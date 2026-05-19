'use client';
import { useState } from 'react';

export default function WeekNavigation({ weeks, weekThemes, topics, activeWeek, onSelectWeek, onSelectTopic }) {
  const [expanded, setExpanded] = useState(new Set([activeWeek]));

  function toggle(week) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(week) ? next.delete(week) : next.add(week);
      return next;
    });
  }

  return (
    <div className="w-72 flex-shrink-0 bg-white border-r border-[var(--c-border)] overflow-y-auto">
      <div className="px-4 pt-5 pb-2">
        <p className="text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">Your Plan</p>
      </div>

      {weeks.map(week => {
        const weekTopics = topics.filter(t => t.week_number === week);
        const doneCount = weekTopics.filter(t => t.is_completed).length;
        const isActive = week === activeWeek;
        const isExpanded = expanded.has(week);

        return (
          <div key={week} className={`border-l-3 ${isActive ? 'border-l-[3px] border-[var(--c-primary)] bg-[var(--c-primary-light)]' : 'border-l-transparent'}`}>
            {/* Week header */}
            <button
              onClick={() => { onSelectWeek(week); toggle(week); }}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--c-primary-light)] transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--c-text)]">Week {week}</p>
                <p className="text-xs text-[var(--c-text-muted)] line-clamp-1">{weekThemes[week] || ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-0.5 rounded-full font-medium">
                  {doneCount}/{weekTopics.length}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </button>

            {/* Topic list */}
            {isExpanded && (
              <div className="pb-2">
                {weekTopics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => { onSelectTopic(topic); onSelectWeek(topic.week_number); }}
                    className="w-full flex items-center gap-2 px-5 py-2 text-left hover:bg-[var(--c-primary-light)] transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${topic.is_completed ? 'bg-[var(--c-success)] border-[var(--c-success)]' : 'border-[var(--c-border)]'}`}>
                      {topic.is_completed && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </span>
                    <span className={`text-xs flex-1 line-clamp-1 ${topic.is_completed ? 'line-through text-[var(--c-text-muted)]' : 'text-[var(--c-text)]'}`}>
                      {topic.title}
                    </span>
                    <span className="text-xs text-[var(--c-text-muted)] flex-shrink-0">{topic.estimated_hours}h</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
