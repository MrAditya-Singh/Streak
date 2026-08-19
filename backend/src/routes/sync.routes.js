import { Router } from 'express';
import { db, authAdmin, isFirebaseInitialized } from '../config/firebase.js';

export const syncRouter = Router();

const memoryState = new Map();
const sseClients = new Map(); // userId (uid) -> Set of res objects

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

/**
 * 🛡️ Strict Firebase ID Token Verification Middleware
 * Extracts and verifies Bearer token, deriving UID from Firebase Auth.
 */
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In local development without token, allow a default authenticated test user ID
    if (!isFirebaseInitialized) {
      req.uid = 'local_authenticated_dev_user';
      return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or malformed Bearer token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Empty token provided' });
  }

  if (isFirebaseInitialized && authAdmin) {
    try {
      const decoded = await authAdmin.verifyIdToken(token);
      req.uid = decoded.uid;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, error: `Unauthorized: Invalid Firebase ID token (${err.message})` });
    }
  } else {
    req.uid = token.length > 10 ? token : 'local_authenticated_dev_user';
    return next();
  }
}

// -------------------------------------------------------------
// 1. Real-Time SSE Stream for Instant Push
// -------------------------------------------------------------
syncRouter.get('/events', verifyFirebaseToken, async (req, res) => {
  const userId = req.uid;

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

  let currentState = getOrCreateUserState(userId);
  if (db) {
    try {
      const userDoc = await db.collection('users').doc(userId).collection('data').doc('state').get();
      if (userDoc.exists) {
        const persisted = userDoc.data();
        if (persisted.activities) currentState.activities = persisted.activities;
        if (persisted.matrixState) currentState.matrix = persisted.matrixState;
        if (persisted.user) Object.assign(currentState.user, persisted.user);
        if (persisted.emergencyTasks) currentState.emergencyTasks = persisted.emergencyTasks;
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
// 2. Fetch Latest State (GET /api/sync/state)
// -------------------------------------------------------------
syncRouter.get('/state', verifyFirebaseToken, async (req, res) => {
  const userId = req.uid;
  const state = getOrCreateUserState(userId);

  try {
    if (db) {
      const userDoc = await db.collection('users').doc(userId).collection('data').doc('state').get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        if (uData.user) Object.assign(state.user, uData.user);
        if (uData.activities) state.activities = uData.activities;
        if (uData.matrixState) state.matrix = uData.matrixState;
        if (uData.emergencyTasks) state.emergencyTasks = uData.emergencyTasks;
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
syncRouter.post('/toggle', verifyFirebaseToken, async (req, res) => {
  const userId = req.uid;
  const { habitId, completed, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const state = getOrCreateUserState(userId);

  if (!state.matrix[habitId]) {
    state.matrix[habitId] = {};
  }
  state.matrix[habitId][targetDate] = completed;

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
    state.user.currentXP = (state.user.currentXP || 0) + 20;
  }
  state.lastUpdated = new Date().toISOString();

  broadcastToClients(userId, {
    type: 'HABIT_TOGGLED',
    habitId,
    completed,
    date: targetDate,
    state,
    timestamp: Date.now(),
  });

  if (db) {
    try {
      const docRef = db.collection('users').doc(userId).collection('data').doc('state');
      const docSnap = await docRef.get();
      let unifiedData = docSnap.exists ? docSnap.data() : null;

      if (!unifiedData) {
        unifiedData = {
          activities: state.activities || [],
          matrixState: {},
          user: {
            currentXP: state.user.currentXP || 0,
            level: state.user.level || 0,
            overallStreak: state.user.overallStreak || 0,
            longestStreak: state.user.longestStreak || 0,
          },
          emergencyTasks: [],
          logs: [],
        };
      }

      unifiedData.activities = (unifiedData.activities || []).map((act) => {
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

      const dateParts = targetDate.split('-');
      const dayNum = parseInt(dateParts[2], 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
        const dayIndex = dayNum - 1;
        if (!unifiedData.matrixState) {
          unifiedData.matrixState = {};
        }
        if (!unifiedData.matrixState[habitId] || !Array.isArray(unifiedData.matrixState[habitId])) {
          unifiedData.matrixState[habitId] = Array.from({ length: 31 }, () => false);
        }
        unifiedData.matrixState[habitId][dayIndex] = completed;
      }

      if (!unifiedData.user) {
        unifiedData.user = {};
      }
      unifiedData.user.currentXP = state.user.currentXP;
      unifiedData.user.overallStreak = state.user.overallStreak;
      unifiedData.user.level = state.user.level;

      unifiedData.updatedAt = Date.now();

      await docRef.set(unifiedData, { merge: true });
    } catch (err) {
      console.warn('Firestore toggle persistence warning:', err.message);
    }
  }

  res.json({
    success: true,
    message: `Toggled ${habitId} -> ${completed}`,
    state,
  });
});

// -------------------------------------------------------------
// 4. Save Full State (POST /api/sync/state)
// -------------------------------------------------------------
syncRouter.post('/state', verifyFirebaseToken, async (req, res) => {
  const userId = req.uid;
  const { state: incomingState } = req.body;
  if (!incomingState) {
    return res.status(400).json({ success: false, error: 'Missing state object' });
  }

  const state = getOrCreateUserState(userId);
  Object.assign(state, incomingState, { lastUpdated: new Date().toISOString() });

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

  if (db) {
    try {
      const docRef = db.collection('users').doc(userId).collection('data').doc('state');
      await docRef.set(
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
syncRouter.post('/reset', verifyFirebaseToken, async (req, res) => {
  const userId = req.uid;

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

  broadcastToClients(userId, {
    type: 'FORCE_RESET',
    state: cleanState,
    timestamp: Date.now(),
  });

  if (db) {
    try {
      const docRef = db.collection('users').doc(userId).collection('data').doc('state');
      await docRef.set({ ...cleanState, updatedAt: Date.now() }, { merge: false });
    } catch (err) {
      console.warn('Firestore force reset error:', err.message);
    }
  }

  res.json({ success: true, message: 'Data reset cleanly', state: cleanState });
});
