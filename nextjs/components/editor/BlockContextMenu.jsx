'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const TURN_INTO = [
  { label: 'Text',          icon: '¶',   cmd: (e) => e.chain().focus().setParagraph().run() },
  { label: 'Heading 1',     icon: 'H1',  cmd: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
  { label: 'Heading 2',     icon: 'H2',  cmd: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
  { label: 'Heading 3',     icon: 'H3',  cmd: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
  { label: 'Bulleted List', icon: '•',   cmd: (e) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered List', icon: '1.',  cmd: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Quote',         icon: '"',   cmd: (e) => e.chain().focus().toggleBlockquote().run() },
  { label: 'Code Block',    icon: '</>',  cmd: (e) => e.chain().focus().toggleCodeBlock().run() },
];

export default function BlockContextMenu({ x, y, editor, bounds, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const onKey   = (e) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  function positionCursorInBlock() {
    if (!bounds || !editor) return;
    try {
      editor.commands.setTextSelection({ from: bounds.nodeStart + 1, to: bounds.nodeStart + 1 });
    } catch { /* ignore */ }
  }

  function deleteBlock() {
    onClose();
    if (!bounds || !editor) return;
    editor.view.dispatch(editor.state.tr.delete(bounds.nodeStart, bounds.nodeEnd));
    editor.commands.focus();
  }

  function duplicateBlock() {
    onClose();
    if (!bounds || !editor) return;
    editor.view.dispatch(editor.state.tr.insert(bounds.nodeEnd, bounds.node));
    editor.commands.focus();
  }

  function moveUp() {
    onClose();
    if (!bounds || !editor) return;
    const { state, dispatch } = editor.view;
    const { nodeStart, nodeEnd, node } = bounds;
    if (nodeStart <= 0) return;
    try {
      const $before  = state.doc.resolve(nodeStart - 1);
      const prevStart = $before.before(1);
      dispatch(state.tr.delete(nodeStart, nodeEnd).insert(prevStart, node));
      editor.commands.focus();
    } catch { /* ignore */ }
  }

  function moveDown() {
    onClose();
    if (!bounds || !editor) return;
    const { state, dispatch } = editor.view;
    const { nodeStart, nodeEnd, node } = bounds;
    if (nodeEnd >= state.doc.content.size) return;
    try {
      const $after  = state.doc.resolve(nodeEnd + 1);
      const nextEnd = $after.after(1);
      dispatch(state.tr.insert(nextEnd, node).delete(nodeStart, nodeEnd));
      editor.commands.focus();
    } catch { /* ignore */ }
  }

  function turnInto(cmdFn) {
    onClose();
    positionCursorInBlock();
    setTimeout(() => cmdFn(editor), 0);
  }

  function copyText() {
    onClose();
    if (!bounds || !editor) return;
    const text = editor.state.doc.textBetween(bounds.nodeStart, bounds.nodeEnd, '\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  // Adjust position so menu stays within viewport
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const menuW = 208;
  const menuH = 380;
  const left = Math.min(x, vw - menuW - 8);
  const top  = y + menuH > vh ? Math.max(8, vh - menuH - 8) : y;

  const Item = ({ onClick, danger, icon, children }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-left text-[13px] rounded-lg transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-[#2C2C2A] dark:text-[#E8EFF7] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)]'
      }`}
    >
      {icon && <span className="w-5 flex-shrink-0 text-center text-[11px] font-mono text-[#9CA3AF]">{icon}</span>}
      {children}
    </button>
  );

  const Section = ({ label, children }) => (
    <div>
      <p className="text-[10px] font-semibold text-[#9CA3AF] dark:text-[#4A6380] uppercase tracking-wider px-3 pt-2 pb-0.5">
        {label}
      </p>
      {children}
    </div>
  );

  const Sep = () => <div className="h-px bg-[#E8EFF7] dark:bg-white/10 my-1 mx-2" />;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top, left, zIndex: 1000 }}
      className="bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-xl shadow-xl w-52 py-1.5 overflow-hidden"
    >
      <Section label="Actions">
        <Item onClick={deleteBlock} danger icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        }>Delete</Item>
        <Item onClick={duplicateBlock} icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        }>Duplicate</Item>
        <Item onClick={copyText} icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
        }>Copy text</Item>
      </Section>

      <Sep />

      <Section label="Move">
        <Item onClick={moveUp} icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6"/>
          </svg>
        }>Move up</Item>
        <Item onClick={moveDown} icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        }>Move down</Item>
      </Section>

      <Sep />

      <Section label="Turn into">
        {TURN_INTO.map(t => (
          <Item key={t.label} onClick={() => turnInto(t.cmd)} icon={t.icon}>
            {t.label}
          </Item>
        ))}
      </Section>
    </div>,
    document.body
  );
}
