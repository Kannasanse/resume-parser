'use client';
import { useRef, useState } from 'react';

function CloudUploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

export function FileDropZone({ accept, multiple = false, maxSizeMB = 50, onFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter(f => f.size <= maxSizeMB * 1024 * 1024);
    if (valid.length) onFiles(multiple ? valid : [valid[0]]);
  }

  const acceptLabel = accept
    .split(',')
    .map(a => a.replace('application/', '').replace('.', '').toUpperCase())
    .join(', ');

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 group
        ${dragging
          ? 'border-[#185FA5] bg-[rgba(24,95,165,0.04)]'
          : 'border-[#D1DCE8] dark:border-white/15 hover:border-[#185FA5] hover:bg-[rgba(24,95,165,0.02)]'
        }`}
    >
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.15)] flex items-center justify-center text-[#185FA5] group-hover:scale-105 transition-transform">
        <CloudUploadIcon />
      </div>
      <p className="text-base font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">
        Drop {multiple ? 'files' : 'a file'} here or{' '}
        <span className="text-[#185FA5]">click to browse</span>
      </p>
      <p className="text-sm text-[#9CA3AF] mt-1">
        {acceptLabel} · Max {maxSizeMB}MB{multiple ? ' per file' : ''}
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={e => {
          const files = Array.from(e.target.files ?? []).filter(f => f.size <= maxSizeMB * 1024 * 1024);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
