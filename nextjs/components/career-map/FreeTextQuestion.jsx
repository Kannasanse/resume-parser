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
          className="w-full px-4 py-3.5 text-[15px] leading-[1.7] border rounded-xl bg-white text-[#2C2C2A] placeholder-[#9CA3AF] resize-vertical focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
          style={{
            minHeight: '120px',
            maxHeight: '250px',
            borderColor: '#D1DCE8',
          }}
        />
        <span
          className="absolute bottom-2.5 right-3 text-[12px]"
          style={{ color: isNearLimit ? '#F59E0B' : '#9CA3AF' }}
        >
          {len} / {maxLength}
        </span>
      </div>
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="text-[12px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
        >
          Skip this question
        </button>
      )}
    </div>
  );
}
