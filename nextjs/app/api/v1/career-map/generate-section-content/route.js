import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { synthesiseContent } from '@/lib/career-map/synthesiseContent.js';
import { needsWebSourcing, getSearchQuery } from '@/lib/career-map/sectionTypeRouter.js';
import { searchWithTavily } from '@/lib/career-map/providers/tavily.js';
import { searchWithExa } from '@/lib/career-map/providers/exa.js';
import { fetchYouTubeVideo } from '@/lib/career-map/fetchYouTubeVideo.js';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { user } = await requireUser(request);
    const {
      topicId,
      sectionId,
      sectionHeading,
      topicTitle,
      skill,
      currentLevel,
      learningStyle,
      precedingSections,
      source,
    } = body;

    // Verify ownership
    const { data: topic } = await supabase
      .from('study_plan_topics')
      .select('id, sections, study_plan_id')
      .eq('id', topicId)
      .single();

    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    const { data: plan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', topic.study_plan_id)
      .eq('user_id', user.id)
      .single();

    if (!plan) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const sectionMeta = (topic.sections || []).find(s => s.id === sectionId) || {};
    const sectionType = sectionMeta.section_type || 'concept';

    // Mark generating
    const sections = (topic.sections || []).map(s =>
      s.id === sectionId ? { ...s, generation_status: 'generating' } : s
    );
    await supabase
      .from('study_plan_topics')
      .update({ sections, updated_at: new Date().toISOString() })
      .eq('id', topicId);

    let content;
    let sourceFields = { source_type: 'ai', source_url: null, source_title: null, source_domain: null, fetched_at: null };

    // Route by section type; explicit 'ai' source overrides web search
    if (needsWebSourcing(sectionType) && source !== 'ai') {
      const query = getSearchQuery(sectionMeta, skill, currentLevel);
      let webResult = query ? await searchWithTavily(query) : null;
      if (!webResult || webResult.quality < 0.5) {
        webResult = query ? await searchWithExa(query) : null;
      }

      if (webResult) {
        content = await synthesiseContent({
          sectionType,
          sectionHeading,
          topicTitle,
          skill,
          currentLevel,
          learningStyle,
          precedingSections,
          webContent: webResult.content,
          sourceTitle: webResult.title,
          sourceUrl: webResult.url,
        });
        let sourceDomain = '';
        try { sourceDomain = new URL(webResult.url).hostname.replace('www.', ''); } catch {}
        sourceFields = {
          source_type: 'web',
          source_url: webResult.url,
          source_title: webResult.title,
          source_domain: sourceDomain,
          fetched_at: new Date().toISOString(),
        };
      } else {
        // Web unavailable — fall back to pure AI
        content = await synthesiseContent({
          sectionType,
          sectionHeading,
          topicTitle,
          skill,
          currentLevel,
          learningStyle,
          precedingSections,
        });
        sourceFields.source_type = 'ai_fallback';
      }
    } else {
      // exercise, summary, video — AI-only, no web search
      content = await synthesiseContent({
        sectionType,
        sectionHeading,
        topicTitle,
        skill,
        currentLevel,
        learningStyle,
        precedingSections,
      });
    }

    // Auto-fetch video for video-only / text-with-video sections
    let videoFields = {};
    let videoResult = null;
    const legacyType = sectionMeta.type || 'text';
    if (legacyType === 'text-with-video' || legacyType === 'video-only' || sectionType === 'video') {
      try {
        videoResult = await fetchYouTubeVideo({ skill, sectionTitle: sectionHeading, level: currentLevel });
        if (videoResult) {
          videoFields = {
            youtube_video_id: videoResult.videoId,
            youtube_video_fetched_at: new Date().toISOString(),
          };
        }
      } catch (videoErr) {
        console.error('[generate-section-content] Video fetch failed (non-fatal):', videoErr);
      }
    }

    // Persist
    const updatedSections = (topic.sections || []).map(s =>
      s.id === sectionId
        ? { ...s, content, is_generated: true, generation_status: 'done', content_type: 'generated', ...sourceFields, ...videoFields }
        : s
    );

    await supabase
      .from('study_plan_topics')
      .update({ sections: updatedSections, updated_at: new Date().toISOString() })
      .eq('id', topicId);

    return NextResponse.json({
      content,
      section_id: sectionId,
      ...sourceFields,
      ...(videoResult ? {
        video_id:           videoResult.videoId,
        video_title:        videoResult.title,
        video_channel:      videoResult.channelTitle,
        video_thumbnail:    videoResult.thumbnailUrl,
        video_duration:     videoResult.duration,
        video_duration_sec: videoResult.durationSec,
        video_fetched_at:   new Date().toISOString(),
        video_score:        videoResult.score,
      } : {}),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('generate-section-content error:', err);

    try {
      const { topicId, sectionId } = body || {};
      if (topicId && sectionId) {
        const { data: topic } = await supabase.from('study_plan_topics').select('sections').eq('id', topicId).single();
        if (topic) {
          const sections = (topic.sections || []).map(s =>
            s.id === sectionId ? { ...s, generation_status: 'error' } : s
          );
          await supabase.from('study_plan_topics').update({ sections }).eq('id', topicId);
        }
      }
    } catch {}

    return NextResponse.json({ error: 'Content generation failed. Please try again.' }, { status: 500 });
  }
}
