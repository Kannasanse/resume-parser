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

export default function NoteListItem({ note, isSelected, onClick, onAction }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer relative group transition-colors
        ${isSelected
          ? 'bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.20)]'
          : 'hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(255,255,255,0.04)]'
        }`}
    >
      {/* Icon */}
      <span className="text-sm flex-shrink-0">{note.icon || '📝'}</span>

      {/* Title + date */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isSelected
              ? 'text-[#185FA5] dark:text-[#5B9FD4]'
              : 'text-[#2C2C2A] dark:text-[#E8EFF7]'
          }`}
        >
          {note.title || 'Untitled'}
        </p>
        <p className="text-[11px] text-[#9CA3AF] dark:text-[#4A6380]">
          {relativeDate(note.updated_at)}
        </p>
      </div>

      {/* "..." menu button — shown on hover */}
      <button
        onClick={e => {
          e.stopPropagation();
          onAction('menu', note.id);
        }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-[#9CA3AF] hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7] hover:bg-[#F4F8FC] dark:hover:bg-[rgba(255,255,255,0.08)] transition-all flex-shrink-0"
        aria-label="Note options"
      >
        ⋯
      </button>
    </div>
  );
}
