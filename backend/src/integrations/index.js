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

export const SUPPORTED_PLATFORMS = [
  'github',
  'leetcode',
  'codeforces',
  'hackerrank',
  'atcoder',
  'gfg',
  'youtube',
];

export const CANONICAL_MAPPING = {
  userId: 'aditya-singh',
  displayName: 'Aditya',
  timezone: 'Asia/Kolkata',
  integrations: {
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
  switch (platform.toLowerCase()) {
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
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export {
  fetchGitHubData,
  fetchLeetCodeData,
  fetchCodeforcesData,
  fetchHackerRankData,
  fetchAtCoderData,
  fetchGFGData,
  fetchYouTubeData,
  parseGitHubUsername,
  parseLeetCodeUsername,
  parseCodeforcesHandle,
  parseHackerRankUsername,
  parseAtCoderUsername,
  parseGFGUsername,
  parseYouTubeHandle,
};
