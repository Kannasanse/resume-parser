'use client';

function IconMCQ({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5"/><line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5"/><line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5"/>
    </svg>
  );
}

function IconTrueFalse({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
      <path d="M12 8v4"/><path d="M8 12h8"/>
    </svg>
  );
}

function IconShortAnswer({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}

const CARDS = [
  { value: 'mcq',          title: 'Multiple choice', sub: 'One correct answer from 2+ options',   Icon: IconMCQ },
  { value: 'true_false',   title: 'True / False',    sub: 'Binary correct answer',                Icon: IconTrueFalse },
  { value: 'short_answer', title: 'Short answer',    sub: 'Free-text response, manually graded',  Icon: IconShortAnswer },
];

export default function QuestionTypeSelector({ value, onChange }) {
  return (
    <div className="flex flex-row gap-3">
      {CARDS.map(({ value: cardVal, title, sub, Icon }) => (
        <TypeCard
          key={cardVal}
          cardVal={cardVal}
          title={title}
          sub={sub}
          Icon={Icon}
          selected={value === cardVal}
          onClick={() => onChange(cardVal)}
        />
      ))}
    </div>
  );
}

function TypeCard({ title, sub, Icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex-1 relative text-left rounded-xl p-[14px_16px] border transition-all duration-[180ms] outline-none min-w-0 ${
        selected
          ? 'border-[#185FA5] bg-gradient-to-br from-[#E6F1FB] to-[#F4F8FC] dark:from-[rgba(24,95,165,0.25)] dark:to-[rgba(24,95,165,0.1)] dark:border-[#5B9FD4]'
          : 'border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#1A2C45] hover:border-[rgba(24,95,165,0.4)] dark:hover:border-white/20'
      }`}
    >
      {selected && (
        <span className="absolute top-2.5 right-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      )}
      <div className="flex items-center gap-2 mb-1">
        <Icon className={selected ? 'text-[#185FA5] dark:text-[#5B9FD4]' : 'text-[#2C2C2A] dark:text-[#E8EFF7]'} />
        <span className={`text-sm font-semibold leading-snug ${selected ? 'text-[#185FA5] dark:text-[#5B9FD4]' : 'text-[#2C2C2A] dark:text-[#E8EFF7]'}`}>
          {title}
        </span>
      </div>
      <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] leading-snug mt-1">{sub}</p>
    </button>
  );
}
