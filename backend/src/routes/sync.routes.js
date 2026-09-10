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
function broadcastToClients(userId, payload) {
  if (sseClients.has(userId)) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of sseClients.get(userId)) {
      try {
        client.write(data);
      } catch {
        // Ignored
      }
    }
  }
}

// -------------------------------------------------------------
// 1. Real-Time SSE Stream for Instant Push
// -------------------------------------------------------------
syncRouter.get('/events', verifySupabaseToken, async (req, res) => {
  const userId = req.uid || 'local_authenticated_dev_user';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  const clientSet = sseClients.get(userId);
  clientSet.add(res);

  // Fetch current state from local SQLite
  const currentState = getUserState(userId);

  // If Supabase is connected, check for newer cloud state
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudState, error } = await supabase
        .from('user_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && cloudState) {
        if (cloudState.activities) currentState.activities = cloudState.activities;
        if (cloudState.matrix_state) currentState.matrix = cloudState.matrix_state;
        if (cloudState.emergency_tasks) currentState.emergencyTasks = cloudState.emergency_tasks;
        saveUserState(userId, currentState);
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
    clientSet.delete(res);
    clearInterval(heartbeat);
  });
});

// -------------------------------------------------------------
// 2. Fetch Latest State (GET /api/sync/state)
// -------------------------------------------------------------
syncRouter.get('/state', verifySupabaseToken, async (req, res) => {
  const userId = req.query?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  let state = getUserState(userId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: cloudState, error } = await supabase
        .from('user_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && cloudState) {
        state = {
          userId,
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
        saveUserState(userId, state);
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
  const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const { habitId, completed, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const state = getUserState(userId);

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
  const savedState = saveUserState(userId, state);

  // 2. Sync to Supabase Cloud
  if (isSupabaseConfigured) {
    syncStateToSupabase(userId, savedState).catch(() => {});
  }

  // 3. Broadcast to Real-Time SSE Listeners
  broadcastToClients(userId, {
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
  const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const { state: incomingState } = req.body;
  if (!incomingState) {
    return res.status(400).json({ success: false, error: 'Missing state object' });
  }

  // 1. Persist to Local SQLite
  const savedState = saveUserState(userId, incomingState);

  // 2. Persist to Cloud Supabase
  if (isSupabaseConfigured) {
    syncStateToSupabase(userId, savedState).catch(() => {});
  }

  // 3. Broadcast to Live SSE Clients
  broadcastToClients(userId, {
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
  const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';

  // 1. Reset in Local SQLite
  const cleanState = resetUserData(userId);

  // 2. Reset in Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('user_state').upsert({
        user_id: userId,
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
  broadcastToClients(userId, {
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
  const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const { habit } = req.body;

  if (!habit || !habit.id || !habit.name) {
    return res.status(400).json({ success: false, error: 'Missing habit id or name' });
  }

  // 1. Save to SQLite
  const savedHabit = saveHabit(userId, habit);

  // 2. Also keep user_state activities array in sync
  const currentState = getUserState(userId);
  const exists = (currentState.activities || []).some((a) => a.id === habit.id);
  if (!exists) {
    currentState.activities = [...(currentState.activities || []), savedHabit];
  } else {
    currentState.activities = (currentState.activities || []).map((a) => a.id === habit.id ? { ...a, ...savedHabit } : a);
  }
  const updatedState = saveUserState(userId, currentState);

  // 3. Sync to Supabase
  if (isSupabaseConfigured) {
    syncHabitToSupabase(userId, savedHabit).catch(() => {});
    syncStateToSupabase(userId, updatedState).catch(() => {});
  }

  // 4. Realtime Broadcast
  broadcastToClients(userId, {
    type: 'HABIT_SAVED',
    habit: savedHabit,
    state: updatedState,
    timestamp: Date.now(),
  });

  res.status(200).json({ success: true, message: 'Habit persisted across SQLite & Supabase', habit: savedHabit, state: updatedState });
});

syncRouter.delete('/habit/:id', verifySupabaseToken, async (req, res) => {
  const userId = req.query?.userId || req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const habitId = req.params.id;

  if (!habitId) {
    return res.status(400).json({ success: false, error: 'Missing habit ID' });
  }

  // 1. Delete from SQLite
  deleteHabit(userId, habitId);

  // 2. Update user_state activities array
  const currentState = getUserState(userId);
  currentState.activities = (currentState.activities || []).filter((a) => a.id !== habitId);
  if (currentState.matrix && currentState.matrix[habitId]) {
    delete currentState.matrix[habitId];
  }
  const updatedState = saveUserState(userId, currentState);

  // 3. Delete from Supabase
  if (isSupabaseConfigured) {
    deleteHabitFromSupabase(userId, habitId).catch(() => {});
    syncStateToSupabase(userId, updatedState).catch(() => {});
  }

  // 4. Realtime Broadcast
  broadcastToClients(userId, {
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
  const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const { habitId, date, status = 'done', xpEarned = 20, completed = true } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (!habitId) {
    return res.status(400).json({ success: false, error: 'Missing habitId' });
  }

  // 1. Save Relational Habit Tick Log in SQLite
  const tickRecord = saveHabitTick(userId, {
    habitId,
    date: targetDate,
    status: status || 'done',
    timestamp: Date.now(),
    xpEarned: completed ? xpEarned : 0,
  });

  // 2. Update user_state & matrix
  const state = getUserState(userId);
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

  const savedState = saveUserState(userId, state);

  // 3. Sync to Supabase
  if (isSupabaseConfigured) {
    syncHabitTickToSupabase(userId, tickRecord).catch(() => {});
    syncStateToSupabase(userId, savedState).catch(() => {});
  }

  // 4. Realtime Broadcast
  broadcastToClients(userId, {
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
  const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const { thoughts, thought } = req.body;

  let savedThoughts = [];
  if (thought) {
    savedThoughts = saveSingleThought(userId, thought);
    if (isSupabaseConfigured) {
      syncThoughtToSupabase(userId, thought).catch(() => {});
    }
  } else if (Array.isArray(thoughts)) {
    savedThoughts = saveThoughts(userId, thoughts);
    if (isSupabaseConfigured) {
      for (const t of thoughts) {
        syncThoughtToSupabase(userId, t).catch(() => {});
      }
    }
  }

  // Update user_state thoughts array
  const state = getUserState(userId);
  state.thoughts = savedThoughts;
  const savedState = saveUserState(userId, state);

  if (isSupabaseConfigured) {
    syncStateToSupabase(userId, savedState).catch(() => {});
  }

  // Broadcast
  broadcastToClients(userId, {
    type: 'THOUGHTS_UPDATED',
    thoughts: savedThoughts,
    state: savedState,
    timestamp: Date.now(),
  });

  res.status(200).json({ success: true, message: 'Thoughts persisted in profile', thoughts: savedThoughts, state: savedState });
});

syncRouter.delete('/thought/:id', verifySupabaseToken, async (req, res) => {
  const userId = req.query?.userId || req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const thoughtId = req.params.id;

  const savedThoughts = deleteThought(userId, thoughtId);

  // Update user_state
  const state = getUserState(userId);
  state.thoughts = savedThoughts;
  const savedState = saveUserState(userId, state);

  if (isSupabaseConfigured) {
    deleteThoughtFromSupabase(userId, thoughtId).catch(() => {});
    syncStateToSupabase(userId, savedState).catch(() => {});
  }

  broadcastToClients(userId, {
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
  const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';
  const { headerImage, dailyMantraImage, mantraReel, headerReel, avatarUrl } = req.body;

  const currentProfile = getUser(userId) || { id: userId, uid: userId };
  const updatedProfile = saveUser({
    ...currentProfile,
    headerImage: headerImage !== undefined ? headerImage : currentProfile.headerImage,
    dailyMantraImage: dailyMantraImage !== undefined ? dailyMantraImage : currentProfile.dailyMantraImage,
    mantraReel: mantraReel !== undefined ? mantraReel : currentProfile.mantraReel,
    headerReel: headerReel !== undefined ? headerReel : currentProfile.headerReel,
    avatarUrl: avatarUrl !== undefined ? avatarUrl : currentProfile.avatarUrl,
  });

  if (isSupabaseConfigured) {
    syncUserToSupabase(updatedProfile).catch(() => {});
  }

  broadcastToClients(userId, {
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
