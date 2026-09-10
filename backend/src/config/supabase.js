import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('http') && 
  supabaseKey.length > 20
);

export let supabase = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log(`⚡ Supabase cloud client initialized successfully! [URL: ${supabaseUrl}]`);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not configured in backend env. Running with local SQLite database engine.');
}

/**
 * ⚡ Sync profile to Supabase public.user_profiles table
 */
export async function syncUserToSupabase(profile) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const targetId = profile.id || profile.uid;
    const payload = {
      id: targetId,
      uid: profile.uid || targetId,
      email: profile.email || null,
      name: profile.name || 'Hunter',
      avatar_url: profile.avatarUrl || '/images/char_hero.jpg',
      hunter_rank: profile.hunterRank || 'E',
      level: profile.level ?? 0,
      current_xp: profile.currentXP ?? profile.xp ?? 0,
      overall_streak: profile.overallStreak ?? 0,
      longest_streak: profile.longestStreak ?? 0,
      efficiency_pct: profile.efficiencyPct ?? 0,
      age: profile.age ?? null,
      blood_group: profile.bloodGroup ?? null,
      height: profile.height ?? null,
      weight: profile.weight ?? null,
      resident: profile.resident ?? null,
      phone_number: profile.phoneNumber ?? null,
      bio: profile.bio ?? null,
      last_active_date: profile.lastActiveDate ?? new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase profile sync warning:', err.message);
    return null;
  }
}

/**
 * ⚡ Sync state to Supabase public.user_state table
 */
export async function syncStateToSupabase(userId, state) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const payload = {
      user_id: userId,
      activities: state.activities || [],
      matrix_state: state.matrixState || state.matrix || {},
      emergency_tasks: state.emergencyTasks || [],
      xp: state.user?.currentXP ?? state.user?.xp ?? 0,
      level: state.user?.level ?? 0,
      overall_streak: state.user?.overallStreak ?? 0,
      longest_streak: state.user?.longestStreak ?? 0,
      efficiency_pct: state.user?.efficiencyPct ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_state')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase user_state sync warning:', err.message);
    return null;
  }
}
