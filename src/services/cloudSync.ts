// Universal Real-Time Multi-Device Cloud Sync Engine (Supabase + SQLite Local Engine)
// Guarantees Supabase Cloud Postgres & Local SQLite as single source of truth across Mobile, Laptop, and Web.

import { UserProfile, ActivityItem, EmergencyTask, ActivityLogEntry, ThoughtItem } from '../types';
import { syncFullStateToSupabase, subscribeToSupabaseFullState, UserCloudState } from './supabase';
import { pushFullStateToBackend, fetchFullStateFromBackend, BACKEND_API_BASE } from './apiSync';

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

  const cleanEmail = (state.user?.email || (typeof uid === 'string' && uid.includes('@') ? uid : null))?.trim().toLowerCase();
  const canonicalId = (cleanEmail && cleanEmail.includes('@'))
    ? 'user_email_' + cleanEmail.replace(/[^a-z0-9]/g, '_')
    : uid;

  const now = Date.now();
  _lastLocalPushTimestamp = now;

  const payload: CloudSyncState = {
    version: 2,
    syncId: canonicalId,
    updatedAt: now,
    deviceId: DEVICE_ID,
    user: { ...state.user, uid: canonicalId, email: cleanEmail || state.user?.email },
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
  pushFullStateToBackend(canonicalId, payload, cleanEmail).catch(() => {});

  try {
    await syncFullStateToSupabase(canonicalId, payload as UserCloudState, cleanEmail);
    return true;
  } catch (err) {
    console.warn('Cloud sync push warning (operating in local offline mode):', err);
    return false;
  }
}

/**
 * ⚡ Real-Time Cloud Synchronization Engine
 * Combines Backend SSE, Supabase Realtime, Local BroadcastChannel, and Active Window Reconciliation
 * to guarantee instant sub-second synchronization between Downloaded App and Website on the same account.
 */
export function subscribeToCloudSync(
  uid: string,
  onRemoteStateReceived: (remoteState: CloudSyncState) => void,
  userEmail?: string
): () => void {
  if (!uid) return () => {};

  const cleanEmail = (userEmail || (typeof uid === 'string' && uid.includes('@') ? uid : null))?.trim().toLowerCase();
  const canonicalId = (cleanEmail && cleanEmail.includes('@'))
    ? 'user_email_' + cleanEmail.replace(/[^a-z0-9]/g, '_')
    : uid;

  let isActive = true;

  // 1. Listen for local BroadcastChannel messages (same device instant sync)
  const handleBroadcast = (event: MessageEvent) => {
    if (!isActive) return;
    if (event.data?.type === 'STATE_PUSH' && event.data.payload) {
      const payload: CloudSyncState = event.data.payload;
      const isTarget = payload.syncId === canonicalId || 
                       payload.syncId === uid || 
                       (cleanEmail && payload.user?.email?.toLowerCase() === cleanEmail);

      if (isTarget && payload.deviceId !== DEVICE_ID && payload.updatedAt > lastRemoteReceivedTimestamp) {
        lastRemoteReceivedTimestamp = payload.updatedAt;
        onRemoteStateReceived(payload);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Real-Time Backend SSE Stream (Cross-Device Instant Push between App & Website)
  let eventSource: EventSource | null = null;
  const connectSSE = () => {
    if (!isActive) return;
    try {
      const sseQuery = new URLSearchParams({ userId: canonicalId });
      if (cleanEmail) sseQuery.set('email', cleanEmail);
      const sseUrl = `${BACKEND_API_BASE}/sync/events?${sseQuery.toString()}`;

      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (e) => {
        if (!isActive || !e.data) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'INIT_STATE' && msg.state) {
            const remote = msg.state;
            const uTime = new Date(remote.lastUpdated || remote.updatedAt || 0).getTime();
            if (uTime > lastRemoteReceivedTimestamp) {
              lastRemoteReceivedTimestamp = uTime;
              onRemoteStateReceived({
                version: 2,
                syncId: canonicalId,
                updatedAt: uTime,
                deviceId: 'remote_peer_sse',
                user: remote.user || { uid: canonicalId, email: cleanEmail },
                activities: remote.activities || [],
                matrixState: remote.matrixState || remote.matrix || {},
                yearlyMatrixState: remote.yearlyMatrixState || remote.yearlyMatrix || {},
                emergencyTasks: remote.emergencyTasks || [],
                thoughts: remote.thoughts || [],
                logs: remote.logs || [],
              });
            }
          } else if (msg.state) {
            const remote = msg.state;
            const uTime = msg.timestamp || new Date(remote.lastUpdated || remote.updatedAt || 0).getTime() || Date.now();
            if (uTime > lastRemoteReceivedTimestamp) {
              lastRemoteReceivedTimestamp = uTime;
              onRemoteStateReceived({
                version: 2,
                syncId: canonicalId,
                updatedAt: uTime,
                deviceId: 'remote_peer_sse',
                user: remote.user || { uid: canonicalId, email: cleanEmail },
                activities: remote.activities || [],
                matrixState: remote.matrixState || remote.matrix || {},
                yearlyMatrixState: remote.yearlyMatrixState || remote.yearlyMatrix || {},
                emergencyTasks: remote.emergencyTasks || [],
                thoughts: remote.thoughts || [],
                logs: remote.logs || [],
              });
            }
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Auto-reconnect after 4s
        if (isActive) {
          setTimeout(connectSSE, 4000);
        }
      };
    } catch {
      // EventSource fallback
    }
  };

  connectSSE();

  // 3. Real-Time Supabase Listener
  const unsubSupabase = subscribeToSupabaseFullState(canonicalId, (data, exists) => {
    if (!isActive || !exists || !data) return;

    const remoteState = data as unknown as CloudSyncState;
    if (remoteState.updatedAt > lastRemoteReceivedTimestamp && remoteState.deviceId !== DEVICE_ID) {
      lastRemoteReceivedTimestamp = remoteState.updatedAt;
      onRemoteStateReceived(remoteState);
    }
  }, cleanEmail);

  // 4. Active Window & Background Polling Reconciliation
  const reconcileLatestState = async () => {
    if (!isActive) return;
    try {
      const bState = await fetchFullStateFromBackend(canonicalId, cleanEmail);
      if (bState && (
        (Array.isArray(bState.activities) && bState.activities.length > 0) ||
        (bState.matrix && Object.keys(bState.matrix).length > 0) ||
        (bState.matrixState && Object.keys(bState.matrixState).length > 0) ||
        (bState.user && (bState.user.overallStreak > 0 || bState.user.currentXP > 0 || bState.user.level > 0))
      )) {
        const uTime = new Date(bState.lastUpdated || bState.updatedAt || 0).getTime();
        if (uTime > lastRemoteReceivedTimestamp) {
          lastRemoteReceivedTimestamp = uTime;
          onRemoteStateReceived({
            version: 2,
            syncId: canonicalId,
            updatedAt: uTime,
            deviceId: 'remote_backend_poller',
            user: bState.user || { uid: canonicalId, email: cleanEmail },
            activities: bState.activities || [],
            matrixState: bState.matrixState || bState.matrix || {},
            yearlyMatrixState: bState.yearlyMatrixState || bState.yearlyMatrix || {},
            emergencyTasks: bState.emergencyTasks || [],
            thoughts: bState.thoughts || [],
            logs: bState.logs || [],
          });
        }
      }
    } catch {}
  };

  // Trigger poll immediately and when window/app is focused or unlocked
  reconcileLatestState();

  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible' || !document.hidden) {
      reconcileLatestState();
    }
  };

  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // Periodic background check every 6 seconds to ensure App & Website never drift
  const intervalId = setInterval(reconcileLatestState, 6000);

  return () => {
    isActive = false;
    unsubSupabase();
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    clearInterval(intervalId);
  };
}
