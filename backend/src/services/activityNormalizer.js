/**
 * ⚡ Activity Normalizer Service
 * Standardizes raw responses from heterogeneous platform APIs into a single canonical contract:
 * {
 *   platform: 'github' | 'leetcode' | 'codeforces' | 'atcoder' | 'hackerrank' | 'gfg' | 'youtube',
 *   username: string,
 *   isCodingPlatform: boolean,
 *   identity: { username, profileUrl, avatarUrl, verified },
 *   stats: Record<string, any>,
 *   dailyActivity: Record<string, number>, // e.g. { "2026-08-13": 2, "2026-08-14": 0, "2026-08-15": 3 }
 *   sync: { status: 'success' | 'unavailable' | 'error', lastSyncedAt: string }
 * }
 */

export function normalizePlatformActivity(rawPlatformData) {
  if (!rawPlatformData || typeof rawPlatformData !== 'object') {
    return {
      platform: 'unknown',
      username: '',
      isCodingPlatform: false,
      identity: { username: '', profileUrl: '', verified: false },
      stats: {},
      dailyActivity: {},
      sync: { status: 'error', lastSyncedAt: new Date().toISOString() },
    };
  }

  const platform = String(rawPlatformData.platform || 'unknown').toLowerCase();
  const isCodingPlatform = platform !== 'youtube';

  const identity = {
    username: rawPlatformData.identity?.username || rawPlatformData.username || '',
    profileUrl: rawPlatformData.identity?.profileUrl || rawPlatformData.profileUrl || '',
    avatarUrl: rawPlatformData.identity?.avatarUrl || rawPlatformData.avatarUrl,
    verified: rawPlatformData.identity?.verified ?? rawPlatformData.verified ?? true,
    ...(rawPlatformData.identity || {}),
  };

  const stats = {
    ...(rawPlatformData.stats || {}),
  };

  // Standardize dailyActivity map: { "YYYY-MM-DD": number }
  const dailyActivity = {};
  const rawMap = rawPlatformData.dailyActivity || rawPlatformData.activity || {};
  
  for (const [key, val] of Object.entries(rawMap)) {
    if (typeof key === 'string' && key.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dailyActivity[key] = Number(val) || 0;
    }
  }

  const sync = {
    status: rawPlatformData.sync?.status || 'success',
    dailyActivityStatus: rawPlatformData.sync?.dailyActivityStatus || (rawPlatformData.stats?.dailyActivityAvailable === false ? 'unavailable' : 'available'),
    lastSyncedAt: rawPlatformData.sync?.lastSyncedAt || rawPlatformData.lastSyncedAt || new Date().toISOString(),
  };

  return {
    platform,
    username: identity.username,
    isCodingPlatform,
    identity,
    stats,
    dailyActivity,
    sync,
  };
}

/**
 * ⚡ Builds Firestore canonical document for `integrations/{userId}_{platform}`
 */
export function buildFirestoreIntegrationDoc(userId, normalizedData) {
  const todayStr = new Date().toISOString().split('T')[0];
  return {
    userId,
    platform: normalizedData.platform,
    identity: normalizedData.identity,
    stats: normalizedData.stats,
    activity: normalizedData.dailyActivity,
    todayCount: normalizedData.dailyActivity[todayStr] || 0,
    hasActivityToday: (normalizedData.dailyActivity[todayStr] || 0) > 0,
    sync: normalizedData.sync,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * ⚡ Combines all platform activities across dates for OR-based unified streak calculation
 */
export function buildCombinedDailyActivityMap(normalizedPlatforms = []) {
  const combinedCodingMap = {};
  const platformDailyMaps = {};

  normalizedPlatforms.forEach((p) => {
    platformDailyMaps[p.platform] = p.dailyActivity;

    if (p.isCodingPlatform) {
      for (const [dateStr, count] of Object.entries(p.dailyActivity)) {
        if (count > 0) {
          combinedCodingMap[dateStr] = (combinedCodingMap[dateStr] || 0) + count;
        }
      }
    }
  });

  return {
    combinedCodingMap,
    platformDailyMaps,
  };
}
