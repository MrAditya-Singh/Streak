// Universal Real-Time Multi-Device Cloud Sync Engine (Supabase + SQLite Local Engine)
// Guarantees Supabase Cloud Postgres & Local SQLite as single source of truth across Mobile, Laptop, and Web.

import { UserProfile, ActivityItem, EmergencyTask, ActivityLogEntry, ThoughtItem } from '../types';
import { syncFullStateToSupabase, subscribeToSupabaseFullState, UserCloudState } from './supabase';
import { pushFullStateToBackend } from './apiSync';

export interface CloudSyncState {
  version: number;
  syncId: string; // Authenticated Supabase UID or local ID
  updatedAt: number;
  deviceId: string;
  user: UserProfile;
  activities: ActivityItem[];
  matrixState: Record<string, boolean[]>;
  yearlyMatrixState?: Record<string, Record<string, boolean[]>>;
  emergencyTasks: EmergencyTask[];
  thoughts?: ThoughtItem[];
  logs?: ActivityLogEntry[];
}

export const DEVICE_ID = (() => {
  let id = localStorage.getItem('effstreak_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('effstreak_device_id', id);
  }
  return id;
})();

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('effstreak_cloud_sync_bus');
  }
} catch {
  // Ignore if not supported
}

let _lastLocalPushTimestamp = 0;
let lastRemoteReceivedTimestamp = 0;

/**
 * 📡 Push full state to Supabase Cloud & Local SQLite Backend & Local Broadcast
 */
export async function pushStateToCloud(
  uid: string,
  state: {
    user: UserProfile;
    activities: ActivityItem[];
    matrixState: Record<string, boolean[]>;
    yearlyMatrixState?: Record<string, Record<string, boolean[]>>;
    emergencyTasks: EmergencyTask[];
    thoughts?: ThoughtItem[];
    logs?: ActivityLogEntry[];
  }
): Promise<boolean> {
  if (!uid) return false;

  const now = Date.now();
  _lastLocalPushTimestamp = now;

  const payload: CloudSyncState = {
    version: 2,
    syncId: uid,
    updatedAt: now,
    deviceId: DEVICE_ID,
    user: { ...state.user, uid },
    activities: state.activities,
    matrixState: state.matrixState,
    yearlyMatrixState: state.yearlyMatrixState,
    emergencyTasks: state.emergencyTasks,
    thoughts: state.thoughts || [],
    logs: state.logs || [],
  };

  // 1. Instant local broadcast for cross-tab instances on the same device
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'STATE_PUSH', payload });
    } catch (e) {
      console.warn('BroadcastChannel notice:', e);
    }
  }

  // 2. Dual-Channel Push: Local SQLite Backend API + Supabase Cloud PostgREST
  pushFullStateToBackend(uid, payload, state.user?.email).catch(() => {});

  try {
    await syncFullStateToSupabase(uid, payload as UserCloudState);
    return true;
  } catch (err) {
    console.warn('Cloud sync push warning (operating in local offline mode):', err);
    return false;
  }
}

/**
 * ⚡ Real-Time Cloud Supabase Listener + Local Broadcast Hook
 * Automatically synchronizes Mobile and Laptop whenever data is modified in Supabase.
 */
export function subscribeToCloudSync(
  uid: string,
  onRemoteStateReceived: (remoteState: CloudSyncState) => void,
  _userEmail?: string
): () => void {
  if (!uid) return () => {};

  let isActive = true;

  // 1. Listen for local BroadcastChannel messages
  const handleBroadcast = (event: MessageEvent) => {
    if (!isActive) return;
    if (event.data?.type === 'STATE_PUSH' && event.data.payload) {
      const payload: CloudSyncState = event.data.payload;
      if (payload.syncId === uid && payload.deviceId !== DEVICE_ID && payload.updatedAt > lastRemoteReceivedTimestamp) {
        lastRemoteReceivedTimestamp = payload.updatedAt;
        onRemoteStateReceived(payload);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Real-Time Supabase Listener
  const unsubSupabase = subscribeToSupabaseFullState(uid, (data, exists) => {
    if (!isActive || !exists || !data) return;

    const remoteState = data as unknown as CloudSyncState;
    if (remoteState.updatedAt > lastRemoteReceivedTimestamp && remoteState.deviceId !== DEVICE_ID) {
      lastRemoteReceivedTimestamp = remoteState.updatedAt;
      onRemoteStateReceived(remoteState);
    }
  });

  return () => {
    isActive = false;
    unsubSupabase();
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}
