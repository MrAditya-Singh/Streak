// Supabase Integration for Cloud Database Storage & Realtime Synchronization

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, ActivityItem, EmergencyTask, ActivityLogEntry } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20
);

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.log('⚡ Supabase Web Client connected successfully!');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export { supabase };

export interface UserCloudState {
  user: Partial<UserProfile>;
  activities: ActivityItem[];
  matrixState: Record<string, boolean[]>;
  emergencyTasks: EmergencyTask[];
  logs?: ActivityLogEntry[];
  updatedAt: number;
}

/**
 * ⚡ Save Full User Cloud State to Supabase tables (user_profiles, user_state)
 */
export async function syncFullStateToSupabase(uid: string, state: Partial<UserCloudState>): Promise<void> {
  if (!supabase || !uid) return;
  try {
    const targetId = uid;

    // 1. Upsert to public.user_profiles
    if (state.user) {
      await supabase.from('user_profiles').upsert({
        id: targetId,
        uid: targetId,
        email: state.user.email || null,
        name: state.user.name || 'Hunter',
        avatar_url: state.user.avatarUrl || '/images/char_hero.jpg',
        hunter_rank: state.user.hunterRank || 'E',
        level: state.user.level ?? 0,
        current_xp: state.user.currentXP ?? 0,
        overall_streak: state.user.overallStreak ?? 0,
        longest_streak: state.user.longestStreak ?? 0,
        age: state.user.age ?? null,
        blood_group: state.user.bloodGroup ?? null,
        height: state.user.height ?? null,
        weight: state.user.weight ?? null,
        resident: state.user.resident ?? null,
        phone_number: state.user.phoneNumber ?? null,
        bio: state.user.bio ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    // 2. Upsert to public.user_state
    const statePayload = {
      user_id: targetId,
      activities: state.activities || [],
      matrix_state: state.matrixState || {},
      emergency_tasks: state.emergencyTasks || [],
      xp: state.user?.currentXP ?? 0,
      level: state.user?.level ?? 0,
      overall_streak: state.user?.overallStreak ?? 0,
      longest_streak: state.user?.longestStreak ?? 0,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('user_state').upsert(statePayload, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('Supabase state sync error:', err);
  }
}

/**
 * ⚡ Subscribe to Real-Time Cloud Updates via Supabase Realtime Channels
 */
export function subscribeToSupabaseFullState(
  uid: string,
  onUpdate: (state: UserCloudState | null, exists: boolean) => void
): () => void {
  if (!supabase || !uid) {
    onUpdate(null, false);
    return () => {};
  }

  try {
    // Initial fetch
    supabase
      .from('user_state')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          const cloudState: UserCloudState = {
            user: {
              uid,
              currentXP: data.xp || 0,
              level: data.level || 0,
              overallStreak: data.overall_streak || 0,
              longestStreak: data.longest_streak || 0,
            },
            activities: data.activities || [],
            matrixState: data.matrix_state || {},
            emergencyTasks: data.emergency_tasks || [],
            updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
          };
          onUpdate(cloudState, true);
        } else {
          onUpdate(null, false);
        }
      });

    // Realtime channel subscription
    const channel = supabase
      .channel(`public:user_state:${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_state',
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const row = payload.new as any;
            const cloudState: UserCloudState = {
              user: {
                uid,
                currentXP: row.xp || 0,
                level: row.level || 0,
                overallStreak: row.overall_streak || 0,
                longestStreak: row.longest_streak || 0,
              },
              activities: row.activities || [],
              matrixState: row.matrix_state || {},
              emergencyTasks: row.emergency_tasks || [],
              updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
            };
            onUpdate(cloudState, true);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  } catch (err) {
    console.warn('Supabase realtime subscription failed:', err);
    return () => {};
  }
}
