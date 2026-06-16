'use client';

function IconCheckCircle({ className }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function IconXCircle({ className }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}

const CARDS = [
  {
    value: 'true',
    label: 'True',
    Icon: IconCheckCircle,
    activeClass: 'border-[#1D9E75] bg-[#D1FAE5] dark:bg-[rgba(29,158,117,0.15)] dark:border-[#1D9E75]',
    iconClass: 'text-[#1D9E75]',
    labelClass: 'text-[#1D9E75]',
  },
  {
    value: 'false',
    label: 'False',
    Icon: IconXCircle,
    activeClass: 'border-[#D93025] bg-[#FEE2E2] dark:bg-[rgba(217,48,37,0.15)] dark:border-[#D93025]',
    iconClass: 'text-[#D93025]',
    labelClass: 'text-[#D93025]',
  },
];

function TFCard({ cardDef, selected, onClick }) {
  const { label, Icon, activeClass, iconClass, labelClass } = cardDef;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl border transition-all duration-[180ms] outline-none min-w-0 ${
        selected
          ? activeClass
          : 'border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#1A2C45] hover:border-[rgba(24,95,165,0.35)] dark:hover:border-white/20'
      }`}
    >
      <Icon className={selected ? iconClass : 'text-[#9CA3AF] dark:text-[#4B6280]'} />
      <span className={`text-[15px] font-semibold ${selected ? labelClass : 'text-[#6B7280] dark:text-[#8BA3C1]'}`}>
        {label}
      </span>
    </button>
  );
}

export default function TrueFalseSelector({ value, onChange }) {
  return (
    <div>
      <div className="flex gap-3">
        {CARDS.map((card) => (
          <TFCard key={card.value} cardDef={card} selected={value === card.value} onClick={() => onChange(card.value)} />
        ))}
      </div>
      <p className="text-xs text-[#9CA3AF] mt-2">Select the correct answer</p>
    </div>
  );
}
