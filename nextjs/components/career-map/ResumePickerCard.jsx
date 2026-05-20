'use client';

function relativeDate(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ResumePickerCard({ resume, selected, onSelect }) {
  const isSelected = selected === resume.id;

  return (
    <button
      type="button"
      onClick={() => onSelect(resume.id)}
      className="w-full text-left transition-all duration-200 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
      style={{
        border: isSelected ? '2px solid #185FA5' : '1.5px solid #D1DCE8',
        background: isSelected
          ? 'linear-gradient(135deg, #E6F1FB, #F4F8FC)'
          : 'white',
        boxShadow: isSelected ? '0 4px 16px rgba(12,68,124,0.10)' : 'none',
        transform: 'translateY(0)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'rgba(24,95,165,0.4)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(12,68,124,0.10)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#D1DCE8';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {isSelected && (
        <span className="absolute top-3 right-3 text-[#185FA5]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
          </svg>
        </span>
      )}

      {/* Top row: title + template chip */}
      <div className="flex items-start gap-2 pr-6">
        <p className="text-[16px] font-semibold text-[#2C2C2A] flex-1 leading-snug">{resume.title}</p>
        {resume.templateId && (
          <span className="flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border"
            style={{ background: '#F4F8FC', borderColor: '#D1DCE8', color: '#6B7280' }}>
            {resume.templateId}
          </span>
        )}
      </div>

      {/* Skills chips */}
      {resume.skillsPreview?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {resume.skillsPreview.map(skill => (
            <span key={skill} className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: '#E6F1FB', color: '#185FA5' }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-3">
        <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
          Updated {relativeDate(resume.updatedAt)}
        </span>
        {resume.sectionCount > 0 && (
          <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
            {resume.sectionCount} section{resume.sectionCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  );
}
