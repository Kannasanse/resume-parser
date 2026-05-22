'use client';
import { useRef, useEffect, useCallback } from 'react';

export default function EditorTitle({
  value = '',
  onChange,
  placeholder = 'Untitled',
  icon,
  onIconChange,
  coverUrl,
  onCoverChange,
  onEnterPress,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  function handleChange(e) {
    onChange?.(e.target.value);
    resize();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnterPress?.();
    }
  }

  function handleIconClick() {
    const newIcon = window.prompt('Enter an emoji for the icon:', icon || '');
    if (newIcon !== null) {
      onIconChange?.(newIcon.trim() || null);
    }
  }

  function handleCoverClick() {
    if (coverUrl) {
      const action = window.confirm('Remove cover image?\n\nClick OK to remove, Cancel to change URL.');
      if (action) {
        onCoverChange?.(null);
        return;
      }
    }
    const url = window.prompt('Cover image URL:', coverUrl || '');
    if (url !== null) {
      onCoverChange?.(url.trim() || null);
    }
  }

  return (
    <div className="editor-title-wrapper group">
      {/* Cover image */}
      {coverUrl && (
        <div className="relative w-full h-40 overflow-hidden rounded-t-xl mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleCoverClick}
            className="absolute bottom-2 right-3 text-xs bg-black/40 hover:bg-black/60 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm transition-colors"
          >
            Change cover
          </button>
        </div>
      )}

      {/* Ghost action buttons — visible on hover when no cover/icon */}
      {!coverUrl && (
        <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!icon && (
            <button
              onClick={handleIconClick}
              className="text-xs text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] px-2 py-1 rounded-lg hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.10)] transition-colors flex items-center gap-1"
            >
              <span>😊</span>
              <span>Add icon</span>
            </button>
          )}
          <button
            onClick={handleCoverClick}
            className="text-xs text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] px-2 py-1 rounded-lg hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.10)] transition-colors flex items-center gap-1"
          >
            <span>🖼</span>
            <span>Add cover</span>
          </button>
        </div>
      )}

      {/* Emoji icon */}
      {icon && (
        <button
          onClick={handleIconClick}
          className="text-5xl mb-2 hover:opacity-70 transition-opacity block leading-none"
          title="Click to change icon"
          type="button"
        >
          {icon}
        </button>
      )}

      {/* Title textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="editor-title-input w-full resize-none border-none outline-none bg-transparent overflow-hidden leading-tight placeholder-[#D1DCE8] dark:placeholder-[#2A3F5A]"
        style={{
          fontSize: '36px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--c-text)',
          lineHeight: 1.2,
        }}
      />

    </div>
  );
}
