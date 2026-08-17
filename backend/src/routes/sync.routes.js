import { Router } from 'express';
import { db, authAdmin, isFirebaseInitialized } from '../config/firebase.js';

export const syncRouter = Router();

// In-memory real-time state cache for instantaneous sub-10ms syncing
const memoryState = new Map();
const sseClients = new Map(); // userId -> Set of res objects

function getOrCreateUserState(userId) {
  if (!memoryState.has(userId)) {
    memoryState.set(userId, {
      userId,
      activities: [],
      matrix: {},
      emergencyTasks: [],
      user: {
        currentXP: 0,
        level: 0,
        overallStreak: 0,
        longestStreak: 0,
        efficiencyPct: 0,
      },
      lastUpdated: new Date().toISOString(),
    });
  }
  return memoryState.get(userId);
}

async function resolveTargetUserId(req, fallbackId = 'local_user_1') {
  let targetId = req.query.userId || req.body?.userId || fallbackId;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1]?.trim();
      if (token && isFirebaseInitialized && authAdmin) {
        const decoded = await authAdmin.verifyIdToken(token);
        if (decoded.uid) {
          targetId = decoded.uid;
        }
      }
    } catch (err) {
      console.warn('Optional token verification warning in sync routes:', err.message);
    }
  }
  return targetId;
}

// -------------------------------------------------------------
// 1. Real-Time SSE Stream for Instant Laptop Live Push
// -------------------------------------------------------------
syncRouter.get('/events', async (req, res) => {
  const userId = await resolveTargetUserId(req, 'local_user_1');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  const clientSet = sseClients.get(userId);
  clientSet.add(res);

  // Send initial state immediately
  const currentState = getOrCreateUserState(userId);
  res.write(`data: ${JSON.stringify({ type: 'INIT_STATE', state: currentState })}\n\n`);

  req.on('close', () => {
    clientSet.delete(res);
  });
});

function broadcastToClients(userId, payload) {
  if (sseClients.has(userId)) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of sseClients.get(userId)) {
      try {
        client.write(data);
      } catch (err) {
        // Ignored
      }
    }
  }
}

// -------------------------------------------------------------
// 2. Fetch Latest State (GET /api/sync/state)
// -------------------------------------------------------------
syncRouter.get('/state', async (req, res) => {
  const userId = await resolveTargetUserId(req, 'local_user_1');
  const state = getOrCreateUserState(userId);

  try {
    if (db) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        state.user.currentXP = uData.currentXP ?? uData.xp ?? state.user.currentXP;
        state.user.overallStreak = uData.overallStreak ?? uData.currentStreak ?? state.user.overallStreak;
        state.user.longestStreak = uData.longestStreak ?? state.user.longestStreak;
        state.user.level = uData.level ?? state.user.level;
        state.user.efficiencyPct = uData.efficiencyPct ?? state.user.efficiencyPct;
        if (uData.activities) state.activities = uData.activities;
        if (uData.emergencyTasks) state.emergencyTasks = uData.emergencyTasks;
      }

      const matrixDoc = await db.collection('matrix').doc(`${userId}_matrix`).get();
      if (matrixDoc.exists) {
        state.matrix = { ...state.matrix, ...matrixDoc.data() };
      }
    }
  } catch (err) {
    console.warn('Firestore fetch warning:', err.message);
  }

  res.json({ success: true, state });
});

// -------------------------------------------------------------
// 3. Mobile / Laptop Toggle Action (POST /api/sync/toggle)
// -------------------------------------------------------------
syncRouter.post('/toggle', async (req, res) => {
  const userId = await resolveTargetUserId(req, req.body.userId || 'local_user_1');
  const { habitId, completed, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const state = getOrCreateUserState(userId);

  // Update in-memory state
  if (!state.matrix[habitId]) {
    state.matrix[habitId] = {};
  }
  state.matrix[habitId][targetDate] = completed;

  // Update activity status
  state.activities = (state.activities || []).map((act) => {
    if (act.id === habitId) {
      const nextCompleted = completed ?? !act.completed;
      return {
        ...act,
        completed: nextCompleted,
        streak: nextCompleted ? act.streak + 1 : Math.max(0, act.streak - 1),
      };
    }
    return act;
  });

  if (completed) {
    state.user.currentXP = (state.user.currentXP || 1840) + 20;
  }
  state.lastUpdated = new Date().toISOString();

  // Instant real-time broadcast to laptop web browser
  broadcastToClients(userId, {
    type: 'HABIT_TOGGLED',
    habitId,
    completed,
    date: targetDate,
    state,
    timestamp: Date.now(),
  });

  // Async Firestore persistence
  if (db) {
    try {
      await db.collection('matrix').doc(`${userId}_matrix`).set(
        {
          [`${habitId}_${targetDate}`]: completed,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
      await db.collection('users').doc(userId).set(
        {
          xp: state.user.currentXP,
          currentXP: state.user.currentXP,
          overallStreak: state.user.overallStreak,
          longestStreak: state.user.longestStreak || state.user.overallStreak,
          level: state.user.level,
          lastActiveDate: targetDate,
          activities: state.activities,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore toggle persistence warning:', err.message);
    }
  }

  console.log(`⚡ [Real-Time Sync] Mobile/Client toggled [${habitId}] -> ${completed ? 'COMPLETED' : 'UNCHECKED'}. Broadcasted to Laptop!`);

  res.json({
    success: true,
    message: `Toggled ${habitId} -> ${completed}`,
    state,
  });
});

// -------------------------------------------------------------
// 4. Save Full State (POST /api/sync/state)
// -------------------------------------------------------------
syncRouter.post('/state', async (req, res) => {
  const userId = await resolveTargetUserId(req, req.body.userId || 'local_user_1');
  const { state: incomingState } = req.body;
  if (!incomingState) {
    return res.status(400).json({ success: false, error: 'Missing state object' });
  }

  const state = getOrCreateUserState(userId);
  Object.assign(state, incomingState, { lastUpdated: new Date().toISOString() });

  // ⚡ Broadcast FULL incoming state to ALL peer devices via SSE
  // This ensures habit add / delete / toggle on one device instantly reflects on all others
  broadcastToClients(userId, {
    type: 'STATE_UPDATED',
    state: {
      ...incomingState,
      activities: incomingState.activities || state.activities,
      matrixState: incomingState.matrixState || incomingState.matrix || state.matrix,
      user: incomingState.user || state.user,
      emergencyTasks: incomingState.emergencyTasks || state.emergencyTasks,
    },
    timestamp: Date.now(),
  });

  // Persist full state to Cloud Firestore under Firebase UID
  if (db) {
    try {
      const userPayload = {
        userId,
        uid: userId,
        ...(incomingState.user || {}),
        currentXP: incomingState.user?.currentXP ?? state.user.currentXP,
        overallStreak: incomingState.user?.overallStreak ?? state.user.overallStreak,
        level: incomingState.user?.level ?? state.user.level,
        activities: incomingState.activities || state.activities,
        emergencyTasks: incomingState.emergencyTasks || state.emergencyTasks,
        updatedAt: new Date().toISOString(),
      };

      await db.collection('users').doc(userId).set(userPayload, { merge: true });

      if (incomingState.matrixState || incomingState.matrix) {
        await db.collection('matrix').doc(`${userId}_matrix`).set(
          {
            ...(incomingState.matrixState || incomingState.matrix),
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // Also persist to unified_sync so Firestore real-time listeners on peer devices receive it
      await db.collection('unified_sync').doc(userId).set(
        {
          activities: incomingState.activities || state.activities,
          matrixState: incomingState.matrixState || state.matrix,
          user: incomingState.user || state.user,
          emergencyTasks: incomingState.emergencyTasks || state.emergencyTasks,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore full state save warning:', err.message);
    }
  }

  res.json({ success: true, message: 'State synced & broadcast to all peer devices', state });
});

// -------------------------------------------------------------
// 5. Force Reset Endpoint (POST /api/sync/reset)
// -------------------------------------------------------------
syncRouter.post('/reset', async (req, res) => {
  const userId = await resolveTargetUserId(req, req.body.userId || 'local_user_1');

  const cleanState = {
    userId,
    activities: [],
    matrix: {},
    emergencyTasks: [],
    user: {
      currentXP: 0,
      level: 0,
      overallStreak: 0,
      longestStreak: 0,
      efficiencyPct: 0,
      hunterRank: 'E',
      isActiveToday: false,
    },
    isReset: true,
    lastUpdated: new Date().toISOString(),
  };

  memoryState.set(userId, cleanState);

  // Broadcast FORCE_RESET to all connected clients
  broadcastToClients(userId, {
    type: 'FORCE_RESET',
    state: cleanState,
    timestamp: Date.now(),
  });

  // Wipe Firestore documents cleanly WITHOUT merge: true!
  if (db) {
    try {
      await db.collection('matrix').doc(`${userId}_matrix`).set({ isReset: true, lastUpdated: new Date().toISOString() }, { merge: false });
      await db.collection('unified_sync').doc(userId).set({ ...cleanState, updatedAt: Date.now() }, { merge: false });
      await db.collection('users').doc(userId).set(cleanState.user, { merge: false });
    } catch (err) {
      console.warn('Firestore force reset error:', err.message);
    }
  }

  console.log(`⚡ [Force Reset] Wiped all streak, matrix, and user data to clean 0 for ${userId}`);

  res.json({ success: true, message: 'All streak, matrix, and user data force-wiped to 0!', state: cleanState });
});

