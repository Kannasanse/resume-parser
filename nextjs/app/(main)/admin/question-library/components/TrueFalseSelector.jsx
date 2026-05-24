'use client';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheckCircle({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconXCircle({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

// ─── Card config ──────────────────────────────────────────────────────────────

const CARDS = [
  {
    value: 'true',
    label: 'True',
    Icon: IconCheckCircle,
    selectedBg: '#D1FAE5',
    selectedBorder: '#1D9E75',
    selectedColor: '#1D9E75',
  },
  {
    value: 'false',
    label: 'False',
    Icon: IconXCircle,
    selectedBg: '#FEE2E2',
    selectedBorder: '#D93025',
    selectedColor: '#D93025',
  },
];

// ─── TFCard ───────────────────────────────────────────────────────────────────

function TFCard({ cardDef, selected, onClick }) {
  const { value, label, Icon, selectedBg, selectedBorder, selectedColor } = cardDef;

  const baseStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '12px 24px',
    borderRadius: 12,
    border: selected ? `1.5px solid ${selectedBorder}` : '1.5px solid #D1DCE8',
    background: selected ? selectedBg : 'var(--ql-card-bg, white)',
    cursor: 'pointer',
    transition: 'all 180ms ease',
    outline: 'none',
    minWidth: 0,
  };

  const labelStyle = {
    fontSize: 15,
    fontWeight: 600,
    color: selected ? selectedColor : '#6B7280',
    transition: 'color 180ms ease',
  };

  const handleMouseEnter = (e) => {
    if (!selected) {
      e.currentTarget.style.borderColor = 'rgba(24,95,165,0.35)';
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
      <Icon color={selected ? selectedColor : '#9CA3AF'} />
      <span style={labelStyle}>{label}</span>
    </button>
  );
}

// ─── TrueFalseSelector ────────────────────────────────────────────────────────

export default function TrueFalseSelector({ value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12 }}>
        {CARDS.map((card) => (
          <TFCard
            key={card.value}
            cardDef={card}
            selected={value === card.value}
            onClick={() => onChange(card.value)}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: 12,
          color: '#9CA3AF',
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        Select the correct answer
      </p>
    </div>
  );
}
