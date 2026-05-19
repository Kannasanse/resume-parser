'use client';
import { useState } from 'react';
import PlaceholderState from './PlaceholderState';
import GeneratingState from './GeneratingState';
import GeneratedContent from './GeneratedContent';
import YouTubeEmbed from './YouTubeEmbed';

export default function SectionBlock({ section, index, topicId, topicTitle, skill, isCompleted, onToggleComplete, onGenerated, precedingSections, topicVideos }) {
  const [localSection, setLocalSection] = useState(section);
  const sectionType = localSection.type || 'text';
  const isVideoOnly = sectionType === 'video-only';

  // Find video data for this section
  const videoData = localSection.youtube_video_id
    ? (topicVideos || []).find(v => v.videoId === localSection.youtube_video_id) || { videoId: localSection.youtube_video_id }
    : null;

  async function handleGenerate() {
    setLocalSection(s => ({ ...s, generation_status: 'generating' }));
    try {
      const res = await fetch('/api/v1/career-map/generate-section-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId, sectionId: section.id, sectionHeading: section.heading,
          topicTitle, skill, currentLevel: 'intermediate',
          learningStyle: ['mixed'], precedingSections,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocalSection(s => ({ ...s, content: data.content, is_generated: true, generation_status: 'done' }));
      onGenerated(data.content);
    } catch {
      setLocalSection(s => ({ ...s, generation_status: 'error' }));
    }
  }

  function handleRegenerate() {
    setLocalSection(s => ({ ...s, is_generated: false, generation_status: 'idle', content: null }));
  }

  const checkLabel = isVideoOnly ? 'Mark as watched' : 'Mark as read';

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium">Section {index + 1}</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isCompleted} onChange={e => onToggleComplete(e.target.checked)}
            className="accent-[var(--c-primary)] w-4 h-4" />
          <span className="text-xs text-[var(--c-text-muted)]">{checkLabel}</span>
        </label>
      </div>

      {/* Heading */}
      <h2 className="text-xl font-semibold text-[var(--c-text)] pb-2 border-b-2 border-[var(--c-primary-light)]">
        {section.heading}
      </h2>

      {/* Video-only: just show embed, no written content */}
      {isVideoOnly ? (
        <div className="py-2">
          {videoData ? (
            <YouTubeEmbed {...videoData} />
          ) : (
            <div className="ds-skel rounded-xl" style={{ aspectRatio: '16/9' }} />
          )}
        </div>
      ) : (
        <>
          {/* Written content */}
          {localSection.generation_status === 'generating' ? (
            <GeneratingState />
          ) : localSection.generation_status === 'error' ? (
            <div className="bg-red-50 border border-dashed border-red-300 rounded-xl p-6 text-center space-y-3">
              <p className="text-sm text-red-600">Content generation failed. Please try again.</p>
              <button onClick={handleGenerate}
                className="border border-red-300 text-red-600 text-sm px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors mx-auto block">
                Try again
              </button>
            </div>
          ) : localSection.is_generated && localSection.content ? (
            <GeneratedContent content={localSection.content} onRegenerate={handleRegenerate} />
          ) : (
            <PlaceholderState estimatedMinutes={section.estimatedReadMinutes} onGenerate={handleGenerate} />
          )}

          {/* Video below text for text-with-video sections */}
          {sectionType === 'text-with-video' && (
            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><polygon points="10 10 15 13.5 10 17"/></svg>
                Recommended video
              </p>
              {videoData ? (
                <YouTubeEmbed {...videoData} />
              ) : null}
            </div>
          )}

          {/* Legacy: plain youtube_video_id on text sections */}
          {sectionType === 'text' && localSection.youtube_video_id && videoData && (
            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium">🎬 Recommended video</p>
              <YouTubeEmbed {...videoData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
