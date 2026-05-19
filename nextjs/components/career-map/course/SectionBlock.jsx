'use client';
import { useState } from 'react';
import PlaceholderState from './PlaceholderState';
import GeneratingState from './GeneratingState';
import GeneratedContent from './GeneratedContent';
import YouTubeBlock from './YouTubeBlock';

export default function SectionBlock({ section, index, topicId, topicTitle, skill, isCompleted, onToggleComplete, onGenerated, precedingSections }) {
  const [localSection, setLocalSection] = useState(section);

  async function handleGenerate() {
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
          currentLevel: 'intermediate',
          learningStyle: ['mixed'],
          precedingSections,
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

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium">Section {index + 1}</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={e => onToggleComplete(e.target.checked)}
            className="accent-[var(--c-primary)] w-4 h-4"
          />
          <span className="text-xs text-[var(--c-text-muted)]">Mark as read</span>
        </label>
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--c-text)] pb-2 border-b-2 border-[var(--c-primary-light)]">
          {section.heading}
        </h2>
      </div>

      {/* Content */}
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
        <PlaceholderState
          estimatedMinutes={section.estimatedReadMinutes}
          onGenerate={handleGenerate}
        />
      )}

      {/* YouTube video */}
      {section.youtube_video_id && (
        <YouTubeBlock
          videoId={section.youtube_video_id}
          title={section.heading}
        />
      )}
    </div>
  );
}
