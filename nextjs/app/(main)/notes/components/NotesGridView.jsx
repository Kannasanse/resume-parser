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

function extractPreview(content, maxChars = 100) {
  if (!content?.content) return '';
  const parts = [];
  function walk(nodes) {
    for (const node of nodes) {
      if (node.text) parts.push(node.text);
      if (node.content) walk(node.content);
      if (parts.join('').length >= maxChars) return;
    }
  }
  walk(content.content);
  const text = parts.join(' ').trim();
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
}

export default function NotesGridView({ notes, selectedNoteId, onSelectNote }) {
  if (notes.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-6 pt-4">
      {notes.map(note => {
        const preview = extractPreview(note.content);
        const isSelected = selectedNoteId === note.id;
        return (
          <button
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`group text-left flex flex-col gap-2 p-4 rounded-xl border transition-all min-h-[120px]
              ${isSelected
                ? 'bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.20)] border-[#185FA5]/40'
                : 'bg-white dark:bg-[#111F35] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5]/30 hover:shadow-md dark:hover:shadow-none dark:hover:border-white/20'
              }`}
          >
            <span className="text-2xl leading-none">{note.icon || '📝'}</span>
            <p className={`text-sm font-semibold leading-snug truncate ${
              isSelected ? 'text-[#185FA5] dark:text-[#5B9FD4]' : 'text-[#2C2C2A] dark:text-[#E8EFF7]'
            }`}>
              {note.title || 'Untitled'}
            </p>
            {preview && (
              <p className="text-xs text-[#6B7280] dark:text-[#4A6380] line-clamp-2 leading-relaxed flex-1">
                {preview}
              </p>
            )}
            <div className="flex items-center gap-2 mt-auto">
              <p className="text-[11px] text-[#9CA3AF] dark:text-[#4A6380]">
                {relativeDate(note.updated_at)}
              </p>
              {note.child_count > 0 && (
                <span className="text-[10px] bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.15)] text-[#185FA5] dark:text-[#5B9FD4] px-1.5 py-0.5 rounded-full font-medium">
                  {note.child_count} sub
                </span>
              )}
              {note.is_pinned && <span className="text-[11px] opacity-60">📌</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
