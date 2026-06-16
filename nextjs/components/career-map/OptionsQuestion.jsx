'use client';

export default function OptionsQuestion({ options = [], selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(opt => {
        const isSelected = selected === opt.value || selected === opt.id;
        return (
          <button
            key={opt.id || opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`relative text-left transition-all duration-200 rounded-2xl min-h-[72px] flex items-center px-5 py-4 ${
              isSelected
                ? 'border-2 border-[#185FA5] bg-gradient-to-br from-[#E6F1FB] to-[#F4F8FC] dark:from-[rgba(24,95,165,0.20)] dark:to-[rgba(24,95,165,0.10)] shadow-[0_0_0_4px_rgba(24,95,165,0.12)] -translate-y-px'
                : 'border border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#0F1A2E] hover:border-[rgba(24,95,165,0.4)] hover:bg-[#F4F8FC] dark:hover:bg-[rgba(255,255,255,0.06)] hover:-translate-y-px'
            }`}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 text-[#185FA5] dark:text-[#5B9FD4]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
                </svg>
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">{opt.label}</p>
              {opt.subLabel && (
                <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] mt-0.5">{opt.subLabel}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
