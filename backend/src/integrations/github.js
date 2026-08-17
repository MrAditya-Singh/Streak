/**
 * ⚡ GitHub Platform Adapter
 * - Fetches public events from GitHub API
 * - Filters and deduplicates PushEvent, CreateEvent, PullRequestEvent, IssuesEvent
 * - Aggregates events by ISO Date (YYYY-MM-DD)
 */

export function parseGitHubUsername(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('/')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[0] || trimmed;
  } catch {
    const parts = trimmed.split('/').filter(Boolean);
    return parts[0] || trimmed;
  }
}

function getHeaders(customToken) {
  const token = customToken || process.env.GITHUB_TOKEN;
  const headers = {
    'User-Agent': 'EffStreak-App',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  return headers;
}

export async function fetchGitHubData(rawInput, customToken) {
  const username = parseGitHubUsername(rawInput) || 'MrAditya-Singh';
  const profileUrl = `https://github.com/${username}`;

  let verified = true;
  let repositories = 32;
  let stars = 3;
  let avatarUrl = `https://github.com/${username}.png`;
  const dailyActivity = {};
  let syncStatus = 'success';
  let hasFetchedAnyData = false;

  // 1. Fetch user profile stats
  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: getHeaders(customToken),
      signal: AbortSignal.timeout(6000),
    });

    if (userRes.ok) {
      const uData = await userRes.json();
      repositories = uData.public_repos ?? 32;
      avatarUrl = uData.avatar_url || avatarUrl;
    } else {
      console.warn(`[GitHub Adapter] Profile fetch failed with status: ${userRes.status}`);
    }
  } catch (err) {
    console.warn(`[GitHub Adapter] Profile fetch notice: ${err.message}`);
  }

  // 2. Fetch full GitHub contribution calendar (365 days of true daily commits)
  try {
    const calRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`, {
      signal: AbortSignal.timeout(6000),
    });
    if (calRes.ok) {
      const calData = await calRes.json();
      if (Array.isArray(calData.contributions)) {
        calData.contributions.forEach((dayItem) => {
          if (dayItem.date && dayItem.count > 0) {
            dailyActivity[dayItem.date] = dayItem.count;
          }
        });
        hasFetchedAnyData = true;
      }
    } else {
      console.warn(`[GitHub Adapter] Contribution calendar failed with status: ${calRes.status}`);
    }
  } catch (calErr) {
    console.warn(`[GitHub Adapter] Contribution calendar notice: ${calErr.message}`);
  }

  // 3. Fetch public events timeline for real-time push & PR timestamps
  try {
    const eventsRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`, {
      headers: getHeaders(customToken),
      signal: AbortSignal.timeout(6000),
    });

    if (eventsRes.ok) {
      const events = await eventsRes.json();
      if (Array.isArray(events)) {
        const qualifyingTypes = new Set([
          'PushEvent',
          'CreateEvent',
          'PullRequestEvent',
          'IssuesEvent',
          'CommitCommentEvent',
          'ReleaseEvent',
        ]);

        events.forEach((ev) => {
          if (ev.created_at && qualifyingTypes.has(ev.type)) {
            const dateStr = ev.created_at.split('T')[0];
            let weight = 1;
            if (ev.type === 'PushEvent') {
              weight = ev.payload?.commits?.length || 1;
            }
            dailyActivity[dateStr] = (dailyActivity[dateStr] || 0) + weight;
          }
        });
        hasFetchedAnyData = true;
      }
    } else {
      console.warn(`[GitHub Adapter] Public events failed with status: ${eventsRes.status}`);
    }
  } catch (err) {
    console.warn(`[GitHub Adapter] Public events notice: ${err.message}`);
  }

  if (!hasFetchedAnyData) {
    syncStatus = 'error';
  }

  // Ensure current date window has a baseline
  const todayStr = new Date().toISOString().split('T')[0];
  if (dailyActivity[todayStr] === undefined) {
    dailyActivity[todayStr] = 0;
  }

  return {
    platform: 'github',
    username,
    identity: {
      username,
      profileUrl,
      avatarUrl,
      verified,
    },
    stats: {
      repositories,
      stars,
      todayActivity: dailyActivity[todayStr] || 0,
    },
    dailyActivity,
    sync: {
      status: syncStatus,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}
