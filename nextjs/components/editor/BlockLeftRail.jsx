'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const RAIL_OFFSET = 58; // px to the left of the block's left edge

function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
      <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
      <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
      <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="3" height="15" viewBox="0 0 3 15" fill="currentColor">
      <circle cx="1.5" cy="1.5" r="1.5"/>
      <circle cx="1.5" cy="7.5" r="1.5"/>
      <circle cx="1.5" cy="13.5" r="1.5"/>
    </svg>
  );
}

function RailBtn({ title, onMouseDown, children, grab = false }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`w-6 h-6 flex items-center justify-center rounded-md
        text-[#C4CEDD] hover:text-[#6B7280]
        hover:bg-[rgba(24,95,165,0.08)]
        dark:text-[#2E4460] dark:hover:text-[#8BA3C1]
        dark:hover:bg-[rgba(24,95,165,0.12)]
        transition-colors select-none
        ${grab ? 'cursor-grab' : ''}`}
    >
      {children}
    </button>
  );
}

export default function BlockLeftRail({ editor, onContextMenu }) {
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropLine, setDropLine] = useState(null);

  const isDraggingRef = useRef(false);
  const dragSourceRef = useRef(null);
  const dropTargetRef = useRef(null);

  // ── Track hovered block ────────────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onMouseMove = (e) => {
      if (isDraggingRef.current) return;
      let el = e.target;
      while (el && el !== dom && el.parentElement !== dom) el = el.parentElement;
      if (!el || el === dom || el.parentElement !== dom) { setHoveredBlock(null); return; }

      let pmPos = null;
      try { pmPos = editor.view.posAtDOM(el, 0); } catch { /* ignore */ }
      setHoveredBlock({ rect: el.getBoundingClientRect(), pmPos });
    };

    const clearHover = () => { if (!isDraggingRef.current) setHoveredBlock(null); };

    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('mouseleave', clearHover);

    // Clear when the scroll container scrolls (block rects become stale)
    const layoutMain = document.getElementById('layout-main');
    if (layoutMain) layoutMain.addEventListener('scroll', clearHover, { passive: true });

    return () => {
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('mouseleave', clearHover);
      if (layoutMain) layoutMain.removeEventListener('scroll', clearHover);
    };
  }, [editor]);

  // ── Resolve top-level block bounds from a PM position ────────────────────
  function resolveBlock(pmPos) {
    if (pmPos == null || !editor) return null;
    try {
      const { state } = editor.view;
      const $pos = state.doc.resolve(pmPos);
      if ($pos.depth === 0) return null;
      const nodeStart = $pos.before(1);
      const nodeEnd   = $pos.after(1);
      const node      = state.doc.nodeAt(nodeStart);
      return node ? { nodeStart, nodeEnd, node } : null;
    } catch { return null; }
  }

  // ── Add block below ────────────────────────────────────────────────────────
  function handleAdd(e) {
    e.preventDefault();
    if (!hoveredBlock?.pmPos || !editor) return;
    const b = resolveBlock(hoveredBlock.pmPos);
    if (!b) return;
    editor.chain().focus().insertContentAt(b.nodeEnd, { type: 'paragraph' }).run();
  }

  // ── Context menu ───────────────────────────────────────────────────────────
  function handleMenu(e) {
    e.preventDefault();
    if (!hoveredBlock || !onContextMenu) return;
    const b = resolveBlock(hoveredBlock.pmPos);
    onContextMenu({ x: e.clientX, y: e.clientY, bounds: b, onClose: () => setHoveredBlock(null) });
  }

  // ── Drag to reorder ────────────────────────────────────────────────────────
  const startDrag = useCallback((e) => {
    if (!hoveredBlock?.pmPos || !editor) return;
    e.preventDefault();
    const b = resolveBlock(hoveredBlock.pmPos);
    if (!b) return;

    dragSourceRef.current = b;
    isDraggingRef.current = true;
    setIsDragging(true);
    setHoveredBlock(null);

    const editorDom = editor.view.dom;
    const editorRect = editorDom.getBoundingClientRect();

    const onDragMove = (me) => {
      const children = [...editorDom.children];
      let indicator = null;

      for (let i = 0; i < children.length; i++) {
        const r = children[i].getBoundingClientRect();
        if (me.clientY <= r.top + r.height / 2) {
          let pos = 0;
          try { pos = Math.max(0, editor.view.posAtDOM(children[i], 0) - 1); } catch {}
          indicator = { y: r.top, pos };
          break;
        }
        if (i === children.length - 1) {
          indicator = { y: r.bottom, pos: editor.state.doc.content.size };
        }
      }

      if (indicator) {
        dropTargetRef.current = indicator;
        setDropLine({ y: indicator.y, left: editorRect.left, width: editorRect.width });
      }
    };

    const onDragEnd = () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      isDraggingRef.current = false;

      const dt = dropTargetRef.current;
      const ds = dragSourceRef.current;

      if (dt && ds) {
        try {
          const { state, dispatch } = editor.view;
          const { nodeStart, nodeEnd, node } = ds;
          const targetPos = dt.pos;
          if (targetPos > nodeEnd) {
            dispatch(state.tr.insert(targetPos, node).delete(nodeStart, nodeEnd));
          } else if (targetPos < nodeStart) {
            dispatch(state.tr.delete(nodeStart, nodeEnd).insert(targetPos, node));
          }
        } catch { /* ignore bad positions */ }
      }

      dragSourceRef.current = null;
      dropTargetRef.current = null;
      setIsDragging(false);
      setDropLine(null);
    };

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  }, [hoveredBlock, editor]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (typeof document === 'undefined') return null;
  if (!hoveredBlock && !isDragging) return null;

  return createPortal(
    <>
      {hoveredBlock && !isDragging && (
        <div
          style={{
            position: 'fixed',
            top: hoveredBlock.rect.top,
            left: hoveredBlock.rect.left - RAIL_OFFSET,
            height: hoveredBlock.rect.height,
            zIndex: 500,
            display: 'flex',
            alignItems: 'flex-start',
            paddingTop: '3px',
            gap: '2px',
          }}
        >
          <RailBtn title="Add block below" onMouseDown={handleAdd}>
            <span className="text-base font-medium leading-none">+</span>
          </RailBtn>
          <RailBtn title="Drag to reorder" onMouseDown={startDrag} grab>
            <GripIcon />
          </RailBtn>
          <RailBtn title="Block options" onMouseDown={handleMenu}>
            <DotsIcon />
          </RailBtn>
        </div>
      )}

      {isDragging && dropLine && (
        <div
          style={{
            position: 'fixed',
            top: dropLine.y - 1,
            left: dropLine.left,
            width: dropLine.width,
            height: 2,
            backgroundColor: '#185FA5',
            borderRadius: 1,
            zIndex: 600,
            pointerEvents: 'none',
          }}
        />
      )}
    </>,
    document.body
  );
}
