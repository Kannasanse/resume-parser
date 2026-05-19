import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

const API_KEY = process.env.YOUTUBE_API_KEY;

function parseDurationToMinutes(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 10;
  return (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0) + parseInt(m[3] || 0) / 60;
}

function scoreVideo(v) {
  const stats = v.statistics || {};
  const viewCount = parseInt(stats.viewCount || '0');
  const likeCount = parseInt(stats.likeCount || '0');
  const viewScore = Math.log10(Math.max(viewCount, 1)) / 7;
  const likeScore = Math.log10(Math.max(likeCount, 1)) / 6;
  const engageScore = likeCount > 0 ? Math.min(likeCount / Math.max(viewCount, 1) * 100, 10) / 10 : 0;
  const ageYears = (Date.now() - new Date(v.snippet?.publishedAt || 0).getTime()) / (1000 * 60 * 60 * 24 * 365);
  const recencyScore = Math.max(0, 1 - ageYears / 5);
  const dur = parseDurationToMinutes(v.contentDetails?.duration);
  const durationScore = dur >= 8 && dur <= 20 ? 1 : dur >= 4 && dur <= 30 ? 0.7 : 0.3;
  return viewScore * 0.25 + likeScore * 0.25 + engageScore * 0.20 + recencyScore * 0.15 + durationScore * 0.15;
}

function assignVideosToSections(sections, rankedVideos) {
  const result = sections.map(s => ({ ...s }));
  const videoOnly = result.filter(s => s.type === 'video-only');
  const textWithVideo = result.filter(s => s.type === 'text-with-video');
  const realVideos = rankedVideos.filter(v => !v.isFallback);
  if (videoOnly[0] && realVideos[0]) videoOnly[0].youtube_video_id = realVideos[0].videoId;
  if (videoOnly[1] && realVideos[1]) videoOnly[1].youtube_video_id = realVideos[1].videoId;
  textWithVideo.forEach((s, i) => {
    const v = realVideos[videoOnly.length + i];
    if (v) s.youtube_video_id = v.videoId;
  });
  if (videoOnly.length === 0 && textWithVideo.length === 0 && result[0] && realVideos[0]) {
    result[0].youtube_video_id = realVideos[0].videoId;
    if (result[2] && realVideos[1]) result[2].youtube_video_id = realVideos[1].videoId;
  }
  return result;
}

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { topicId } = await request.json();

    const { data: topic, error } = await supabase
      .from('study_plan_topics')
      .select('id, youtube_queries, sections, youtube_videos, study_plan_id')
      .eq('id', topicId)
      .single();
    if (error || !topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    // Verify ownership
    const { data: plan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', topic.study_plan_id)
      .eq('user_id', user.id)
      .single();
    if (!plan) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const query = topic.youtube_queries?.[0];
    if (!query || !API_KEY) return NextResponse.json({ topicId, videos: topic.youtube_videos || [] });

    const candidateIds = await (async () => {
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', query);
        url.searchParams.set('type', 'video');
        url.searchParams.set('maxResults', '10');
        url.searchParams.set('relevanceLanguage', 'en');
        url.searchParams.set('videoDuration', 'medium');
        url.searchParams.set('order', 'relevance');
        url.searchParams.set('key', API_KEY);
        const res = await fetch(url.toString());
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).map(i => i.id.videoId).filter(Boolean);
      } catch { return []; }
    })();

    let rankedVideos = [{ videoId: null, searchQuery: query, searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, isFallback: true }];
    if (candidateIds.length > 0) {
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.set('part', 'statistics,contentDetails,snippet');
        url.searchParams.set('id', candidateIds.join(','));
        url.searchParams.set('key', API_KEY);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const scored = (data.items || []).map(v => ({ ...v, qualityScore: scoreVideo(v) })).sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 3);
          if (scored.length > 0) {
            rankedVideos = scored.map(v => ({
              videoId: v.id,
              title: v.snippet?.title || '',
              channelName: v.snippet?.channelTitle || '',
              thumbnail: v.snippet?.thumbnails?.medium?.url || null,
              duration: parseDurationToMinutes(v.contentDetails?.duration),
              viewCount: parseInt(v.statistics?.viewCount || '0'),
              likeCount: parseInt(v.statistics?.likeCount || '0'),
              publishedAt: v.snippet?.publishedAt || null,
              qualityScore: v.qualityScore,
            }));
          }
        }
      } catch {}
    }

    const updatedSections = assignVideosToSections(topic.sections || [], rankedVideos);
    await supabase.from('study_plan_topics')
      .update({ youtube_videos: rankedVideos, sections: updatedSections, updated_at: new Date().toISOString() })
      .eq('id', topicId);

    return NextResponse.json({ topicId, videos: rankedVideos });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
