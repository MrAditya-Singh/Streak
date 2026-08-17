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
  userId: 'aditya-singh',
  displayName: 'Aditya',
  timezone: 'Asia/Kolkata',
  integrations: {
    codolio: {
      platform: 'codolio',
      username: 'mraditya',
      url: 'https://codolio.com/profile/mraditya',
      enabled: true,
    },
    github: {
      platform: 'github',
      username: 'MrAditya-Singh',
      url: 'https://github.com/MrAditya-Singh',
      enabled: true,
    },
    leetcode: {
      platform: 'leetcode',
      username: 'mradityasingh',
      url: 'https://leetcode.com/u/mradityasingh',
      enabled: true,
    },
    codeforces: {
      platform: 'codeforces',
      username: 'Aditya__YUPP',
      url: 'https://codeforces.com/profile/Aditya__YUPP',
      enabled: true,
    },
    hackerrank: {
      platform: 'hackerrank',
      username: 'mradityasingh',
      url: 'https://www.hackerrank.com/profile/mradityasingh',
      enabled: true,
    },
    atcoder: {
      platform: 'atcoder',
      username: 'MrAditya',
      url: 'https://atcoder.jp/users/MrAditya',
      enabled: true,
    },
    gfg: {
      platform: 'gfg',
      username: 'mraditya',
      url: 'https://www.geeksforgeeks.org/user/mraditya',
      enabled: true,
    },
    youtube: {
      platform: 'youtube',
      username: 'Viralhit-1',
      url: 'https://www.youtube.com/@Viralhit-1',
      enabled: true,
    },
  },
};

export async function fetchPlatformData(platform, usernameOrUrl, token) {
  const p = (platform || '').toLowerCase().trim();
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
