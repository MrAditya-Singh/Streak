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
          const userDoc = await db.collection('users').doc(userId).get();
          const user = userDoc.exists ? (userDoc.data().user || {}) : {};
          
          const codolioUsername = user.codolioUsername || platforms.codolio?.username || 'Mr.Aditya';
          const leetcodeUsername = user.leetcodeUsername || platforms.leetcode?.username || 'mradityasingh';
          const codeforcesHandle = user.codeforcesHandle || platforms.codeforces?.username || 'Aditya__YUPP';
          const gfgUsername = user.gfgUsername || platforms.gfg?.username || 'mraditya';
          const tz = (user.timezone || 'Asia/Kolkata').split(' ')[0];

          // Fetch Codolio, LeetCode direct, Codeforces direct, & GFG direct
          let rawCodolio = null;
          try {
            rawCodolio = await fetchPlatformData('codolio', codolioUsername);
          } catch (err) {
            console.warn(`[Cron] Codolio fetch warning for ${userId}:`, err.message);
          }

          let rawLeetCode = null;
          try {
            rawLeetCode = await fetchPlatformData('leetcode', leetcodeUsername);
          } catch (err) {
            console.warn(`[Cron] LeetCode fetch warning for ${userId}:`, err.message);
          }

          let rawCodeforces = null;
          try {
            rawCodeforces = await fetchPlatformData('codeforces', codeforcesHandle);
          } catch (err) {
            console.warn(`[Cron] Codeforces fetch warning for ${userId}:`, err.message);
          }

          let rawGFG = null;
          try {
            rawGFG = await fetchPlatformData('gfg', gfgUsername);
          } catch (err) {
            console.warn(`[Cron] GFG fetch warning for ${userId}:`, err.message);
          }

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
                const dateStr = new Date(Number(ts) * 1000).toLocaleDateString('en-CA', { timeZone: tz });
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
                const dateStr = new Date(Number(ts) * 1000).toLocaleDateString('en-CA', { timeZone: tz });
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
              dailyActivity,
              sync: { status: 'success', lastSyncedAt: new Date().toISOString() }
            };
            normalizedPlatforms.push(normalizedGitHub);
          }

          // Merge direct LeetCode stats
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

          // Merge direct Codeforces stats
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

          // Merge direct GFG stats
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

          // Save platform status docs
          const savePromises = normalizedPlatforms.map(async (normalized) => {
            const platform = normalized.platform;
            const firestoreDoc = buildFirestoreIntegrationDoc(userId, normalized);
            const docId = `${userId}_${platform}`;
            await db.collection('integrations').doc(docId).set(firestoreDoc, { merge: true });
          });
          await Promise.all(savePromises);

          // Fetch user's current matrix and habits
          const habitsDoc = await db.collection('matrix').doc(userId).get();
          const habits = habitsDoc.exists ? (habitsDoc.data().habits || []) : [];
          const matrixState = habitsDoc.exists ? (habitsDoc.data().matrixState || {}) : {};

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
