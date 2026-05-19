'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import WeekNavigation from './WeekNavigation';
import TopicCard from './TopicCard';

export default function StudyPlanPage({ studyPlanId }) {
  const [plan, setPlan] = useState(null);
  const [topics, setTopics] = useState([]);
  const [activeWeek, setActiveWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/career-map/study-plan/${studyPlanId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data.plan);
      setTopics(data.topics);
      if (data.topics.length > 0) setActiveWeek(data.topics[0].week_number);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [studyPlanId]);

  const weekTopics = topics.filter(t => t.week_number === activeWeek);
  const weeks = [...new Set(topics.map(t => t.week_number))].sort((a, b) => a - b);
  const weekThemes = {};
  if (plan?.plan_structure?.weeks) {
    for (const w of plan.plan_structure.weeks) weekThemes[w.weekNumber] = w.theme;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="ds-skel h-6 w-48 rounded mx-auto" />
          <p className="text-sm text-[var(--c-text-muted)]">Loading your study plan…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <div className="ds-alert ds-alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--c-bg)]">
      {/* Top bar */}
      <div className="bg-white border-b border-[var(--c-border)] px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--c-text-muted)]">
              <Link href="/career-map" className="hover:text-[var(--c-primary)]">Career Map</Link>
              <span>›</span>
              <span className="text-[var(--c-text)] font-medium">{plan?.target_role_title}</span>
              <span>›</span>
              <span>Study Plan</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[var(--c-text-muted)]">Overall progress</p>
              <p className="text-sm font-semibold text-[var(--c-primary)]">{plan?.overall_pct || 0}% complete</p>
            </div>
            <div className="w-32 h-2 bg-[var(--c-primary-light)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--c-primary)] rounded-full transition-all" style={{ width: `${plan?.overall_pct || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <WeekNavigation
          weeks={weeks}
          weekThemes={weekThemes}
          topics={topics}
          activeWeek={activeWeek}
          onSelectWeek={setActiveWeek}
          onSelectTopic={t => setActiveWeek(t.week_number)}
        />

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-[var(--c-text)] mb-1">
              Week {activeWeek}: {weekThemes[activeWeek] || ''}
            </h2>
            <p className="text-sm text-[var(--c-text-muted)] mb-6">
              {weekTopics.length} topics · ~{weekTopics.reduce((sum, t) => sum + Number(t.estimated_hours), 0).toFixed(1)} hours this week
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {weekTopics.map(topic => (
                <TopicCard key={topic.id} topic={topic} studyPlanId={studyPlanId} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
