'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SectionNavSidebar from './SectionNavSidebar';
import SectionBlock from './SectionBlock';
import BottomNavBar from './BottomNavBar';
import CompletionCelebration from '../roadmap/CompletionCelebration';
import TopicNotesPanel from './TopicNotesPanel';
import TestConfigModal from './TestConfigModal';
import TopicPrerequisites from './TopicPrerequisites';
import RealWorldCallout from './RealWorldCallout';
import TopicProgressBreakdown from './TopicProgressBreakdown';
import GenerateTopicButton from './GenerateTopicButton';
import SourcesPanel from './SourcesPanel';
import CourseRightPanel from './CourseRightPanel';

function NotebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/>
      <rect x="6" y="4" width="16" height="16" rx="2"/>
    </svg>
  );
}

function SourcesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

export default function CourseDetailPage({ studyPlanId, topicId }) {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState(null);
  const [completedSectionIds, setCompletedSectionIds] = useState(new Set());
  const [activeSection, setActiveSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [nextTopic, setNextTopic] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState(null); // 'chat' | 'guide' | null
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [planPreferences, setPlanPreferences] = useState(null);
  const sectionRefs = useRef({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/career-map/study-plan/${studyPlanId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const t = data.topics.find(t => t.id === topicId);
      if (!t) throw new Error('Topic not found');
      setTopic(t);
      setCompletedSectionIds(new Set(t.completed_section_ids || []));
      setPlanPreferences(data.plan?.preferences || null);

      const idx = data.topics.findIndex(t => t.id === topicId);
      if (idx >= 0 && idx < data.topics.length - 1) setNextTopic(data.topics[idx + 1]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [topicId]);

  function handleVideoFetched(videos, sections) {
    setTopic(prev => prev ? {
      ...prev,
      youtube_videos: videos,
      sections: sections || prev.sections,
    } : prev);
  }

  useEffect(() => {
    const sectionId = searchParams?.get('section');
    if (!sectionId || !topic) return;
    const idx = (topic.sections || []).findIndex(s => s.id === sectionId);
    if (idx >= 0) {
      setTimeout(() => scrollToSection(idx), 300);
    }
  }, [topic]);

  function scrollToSection(idx) {
    setActiveSection(idx);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function toggleSection(sectionId, completed) {
    setCompletedSectionIds(prev => {
      const next = new Set(prev);
      completed ? next.add(sectionId) : next.delete(sectionId);
      return next;
    });
    await fetch('/api/v1/career-map/complete-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId, sectionId, completed }),
    });
  }

  async function handleSectionGenerated(sectionId, content) {
    setTopic(prev => {
      if (!prev) return prev;
      const sections = prev.sections.map(s =>
        s.id === sectionId ? { ...s, content, is_generated: true, generation_status: 'done' } : s
      );
      return { ...prev, sections };
    });
  }

  function handleExercisesGenerated(data) {
    const results = data.exercises || [];
    setTopic(prev => {
      if (!prev) return prev;
      const map = Object.fromEntries(results.map(r => [r.section_id, r.content]));
      const sections = prev.sections.map(s =>
        map[s.id] ? { ...s, content: map[s.id], is_generated: true, generation_status: 'done' } : s
      );
      return { ...prev, sections };
    });
  }

  function handleSummaryGenerated(data) {
    const results = data.summaries || [];
    setTopic(prev => {
      if (!prev) return prev;
      const map = Object.fromEntries(results.map(r => [r.section_id, r.content]));
      const sections = prev.sections.map(s =>
        map[s.id] ? { ...s, content: map[s.id], is_generated: true, generation_status: 'done' } : s
      );
      return { ...prev, sections };
    });
  }

  async function handleMarkTopicComplete() {
    await fetch('/api/v1/career-map/complete-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId }),
    });
    setShowCelebration(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-[var(--c-text-muted)]">Loading course…</p>
      </div>
    );
  }

  if (error || !topic) {
    return <div className="max-w-xl mx-auto p-8"><div className="ds-alert ds-alert-error">{error || 'Not found'}</div></div>;
  }

  const sections = topic.sections || [];
  const totalSections = sections.length;
  const completedCount = completedSectionIds.size;
  const pct = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  const currentLevel = planPreferences?.currentLevel || 'intermediate';
  const learningStyle = planPreferences?.learningStyle || ['mixed'];

  const hasUngeneratedExercises = sections.some(s => s.section_type === 'exercise' && !s.is_generated);
  const hasUngeneratedSummary  = sections.some(s => s.section_type === 'summary'  && !s.is_generated);

  return (
    <div className="flex flex-col h-screen bg-[var(--c-bg)]">
      {/* Top bar */}
      <div className="glass-light border-b border-[rgba(209,220,232,0.6)] px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Link href={`/career-map/study-plan/${studyPlanId}`}
            className="flex items-center gap-1.5 text-sm text-[var(--c-primary)] hover:underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to study plan
          </Link>
          <h4 className="text-sm font-semibold text-[var(--c-text)] hidden sm:block line-clamp-1 max-w-md">{topic.title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-1 rounded-full font-medium hidden sm:block">{topic.skill}</span>

            {/* Sources toggle */}
            <button
              onClick={() => setSourcesOpen(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                sourcesOpen
                  ? 'bg-[var(--c-primary-light)] text-[var(--c-primary)] border-[var(--c-primary)]'
                  : 'border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:bg-[var(--c-primary-light)] hover:text-[var(--c-primary)]'
              }`}
              title="Sources"
            >
              <SourcesIcon /> Sources
            </button>

            {/* Chat toggle */}
            <button
              onClick={() => {
                setNotesOpen(false);
                setRightPanelTab(prev => prev === 'chat' ? null : 'chat');
              }}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                rightPanelTab === 'chat'
                  ? 'bg-[var(--c-primary-light)] text-[var(--c-primary)] border-[var(--c-primary)]'
                  : 'border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:bg-[var(--c-primary-light)] hover:text-[var(--c-primary)]'
              }`}
              title="Chat with sources"
            >
              <ChatIcon /> Chat
            </button>

            {/* Notes toggle */}
            <button
              onClick={() => {
                setRightPanelTab(null);
                setNotesOpen(v => !v);
              }}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                notesOpen
                  ? 'bg-[var(--c-primary-light)] text-[var(--c-primary)] border-[var(--c-primary)]'
                  : 'border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:bg-[var(--c-primary-light)] hover:text-[var(--c-primary)]'
              }`}
            >
              <NotebookIcon /> Notes
            </button>

            <button
              onClick={() => setTestModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:bg-[var(--c-primary-light)] hover:text-[var(--c-primary)] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/>
              </svg>
              Test
            </button>
            <div className="flex items-center gap-1.5">
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#E6F1FB" className="dark:[stroke:rgba(24,95,165,0.20)]" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--c-primary)" strokeWidth="3"
                    strokeDasharray={`${pct * 0.942} 94.2`}/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--c-primary)]">{pct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden pb-16">
        {sourcesOpen && (
          <SourcesPanel courseId={studyPlanId} />
        )}

        <SectionNavSidebar
          sections={sections}
          completedSectionIds={completedSectionIds}
          activeIndex={activeSection}
          onSelectSection={scrollToSection}
          pct={pct}
          completedCount={completedCount}
          totalSections={totalSections}
        />

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Topic meta */}
            <div className="space-y-3">
              {topic.prerequisites?.length > 0 && (
                <TopicPrerequisites prerequisites={topic.prerequisites} />
              )}
              {topic.real_world_application && (
                <RealWorldCallout text={topic.real_world_application} />
              )}
              <TopicProgressBreakdown sections={sections} completedSectionIds={completedSectionIds} />
            </div>

            {/* Sections */}
            {sections.map((section, idx) => (
              <div key={section.id} ref={el => sectionRefs.current[idx] = el}>
                <SectionBlock
                  section={section}
                  index={idx}
                  topicId={topicId}
                  topicTitle={topic.title}
                  skill={topic.skill}
                  isCompleted={completedSectionIds.has(section.id)}
                  onToggleComplete={(completed) => toggleSection(section.id, completed)}
                  onGenerated={(content) => handleSectionGenerated(section.id, content)}
                  onVideoFetched={handleVideoFetched}
                  precedingSections={sections.slice(0, idx).map(s => s.heading)}
                  topicVideos={topic?.youtube_videos || []}
                  topicYoutubeQueries={topic?.youtube_queries || []}
                  currentLevel={currentLevel}
                  learningStyle={learningStyle}
                />
              </div>
            ))}

            {/* Topic-level generators */}
            {(hasUngeneratedExercises || hasUngeneratedSummary) && (
              <div className="space-y-3 pt-4 border-t border-[var(--c-border)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)]">Generate all at once</p>
                {hasUngeneratedExercises && (
                  <GenerateTopicButton
                    topicId={topicId}
                    currentLevel={currentLevel}
                    learningStyle={learningStyle}
                    type="exercise"
                    onDone={handleExercisesGenerated}
                  />
                )}
                {hasUngeneratedSummary && (
                  <GenerateTopicButton
                    topicId={topicId}
                    currentLevel={currentLevel}
                    learningStyle={learningStyle}
                    type="summary"
                    onDone={handleSummaryGenerated}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {notesOpen && (
          <TopicNotesPanel
            topicId={topicId}
            topicTitle={topic.title}
            onClose={() => setNotesOpen(false)}
          />
        )}

        {rightPanelTab && (
          <CourseRightPanel
            courseId={studyPlanId}
            skillName={topic.skill}
            activeTab={rightPanelTab}
            onTabChange={setRightPanelTab}
            onClose={() => setRightPanelTab(null)}
          />
        )}
      </div>

      <BottomNavBar
        currentIndex={activeSection}
        total={totalSections}
        onPrev={() => scrollToSection(Math.max(0, activeSection - 1))}
        onNext={() => scrollToSection(Math.min(totalSections - 1, activeSection + 1))}
        onComplete={handleMarkTopicComplete}
      />

      {showCelebration && (
        <CompletionCelebration
          topic={topic}
          nextTopic={nextTopic}
          studyPlanId={studyPlanId}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {testModalOpen && topic && (
        <TestConfigModal topic={topic} onClose={() => setTestModalOpen(false)} />
      )}
    </div>
  );
}
