import cron from 'node-cron';
import { sqliteDb, getAllUsers, getUserState, saveUserState, saveUser } from '../config/sqlite.js';
import { isSupabaseConfigured, syncUserToSupabase, syncStateToSupabase } from '../config/supabase.js';
import { fetchPlatformData } from '../integrations/index.js';
import { normalizePlatformActivity, buildFirestoreIntegrationDoc } from './activityNormalizer.js';
import { evaluateHabitsAndStreaks } from './streakEngine.js';

let cronJobInstance = null;

/**
 * ⚡ Background Auto-Sync Worker (Every 30 Minutes)
 * Fetches GitHub commits, LeetCode ACs, Codeforces solves, AtCoder ACs, GFG, YouTube,
 * normalizes daily activity, updates SQLite and Supabase databases, and executes the Unified Streak Engine.
 */
export function startCronService(scheduleExpression = '*/30 * * * *') {
  if (cronJobInstance) {
    cronJobInstance.stop();
  }

  console.log(`⏰ Starting Background Cron Sync Service (Schedule: ${scheduleExpression} - Every 30 mins)`);

  cronJobInstance = cron.schedule(scheduleExpression, async () => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🔄 Running Scheduled Background Multi-Platform Sync...`);

    try {
      // 1. Fetch user list from SQLite
      let users = getAllUsers();
      if (!users || users.length === 0) {
        users = [{ id: 'local_authenticated_dev_user', uid: 'local_authenticated_dev_user', name: 'Hunter' }];
      }

      // 2. Execute pipeline per user
      for (const user of users) {
        const userId = user.id || user.uid;
        try {
          const userState = getUserState(userId);
          const habits = userState.activities || [];
          const matrixState = userState.matrix || {};

          // Fetch stored integration cache from SQLite
          const cacheRows = sqliteDb.prepare('SELECT * FROM integration_cache WHERE user_id = ?').all(userId);
          const platformsMap = {};
          cacheRows.forEach((r) => {
            try { platformsMap[r.platform] = JSON.parse(r.data_json); } catch {}
          });

          const codolioUsername = user.codolioUsername || platformsMap.codolio?.username || '';
          const leetcodeUsername = user.leetcodeUsername || platformsMap.leetcode?.username || '';
          const codeforcesHandle = user.codeforcesHandle || platformsMap.codeforces?.username || '';
          const gfgUsername = user.gfgUsername || platformsMap.gfg?.username || '';
          const githubUsername = user.githubUsername || platformsMap.github?.username || '';

          // Fetch Codolio, LeetCode, Codeforces, GFG, GitHub
          try {
            if (codolioUsername) {
              await fetchPlatformData('codolio', codolioUsername);
            }
          } catch (e) {
            console.warn(`[Cron] Codolio fetch warning for ${userId}:`, e.message);
          }

          let rawLeetCode = null;
          try {
            if (leetcodeUsername) {
              rawLeetCode = await fetchPlatformData('leetcode', leetcodeUsername);
            }
          } catch (e) {
            console.warn(`[Cron] LeetCode fetch warning for ${userId}:`, e.message);
          }

          let rawCodeforces = null;
          try {
            if (codeforcesHandle) {
              rawCodeforces = await fetchPlatformData('codeforces', codeforcesHandle);
            }
          } catch (e) {
            console.warn(`[Cron] Codeforces fetch warning for ${userId}:`, e.message);
          }

          let rawGFG = null;
          try {
            if (gfgUsername) {
              rawGFG = await fetchPlatformData('gfg', gfgUsername);
            }
          } catch (e) {
            console.warn(`[Cron] GFG fetch warning for ${userId}:`, e.message);
          }

          let rawGitHub = null;
          try {
            if (githubUsername) {
              rawGitHub = await fetchPlatformData('github', githubUsername);
            }
          } catch (e) {
            console.warn(`[Cron] GitHub fetch warning for ${userId}:`, e.message);
          }

          const normalizedPlatforms = [];
          if (rawLeetCode) normalizedPlatforms.push(normalizePlatformActivity(rawLeetCode));
          if (rawCodeforces) normalizedPlatforms.push(normalizePlatformActivity(rawCodeforces));
          if (rawGFG) normalizedPlatforms.push(normalizePlatformActivity(rawGFG));
          if (rawGitHub) normalizedPlatforms.push(normalizePlatformActivity(rawGitHub));

          if (normalizedPlatforms.length === 0) {
            continue;
          }

          // Persist to SQLite integration cache
          for (const normDoc of normalizedPlatforms) {
            const platform = normDoc.platform;
            const docData = buildFirestoreIntegrationDoc(userId, normDoc);
            try {
              sqliteDb.prepare(`
                INSERT INTO integration_cache (user_id, platform, data_json, synced_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, platform) DO UPDATE SET
                  data_json = excluded.data_json,
                  synced_at = excluded.synced_at
              `).run(userId, platform, JSON.stringify(docData), new Date().toISOString());
            } catch {}
          }

          const streakResult = evaluateHabitsAndStreaks({
            userId,
            habits,
            normalizedPlatforms,
            matrixState,
            user,
          });

          const updatedState = {
            activities: streakResult.habits,
            matrixState: streakResult.matrixState,
            user: streakResult.user,
            emergencyTasks: userState.emergencyTasks || [],
          };

          saveUserState(userId, updatedState);
          saveUser({ id: userId, uid: userId, ...streakResult.user });

          if (isSupabaseConfigured) {
            syncStateToSupabase(userId, updatedState).catch(() => {});
            syncUserToSupabase({ id: userId, uid: userId, ...streakResult.user }).catch(() => {});
          }

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
