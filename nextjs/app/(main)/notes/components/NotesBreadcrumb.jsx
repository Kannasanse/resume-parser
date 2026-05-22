'use client';

export default function NotesBreadcrumb({ note, notes, onSelectNote }) {
  if (!note?.parent_id) return null;

  // Walk up the parent chain
  const chain = [];
  let current = note;
  while (current?.parent_id) {
    const parent = notes.find(n => n.id === current.parent_id);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }

  if (chain.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap px-8 pt-4 pb-1 text-xs text-[#9CA3AF] dark:text-[#4A6380] select-none">
      <button
        onClick={() => onSelectNote(null)}
        className="hover:text-[#185FA5] dark:hover:text-[#5B9FD4] transition-colors whitespace-nowrap"
      >
        Notes
      </button>
      {chain.map(ancestor => (
        <span key={ancestor.id} className="flex items-center gap-1">
          <span className="opacity-40">/</span>
          <button
            onClick={() => onSelectNote(ancestor.id)}
            className="hover:text-[#185FA5] dark:hover:text-[#5B9FD4] transition-colors max-w-[140px] truncate"
          >
            {ancestor.icon && <span className="mr-0.5">{ancestor.icon}</span>}
            {ancestor.title || 'Untitled'}
          </button>
        </span>
      ))}
      <span className="opacity-40">/</span>
      <span className="text-[#6B7280] dark:text-[#8BA3C1] max-w-[140px] truncate">
        {note.icon && <span className="mr-0.5">{note.icon}</span>}
        {note.title || 'Untitled'}
      </span>
    </div>
  );
}
