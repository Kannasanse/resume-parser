'use client';
import CourseChat from './CourseChat';
import StudyGuide from './StudyGuide';

const TABS = [
  { id: 'chat',  label: 'Chat' },
  { id: 'guide', label: 'Study Guide' },
];

export default function CourseRightPanel({ courseId, skillName, activeTab, onTabChange, onClose }) {
  return (
    <div style={{
      width: 320, flexShrink: 0,
      background: 'var(--c-bg-surface, #0f1923)',
      borderLeft: '1px solid var(--c-border)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--c-border)',
        padding: '0 12px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 0, flex: 1 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '10px 14px', border: 'none', background: 'none',
                fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? 'var(--c-primary)' : 'var(--c-text-muted)',
                cursor: 'pointer',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--c-primary)' : 'transparent'}`,
                transition: 'all 0.15s', marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            color: 'var(--c-text-muted)', cursor: 'pointer',
            fontSize: 16, padding: '4px 6px', lineHeight: 1,
          }}
          title="Close"
        >×</button>
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'chat' && (
          <CourseChat courseId={courseId} skillName={skillName} />
        )}
        {activeTab === 'guide' && (
          <StudyGuide courseId={courseId} skillName={skillName} />
        )}
      </div>
    </div>
  );
}
