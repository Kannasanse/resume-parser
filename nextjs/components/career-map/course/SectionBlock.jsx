'use client';
import { useState, useEffect } from 'react';
import PlaceholderState from './PlaceholderState';
import GeneratingState from './GeneratingState';
import GeneratedContent from './GeneratedContent';
import YouTubeEmbed from './YouTubeEmbed';
import ContentSourceModal from '@/components/career-map/ContentSourceModal';
import SectionTypeBadge from './SectionTypeBadge';
import LearningObjectives from './LearningObjectives';
import DifficultyNote from './DifficultyNote';
import ExerciseSection from './ExerciseSection';
import TopicSummary from './TopicSummary';

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
  currentLevel, learningStyle,
}) {
  const [localSection, setLocalSection] = useState(section);
  const [videoFetchState, setVideoFetchState] = useState('idle');
  const [fetchedVideo, setFetchedVideo] = useState(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [pendingSource, setPendingSource] = useState('web');

  const sectionType = localSection.section_type || 'concept';
  const legacyType = localSection.type || 'text';
  const isVideoOnly = legacyType === 'video-only' || sectionType === 'video';
  const hasVideoSlot = isVideoOnly || legacyType === 'text-with-video';
  const isExercise = sectionType === 'exercise';
  const isSummary = sectionType === 'summary';

  useEffect(() => {
    if (section.youtube_video_id && !localSection.youtube_video_id) {
      setLocalSection(s => ({ ...s, youtube_video_id: section.youtube_video_id }));
    }
  }, [section.youtube_video_id]);

  // Keep local state in sync when parent refreshes after generate-exercises / generate-summary
  useEffect(() => {
    if (section.is_generated && !localSection.is_generated) {
      setLocalSection(section);
    }
  }, [section.is_generated, section.content]);

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

      if (onVideoFetched) onVideoFetched(videos, sections);
      setVideoFetchState('done');
    } catch {
      setVideoFetchState('error');
    }
  }

  async function handleGenerate(source = 'ai') {
    setShowSourceModal(false);
    setLocalSection(s => ({ ...s, generation_status: 'generating' }));
    try {
      const res = await fetch('/api/v1/career-map/generate-section-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          sectionId: section.id,
          sectionHeading: section.heading,
          topicTitle,
          skill,
          currentLevel: currentLevel || 'intermediate',
          learningStyle: learningStyle || ['mixed'],
          precedingSections,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLocalSection(s => ({
        ...s,
        content: data.content,
        is_generated: true,
        generation_status: 'done',
        source_type: data.source_type,
        source_url: data.source_url,
        source_title: data.source_title,
        source_domain: data.source_domain,
        fetched_at: data.fetched_at,
        ...(data.video_id ? { youtube_video_id: data.video_id } : {}),
      }));

      if (data.video_id) {
        const vid = {
          videoId:      data.video_id,
          title:        data.video_title     || '',
          channelName:  data.video_channel   || '',
          thumbnail:    data.video_thumbnail || null,
          duration:     data.video_duration_sec ? data.video_duration_sec / 60 : 0,
          viewCount:    0,
          qualityScore: data.video_score     || 0,
        };
        setFetchedVideo(vid);
        setVideoFetchState('done');
        if (onVideoFetched) onVideoFetched([vid], []);
      }
      onGenerated(data.content);
    } catch {
      setLocalSection(s => ({ ...s, generation_status: 'error' }));
    }
  }

  function handleRegenerate() {
    setPendingSource('web');
    setShowSourceModal(true);
  }

  const checkLabel = isVideoOnly ? 'Mark as watched' : 'Mark as read';
  const needsVideoFetch = hasVideoSlot && !videoData && videoFetchState === 'idle';
  const videoLoading = videoFetchState === 'loading';

  // Exercise sections rendered differently
  if (isExercise) {
    return (
      <div className="space-y-4">
        <SectionHeader index={index} section={section} sectionType={sectionType} isCompleted={isCompleted} onToggleComplete={onToggleComplete} checkLabel={checkLabel} />
        {localSection.generation_status === 'generating' ? (
          <GeneratingState />
        ) : localSection.generation_status === 'error' ? (
          <ErrorState onRetry={handleGenerate} />
        ) : localSection.is_generated && localSection.content ? (
          <ExerciseSection section={localSection} onRegenerate={handleRegenerate} />
        ) : (
          <PlaceholderState estimatedMinutes={section.estimated_minutes || section.estimatedReadMinutes} onGenerate={() => { setPendingSource('ai'); handleGenerate('ai'); }} />
        )}
      </div>
    );
  }

  // Summary sections rendered differently
  if (isSummary) {
    return (
      <div className="space-y-4">
        <SectionHeader index={index} section={section} sectionType={sectionType} isCompleted={isCompleted} onToggleComplete={onToggleComplete} checkLabel={checkLabel} />
        {localSection.generation_status === 'generating' ? (
          <GeneratingState />
        ) : localSection.generation_status === 'error' ? (
          <ErrorState onRetry={handleGenerate} />
        ) : localSection.is_generated && localSection.content ? (
          <TopicSummary section={localSection} onRegenerate={handleRegenerate} />
        ) : (
          <PlaceholderState estimatedMinutes={section.estimated_minutes || section.estimatedReadMinutes} onGenerate={() => handleGenerate('ai')} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showSourceModal && (
        <ContentSourceModal
          source={pendingSource}
          onChangeSource={setPendingSource}
          onConfirm={handleGenerate}
          onClose={() => setShowSourceModal(false)}
        />
      )}

      <SectionHeader index={index} section={section} sectionType={sectionType} isCompleted={isCompleted} onToggleComplete={onToggleComplete} checkLabel={checkLabel} />

      {/* Learning objectives */}
      {section.learning_objectives?.length > 0 && !localSection.is_generated && (
        <LearningObjectives objectives={section.learning_objectives} />
      )}

      {/* Difficulty note */}
      {section.difficulty_note && !localSection.is_generated && (
        <DifficultyNote note={section.difficulty_note} />
      )}

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
          {localSection.generation_status === 'generating' ? (
            <GeneratingState />
          ) : localSection.generation_status === 'error' ? (
            <ErrorState onRetry={handleGenerate} />
          ) : localSection.is_generated && localSection.content ? (
            <GeneratedContent section={localSection} onRegenerate={handleRegenerate} />
          ) : (
            <PlaceholderState
              estimatedMinutes={section.estimated_minutes || section.estimatedReadMinutes}
              onGenerate={() => { setPendingSource('web'); setShowSourceModal(true); }}
            />
          )}

          {legacyType === 'text-with-video' && (
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

          {legacyType === 'text' && localSection.youtube_video_id && videoData && (
            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium">Recommended video</p>
              <YouTubeEmbed {...videoData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionHeader({ index, section, sectionType, isCompleted, onToggleComplete, checkLabel }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium">Section {index + 1}</span>
          {sectionType && <SectionTypeBadge sectionType={sectionType} />}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isCompleted} onChange={e => onToggleComplete(e.target.checked)}
            className="accent-[var(--c-primary)] w-4 h-4" />
          <span className="text-xs text-[var(--c-text-muted)]">{checkLabel}</span>
        </label>
      </div>
      <h2 className="text-xl font-bold tracking-[-0.02em] text-[var(--c-text)] pb-2 border-b-2 border-[var(--c-primary-light)]">
        {section.heading}
      </h2>
      <div className="w-10 h-0.5 mt-1 bg-gradient-to-r from-[#185FA5] to-[#1D9E75] rounded-full" />
    </>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="bg-red-50 border border-dashed border-red-300 rounded-xl p-6 text-center space-y-3">
      <p className="text-sm text-red-600">Content generation failed. Please try again.</p>
      <button onClick={onRetry}
        className="border border-red-300 text-red-600 text-sm px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors mx-auto block">
        Try again
      </button>
    </div>
  );
}
