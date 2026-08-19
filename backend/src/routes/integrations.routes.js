import { Router } from 'express';
import { db, authAdmin, isFirebaseInitialized } from '../config/firebase.js';
import {
  CANONICAL_MAPPING,
  fetchPlatformData,
} from '../integrations/index.js';
import {
  normalizePlatformActivity,
  buildFirestoreIntegrationDoc,
} from '../services/activityNormalizer.js';
import { evaluateHabitsAndStreaks } from '../services/streakEngine.js';
import { encryptSecret } from '../utils/crypto.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.middleware.js';

const router = Router();
const DEFAULT_USER_ID = 'local_authenticated_dev_user';

router.use(verifyFirebaseToken);

const memoryStore = {
  integrations: {},
  users: {},
  matrix: {},
  activity_logs: [],
};

async function resolveTargetUserId(req, fallbackId = 'local_authenticated_dev_user') {
  if (req.user?.uid) return req.user.uid;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1]?.trim();
      if (token && isFirebaseInitialized && authAdmin) {
        const decoded = await authAdmin.verifyIdToken(token);
        if (decoded.uid) {
          return decoded.uid;
        }
      } else if (token) {
        return token.length > 10 ? token : fallbackId;
      }
    } catch (err) {
      console.warn('Token verification warning in integrations routes:', err.message);
    }
  }
  return req.query.userId || req.body?.userId || fallbackId;
}

/**
 * @route   GET /api/integrations
 * @desc    Get all connected platforms and stats for user
 */
router.get('/', async (req, res) => {
  const userId = await resolveTargetUserId(req, DEFAULT_USER_ID);

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
  const userId = await resolveTargetUserId(req, req.body.userId || DEFAULT_USER_ID);
  const { platform, handleOrUrl, token } = req.body;

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
      const docId = `${userId}_${normalized.platform}`;
      db.collection('integrations').doc(docId).set(docData, { merge: true }).catch((err) => {
        console.warn(`Firestore saving warning: ${err.message}`);
      });
      db.collection('users').doc(userId).set({
        [`platform_${normalized.platform}_username`]: handleOrUrl,
        [`platform_${normalized.platform}_streak`]: normalized.streak?.currentStreak || 0,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch((err) => {
        console.warn(`Firestore user saving warning: ${err.message}`);
      });
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
// Simple in-memory cache for Codolio and LeetCode calls (5 minutes TTL)
const apiCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchWithCache(key, fetchFn) {
  const cached = apiCache.get(key);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[Cache Hit] Serving ${key} from memory cache`);
    return cached.data;
  }
  const data = await fetchFn();
  apiCache.set(key, { timestamp: now, data });
  return data;
}

function getLocalDateString(dateInput, timezone = 'Asia/Kolkata') {
  const d = dateInput ? new Date(dateInput) : new Date();
  try {
    return d.toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return d.toLocaleDateString('en-CA');
  }
}

router.post('/sync', async (req, res) => {
  const userId = await resolveTargetUserId(req, req.body.userId || DEFAULT_USER_ID);
  const {
    habits = [],
    matrixState = {},
    user = {},
    specificPlatform,
  } = req.body;

  try {
    const userIntegrations = memoryStore.integrations[userId] || {};
    const codolioUsername = user?.codolioUsername || user?.platformUrls?.codolio || userIntegrations?.codolio?.username || '';
    const leetcodeUsername = user?.leetcodeUsername || user?.platformUrls?.leetcode || userIntegrations?.leetcode?.username || '';
    const codeforcesHandle = user?.codeforcesHandle || user?.platformUrls?.codeforces || userIntegrations?.codeforces?.username || '';
    const gfgUsername = user?.gfgUsername || user?.platformUrls?.gfg || userIntegrations?.gfg?.username || '';
    const githubUsername = user?.githubUsername || user?.platformUrls?.github || userIntegrations?.github?.username || userIntegrations?.github?.identity?.username || '';
    const tz = (user.timezone || 'Asia/Kolkata').split(' ')[0];

    // 1. Fetch platform profiles in parallel (Codolio, LeetCode, Codeforces, GFG, GitHub)
    let rawCodolio = null;
    let rawLeetCode = null;
    let rawCodeforces = null;
    let rawGFG = null;
    let rawGitHub = null;

    await Promise.allSettled([
      (async () => {
        if (!codolioUsername) return;
        try {
          rawCodolio = await fetchWithCache(`codolio_${codolioUsername}`, () =>
            fetchPlatformData('codolio', codolioUsername)
          );
        } catch (err) {
          console.warn('Failed to fetch Codolio profile:', err.message);
        }
      })(),
      (async () => {
        if (!leetcodeUsername) return;
        try {
          rawLeetCode = await fetchWithCache(`leetcode_${leetcodeUsername}`, () =>
            fetchPlatformData('leetcode', leetcodeUsername)
          );
        } catch (err) {
          console.warn('Failed to fetch LeetCode data directly:', err.message);
        }
      })(),
      (async () => {
        if (!codeforcesHandle) return;
        try {
          rawCodeforces = await fetchWithCache(`codeforces_${codeforcesHandle}`, () =>
            fetchPlatformData('codeforces', codeforcesHandle)
          );
        } catch (err) {
          console.warn('Failed to fetch Codeforces data directly:', err.message);
        }
      })(),
      (async () => {
        if (!gfgUsername) return;
        try {
          rawGFG = await fetchWithCache(`gfg_${gfgUsername}`, () =>
            fetchPlatformData('gfg', gfgUsername)
          );
        } catch (err) {
          console.warn('Failed to fetch GFG data directly:', err.message);
        }
      })(),
      (async () => {
        if (!githubUsername) return;
        try {
          rawGitHub = await fetchWithCache(`github_${githubUsername}`, () =>
            fetchPlatformData('github', githubUsername)
          );
        } catch (err) {
          console.warn('Failed to fetch GitHub data directly:', err.message);
        }
      })(),
    ]);

    // Fetch existing GitHub & GFG activity from Firestore to prevent data wiping
    let existingGitHubActivity = {};
    let existingGFGActivity = {};
    if (isFirebaseInitialized && db) {
      try {
        const fetchExistingDoc = (docId) => Promise.race([
          db.collection('integrations').doc(docId).get(),
          new Promise((resolve) => setTimeout(() => resolve(null), 1200))
        ]);
        const ghDoc = await fetchExistingDoc(`${userId}_github`);
        if (ghDoc && ghDoc.exists) {
          existingGitHubActivity = ghDoc.data().activity || ghDoc.data().dailyActivity || {};
        }
        const gfgDoc = await fetchExistingDoc(`${userId}_gfg`);
        if (gfgDoc && gfgDoc.exists) {
          existingGFGActivity = gfgDoc.data().activity || gfgDoc.data().dailyActivity || {};
        }
      } catch (err) {
        console.warn('Failed to load existing platform activity from Firestore:', err.message);
      }
    }

    // 2. Parse Codolio profile JSON & connected platforms
    const normalizedPlatforms = [];
    let normalizedLC = null;
    if (rawLeetCode) {
      normalizedLC = normalizePlatformActivity(rawLeetCode);
    }

    let normalizedCF = null;
    if (rawCodeforces) {
      normalizedCF = normalizePlatformActivity(rawCodeforces);
    }

    let normalizedGFG = null;
    if (rawGFG) {
      normalizedGFG = normalizePlatformActivity(rawGFG);
      normalizedGFG.dailyActivity = {
        ...existingGFGActivity,
        ...normalizedGFG.dailyActivity
      };
    }

    let normalizedGitHub = null;
    if (rawGitHub) {
      normalizedGitHub = normalizePlatformActivity(rawGitHub);
      normalizedGitHub.dailyActivity = {
        ...existingGitHubActivity,
        ...normalizedGitHub.dailyActivity
      };
    }

    if (rawCodolio && rawCodolio.raw?.profileJson?.data) {
      const pData = rawCodolio.raw.profileJson.data;
      const cards = pData.platformProfiles?.platformProfiles || pData.platformCards || [];

      cards.forEach((card) => {
        let pName = (card.platform || '').toLowerCase().trim();
        if (pName.includes('geeks') || pName === 'gfg') pName = 'gfg';
        if (pName.includes('codeforces')) pName = 'codeforces';
        if (pName.includes('atcoder')) pName = 'atcoder';
        if (pName.includes('hackerrank')) pName = 'hackerrank';
        if (pName.includes('codechef')) pName = 'codechef';
        if (pName.includes('leetcode')) pName = 'leetcode';

        const dailyActivity = {};
        const calendar = card.dailyActivityStatsResponse?.submissionCalendar || {};
        Object.keys(calendar).forEach((ts) => {
          const dateStr = getLocalDateString(Number(ts) * 1000, tz);
          dailyActivity[dateStr] = Number(calendar[ts]) || 1;
        });

        const userStats = card.userStats || {};
        const qStats = card.totalQuestionStats || {};
        const stats = {
          solved: qStats.totalQuestionCounts || userStats.totalQuestionCounts || 0,
          rating: userStats.currentRating || userStats.rating || 0,
          rank: userStats.rank || 'Active',
        };

        const normalizedCard = {
          platform: pName,
          username: card.username || codolioUsername,
          isCodingPlatform: pName !== 'youtube',
          identity: {
            username: card.username || codolioUsername,
            profileUrl: card.profileUrl || '',
            verified: true,
          },
          stats,
          dailyActivity,
          sync: { status: 'success', lastSyncedAt: new Date().toISOString() }
        };
        normalizedPlatforms.push(normalizedCard);
      });
    }

    // Parse GitHub from Codolio's githubJson
    if (rawCodolio && rawCodolio.raw?.githubJson?.data) {
      const ghData = rawCodolio.raw.githubJson.data;
      const dailyActivity = {};
      const devCal = ghData.developmentActivity || {};
      Object.keys(devCal).forEach((ts) => {
        const count = devCal[ts];
        if (count > 0) {
          const dateStr = getLocalDateString(Number(ts) * 1000, tz);
          dailyActivity[dateStr] = count;
        }
      });

      const normalizedGitHub = {
        platform: 'github',
        username: ghData.githubProfile || codolioUsername,
        isCodingPlatform: true,
        identity: {
          username: ghData.githubProfile || codolioUsername,
          profileUrl: `https://github.com/${ghData.githubProfile || ''}`,
          verified: true,
        },
        stats: {
          solved: ghData.commitCounts || 0,
          totalContributions: ghData.totalContributions || 0,
        },
        dailyActivity: {
          ...existingGitHubActivity,
          ...dailyActivity
        },
        sync: { status: 'success', lastSyncedAt: new Date().toISOString() }
      };
      normalizedPlatforms.push(normalizedGitHub);
    }

    // Merge direct LeetCode stats with Codolio LeetCode stats
    if (normalizedLC) {
      const codolioLC = normalizedPlatforms.find(p => p.platform === 'leetcode');
      if (codolioLC) {
        const mergedDaily = { ...codolioLC.dailyActivity };
        for (const [dStr, cnt] of Object.entries(normalizedLC.dailyActivity)) {
          mergedDaily[dStr] = Math.max(mergedDaily[dStr] || 0, cnt);
        }
        codolioLC.dailyActivity = mergedDaily;
        codolioLC.stats.solved = Math.max(codolioLC.stats.solved || 0, normalizedLC.stats.solved || 0);
        codolioLC.stats.todaySubmissions = Math.max(codolioLC.stats.todaySubmissions || 0, normalizedLC.stats.todaySubmissions || 0);
      } else {
        normalizedPlatforms.push(normalizedLC);
      }
    }

    // Merge direct Codeforces stats with Codolio Codeforces stats
    if (normalizedCF) {
      const codolioCF = normalizedPlatforms.find(p => p.platform === 'codeforces');
      if (codolioCF) {
        const mergedDaily = { ...codolioCF.dailyActivity };
        for (const [dStr, cnt] of Object.entries(normalizedCF.dailyActivity)) {
          mergedDaily[dStr] = Math.max(mergedDaily[dStr] || 0, cnt);
        }
        codolioCF.dailyActivity = mergedDaily;
        codolioCF.stats.solved = Math.max(codolioCF.stats.solved || 0, normalizedCF.stats.totalSolved || normalizedCF.stats.solved || 0);
        codolioCF.stats.rating = Math.max(codolioCF.stats.rating || 0, normalizedCF.stats.rating || 0);
      } else {
        normalizedPlatforms.push(normalizedCF);
      }
    }

    // Merge direct GFG stats with Codolio GFG stats
    if (normalizedGFG) {
      const codolioGFG = normalizedPlatforms.find(p => p.platform === 'gfg');
      if (codolioGFG) {
        const mergedDaily = { ...codolioGFG.dailyActivity };
        for (const [dStr, cnt] of Object.entries(normalizedGFG.dailyActivity)) {
          mergedDaily[dStr] = Math.max(mergedDaily[dStr] || 0, cnt);
        }
        codolioGFG.dailyActivity = mergedDaily;
        codolioGFG.stats.solved = Math.max(codolioGFG.stats.solved || 0, normalizedGFG.stats.solved || 0);
      } else {
        normalizedPlatforms.push(normalizedGFG);
      }
    }

    // Merge direct GitHub stats with Codolio GitHub stats
    if (normalizedGitHub) {
      const codolioGH = normalizedPlatforms.find(p => p.platform === 'github');
      if (codolioGH) {
        const mergedDaily = { ...codolioGH.dailyActivity };
        for (const [dStr, cnt] of Object.entries(normalizedGitHub.dailyActivity)) {
          mergedDaily[dStr] = Math.max(mergedDaily[dStr] || 0, cnt);
        }
        codolioGH.dailyActivity = mergedDaily;
        codolioGH.stats.totalContributions = Math.max(codolioGH.stats.totalContributions || 0, normalizedGitHub.stats.totalContributions || 0);
        codolioGH.stats.repositories = Math.max(codolioGH.stats.repositories || 0, normalizedGitHub.stats.repositories || 0);
      } else {
        normalizedPlatforms.push(normalizedGitHub);
      }
    }

    // Filter specifically requested platform if applicable
    const finalNormalized = specificPlatform
      ? normalizedPlatforms.filter(p => p.platform === specificPlatform)
      : normalizedPlatforms;

    // 3. Persist all dynamically synced platforms to memory store and fire-and-forget Firestore
    finalNormalized.forEach((normalized) => {
      const platform = normalized.platform;
      const firestoreDoc = buildFirestoreIntegrationDoc(userId, normalized);
      
      if (!memoryStore.integrations[userId]) memoryStore.integrations[userId] = {};
      memoryStore.integrations[userId][platform] = firestoreDoc;

      if (isFirebaseInitialized && db) {
        const docId = `${userId}_${platform}`;
        db.collection('integrations').doc(docId).set(firestoreDoc, { merge: true }).catch((fsErr) => {
          console.warn(`Firestore write warning for ${platform}:`, fsErr.message);
        });
      }
    });

    // ⚡ Execute central Unified Streak Engine on normalized dataset
    const streakResult = evaluateHabitsAndStreaks({
      userId,
      habits,
      normalizedPlatforms: finalNormalized,
      matrixState,
      user,
    });

    // Save to Firestore collections: users, matrix, activity_logs
    if (isFirebaseInitialized && db) {
      db.collection('users').doc(userId).set({
        user: streakResult.user,
        summary: streakResult.summary,
        platformStreaks: streakResult.platformStreaks,
        unifiedCodingStreak: streakResult.unifiedCodingStreak,
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true }).catch((err) => console.warn('Firestore user sync write error:', err.message));

      db.collection('matrix').doc(userId).set({
        matrixState: streakResult.matrixState,
        habits: streakResult.habits,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch((err) => console.warn('Firestore matrix sync write error:', err.message));

      if (streakResult.auditLogs && streakResult.auditLogs.length > 0) {
        const batch = db.batch();
        streakResult.auditLogs.forEach((log) => {
          const logRef = db.collection('activity_logs').doc(log.logId);
          batch.set(logRef, log);
        });
        batch.commit().catch((err) => console.warn('Firestore batch commit error:', err.message));
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
