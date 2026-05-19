'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SectionNavSidebar from './SectionNavSidebar';
import SectionBlock from './SectionBlock';
import BottomNavBar from './BottomNavBar';
import CompletionCelebration from '../roadmap/CompletionCelebration';

export default function CourseDetailPage({ studyPlanId, topicId }) {
  const [topic, setTopic] = useState(null);
  const [completedSectionIds, setCompletedSectionIds] = useState(new Set());
  const [activeSection, setActiveSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [nextTopic, setNextTopic] = useState(null);
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

      // Find next topic
      const idx = data.topics.findIndex(t => t.id === topicId);
      if (idx >= 0 && idx < data.topics.length - 1) setNextTopic(data.topics[idx + 1]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [topicId]);

  function scrollToSection(idx) {
    setActiveSection(idx);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function toggleSection(sectionId, completed) {
    // Optimistic update
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

  return (
    <div className="flex flex-col h-screen bg-[var(--c-bg)]">
      {/* Top bar */}
      <div className="bg-white border-b border-[var(--c-border)] px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Link href={`/career-map/study-plan/${studyPlanId}`}
            className="flex items-center gap-1.5 text-sm text-[var(--c-primary)] hover:underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to study plan
          </Link>
          <h4 className="text-sm font-semibold text-[var(--c-text)] hidden sm:block line-clamp-1 max-w-md">{topic.title}</h4>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-1 rounded-full font-medium">{topic.skill}</span>
            <div className="flex items-center gap-1.5">
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#E6F1FB" strokeWidth="3"/>
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
        {/* Sidebar */}
        <SectionNavSidebar
          sections={sections}
          completedSectionIds={completedSectionIds}
          activeIndex={activeSection}
          onSelectSection={scrollToSection}
          pct={pct}
          completedCount={completedCount}
          totalSections={totalSections}
        />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-10">
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
                  precedingSections={sections.slice(0, idx).map(s => s.heading)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
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
    </div>
  );
}
