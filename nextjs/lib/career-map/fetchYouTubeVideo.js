import { createHash } from 'crypto';
import supabase from '@/lib/supabase.js';
import { canMakeVideoSearch, recordVideoSearch } from './youtubeQuotaGuard.js';

// Well-known educational channel IDs
const TRUSTED_CHANNEL_IDS = new Set([
  'UCVTlvUkGslCV_h-nSAId8Sw', // Traversy Media
  'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp.org
  'UCsBjURrPoezykLs9EqgamOA', // Fireship
  'UCW5YeuERMmlnqo4oq8vwUpg', // The Coding Train
  'UCJZv4d5rbIKd4QHMPkcABCw', // Computerphile
  'UCy0tKL1T7wFoYcxCe0xjN6Q', // Kevin Powell
  'UCddiUEpeqJcYeBxX1IVBKvQ', // The Primeagen
  'UCVa_PoqEEjmKpWNO-3s9Fsg', // Corey Schafer
  'UCCTVrRjYcEZcGmcdpHBovRQ', // Tech With Tim
  'UC-8QAzbLcRglXeN_MY9blyw', // Google Chrome Developers
  'UCoebwHSTvwalADTJhps0emA', // Sentdex
]);

const TRUSTED_CHANNEL_NAMES = new Set([
  'traversy media',
  'freecodecamp.org',
  'fireship',
  'the coding train',
  'computerphile',
  'kevin powell',
  'corey schafer',
  'tech with tim',
  'programming with mosh',
  'net ninja',
  'academind',
  'sentdex',
  'the primeagen',
  'google chrome developers',
]);

function makeQueryHash(query) {
  return createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
}

function parseDurationSec(iso8601) {
  const m = iso8601?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

function formatDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function scoreVideo(video) {
  const { snippet, statistics, contentDetails } = video;
  const viewCount  = parseInt(statistics?.viewCount  || 0);
  const likeCount  = parseInt(statistics?.likeCount  || 0);
  const durationSec = parseDurationSec(contentDetails?.duration);
  const channelId   = snippet?.channelId || '';
  const channelName = (snippet?.channelTitle || '').toLowerCase();
  const publishedAt = snippet?.publishedAt || '';

  // View count (log scale, cap at 10M → score 1.0)
  const viewScore = viewCount > 0 ? Math.min(Math.log10(viewCount) / 7, 1) : 0;

  // Like ratio (10% like rate = full score)
  const likeScore = viewCount > 0 ? Math.min(likeCount / viewCount / 0.10, 1) : 0;

  // Trusted channel boost
  const trustedScore = (TRUSTED_CHANNEL_IDS.has(channelId) || TRUSTED_CHANNEL_NAMES.has(channelName)) ? 1 : 0;

  // Duration sweet spot: 5–20 min = full score, ramps up 3–5, ramps down 20–40
  const minutes = durationSec / 60;
  let durationScore = 0;
  if (minutes >= 5 && minutes <= 20) {
    durationScore = 1;
  } else if (minutes >= 3 && minutes < 5) {
    durationScore = (minutes - 3) / 2;
  } else if (minutes > 20 && minutes <= 40) {
    durationScore = 1 - (minutes - 20) / 20;
  }

  // Recency: full score within 3 years, fades to 0 at 5 years
  let recencyScore = 0;
  if (publishedAt) {
    const ageYears = (Date.now() - new Date(publishedAt).getTime()) / (365.25 * 24 * 3600 * 1000);
    recencyScore = Math.max(0, 1 - ageYears / 5);
  }

  return (
    viewScore     * 0.30 +
    likeScore     * 0.25 +
    trustedScore  * 0.20 +
    durationScore * 0.15 +
    recencyScore  * 0.10
  );
}

/**
 * Fetch the best YouTube video for a study section.
 * Returns a VideoResult object or null if quota exhausted / API error.
 */
export async function fetchYouTubeVideo({ skill, sectionTitle, level }) {
  const query = `${skill} ${sectionTitle} tutorial`.slice(0, 100);
  const queryHash = makeQueryHash(query);

  // 1. Cache hit
  const { data: cached } = await supabase
    .from('youtube_video_cache')
    .select('video_data, hit_count')
    .eq('query_hash', queryHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached?.video_data) {
    supabase
      .from('youtube_video_cache')
      .update({ hit_count: (cached.hit_count || 0) + 1 })
      .eq('query_hash', queryHash)
      .then(() => {});
    return cached.video_data;
  }

  // 2. Quota guard
  if (!canMakeVideoSearch()) {
    console.warn('[fetchYouTubeVideo] Daily quota exhausted');
    return null;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('[fetchYouTubeVideo] YOUTUBE_API_KEY not configured');
    return null;
  }

  // 3. search.list — 5 candidate IDs (costs 100 units)
  const searchParams = new URLSearchParams({
    part:              'id',
    q:                 query,
    type:              'video',
    maxResults:        '5',
    videoDuration:     'medium',
    videoDefinition:   'high',
    relevanceLanguage: 'en',
    order:             'relevance',
    key:               apiKey,
  });

  let searchData;
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
    if (!res.ok) {
      console.error('[fetchYouTubeVideo] search.list error:', res.status, await res.text());
      return null;
    }
    searchData = await res.json();
  } catch (err) {
    console.error('[fetchYouTubeVideo] search.list fetch failed:', err);
    return null;
  }

  const videoIds = (searchData.items || []).map(i => i.id?.videoId).filter(Boolean);
  if (!videoIds.length) return null;

  // 4. videos.list — full details for all candidates (costs 1 unit)
  const videosParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id:   videoIds.join(','),
    key:  apiKey,
  });

  let videosData;
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams}`);
    if (!res.ok) {
      console.error('[fetchYouTubeVideo] videos.list error:', res.status);
      return null;
    }
    videosData = await res.json();
  } catch (err) {
    console.error('[fetchYouTubeVideo] videos.list fetch failed:', err);
    return null;
  }

  // Record quota usage after both calls succeed
  recordVideoSearch();

  // 5. Score and pick best
  const items = videosData.items || [];
  if (!items.length) return null;

  const best = items
    .map(v => ({ v, score: scoreVideo(v) }))
    .sort((a, b) => b.score - a.score)[0];

  const { v, score } = best;
  const durationSec = parseDurationSec(v.contentDetails?.duration);

  const result = {
    videoId:      v.id,
    title:        v.snippet?.title || '',
    channelTitle: v.snippet?.channelTitle || '',
    channelId:    v.snippet?.channelId || '',
    thumbnailUrl: v.snippet?.thumbnails?.high?.url
                  || v.snippet?.thumbnails?.medium?.url
                  || v.snippet?.thumbnails?.default?.url
                  || null,
    duration:     formatDuration(durationSec),
    durationSec,
    viewCount:    parseInt(v.statistics?.viewCount  || 0),
    likeCount:    parseInt(v.statistics?.likeCount  || 0),
    publishedAt:  v.snippet?.publishedAt || null,
    description:  (v.snippet?.description || '').slice(0, 300),
    score,
  };

  // 6. Cache for 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('youtube_video_cache').upsert(
    {
      query_hash:    queryHash,
      query_text:    query,
      video_id:      result.videoId,
      video_data:    result,
      skill:         skill   || null,
      section_title: sectionTitle || null,
      cached_at:     new Date().toISOString(),
      expires_at:    expiresAt,
    },
    { onConflict: 'query_hash' }
  );

  return result;
}
