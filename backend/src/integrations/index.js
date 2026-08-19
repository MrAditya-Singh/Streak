/**
 * ⚡ Platform Integration Hub
 * Exports all canonical platform adapters with standardized fetch methods
 */

import { fetchGitHubData, parseGitHubUsername } from './github.js';
import { fetchLeetCodeData, parseLeetCodeUsername } from './leetcode.js';
import { fetchCodeforcesData, parseCodeforcesHandle } from './codeforces.js';
import { fetchHackerRankData, parseHackerRankUsername } from './hackerrank.js';
import { fetchAtCoderData, parseAtCoderUsername } from './atcoder.js';
import { fetchGFGData, parseGFGUsername } from './gfg.js';
import { fetchYouTubeData, parseYouTubeHandle } from './youtube.js';
import { fetchCodolioData, parseCodolioUsername } from './codolio.js';

export const SUPPORTED_PLATFORMS = [
  'codolio',
  'github',
  'leetcode',
  'codeforces',
  'hackerrank',
  'atcoder',
  'gfg',
  'youtube',
  'codestudio',
  'interviewbit',
  'codechef',
];

export const CANONICAL_MAPPING = {
  userId: 'local_authenticated_dev_user',
  displayName: 'Local User',
  timezone: 'Asia/Kolkata',
  integrations: {},
};

export async function fetchPlatformData(platform, usernameOrUrl, token) {
  const p = (platform || '').toLowerCase().trim();
  const timeoutFallback = {
    platform: p,
    username: usernameOrUrl,
    profileUrl: '',
    isVerified: true,
    hasActivityToday: false,
    dailyActivity: {},
    sync: { status: 'timeout', lastSyncedAt: new Date().toISOString() },
  };

  const fetchPromise = (async () => {
    switch (p) {
      case 'codolio':
        return await fetchCodolioData(usernameOrUrl, token);
      case 'github':
        return await fetchGitHubData(usernameOrUrl, token);
      case 'leetcode':
        return await fetchLeetCodeData(usernameOrUrl);
      case 'codeforces':
        return await fetchCodeforcesData(usernameOrUrl);
      case 'hackerrank':
        return await fetchHackerRankData(usernameOrUrl);
      case 'atcoder':
        return await fetchAtCoderData(usernameOrUrl);
      case 'gfg':
      case 'geeksforgeeks':
        return await fetchGFGData(usernameOrUrl);
      case 'youtube':
        return await fetchYouTubeData(usernameOrUrl, token);
      case 'codestudio':
      case 'code360':
        return {
          platform: 'codestudio',
          username: usernameOrUrl,
          profileUrl: usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://www.naukri.com/code360/profile/${usernameOrUrl}`,
          isVerified: true,
          stats: { status: 'connected' },
          hasActivityToday: false,
          dailyActivity: {},
        };
      case 'interviewbit':
        return {
          platform: 'interviewbit',
          username: usernameOrUrl,
          profileUrl: usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://www.interviewbit.com/profile/${usernameOrUrl}`,
          isVerified: true,
          stats: { status: 'connected' },
          hasActivityToday: false,
          dailyActivity: {},
        };
      case 'codechef':
        return {
          platform: 'codechef',
          username: usernameOrUrl,
          profileUrl: usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://www.codechef.com/users/${usernameOrUrl}`,
          isVerified: true,
          stats: { status: 'connected' },
          hasActivityToday: false,
          dailyActivity: {},
        };
      default:
        // Generic custom platform support
        return {
          platform: p,
          username: usernameOrUrl,
          profileUrl: usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://${p}.com/profile/${usernameOrUrl}`,
          isVerified: true,
          stats: { status: 'connected', customPlatform: true },
          hasActivityToday: false,
          dailyActivity: {},
        };
    }
  })();

  return Promise.race([
    fetchPromise,
    new Promise((resolve) => setTimeout(() => resolve(timeoutFallback), 2000)),
  ]);
}

export {
  fetchCodolioData,
  fetchGitHubData,
  fetchLeetCodeData,
  fetchCodeforcesData,
  fetchHackerRankData,
  fetchAtCoderData,
  fetchGFGData,
  fetchYouTubeData,
  parseCodolioUsername,
  parseGitHubUsername,
  parseLeetCodeUsername,
  parseCodeforcesHandle,
  parseHackerRankUsername,
  parseAtCoderUsername,
  parseGFGUsername,
  parseYouTubeHandle,
};
