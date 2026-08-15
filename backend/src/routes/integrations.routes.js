import { Router } from 'express';
import { db, isFirebaseInitialized } from '../config/firebase.js';
import {
  SUPPORTED_PLATFORMS,
  CANONICAL_MAPPING,
  fetchPlatformData,
} from '../integrations/index.js';
import {
  normalizePlatformActivity,
  buildFirestoreIntegrationDoc,
} from '../services/activityNormalizer.js';
import { evaluateHabitsAndStreaks } from '../services/streakEngine.js';
import { encryptSecret, decryptSecret } from '../utils/crypto.js';

const router = Router();
const DEFAULT_USER_ID = 'aditya-singh';

const memoryStore = {
  integrations: {},
  users: {},
  matrix: {},
  activity_logs: [],
};

/**
 * @route   GET /api/integrations
 * @desc    Get all connected platforms and stats for user
 */
router.get('/', async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;

  if (isFirebaseInitialized && db) {
    try {
      const snapshot = await db.collection('integrations')
        .where('userId', '==', userId)
        .get();

      const integrations = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const safeData = { ...data };
        delete safeData.encryptedToken;
        integrations[data.platform] = safeData;
      });

      if (Object.keys(integrations).length > 0) {
        return res.status(200).json({
          success: true,
          data: integrations,
          canonicalMapping: CANONICAL_MAPPING,
        });
      }
    } catch (err) {
      console.warn('Firestore query fallback to memory cache:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    data: memoryStore.integrations[userId] || CANONICAL_MAPPING.integrations,
    canonicalMapping: CANONICAL_MAPPING,
    source: 'memory_cache',
  });
});

/**
 * @route   POST /api/integrations/connect
 * @desc    Verify and connect a new platform account
 */
router.post('/connect', async (req, res) => {
  const { platform, handleOrUrl, token, userId = DEFAULT_USER_ID } = req.body;

  if (!platform || !handleOrUrl) {
    return res.status(400).json({ error: 'Platform and username/URL are required' });
  }

  try {
    console.log(`🔍 [Adapter Pipeline] Verifying [${platform}] for user [${userId}]`);
    const rawData = await fetchPlatformData(platform, handleOrUrl, token);
    const normalized = normalizePlatformActivity(rawData);
    const docData = buildFirestoreIntegrationDoc(userId, normalized);

    if (token) {
      docData.encryptedToken = encryptSecret(token);
    }

    if (!memoryStore.integrations[userId]) memoryStore.integrations[userId] = {};
    memoryStore.integrations[userId][normalized.platform] = docData;

    if (isFirebaseInitialized && db) {
      try {
        const docId = `${userId}_${normalized.platform}`;
        await db.collection('integrations').doc(docId).set(docData, { merge: true });
      } catch (firestoreErr) {
        console.warn(`Firestore saving warning: ${firestoreErr.message}`);
      }
    }

    const safeResponse = { ...docData };
    delete safeResponse.encryptedToken;

    res.status(200).json({
      success: true,
      message: `✓ ${platform} profile mapped and verified successfully!`,
      data: safeResponse,
    });
  } catch (error) {
    console.error(`Error connecting ${platform}:`, error);
    res.status(400).json({
      error: `Verification failed for ${platform}`,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/integrations/sync
 * @desc    Idempotent live sync across all platforms + Normalization + Firestore persistence + Streak Engine
 */
router.post('/sync', async (req, res) => {
  const {
    userId = DEFAULT_USER_ID,
    habits = [],
    matrixState = {},
    user = {},
    specificPlatform,
  } = req.body;

  try {
    const platformsToSync = specificPlatform ? [specificPlatform] : SUPPORTED_PLATFORMS;
    const userCanonicalIntegrations = CANONICAL_MAPPING.integrations;

    const normalizedPlatforms = [];
    const syncPromises = platformsToSync.map(async (platform) => {
      const canonicalConfig = userCanonicalIntegrations[platform];
      const usernameInput = canonicalConfig?.username || user?.platformUrls?.[platform] || user?.[`${platform}Username`];

      if (usernameInput) {
        try {
          const rawData = await fetchPlatformData(platform, usernameInput);
          const normalized = normalizePlatformActivity(rawData);
          normalizedPlatforms.push(normalized);

          const firestoreDoc = buildFirestoreIntegrationDoc(userId, normalized);
          if (!memoryStore.integrations[userId]) memoryStore.integrations[userId] = {};
          memoryStore.integrations[userId][platform] = firestoreDoc;

          if (isFirebaseInitialized && db) {
            try {
              const docId = `${userId}_${platform}`;
              await db.collection('integrations').doc(docId).set(firestoreDoc, { merge: true });
            } catch (fsErr) {
              console.warn(`Firestore write warning for ${platform}:`, fsErr.message);
            }
          }
        } catch (err) {
          console.warn(`Could not sync ${platform}:`, err.message);
        }
      }
    });

    await Promise.all(syncPromises);

    // ⚡ Execute central Unified Streak Engine on normalized dataset
    const streakResult = evaluateHabitsAndStreaks({
      userId,
      habits,
      normalizedPlatforms,
      matrixState,
      user,
    });

    // Save to Firestore collections: users, matrix, activity_logs
    if (isFirebaseInitialized && db) {
      try {
        await db.collection('users').doc(userId).set({
          user: streakResult.user,
          summary: streakResult.summary,
          platformStreaks: streakResult.platformStreaks,
          unifiedCodingStreak: streakResult.unifiedCodingStreak,
          lastSyncedAt: new Date().toISOString(),
        }, { merge: true });

        await db.collection('matrix').doc(userId).set({
          matrixState: streakResult.matrixState,
          habits: streakResult.habits,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Save activity audit logs
        if (streakResult.auditLogs && streakResult.auditLogs.length > 0) {
          const batch = db.batch();
          streakResult.auditLogs.forEach((log) => {
            const logRef = db.collection('activity_logs').doc(log.logId);
            batch.set(logRef, log);
          });
          await batch.commit();
        }
      } catch (fsErr) {
        console.warn('Firestore sync write error:', fsErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `⚡ Live multi-platform sync complete! Unified Coding Streak: ${streakResult.unifiedCodingStreak} Days (+${streakResult.xpAwardedThisRun} XP)`,
      data: streakResult,
    });
  } catch (error) {
    console.error('Error during multi-platform sync:', error);
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
});

export default router;
