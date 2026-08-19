/**
 * ⚡ YouTube Platform Adapter
 * - Tracks channel uploads via YouTube RSS feed
 * - Checks if a video was uploaded today (YES -> ACTIVE, NO -> INACTIVE)
 * - Calculates upload streak over the last 15 days
 */

export function parseYouTubeHandle(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('/')) {
    return trimmed.replace(/^@/, '');
  }
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const parts = url.pathname.split('/').filter(Boolean);
    const handle = parts.find(p => p.startsWith('@')) || parts[0] || trimmed;
    return handle.replace(/^@/, '');
  } catch {
    const parts = trimmed.split('/').filter(Boolean);
    return (parts[0] || trimmed).replace(/^@/, '');
  }
}

export async function fetchYouTubeData(rawInput) {
  const channelOrHandle = parseYouTubeHandle(rawInput);
  if (!channelOrHandle) {
    return { platform: 'youtube', username: '', profileUrl: '', isVerified: false, hasActivityToday: false, dailyActivity: {}, sync: { status: 'not_configured' } };
  }
  const profileUrl = `https://www.youtube.com/@${channelOrHandle}`;

  const dailyActivity = {};
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  let uploadsCount = 0;
  let status = 'success';

  try {
    let channelId = channelOrHandle.startsWith('UC') ? channelOrHandle : null;

    if (!channelId) {
      const channelRes = await fetch(`https://www.youtube.com/@${encodeURIComponent(channelOrHandle)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (channelRes.ok) {
        const html = await channelRes.text();
        const rssMatch = html.match(/https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=([A-Za-z0-9_-]+)/);
        const extId = html.match(/"externalId":"(UC[^"]+)"/);
        const ucMatches = html.match(/UC[A-Za-z0-9_-]{22}/g);
        channelId = rssMatch?.[1] || extId?.[1] || (ucMatches?.[0]) || null;
      }
    }

    if (channelId) {
      const feedRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (feedRes.ok) {
        const xml = await feedRes.text();
        const publishedMatches = [...xml.matchAll(/<published>([^<]+)<\/published>/g)];
        uploadsCount = publishedMatches.length;

        publishedMatches.forEach((m) => {
          const rawIso = m[1];
          const localDateStr = new Date(rawIso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          dailyActivity[localDateStr] = (dailyActivity[localDateStr] || 0) + 1;
        });
      }
    }
  } catch (err) {
    console.warn(`[YouTube Adapter] Notice: ${err.message}`);
  }

  // 1. Check if a video was uploaded today (YES -> ACTIVE = 1, NO -> INACTIVE = 0)
  const isUploadedToday = (dailyActivity[todayStr] || 0) > 0;
  dailyActivity[todayStr] = isUploadedToday ? 1 : 0;

  // 2. Count upload streak over the last 15 days
  let uploadStreak15Days = 0;
  const curr = new Date();
  for (let i = 0; i < 15; i++) {
    const dStr = curr.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if ((dailyActivity[dStr] || 0) > 0) {
      uploadStreak15Days++;
    }
    curr.setDate(curr.getDate() - 1);
  }

  return {
    platform: 'youtube',
    username: channelOrHandle,
    isContentPlatform: true,
    identity: {
      username: channelOrHandle,
      profileUrl,
      verified: true,
    },
    stats: {
      channelHandle: `@${channelOrHandle}`,
      uploadsCount,
      todayContentActivity: isUploadedToday ? 1 : 0,
      isUploadedToday,
      currentStreak: uploadStreak15Days,
      uploadStreak15Days,
    },
    dailyActivity,
    sync: {
      status,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}
