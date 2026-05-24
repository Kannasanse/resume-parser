'use client';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconMCQ({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5" />
      <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5" />
      <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5" />
    </svg>
  );
}

function IconTrueFalse({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
      <path d="M12 8v4" />
      <path d="M8 12h8" />
      <circle cx="12" cy="16" r="0.5" fill={color} />
    </svg>
  );
}

function IconShortAnswer({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Card data ────────────────────────────────────────────────────────────────

const CARDS = [
  {
    value: 'mcq',
    title: 'Multiple choice',
    sub: 'One correct answer from 2+ options',
    Icon: IconMCQ,
  },
  {
    value: 'true_false',
    title: 'True / False',
    sub: 'Binary correct answer',
    Icon: IconTrueFalse,
  },
  {
    value: 'short_answer',
    title: 'Short answer',
    sub: 'Free-text response, manually graded',
    Icon: IconShortAnswer,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuestionTypeSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
      {CARDS.map(({ value: cardVal, title, sub, Icon }) => {
        const selected = value === cardVal;
        return (
          <TypeCard
            key={cardVal}
            cardVal={cardVal}
            title={title}
            sub={sub}
            Icon={Icon}
            selected={selected}
            onClick={() => onChange(cardVal)}
          />
        );
      })}
    </div>
  );
}

function TypeCard({ cardVal, title, sub, Icon, selected, onClick }) {
  const iconColor = selected ? '#185FA5' : '#2C2C2A';

  const baseStyle = {
    flex: 1,
    border: selected ? '1.5px solid #185FA5' : '1.5px solid #D1DCE8',
    borderRadius: 12,
    padding: '14px 16px',
    background: selected
      ? 'linear-gradient(135deg, #E6F1FB, #F4F8FC)'
      : 'var(--ql-card-bg, white)',
    cursor: 'pointer',
    transition: 'all 180ms ease',
    position: 'relative',
    textAlign: 'left',
    outline: 'none',
    minWidth: 0,
  };

  const handleMouseEnter = (e) => {
    if (!selected) {
      e.currentTarget.style.borderColor = 'rgba(24,95,165,0.40)';
      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!selected) {
      e.currentTarget.style.borderColor = '#D1DCE8';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={baseStyle}
      aria-pressed={selected}
    >
      {/* Checkmark top-right */}
      {selected && (
        <span style={{ position: 'absolute', top: 10, right: 12 }}>
          <IconCheck />
        </span>
      )}

      {/* Top row: icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Icon color={iconColor} />
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: selected ? '#185FA5' : '#2C2C2A',
            lineHeight: 1.3,
            transition: 'color 180ms ease',
          }}
        >
          {title}
        </span>
      </div>

      {/* Sub-text */}
      <p
        style={{
          fontSize: 12,
          color: '#6B7280',
          margin: 0,
          marginTop: 4,
          lineHeight: 1.4,
        }}
      >
        {sub}
      </p>
    </button>
  );
}
