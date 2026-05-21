'use client';

export default function FreeTextQuestion({ value, onChange, placeholder, maxLength = 300, onSkip }) {
  const len = (value || '').length;
  const isNearLimit = len >= 250;

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'Write your answer here…'}
          maxLength={maxLength}
          rows={5}
          className="w-full px-4 py-3.5 text-[15px] leading-[1.7] border border-[#D1DCE8] dark:border-white/10 rounded-xl bg-white dark:bg-[#0F1A2E] text-[#2C2C2A] dark:text-[#E8EFF7] placeholder-[#9CA3AF] dark:placeholder-[#4A6380] resize-vertical focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
          style={{
            minHeight: '120px',
            maxHeight: '250px',
          }}
        />
        <span
          className={`absolute bottom-2.5 right-3 text-[12px] ${isNearLimit ? 'text-[#F59E0B]' : 'text-[#9CA3AF] dark:text-[#4A6380]'}`}
        >
          {len} / {maxLength}
        </span>
      </div>
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="text-[12px] text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#6B7280] dark:hover:text-[#8BA3C1] transition-colors"
        >
          Skip this question
        </button>
      )}
    </div>
  );
}
