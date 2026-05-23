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

function AlignDropdown({ editor, onClose }) {
  const alignments = [
    { value: 'left',    label: 'Left',    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
    )},
    { value: 'center',  label: 'Center',  icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>
    )},
    { value: 'right',   label: 'Right',   icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
    )},
    { value: 'justify', label: 'Justify', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
    )},
  ];
  return (
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-xl shadow-xl p-1 flex gap-0.5 z-10">
      {alignments.map(a => (
        <button
          key={a.value}
          type="button"
          title={a.label}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign(a.value).run(); onClose(); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            editor.isActive({ textAlign: a.value })
              ? 'bg-[#E6F1FB] text-[#185FA5]'
              : 'text-[#2C2C2A] dark:text-[#E8EFF7] hover:bg-[rgba(24,95,165,0.06)]'
          }`}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
}

export default function NoteBubbleMenu({ editor }) {
  const [pos, setPos] = useState(null);
  const [showAlign, setShowAlign] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    function update() {
      const { selection, doc } = editor.state;
      const { empty, from, to } = selection;
      if (empty || from === to || doc.textBetween(from, to, '').length === 0) {
        setPos(null);
        return;
      }
      try {
        const startCoords = editor.view.coordsAtPos(from);
        const endCoords   = editor.view.coordsAtPos(to);
        const menuW = menuRef.current?.offsetWidth || 380;
        const midX  = (startCoords.left + endCoords.left) / 2;
        const left  = Math.max(8, midX - menuW / 2);
        const top   = startCoords.top - 52;
        setPos({ top, left });
      } catch {
        setPos(null);
      }
    }

    function hide() { setPos(null); setShowAlign(false); }

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

  const currentAlign = ['left','center','right','justify'].find(a => editor.isActive({ textAlign: a })) || 'left';
  const AlignIcon = () => {
    if (currentAlign === 'center') return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>;
    if (currentAlign === 'right')  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>;
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>;
  };

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 999 }}
      onMouseDown={e => e.preventDefault()}
      className="bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-xl shadow-lg p-1 flex items-center gap-0.5 animate-fade-in"
    >
      {/* Inline formatting */}
      <ToolBtn active={editor.isActive('bold')}        onClick={() => editor.chain().focus().toggleBold().run()}        title="Bold (Ctrl+B)">        <span className="font-bold">B</span></ToolBtn>
      <ToolBtn active={editor.isActive('italic')}      onClick={() => editor.chain().focus().toggleItalic().run()}      title="Italic (Ctrl+I)">      <span className="italic">I</span></ToolBtn>
      <ToolBtn active={editor.isActive('underline')}   onClick={() => editor.chain().focus().toggleUnderline().run()}   title="Underline (Ctrl+U)">   <span className="underline">U</span></ToolBtn>
      <ToolBtn active={editor.isActive('strike')}      onClick={() => editor.chain().focus().toggleStrike().run()}      title="Strikethrough">        <span className="line-through">S</span></ToolBtn>
      <ToolBtn active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript">
        <span className="font-semibold text-[10px]">x<sup>2</sup></span>
      </ToolBtn>
      <ToolBtn active={editor.isActive('subscript')}   onClick={() => editor.chain().focus().toggleSubscript().run()}   title="Subscript">
        <span className="font-semibold text-[10px]">x<sub>2</sub></span>
      </ToolBtn>
      <ToolBtn active={editor.isActive('code')}        onClick={() => editor.chain().focus().toggleCode().run()}        title="Inline code (Ctrl+E)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </ToolBtn>
      <ToolBtn active={editor.isActive('link')} onClick={handleLink} title="Link (Ctrl+K)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </ToolBtn>
      <ToolBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight (Ctrl+Shift+H)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l-6 6v3h3l6-6"/><path d="M22 2l-3-3-9 9 3 3 9-9z"/></svg>
      </ToolBtn>

      <Divider />

      {/* Headings */}
      <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><span className="font-bold text-[11px]">H1</span></ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><span className="font-bold text-[11px]">H2</span></ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><span className="font-bold text-[11px]">H3</span></ToolBtn>

      <Divider />

      {/* Text alignment */}
      <div className="relative">
        <ToolBtn active={currentAlign !== 'left'} onClick={() => setShowAlign(v => !v)} title="Text alignment">
          <AlignIcon />
        </ToolBtn>
        {showAlign && <AlignDropdown editor={editor} onClose={() => setShowAlign(false)} />}
      </div>
    </div>
  );
}
