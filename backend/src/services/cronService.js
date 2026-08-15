import cron from 'node-cron';
import { db, isFirebaseInitialized } from '../config/firebase.js';
import { fetchPlatformData, CANONICAL_MAPPING } from '../integrations/index.js';
import { normalizePlatformActivity, buildFirestoreIntegrationDoc } from './activityNormalizer.js';
import { evaluateHabitsAndStreaks } from './streakEngine.js';

let cronJobInstance = null;

/**
 * ⚡ Background Auto-Sync Worker (Every 30 Minutes)
 * Fetches GitHub commits, LeetCode ACs, Codeforces solves, AtCoder ACs, GFG, YouTube,
 * normalizes daily activity, updates Firestore collections, and executes the Unified Streak Engine.
 */
export function startCronService(scheduleExpression = '*/30 * * * *') {
  if (cronJobInstance) {
    cronJobInstance.stop();
  }

  console.log(`⏰ Starting Background Cron Sync Service (Schedule: ${scheduleExpression} - Every 30 mins)`);

  cronJobInstance = cron.schedule(scheduleExpression, async () => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🔄 Running Scheduled Background Multi-Platform Sync...`);

    try {
      if (!isFirebaseInitialized || !db) {
        console.log('ℹ️ Background sync skipped: Firestore offline / propagating.');
        return;
      }

      // 1. Fetch user integration records (or canonical fallback)
      const snapshot = await db.collection('integrations').get();
      const usersIntegrations = {};

      if (!snapshot.empty) {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const uId = data.userId || 'aditya-singh';
          if (!usersIntegrations[uId]) usersIntegrations[uId] = {};
          usersIntegrations[uId][data.platform] = data;
        });
      } else {
        usersIntegrations['aditya-singh'] = CANONICAL_MAPPING.integrations;
      }

      // 2. Execute pipeline per user
      for (const [userId, platforms] of Object.entries(usersIntegrations)) {
        try {
          const normalizedPlatforms = [];
          for (const [platform, record] of Object.entries(platforms)) {
            const usernameInput = record.identity?.username || record.username;
            if (usernameInput) {
              try {
                const rawData = await fetchPlatformData(platform, usernameInput);
                const normalized = normalizePlatformActivity(rawData);
                normalizedPlatforms.push(normalized);

                const firestoreDoc = buildFirestoreIntegrationDoc(userId, normalized);
                const docId = `${userId}_${platform}`;
                await db.collection('integrations').doc(docId).set(firestoreDoc, { merge: true });
              } catch (err) {
                console.warn(`[Cron] Error syncing ${platform} for ${userId}:`, err.message);
              }
            }
          }

          // Fetch user's current matrix and habits
          const habitsDoc = await db.collection('matrix').doc(userId).get();
          const userDoc = await db.collection('users').doc(userId).get();

          const habits = habitsDoc.exists ? (habitsDoc.data().habits || []) : [];
          const matrixState = habitsDoc.exists ? (habitsDoc.data().matrixState || {}) : {};
          const user = userDoc.exists ? (userDoc.data().user || {}) : {};

          const streakResult = evaluateHabitsAndStreaks({
            userId,
            habits,
            normalizedPlatforms,
            matrixState,
            user,
          });

          await db.collection('matrix').doc(userId).set({
            matrixState: streakResult.matrixState,
            habits: streakResult.habits,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          await db.collection('users').doc(userId).set({
            user: streakResult.user,
            summary: streakResult.summary,
            platformStreaks: streakResult.platformStreaks,
            unifiedCodingStreak: streakResult.unifiedCodingStreak,
            lastSyncedAt: new Date().toISOString(),
          }, { merge: true });

          console.log(`[Cron] ✓ Synced ${userId}: Unified Coding Streak: ${streakResult.unifiedCodingStreak} Days (+${streakResult.xpAwardedThisRun} XP)`);
        } catch (userSyncErr) {
          console.warn(`[Cron] Error processing user ${userId}:`, userSyncErr.message);
        }
      }

      console.log(`[${new Date().toLocaleTimeString()}] ✅ Scheduled Background Sync Pipeline Completed.`);
    } catch (cronError) {
      console.error('[Cron] Fatal error during scheduled sync:', cronError);
    }
  });

  return cronJobInstance;
}
