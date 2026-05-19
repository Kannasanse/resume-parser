import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

async function searchYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '3');
    url.searchParams.set('relevanceLanguage', 'en');
    url.searchParams.set('videoDuration', 'medium');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();

    return (data.items || []).map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    }));
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { study_plan_id } = await request.json();

    // Verify ownership
    const { data: plan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', study_plan_id)
      .eq('user_id', user.id)
      .single();

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const { data: topics } = await supabase
      .from('study_plan_topics')
      .select('id, youtube_queries, sections')
      .eq('study_plan_id', study_plan_id);

    const updates = [];
    for (const topic of topics || []) {
      const query = topic.youtube_queries?.[0];
      if (!query) continue;

      const videos = await searchYouTube(query);
      if (!videos || videos.length === 0) continue;

      // Assign first video to first section, distribute rest
      const sections = [...(topic.sections || [])];
      if (sections[0]) sections[0] = { ...sections[0], youtube_video_id: videos[0]?.videoId || null };
      if (sections[2] && videos[1]) sections[2] = { ...sections[2], youtube_video_id: videos[1].videoId };

      updates.push(
        supabase
          .from('study_plan_topics')
          .update({ youtube_videos: videos, sections, updated_at: new Date().toISOString() })
          .eq('id', topic.id)
      );
    }

    await Promise.all(updates);
    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('fetch-youtube-videos error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
