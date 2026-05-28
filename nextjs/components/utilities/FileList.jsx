'use client';
import { useState } from 'react';

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="5" r="1" fill="currentColor" /><circle cx="15" cy="5" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="19" r="1" fill="currentColor" /><circle cx="15" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

export function FileList({ files, onRemove, onReorder, extra }) {
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  function handleDragStart(i) { setDraggingIdx(i); }
  function handleDragOver(e, i) { e.preventDefault(); setOverIdx(i); }
  function handleDrop(e, i) {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === i) { setDraggingIdx(null); setOverIdx(null); return; }
    const next = [...files];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(i, 0, moved);
    onReorder?.(next);
    setDraggingIdx(null);
    setOverIdx(null);
  }

  return (
    <ul className="space-y-2 mt-4">
      {files.map((file, i) => (
        <li
          key={i}
          draggable={!!onReorder}
          onDragStart={() => handleDragStart(i)}
          onDragOver={e => handleDragOver(e, i)}
          onDrop={e => handleDrop(e, i)}
          onDragEnd={() => { setDraggingIdx(null); setOverIdx(null); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white dark:bg-[#111F35] transition-all
            ${overIdx === i ? 'border-[#185FA5] bg-[rgba(24,95,165,0.04)]' : 'border-[#D1DCE8] dark:border-white/10'}
            ${draggingIdx === i ? 'opacity-40' : ''}`}
        >
          {onReorder && (
            <span className="text-[#9CA3AF] cursor-grab active:cursor-grabbing flex-shrink-0"><GripIcon /></span>
          )}
          <span className="text-[13px] text-[#6B7280] dark:text-[#8BA3C1] w-5 text-center select-none flex-shrink-0">{i + 1}</span>
          <span className="flex-1 text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</span>
          {extra?.(file, i)}
          <span className="text-xs text-[#9CA3AF] flex-shrink-0">{fmtSize(file.size)}</span>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-[#9CA3AF] hover:text-[#D93025] transition-colors text-lg leading-none flex-shrink-0"
          >×</button>
        </li>
      ))}
    </ul>
  );
}
