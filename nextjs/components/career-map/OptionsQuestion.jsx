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
            className="relative text-left transition-all duration-200 rounded-2xl min-h-[72px] flex items-center px-5 py-4"
            style={{
              border: isSelected ? '2px solid #185FA5' : '1.5px solid #D1DCE8',
              background: isSelected
                ? 'linear-gradient(135deg, #E6F1FB, #F4F8FC)'
                : 'white',
              boxShadow: isSelected ? '0 0 0 4px rgba(24,95,165,0.12)' : undefined,
              transform: isSelected ? 'translateY(-1px)' : undefined,
            }}
            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(24,95,165,0.4)'; e.currentTarget.style.background = '#F4F8FC'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#D1DCE8'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'none'; } }}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 text-[#185FA5]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
                </svg>
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-[#2C2C2A]">{opt.label}</p>
              {opt.subLabel && (
                <p className="text-xs text-[#6B7280] mt-0.5">{opt.subLabel}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
