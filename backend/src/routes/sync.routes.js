import { Router } from 'express';
import { 
  getUser,
  saveUser,
  getUserState, 
  saveUserState, 
  resetUserData,
  saveHabit,
  deleteHabit,
  getHabits,
  saveHabitTick,
  getHabitTicks,
  saveSingleThought,
  saveThoughts,
  deleteThought,
  getThoughts
} from '../config/sqlite.js';
import { 
  supabase, 
  isSupabaseConfigured, 
  syncUserToSupabase,
  syncStateToSupabase,
  syncHabitToSupabase,
  deleteHabitFromSupabase,
  syncHabitTickToSupabase,
  syncThoughtToSupabase,
  deleteThoughtFromSupabase
} from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabaseAuth.middleware.js';

export const syncRouter = Router();

const sseClients = new Map(); // userId (uid) -> Set of res objects

// -------------------------------------------------------------
// Helper: Broadcast to Real-Time SSE Clients
// -------------------------------------------------------------
function broadcastToClients(userIdOrProfile, payload) {
  const targetIds = new Set();
  if (typeof userIdOrProfile === 'string') {
    targetIds.add(userIdOrProfile);
    const user = getUser(userIdOrProfile);
    if (user?.id) targetIds.add(user.id);
    if (user?.uid) targetIds.add(user.uid);
    if (user?.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      targetIds.add(cleanEmail);
      targetIds.add(`user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`);
    }
  } else if (userIdOrProfile && typeof userIdOrProfile === 'object') {
    if (userIdOrProfile.id) targetIds.add(userIdOrProfile.id);
    if (userIdOrProfile.uid) targetIds.add(userIdOrProfile.uid);
    if (userIdOrProfile.email) {
      const cleanEmail = userIdOrProfile.email.trim().toLowerCase();
      targetIds.add(cleanEmail);
      targetIds.add(`user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`);
    }
  }

  const data = `data: ${JSON.stringify(payload)}\n\n`;
  const notifiedClients = new Set();

  for (const tid of targetIds) {
    if (sseClients.has(tid)) {
      for (const client of sseClients.get(tid)) {
        if (!notifiedClients.has(client)) {
          notifiedClients.add(client);
          try {
            client.write(data);
          } catch {
            // Client disconnected
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 1. Real-Time SSE Stream for Instant Push
// -------------------------------------------------------------
syncRouter.get('/events', verifySupabaseToken, async (req, res) => {
  const email = (req.query?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.query?.userId || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const registerKeys = [rawId, canonicalId, cleanEmail].filter(Boolean);
  registerKeys.forEach((key) => {
    if (!sseClients.has(key)) {
      sseClients.set(key, new Set());
    }
    sseClients.get(key).add(res);
  });

  // Fetch current state from local SQLite
  const currentState = getUserState(canonicalId, cleanEmail);

  // If Supabase is connected, check for newer cloud state
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudState, error } = await supabase
        .from('user_state')
        .select('*')
        .eq('user_id', canonicalId)
        .maybeSingle();

      if (!error && cloudState) {
        if (cloudState.activities) currentState.activities = cloudState.activities;
        if (cloudState.matrix_state) currentState.matrix = cloudState.matrix_state;
        if (cloudState.emergency_tasks) currentState.emergencyTasks = cloudState.emergency_tasks;
        saveUserState(canonicalId, currentState, cleanEmail);
      }
    } catch { /* ignore */ }
  }

  res.write(`data: ${JSON.stringify({ type: 'INIT_STATE', state: currentState })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    registerKeys.forEach((key) => {
      sseClients.get(key)?.delete(res);
    });
    clearInterval(heartbeat);
  });
});

// -------------------------------------------------------------
// 2. Fetch Latest State (GET /api/sync/state)
// -------------------------------------------------------------
syncRouter.get('/state', verifySupabaseToken, async (req, res) => {
  const email = (req.query?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.query?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  let state = getUserState(canonicalId, cleanEmail);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudState, error } = await supabase
        .from('user_state')
        .select('*')
        .eq('user_id', canonicalId)
        .maybeSingle();

      if (!error && cloudState) {
        state = {
          userId: canonicalId,
          activities: cloudState.activities || state.activities,
          matrix: cloudState.matrix_state || state.matrix,
          yearlyMatrix: cloudState.yearly_matrix || state.yearlyMatrix || {},
          yearlyMatrixState: cloudState.yearly_matrix || state.yearlyMatrix || {},
          emergencyTasks: cloudState.emergency_tasks || state.emergencyTasks,
          thoughts: cloudState.thoughts || state.thoughts,
          user: {
            currentXP: cloudState.xp ?? state.user.currentXP,
            level: cloudState.level ?? state.user.level,
            overallStreak: cloudState.overall_streak ?? state.user.overallStreak,
            longestStreak: cloudState.longest_streak ?? state.user.longestStreak,
            efficiencyPct: cloudState.efficiency_pct ?? state.user.efficiencyPct,
          },
          lastUpdated: cloudState.updated_at || new Date().toISOString(),
        };
        // Keep SQLite synced
        saveUserState(canonicalId, state, cleanEmail);
      }
    } catch (err) {
      console.warn('Supabase state fetch notice:', err.message);
    }
  }

  res.json({ success: true, state, source: isSupabaseConfigured ? 'supabase+sqlite' : 'sqlite' });
});

// -------------------------------------------------------------
// 3. Mobile / Laptop Toggle Action (POST /api/sync/toggle)
// -------------------------------------------------------------
syncRouter.post('/toggle', verifySupabaseToken, async (req, res) => {
  const email = (req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  const { habitId, completed, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const state = getUserState(canonicalId, cleanEmail);

  if (!state.matrix) state.matrix = {};
  if (!state.matrix[habitId]) state.matrix[habitId] = {};
  state.matrix[habitId][targetDate] = completed;

  state.activities = (state.activities || []).map((act) => {
    if (act.id === habitId) {
      const nextCompleted = completed ?? !act.completed;
      return {
        ...act,
        completed: nextCompleted,
        streak: nextCompleted ? (act.streak || 0) + 1 : Math.max(0, (act.streak || 0) - 1),
      };
    }
    return act;
  });

  if (completed) {
    state.user.currentXP = (state.user.currentXP || 0) + 20;
  }
  state.lastUpdated = new Date().toISOString();

  // 1. Save to Local SQLite
  const savedState = saveUserState(canonicalId, state, cleanEmail);

  // 2. Sync to Supabase Cloud
  if (isSupabaseConfigured) {
    syncStateToSupabase(canonicalId, savedState, cleanEmail).catch(() => {});
  }

  // 3. Broadcast to Real-Time SSE Listeners
  broadcastToClients(canonicalId, {
    type: 'HABIT_TOGGLED',
    habitId,
    completed,
    date: targetDate,
    state: savedState,
    timestamp: Date.now(),
  });

  res.json({
    success: true,
    message: `Toggled ${habitId} -> ${completed}`,
    state: savedState,
  });
});

// -------------------------------------------------------------
// 4. Save Full State (POST /api/sync/state)
// -------------------------------------------------------------
syncRouter.post('/state', verifySupabaseToken, async (req, res) => {
  const email = (req.body?.email || req.body?.state?.user?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  const { state: incomingState } = req.body;
  if (!incomingState) {
    return res.status(400).json({ success: false, error: 'Missing state object' });
  }

  // 1. Persist to Local SQLite
  const savedState = saveUserState(canonicalId, incomingState, cleanEmail);

  // 2. Persist to Cloud Supabase
  if (isSupabaseConfigured) {
    syncStateToSupabase(canonicalId, savedState, cleanEmail).catch(() => {});
  }

  // 3. Broadcast to Live SSE Clients
  broadcastToClients(canonicalId, {
    type: 'STATE_UPDATED',
    state: savedState,
    timestamp: Date.now(),
  });

  res.json({ success: true, message: 'State synced to SQLite & Supabase and broadcast to peer devices', state: savedState });
});

// -------------------------------------------------------------
// 5. Force Reset Endpoint (POST /api/sync/reset)
// -------------------------------------------------------------
syncRouter.post('/reset', verifySupabaseToken, async (req, res) => {
  const email = (req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  // 1. Reset in Local SQLite
  const cleanState = resetUserData(canonicalId);

  // 2. Reset in Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('user_state').upsert({
        user_id: canonicalId,
        activities: [],
        matrix_state: {},
        yearly_matrix: {},
        emergency_tasks: [],
        thoughts: [],
        xp: 0,
        level: 0,
        overall_streak: 0,
        longest_streak: 0,
        efficiency_pct: 0,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase reset error:', err.message);
    }
  }

  // 3. Broadcast to SSE Clients
  broadcastToClients(canonicalId, {
    type: 'FORCE_RESET',
    state: cleanState,
    timestamp: Date.now(),
  });

  res.json({ success: true, message: 'Data reset cleanly across SQLite & Supabase', state: cleanState });
});

// -------------------------------------------------------------
// 6. Habit CRUD Sync (POST /api/sync/habit & DELETE /api/sync/habit/:id)
// -------------------------------------------------------------
syncRouter.post('/habit', verifySupabaseToken, async (req, res) => {
  const email = (req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  const { habit } = req.body;

  if (!habit || !habit.id || !habit.name) {
    return res.status(400).json({ success: false, error: 'Missing habit id or name' });
  }

  // 1. Save to SQLite
  const savedHabit = saveHabit(canonicalId, habit);

  // 2. Also keep user_state activities array in sync
  const currentState = getUserState(canonicalId, cleanEmail);
  const exists = (currentState.activities || []).some((a) => a.id === habit.id);
  if (!exists) {
    currentState.activities = [...(currentState.activities || []), savedHabit];
  } else {
    currentState.activities = (currentState.activities || []).map((a) => a.id === habit.id ? { ...a, ...savedHabit } : a);
  }
  const updatedState = saveUserState(canonicalId, currentState, cleanEmail);

  // 3. Sync to Supabase
  if (isSupabaseConfigured) {
    syncHabitToSupabase(canonicalId, savedHabit, cleanEmail).catch(() => {});
    syncStateToSupabase(canonicalId, updatedState, cleanEmail).catch(() => {});
  }

  // 4. Realtime Broadcast
  broadcastToClients(canonicalId, {
    type: 'HABIT_SAVED',
    habit: savedHabit,
    state: updatedState,
    timestamp: Date.now(),
  });

  res.status(200).json({ success: true, message: 'Habit persisted across SQLite & Supabase', habit: savedHabit, state: updatedState });
});

syncRouter.delete('/habit/:id', verifySupabaseToken, async (req, res) => {
  const email = (req.query?.email || req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.query?.userId || req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);
  const habitId = req.params.id;

  if (!habitId) {
    return res.status(400).json({ success: false, error: 'Missing habit ID' });
  }

  // 1. Delete from SQLite
  deleteHabit(canonicalId, habitId);

  // 2. Update user_state activities array
  const currentState = getUserState(canonicalId, cleanEmail);
  currentState.activities = (currentState.activities || []).filter((a) => a.id !== habitId);
  if (currentState.matrix && currentState.matrix[habitId]) {
    delete currentState.matrix[habitId];
  }
  const updatedState = saveUserState(canonicalId, currentState, cleanEmail);

  // 3. Delete from Supabase
  if (isSupabaseConfigured) {
    deleteHabitFromSupabase(canonicalId, habitId, cleanEmail).catch(() => {});
    syncStateToSupabase(canonicalId, updatedState, cleanEmail).catch(() => {});
  }

  // 4. Realtime Broadcast
  broadcastToClients(canonicalId, {
    type: 'HABIT_DELETED',
    habitId,
    state: updatedState,
    timestamp: Date.now(),
  });

  res.status(200).json({ success: true, message: 'Habit deleted across SQLite & Supabase', habitId, state: updatedState });
});

// -------------------------------------------------------------
// 7. Habit Tick Record with status: 'done' (POST /api/sync/habit-tick)
// -------------------------------------------------------------
syncRouter.post('/habit-tick', verifySupabaseToken, async (req, res) => {
  const email = (req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  const { habitId, date, status = 'done', xpEarned = 20, completed = true } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (!habitId) {
    return res.status(400).json({ success: false, error: 'Missing habitId' });
  }

  // 1. Save Relational Habit Tick Log in SQLite
  const tickRecord = saveHabitTick(canonicalId, {
    habitId,
    date: targetDate,
    status: status || 'done',
    timestamp: Date.now(),
    xpEarned: completed ? xpEarned : 0,
  });

  // 2. Update user_state & matrix
  const state = getUserState(canonicalId, cleanEmail);
  if (!state.matrix) state.matrix = {};
  if (!state.matrix[habitId]) state.matrix[habitId] = {};
  state.matrix[habitId][targetDate] = completed;

  state.activities = (state.activities || []).map((act) => {
    if (act.id === habitId) {
      return {
        ...act,
        completed,
        streak: completed ? (act.streak || 0) + 1 : Math.max(0, (act.streak || 0) - 1),
      };
    }
    return act;
  });

  if (completed) {
    state.user.currentXP = (state.user.currentXP || 0) + xpEarned;
  }
  state.lastUpdated = new Date().toISOString();

  const savedState = saveUserState(canonicalId, state, cleanEmail);

  // 3. Sync to Supabase
  if (isSupabaseConfigured) {
    syncHabitTickToSupabase(canonicalId, tickRecord, cleanEmail).catch(() => {});
    syncStateToSupabase(canonicalId, savedState, cleanEmail).catch(() => {});
  }

  // 4. Realtime Broadcast
  broadcastToClients(canonicalId, {
    type: 'HABIT_TICKED',
    habitId,
    tick: tickRecord,
    status: status || 'done',
    date: targetDate,
    completed,
    state: savedState,
    timestamp: Date.now(),
  });

  res.status(200).json({
    success: true,
    message: `Habit tick recorded as '${status || 'done'}' across SQLite & Supabase`,
    tick: tickRecord,
    state: savedState,
  });
});

// -------------------------------------------------------------
// 8. Thoughts Sync (POST /api/sync/thoughts & DELETE /api/sync/thought/:id)
// -------------------------------------------------------------
syncRouter.post('/thoughts', verifySupabaseToken, async (req, res) => {
  const email = (req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  const { thoughts, thought } = req.body;

  let savedThoughts = [];
  if (thought) {
    savedThoughts = saveSingleThought(canonicalId, thought);
    if (isSupabaseConfigured) {
      syncThoughtToSupabase(canonicalId, thought, cleanEmail).catch(() => {});
    }
  } else if (Array.isArray(thoughts)) {
    savedThoughts = saveThoughts(canonicalId, thoughts);
    if (isSupabaseConfigured) {
      for (const t of thoughts) {
        syncThoughtToSupabase(canonicalId, t, cleanEmail).catch(() => {});
      }
    }
  }

  // Update user_state thoughts array
  const state = getUserState(canonicalId, cleanEmail);
  state.thoughts = savedThoughts;
  const savedState = saveUserState(canonicalId, state, cleanEmail);

  if (isSupabaseConfigured) {
    syncStateToSupabase(canonicalId, savedState, cleanEmail).catch(() => {});
  }

  // Broadcast
  broadcastToClients(canonicalId, {
    type: 'THOUGHTS_UPDATED',
    thoughts: savedThoughts,
    state: savedState,
    timestamp: Date.now(),
  });

  res.status(200).json({ success: true, message: 'Thoughts persisted in profile', thoughts: savedThoughts, state: savedState });
});

syncRouter.delete('/thought/:id', verifySupabaseToken, async (req, res) => {
  const email = (req.query?.email || req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.query?.userId || req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);
  const thoughtId = req.params.id;

  const savedThoughts = deleteThought(canonicalId, thoughtId);

  // Update user_state
  const state = getUserState(canonicalId, cleanEmail);
  state.thoughts = savedThoughts;
  const savedState = saveUserState(canonicalId, state, cleanEmail);

  if (isSupabaseConfigured) {
    deleteThoughtFromSupabase(canonicalId, thoughtId, cleanEmail).catch(() => {});
    syncStateToSupabase(canonicalId, savedState, cleanEmail).catch(() => {});
  }

  broadcastToClients(canonicalId, {
    type: 'THOUGHT_DELETED',
    thoughtId,
    thoughts: savedThoughts,
    state: savedState,
    timestamp: Date.now(),
  });

  res.status(200).json({ success: true, message: 'Thought deleted across SQLite & Supabase', thoughts: savedThoughts, state: savedState });
});

// -------------------------------------------------------------
// 9. User Photos & Reel Dial Persistence (POST /api/sync/user-photos)
// -------------------------------------------------------------
syncRouter.post('/user-photos', verifySupabaseToken, async (req, res) => {
  const email = (req.body?.email || req.user?.email)?.trim().toLowerCase();
  const rawId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const targetUser = getUser(email || rawId);
  const cleanEmail = targetUser?.email || email;
  const canonicalId = targetUser?.id || (cleanEmail ? `user_email_${cleanEmail.replace(/[^a-z0-9]/g, '_')}` : rawId);

  const { headerImage, dailyMantraImage, mantraReel, headerReel, avatarUrl } = req.body;

  const currentProfile = getUser(canonicalId) || { id: canonicalId, uid: canonicalId, email: cleanEmail };
  const updatedProfile = saveUser({
    ...currentProfile,
    id: canonicalId,
    uid: canonicalId,
    email: cleanEmail || currentProfile.email,
    headerImage: headerImage !== undefined ? headerImage : currentProfile.headerImage,
    dailyMantraImage: dailyMantraImage !== undefined ? dailyMantraImage : currentProfile.dailyMantraImage,
    mantraReel: mantraReel !== undefined ? mantraReel : currentProfile.mantraReel,
    headerReel: headerReel !== undefined ? headerReel : currentProfile.headerReel,
    avatarUrl: avatarUrl !== undefined ? avatarUrl : currentProfile.avatarUrl,
  });

  if (isSupabaseConfigured) {
    syncUserToSupabase(updatedProfile).catch(() => {});
  }

  broadcastToClients(canonicalId, {
    type: 'USER_PHOTOS_UPDATED',
    user: updatedProfile,
    timestamp: Date.now(),
  });

  res.status(200).json({
    success: true,
    message: 'User photos and reel dials saved under profile in database',
    user: updatedProfile,
  });
});
