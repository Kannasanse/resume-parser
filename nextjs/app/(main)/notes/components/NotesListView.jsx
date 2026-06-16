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

const SORT_COLS = [
  { key: 'title', label: 'Title' },
  { key: 'updated_at', label: 'Updated' },
  { key: 'word_count', label: 'Words' },
];

export default function NotesListView({ notes, selectedNoteId, onSelectNote, sort, onSortChange }) {
  if (notes.length === 0) return null;

  return (
    <div className="px-6 py-4">
      {/* Column headers */}
      <div className="flex items-center gap-2 px-3 pb-2 border-b border-[#D1DCE8] dark:border-white/10">
        {SORT_COLS.map(col => (
          <button
            key={col.key}
            onClick={() => onSortChange(col.key)}
            className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors
              ${col.key === 'title' ? 'flex-1' : col.key === 'word_count' ? 'w-16 justify-end' : 'w-28 justify-end'}
              ${sort === col.key
                ? 'text-[#185FA5] dark:text-[#5B9FD4]'
                : 'text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#6B7280] dark:hover:text-[#8BA3C1]'
              }`}
          >
            {col.label}
            {sort === col.key && <span className="text-[9px]">▼</span>}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-0.5 mt-1">
        {notes.map(note => {
          const isSelected = selectedNoteId === note.id;
          return (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors
                ${isSelected
                  ? 'bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.20)]'
                  : 'hover:bg-[rgba(24,95,165,0.04)] dark:hover:bg-white/[0.03]'
                }`}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{note.icon || '📝'}</span>

              {/* Title */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <p className={`text-sm font-medium truncate ${
                  isSelected ? 'text-[#185FA5] dark:text-[#5B9FD4]' : 'text-[#2C2C2A] dark:text-[#E8EFF7]'
                }`}>
                  {note.title || 'Untitled'}
                </p>
                {note.child_count > 0 && (
                  <span className="flex-shrink-0 text-[10px] bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.15)] text-[#185FA5] dark:text-[#5B9FD4] px-1.5 py-0.5 rounded-full font-medium">
                    {note.child_count}
                  </span>
                )}
                {note.is_pinned && <span className="flex-shrink-0 text-[11px] opacity-50">📌</span>}
              </div>

              {/* Updated */}
              <div className="w-28 text-xs text-[#9CA3AF] dark:text-[#4A6380] text-right flex-shrink-0">
                {relativeDate(note.updated_at)}
              </div>

              {/* Words */}
              <div className="w-16 text-xs text-[#9CA3AF] dark:text-[#4A6380] text-right flex-shrink-0">
                {note.word_count ?? 0}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
