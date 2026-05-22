'use client';
import { useState, useEffect, useRef } from 'react';

function ToolBtn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors flex-shrink-0
        ${active
          ? 'bg-[#E6F1FB] text-[#185FA5] dark:bg-[rgba(24,95,165,0.20)] dark:text-[#5B9FD4]'
          : 'text-[#2C2C2A] dark:text-[#E8EFF7] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)]'
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-[#D1DCE8] dark:bg-white/10 mx-0.5 flex-shrink-0" />;
}

export default function NoteBubbleMenu({ editor }) {
  const [pos, setPos] = useState(null); // { top, left } in viewport px
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    function update() {
      const { selection, doc } = editor.state;
      const { empty, from, to } = selection;

      // Hide when no text selected
      if (empty || from === to || doc.textBetween(from, to, '').length === 0) {
        setPos(null);
        return;
      }

      try {
        const startCoords = editor.view.coordsAtPos(from);
        const endCoords   = editor.view.coordsAtPos(to);

        const menuW = menuRef.current?.offsetWidth || 340;
        const midX  = (startCoords.left + endCoords.left) / 2;
        const left  = Math.max(8, midX - menuW / 2);
        const top   = startCoords.top - 48; // 48px above selection

        setPos({ top, left });
      } catch {
        setPos(null);
      }
    }

    function hide() { setPos(null); }

    editor.on('selectionUpdate', update);
    editor.on('blur', hide);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('blur', hide);
    };
  }, [editor]);

  if (!editor || !pos) return null;

  function handleLink() {
    const prevUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL', prevUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  }

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 999 }}
      onMouseDown={e => e.preventDefault()}
      className="bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-xl shadow-lg p-1 flex items-center gap-0.5 animate-fade-in"
    >
      <ToolBtn active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}      title="Bold">      <span className="font-bold">B</span></ToolBtn>
      <ToolBtn active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}    title="Italic">    <span className="italic">I</span></ToolBtn>
      <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"> <span className="underline">U</span></ToolBtn>
      <ToolBtn active={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()}    title="Strikethrough"><span className="line-through">S</span></ToolBtn>
      <ToolBtn active={editor.isActive('code')}      onClick={() => editor.chain().focus().toggleCode().run()}      title="Inline code">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </ToolBtn>
      <ToolBtn active={editor.isActive('link')} onClick={handleLink} title="Link">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </ToolBtn>
      <ToolBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l-6 6v3h3l6-6"/><path d="M22 2l-3-3-9 9 3 3 9-9z"/></svg>
      </ToolBtn>

      <Divider />

      <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><span className="font-bold text-[11px]">H1</span></ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><span className="font-bold text-[11px]">H2</span></ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><span className="font-bold text-[11px]">H3</span></ToolBtn>
    </div>
  );
}
