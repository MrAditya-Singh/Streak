import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('http') && 
  supabaseKey.length > 20 &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-anon-public-key')
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

export function getCanonicalSupabaseId(userId, email) {
  const cleanEmail = (email || (typeof userId === 'string' && userId.includes('@') ? userId : null))?.trim().toLowerCase();
  if (cleanEmail && cleanEmail.includes('@')) {
    return `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
  }
  if (typeof userId === 'string' && userId.startsWith('user_email_')) {
    return userId;
  }
  return userId || 'local_authenticated_dev_user';
}

/**
 * ⚡ Sync profile to Supabase public.user_profiles table (One Gmail = One Account)
 */
export async function syncUserToSupabase(profile) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const cleanEmail = (profile.email || (typeof profile.id === 'string' && profile.id.includes('@') ? profile.id : null))?.trim().toLowerCase();
    const targetId = getCanonicalSupabaseId(profile.id || profile.uid, cleanEmail);
    const payload = {
      id: targetId,
      uid: profile.uid || targetId,
      email: cleanEmail || profile.email || null,
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
 * ⚡ Sync state to Supabase public.user_state table (One Gmail = One Account)
 */
export async function syncStateToSupabase(userId, state, email) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const cleanEmail = email || state.user?.email || state.email;
    const targetId = getCanonicalSupabaseId(userId, cleanEmail);
    const payload = {
      user_id: targetId,
      activities: state.activities || [],
      matrix_state: state.matrixState || state.matrix || {},
      yearly_matrix: state.yearlyMatrixState || state.yearlyMatrix || {},
      emergency_tasks: state.emergencyTasks || [],
      thoughts: state.thoughts || [],
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
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase user_state sync warning:', err.message);
    return null;
  }
}

/**
 * ⚡ Sync Habit to Supabase habits table
 */
export async function syncHabitToSupabase(userId, habit, email) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const targetId = getCanonicalSupabaseId(userId, email);
    const payload = {
      id: habit.id,
      user_id: targetId,
      name: habit.name,
      category: habit.category || 'Focus',
      icon_name: habit.iconName || habit.icon || 'Activity',
      planned_minutes: habit.plannedMinutes || habit.duration || 30,
      color: habit.color || '#3B82F6',
      streak: habit.streak || 0,
      completed: habit.completed ? true : false,
      target_count: habit.targetCount || 1,
      unit: habit.unit || 'times',
      source: habit.source || 'Manual',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('habits')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase habit sync warning:', err.message);
    return null;
  }
}

/**
 * ⚡ Delete Habit from Supabase habits table
 */
export async function deleteHabitFromSupabase(userId, habitId, email) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const targetId = getCanonicalSupabaseId(userId, email);
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', targetId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase habit deletion warning:', err.message);
    return false;
  }
}

/**
 * ⚡ Sync Habit Tick to Supabase habit_ticks table (status: 'done')
 */
export async function syncHabitTickToSupabase(userId, { habitId, date, status = 'done', timestamp = Date.now(), xpEarned = 20 }, email) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const targetId = getCanonicalSupabaseId(userId, email);
    const tickId = `${targetId}_${habitId}_${date}`;
    const payload = {
      id: tickId,
      user_id: targetId,
      habit_id: habitId,
      date,
      status: status || 'done',
      timestamp,
      xp_earned: xpEarned,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('habit_ticks')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase habit_tick sync warning:', err.message);
    return null;
  }
}

/**
 * ⚡ Sync Thought to Supabase thoughts table
 */
export async function syncThoughtToSupabase(userId, thought, email) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const targetId = getCanonicalSupabaseId(userId, email);
    const now = Date.now();
    const payload = {
      id: thought.id || `thought_${now}_${Math.random().toString(36).slice(2, 6)}`,
      user_id: targetId,
      category: thought.category || 'personal',
      title: thought.title || 'Untitled Thought',
      content: thought.content || '',
      tags: thought.tags || [],
      priority: thought.priority || 'medium',
      is_starred: Boolean(thought.isStarred),
      created_at: thought.createdAt || now,
      updated_at: thought.updatedAt || now,
    };

    const { data, error } = await supabase
      .from('thoughts')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase thought sync warning:', err.message);
    return null;
  }
}

/**
 * ⚡ Delete Thought from Supabase thoughts table
 */
export async function deleteThoughtFromSupabase(userId, thoughtId, email) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const targetId = getCanonicalSupabaseId(userId, email);
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', thoughtId)
      .eq('user_id', targetId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase thought deletion warning:', err.message);
    return false;
  }
}

