'use client';
import { useRef, useEffect, useCallback } from 'react';

const TOOLS = [
  { cmd: 'bold',                label: 'B',  title: 'Bold',          cls: 'font-bold' },
  { cmd: 'italic',              label: 'I',  title: 'Italic',        cls: 'italic' },
  { cmd: 'underline',           label: 'U',  title: 'Underline',     cls: 'underline' },
  { type: 'sep' },
  { cmd: 'insertUnorderedList', label: '•≡', title: 'Bullet list',   cls: '' },
  { cmd: 'insertOrderedList',   label: '1≡', title: 'Numbered list', cls: '' },
  { type: 'sep' },
  { cmd: 'formatBlock', arg: 'H3', label: 'H3', title: 'Heading',   cls: 'font-bold text-xs' },
  { cmd: 'formatBlock', arg: 'P',  label: '¶',  title: 'Paragraph', cls: '' },
];

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '180px' }) {
  const editorRef = useRef();
  const isInternal = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternal.current) { isInternal.current = false; return; }
    if (editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg || null);
    editorRef.current?.focus();
  };

  const handleInput = useCallback(() => {
    isInternal.current = true;
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  return (
    <div className="border border-ds-inputBorder rounded overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-ds-border bg-ds-bg flex-wrap">
        {TOOLS.map((t, i) =>
          t.type === 'sep'
            ? <div key={i} className="w-px h-4 bg-ds-border mx-1" />
            : (
              <button key={i} type="button" title={t.title}
                onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.arg); }}
                className={`min-w-[28px] h-7 px-1.5 flex items-center justify-center text-xs rounded hover:bg-ds-border text-ds-text transition-colors ${t.cls}`}>
                {t.label}
              </button>
            )
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-sm text-ds-text bg-ds-card outline-none leading-relaxed rich-content"
        style={{ minHeight }}
      />
    </div>
  );
}
