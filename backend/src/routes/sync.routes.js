import { Router } from 'express';
import { 
  getUserState, 
  saveUserState, 
  resetUserData 
} from '../config/sqlite.js';
import { 
  supabase, 
  isSupabaseConfigured, 
  syncStateToSupabase 
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
          emergencyTasks: cloudState.emergency_tasks || state.emergencyTasks,
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
        emergency_tasks: [],
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
