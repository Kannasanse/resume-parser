'use client';

function relativeDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString();
}

export default function NoteListItem({
  note,
  isSelected,
  onClick,
  onAction,
  depth = 0,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
}) {
  const indent = depth * 14; // 14px per level

  return (
    <div
      onClick={onClick}
      style={{ paddingLeft: `${12 + indent}px` }}
      className={`flex items-center gap-1.5 pr-2 py-2 rounded-[10px] cursor-pointer relative group transition-colors
        ${isSelected
          ? 'bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.20)]'
          : 'hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(255,255,255,0.04)]'
        }`}
    >
      {/* Expand/collapse chevron — only shown when note has children */}
      <button
        onClick={e => {
          e.stopPropagation();
          onToggleExpand?.();
        }}
        className={`w-4 h-4 flex items-center justify-center flex-shrink-0 text-[#9CA3AF] dark:text-[#4A6380] transition-transform rounded
          ${hasChildren ? 'opacity-100 hover:text-[#185FA5] dark:hover:text-[#5B9FD4]' : 'opacity-0 pointer-events-none'}
          ${isExpanded ? 'rotate-90' : ''}`}
        aria-label="Expand"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M3.5 2L7 5L3.5 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Icon */}
      <span className="text-sm flex-shrink-0">{note.icon || '📝'}</span>

      {/* Title + date */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isSelected
            ? 'text-[#185FA5] dark:text-[#5B9FD4]'
            : 'text-[#2C2C2A] dark:text-[#E8EFF7]'
        }`}>
          {note.title || 'Untitled'}
        </p>
        {depth === 0 && (
          <p className="text-[11px] text-[#9CA3AF] dark:text-[#4A6380]">
            {relativeDate(note.updated_at)}
          </p>
        )}
      </div>

      {/* Action menu button — shown on hover */}
      <button
        onClick={e => {
          e.stopPropagation();
          onAction('menu', note.id);
        }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-[#9CA3AF] hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7] hover:bg-[#F4F8FC] dark:hover:bg-white/10 transition-all flex-shrink-0"
        aria-label="Note options"
      >
        ⋯
      </button>
    </div>
  );
}
