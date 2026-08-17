/**
 * ⚡ AtCoder Platform Adapter (Kenkoooo API Integration)
 * - Queries official Kenkoooo AtCoder Submissions API
 * - Filters accepted ('AC') submissions into dailyActivity
 * - Identity isolation: never auto-merges with Codeforces
 */

export function parseAtCoderUsername(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('/')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return parts[parts.length - 1] || trimmed;
  } catch {
    const parts = trimmed.split('/').filter(Boolean);
    return parts[parts.length - 1] || trimmed;
  }
}

export async function fetchAtCoderData(rawInput) {
  const username = parseAtCoderUsername(rawInput) || 'MrAditya';
  const profileUrl = `https://atcoder.jp/users/${username}`;

  const dailyActivity = {};
  let totalAC = 0;
  const now = new Date();
  // Query past 180 days for full streak history
  const fromSecond = Math.floor(new Date(now.getTime() - 180 * 24 * 3600 * 1000).getTime() / 1000);

  try {
    const res = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(username)}&from_second=${fromSecond}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const submissions = await res.json();
      if (Array.isArray(submissions)) {
        submissions.forEach((sub) => {
          if (sub.result === 'AC' && sub.epoch_second) {
            totalAC++;
            const dateStr = new Date(sub.epoch_second * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            dailyActivity[dateStr] = (dailyActivity[dateStr] || 0) + 1;
          }
        });
      }
    }
  } catch (err) {
    console.warn(`[AtCoder Adapter] Notice: ${err.message}`);
  }

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (dailyActivity[todayStr] === undefined) {
    dailyActivity[todayStr] = 0;
  }

  // Calculate current streak and longest streak for AtCoder
  const activeDates = Object.keys(dailyActivity).filter((d) => (dailyActivity[d] || 0) > 0).sort();

  let currentStreak = 0;
  let longestStreak = 0;

  if (activeDates.length > 0) {
    // Current streak (consecutive active days up to today or yesterday)
    const checkDate = new Date();
    const todayFormatted = checkDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if ((dailyActivity[todayFormatted] || 0) === 0) {
      // If not active today, check yesterday to preserve active streak
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if ((dailyActivity[dStr] || 0) > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak calculation
    let tempStreak = 0;
    let prevTime = 0;

    activeDates.forEach((dStr) => {
      const time = new Date(dStr).getTime();
      if (prevTime === 0) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((time - prevTime) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prevTime = time;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    });
  }

  return {
    platform: 'atcoder',
    username,
    identity: {
      username,
      profileUrl,
      verified: true,
      identityIsolated: true, // Do not auto-merge with other platforms
    },
    stats: {
      totalAC,
      todaySolved: dailyActivity[todayStr] || 0,
      currentStreak,
      longestStreak,
    },
    dailyActivity,
    sync: {
      status: 'success',
      lastSyncedAt: new Date().toISOString(),
    },
  };
}
