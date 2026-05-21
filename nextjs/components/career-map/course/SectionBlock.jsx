'use client';
import { useState, useEffect } from 'react';
import PlaceholderState from './PlaceholderState';
import GeneratingState from './GeneratingState';
import GeneratedContent from './GeneratedContent';
import YouTubeEmbed from './YouTubeEmbed';

function PlayVideoButton({ onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-3 w-full rounded-2xl border transition-all duration-200 px-5 py-4 group ${
        loading
          ? 'border-[#D1DCE8] dark:border-white/10 bg-[#F9FAFB] dark:bg-[#0D1830]'
          : 'border-[#185FA5] bg-gradient-to-br from-[#E6F1FB] to-[#F4F8FC] dark:from-[rgba(24,95,165,0.20)] dark:to-[rgba(24,95,165,0.10)]'
      }`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        loading ? 'bg-[#E5E7EB] dark:bg-[rgba(255,255,255,0.10)]' : 'bg-[#185FA5]'
      }`}>
        {loading ? (
          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21"/>
          </svg>
        )}
      </div>
      <div className="text-left">
        <p className={`text-sm font-semibold ${loading ? 'text-[#9CA3AF] dark:text-[#4A6380]' : 'text-[#185FA5] dark:text-[#5B9FD4]'}`}>
          {loading ? 'Finding best video…' : 'Play video'}
        </p>
        <p className="text-xs mt-0.5 text-[#9CA3AF] dark:text-[#4A6380]">
          {loading ? 'Searching YouTube for the most relevant tutorial' : 'Watch a curated tutorial for this topic'}
        </p>
      </div>
      {!loading && (
        <svg className="ml-auto group-hover:translate-x-1 transition-transform text-[#185FA5] dark:text-[#5B9FD4]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </button>
  );
}

export default function SectionBlock({
  section, index, topicId, topicTitle, skill,
  isCompleted, onToggleComplete, onGenerated, onVideoFetched,
  precedingSections, topicVideos, topicYoutubeQueries,
}) {
  const [localSection, setLocalSection] = useState(section);
  const [videoFetchState, setVideoFetchState] = useState('idle'); // idle | loading | done | error
  const [fetchedVideo, setFetchedVideo] = useState(null);

  const sectionType = localSection.type || 'text';
  const isVideoOnly = sectionType === 'video-only';
  const hasVideoSlot = isVideoOnly || sectionType === 'text-with-video';

  // Sync youtube_video_id if parent assigns it later
  useEffect(() => {
    if (section.youtube_video_id && !localSection.youtube_video_id) {
      setLocalSection(s => ({ ...s, youtube_video_id: section.youtube_video_id }));
    }
  }, [section.youtube_video_id]);

  // Resolve video data: prefer fetchedVideo (just fetched), then topicVideos match
  const videoData = fetchedVideo
    || (localSection.youtube_video_id
      ? (topicVideos || []).find(v => v.videoId === localSection.youtube_video_id)
        || { videoId: localSection.youtube_video_id }
      : null);

  async function handlePlayVideo() {
    setVideoFetchState('loading');
    try {
      const res = await fetch('/api/v1/career-map/fetch-youtube-videos/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const videos = data.videos || [];
      const sections = data.sections || [];

      // Find the video assigned to this specific section
      const updatedSection = sections.find(s => s.id === section.id);
      const assignedVideoId = updatedSection?.youtube_video_id;
      const video = assignedVideoId
        ? videos.find(v => v.videoId === assignedVideoId) || { videoId: assignedVideoId }
        : videos.find(v => !v.isFallback) || videos[0] || null;

      if (video && !video.isFallback) {
        setFetchedVideo(video);
        setLocalSection(s => ({ ...s, youtube_video_id: video.videoId }));
      } else if (video?.isFallback) {
        setFetchedVideo(video);
      }

      // Propagate to parent so other sections can use the fetched data
      if (onVideoFetched) onVideoFetched(videos, sections);

      setVideoFetchState('done');
    } catch {
      setVideoFetchState('error');
    }
  }

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

  // Determine if we should show the play button for this section
  const needsVideoFetch = hasVideoSlot && !videoData && videoFetchState === 'idle';
  const videoLoading = videoFetchState === 'loading';

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
      <h2 className="text-xl font-bold tracking-[-0.02em] text-[var(--c-text)] pb-2 border-b-2 border-[var(--c-primary-light)]">
        {section.heading}
      </h2>
      <div className="w-10 h-0.5 mt-1 bg-gradient-to-r from-[#185FA5] to-[#1D9E75] rounded-full" />

      {/* Video-only section */}
      {isVideoOnly ? (
        <div className="py-2">
          {videoData ? (
            <YouTubeEmbed {...videoData} />
          ) : (
            <PlayVideoButton onClick={handlePlayVideo} loading={videoLoading} />
          )}
          {videoFetchState === 'error' && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Couldn't load video.{' '}
              <button onClick={() => setVideoFetchState('idle')} className="underline">Try again</button>
            </p>
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

          {/* Video slot for text-with-video sections */}
          {sectionType === 'text-with-video' && (
            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><polygon points="10 10 15 13.5 10 17"/>
                </svg>
                Recommended video
              </p>
              {videoData ? (
                <YouTubeEmbed {...videoData} />
              ) : (
                <>
                  <PlayVideoButton onClick={handlePlayVideo} loading={videoLoading} />
                  {videoFetchState === 'error' && (
                    <p className="text-xs text-red-500 mt-1 text-center">
                      Couldn't load video.{' '}
                      <button onClick={() => setVideoFetchState('idle')} className="underline">Try again</button>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Legacy text section with assigned video */}
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
