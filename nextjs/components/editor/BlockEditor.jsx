'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import CharacterCount from '@tiptap/extension-character-count';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { createLowlight, common } from 'lowlight';

import { Extension } from '@tiptap/core';
import { CalloutExtension } from './extensions/CalloutNode';
import { ToggleExtension } from './extensions/ToggleNode';
import { SearchExtension } from './extensions/SearchExtension';
import { VideoExtension } from './extensions/VideoNode';
import { TagExtension } from './extensions/TagExtension';
import { WikilinkExtension } from './extensions/WikilinkExtension';
import NoteBubbleMenu from './NoteBubbleMenu';
import NoteSlashMenu from './NoteSlashMenu';
import BlockLeftRail from './BlockLeftRail';
import BlockContextMenu from './BlockContextMenu';

// Block-level keyboard shortcuts (Ctrl+D duplicate, Alt+Shift+↑↓ move, Ctrl+Shift+K delete)
const BlockShortcuts = Extension.create({
  name: 'blockShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-d': () => {
        const { state, dispatch } = this.editor.view;
        const { $from, $to } = state.selection;
        const from = $from.start($from.depth);
        const to = $to.end($to.depth);
        const slice = state.doc.slice(from, to);
        const tr = state.tr.insert(to, slice.content);
        dispatch(tr);
        return true;
      },
      'Mod-Shift-k': () => {
        const { state, dispatch } = this.editor.view;
        const { $from } = state.selection;
        const depth = $from.depth;
        const nodeStart = $from.start(depth) - 1;
        const nodeEnd = $from.end(depth) + 1;
        dispatch(state.tr.delete(nodeStart, nodeEnd));
        return true;
      },
      'Alt-Shift-ArrowUp': () => {
        const { state, dispatch } = this.editor.view;
        const { $from } = state.selection;
        const depth = $from.depth;
        const nodeStart = $from.start(depth) - 1;
        const nodeEnd = $from.end(depth) + 1;
        if (nodeStart <= 0) return false;
        const $before = state.doc.resolve(nodeStart - 1);
        const prevStart = $before.start($before.depth) - 1;
        if (prevStart < 0) return false;
        const node = state.doc.nodeAt(nodeStart);
        if (!node) return false;
        const tr = state.tr.delete(nodeStart, nodeEnd).insert(prevStart, node);
        dispatch(tr);
        return true;
      },
      'Alt-Shift-ArrowDown': () => {
        const { state, dispatch } = this.editor.view;
        const { $from } = state.selection;
        const depth = $from.depth;
        const nodeStart = $from.start(depth) - 1;
        const nodeEnd = $from.end(depth) + 1;
        if (nodeEnd >= state.doc.content.size) return false;
        const $after = state.doc.resolve(nodeEnd + 1);
        const nextEnd = $after.end($after.depth) + 1;
        const node = state.doc.nodeAt(nodeStart);
        if (!node) return false;
        const tr = state.tr.insert(nextEnd, node).delete(nodeStart, nodeEnd);
        dispatch(tr);
        return true;
      },
    };
  },
});

const lowlight = createLowlight(common);

function isValidDoc(content) {
  return (
    content &&
    typeof content === 'object' &&
    content.type === 'doc' &&
    Array.isArray(content.content) &&
    content.content.length > 0
  );
}

// mode: 'full' | 'standard' | 'minimal' | 'readonly'
export default function BlockEditor({
  content,
  onChange,
  placeholder,
  autoFocus = false,
  readOnly = false,
  mode = 'full',
  className,
  onCreateSubpage,
  onEditorReady,
  noteId,
}) {
  const debounceTimer = useRef(null);
  const onChangeRef = useRef(onChange);
  const editorContainerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  const isReadonly  = readOnly || mode === 'readonly';
  const isMinimal   = mode === 'minimal';
  const showRail    = !isMinimal && !isReadonly;
  const showSlash   = !isMinimal && !isReadonly;
  const showBubble  = !isReadonly;

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const handleUpdate = useCallback(({ editor }) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const json = editor.getJSON();
      const words = editor.storage.characterCount?.words?.() ?? 0;
      onChangeRef.current?.(json, words);
    }, 1500);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'note-link' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading';
          return placeholder || "Type '/' for commands…";
        },
      }),
      Highlight.configure({ multicolor: false }),
      Color,
      TextStyle,
      Superscript,
      Subscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ allowBase64: false }),
      CodeBlockLowlight.configure({ lowlight }),
      CharacterCount,
      CalloutExtension,
      ToggleExtension,
      SearchExtension,
      BlockShortcuts,
      TagExtension,
      WikilinkExtension,
      ...(mode !== 'minimal' ? [VideoExtension] : []),
    ],

    editorProps: {
      attributes: {
        class: 'note-editor-content outline-none min-h-[300px]',
      },
    },

    editable: !isReadonly,
    autofocus: autoFocus ? 'end' : false,
    content: isValidDoc(content) ? content : undefined,
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.isFocused) return;
    if (!isValidDoc(content)) return;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(content)) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!isReadonly);
  }, [isReadonly, editor]);

  // ── Wikilink click → navigate to linked note ───────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const handleClick = (event) => {
      const el = event.target.closest('[data-wikilink]');
      if (!el) return;
      const noteId = el.dataset.wikilink;
      if (!noteId) return;
      // Emit a custom event; the notes page listens and selects the note
      window.dispatchEvent(new CustomEvent('proflect:navigate-note', { detail: { noteId } }));
    };
    editor.view.dom.addEventListener('click', handleClick);
    return () => editor.view.dom.removeEventListener('click', handleClick);
  }, [editor]);

  // ── Paste image from clipboard ─────────────────────────────────────────────
  useEffect(() => {
    if (!editor || !noteId) return;

    const handlePaste = async (event) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      if (!imageItem) return;

      event.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      try {
        const { uploadImageFile } = await import('@/lib/editor/uploadImage');
        const url = await uploadImageFile(file, noteId);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error('[BlockEditor] paste image upload failed:', err.message);
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener('paste', handlePaste);
    return () => dom.removeEventListener('paste', handlePaste);
  }, [editor, noteId]);

  // ── Drag image file onto editor ────────────────────────────────────────────
  useEffect(() => {
    if (!editor || !noteId) return;
    const container = editorContainerRef.current;
    if (!container) return;

    const handleDragOver = (e) => {
      if (!Array.from(e.dataTransfer.types).includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      container.classList.add('drag-image-over');
    };

    const handleDragLeave = (e) => {
      if (!container.contains(e.relatedTarget)) {
        container.classList.remove('drag-image-over');
      }
    };

    const handleDrop = async (e) => {
      container.classList.remove('drag-image-over');
      const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();

      try {
        const { uploadImageFile } = await import('@/lib/editor/uploadImage');
        const url = await uploadImageFile(file, noteId);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error('[BlockEditor] drop image upload failed:', err.message);
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragleave', handleDragLeave);
      container.removeEventListener('drop', handleDrop);
    };
  }, [editor, noteId]);

  return (
    <>
      <style>{EDITOR_STYLES}</style>
      <div ref={editorContainerRef} className={`note-editor ${className || ''}`}>
        <EditorContent editor={editor} />
        {editor && showBubble  && <NoteBubbleMenu editor={editor} />}
        {editor && showSlash   && <NoteSlashMenu editor={editor} onCreateSubpage={onCreateSubpage} noteId={noteId} />}
        {editor && showRail    && (
          <BlockLeftRail
            editor={editor}
            onContextMenu={(params) => setContextMenu(params)}
          />
        )}
        {contextMenu && editor && (
          <BlockContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            editor={editor}
            bounds={contextMenu.bounds}
            onClose={() => {
              setContextMenu(null);
              contextMenu.onClose?.();
            }}
          />
        )}
      </div>
    </>
  );
}

const EDITOR_STYLES = `
/* ── Headings ─────────────────────────────────────────────────────────────── */
.note-editor-content h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; margin-top: 32px; margin-bottom: 8px; }
.note-editor-content h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-top: 24px; margin-bottom: 6px; }
.note-editor-content h3 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin-top: 20px; margin-bottom: 4px; }
.note-editor-content h4 { font-size: 15px; font-weight: 600; margin-top: 18px; margin-bottom: 4px; }
.note-editor-content h5 { font-size: 13px; font-weight: 600; color: #6B7280; margin-top: 14px; margin-bottom: 2px; }
.note-editor-content h6 { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 12px; margin-bottom: 2px; }
.dark .note-editor-content h5 { color: #8BA3C1; }
.dark .note-editor-content h6 { color: #4A6380; }

/* ── Text ─────────────────────────────────────────────────────────────────── */
.note-editor-content p { line-height: 1.75; margin: 2px 0; }
.note-editor-content ul { list-style-type: disc; padding-left: 20px; }
.note-editor-content ol { list-style-type: decimal; padding-left: 20px; }
.note-editor-content li { margin: 2px 0; }
.note-editor-content sup { font-size: 0.75em; vertical-align: super; }
.note-editor-content sub { font-size: 0.75em; vertical-align: sub; }

/* ── Blockquote ───────────────────────────────────────────────────────────── */
.note-editor-content blockquote { border-left: 4px solid #185FA5; padding-left: 16px; margin: 8px 0; font-style: italic; color: #6B7280; background: rgba(24,95,165,0.04); border-radius: 0 8px 8px 0; }
.dark .note-editor-content blockquote { color: #8BA3C1; background: rgba(24,95,165,0.08); }

/* ── HR ───────────────────────────────────────────────────────────────────── */
.note-editor-content hr { border: none; height: 1px; background: linear-gradient(90deg, transparent, #D1DCE8, transparent); margin: 24px 0; }
.dark .note-editor-content hr { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent); }

/* ── Inline code & pre ────────────────────────────────────────────────────── */
.note-editor-content code { background: #F1F5F9; color: #185FA5; border-radius: 4px; padding: 2px 6px; font-family: monospace; font-size: 0.9em; }
.dark .note-editor-content code { background: rgba(255,255,255,0.10); color: #5B9FD4; }
.note-editor-content pre { background: #1E293B; border-radius: 12px; padding: 16px 20px; color: #F1F5F9; overflow-x: auto; }
.note-editor-content pre code { background: none; color: inherit; padding: 0; }

/* ── Links ────────────────────────────────────────────────────────────────── */
.note-editor-content a { color: #185FA5; text-decoration: underline; }
.dark .note-editor-content a { color: #5B9FD4; }

/* ── Tables ───────────────────────────────────────────────────────────────── */
.note-editor-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
.note-editor-content td, .note-editor-content th { border: 1px solid #D1DCE8; padding: 8px 12px; }
.dark .note-editor-content td, .dark .note-editor-content th { border-color: rgba(255,255,255,0.10); }
.note-editor-content th { background: #F4F8FC; font-weight: 600; }
.dark .note-editor-content th { background: #0D1830; }

/* ── Task list ────────────────────────────────────────────────────────────── */
.note-editor-content ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.note-editor-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; }
.note-editor-content ul[data-type="taskList"] li label { cursor: pointer; margin-top: 2px; }
.note-editor-content ul[data-type="taskList"] input[type="checkbox"] { width: 16px; height: 16px; border-radius: 4px; cursor: pointer; accent-color: #185FA5; }

/* ── Placeholder ──────────────────────────────────────────────────────────── */
.note-editor-content p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #D1DCE8; pointer-events: none; float: left; height: 0; }
.dark .note-editor-content p.is-editor-empty:first-child::before { color: #4A6380; }
.note-editor-content .is-empty::before { content: attr(data-placeholder); color: #D1DCE8; pointer-events: none; float: left; height: 0; }
.dark .note-editor-content .is-empty::before { color: #4A6380; }

/* ── Callout ──────────────────────────────────────────────────────────────── */
.note-callout { display: flex; gap: 12px; padding: 14px 16px; border-radius: 0 12px 12px 0; margin: 8px 0; border-left-width: 4px; border-left-style: solid; }
.note-callout-icon { font-size: 20px; flex-shrink: 0; cursor: pointer; }
.note-callout-content { flex: 1; outline: none; }
.note-callout[data-callout-type="info"]      { background: #E6F1FB; border-color: #185FA5; }
.note-callout[data-callout-type="success"]   { background: #D1FAE5; border-color: #1D9E75; }
.note-callout[data-callout-type="warning"]   { background: #FEF3C7; border-color: #F59E0B; }
.note-callout[data-callout-type="danger"]    { background: #FEE2E2; border-color: #D93025; }
.note-callout[data-callout-type="important"] { background: #FEF3C7; border-color: #D97706; }
.note-callout[data-callout-type="tip"]       { background: #D1FAE5; border-color: #059669; }
.note-callout[data-callout-type="quote"]     { background: #F3F4F6; border-color: #9CA3AF; font-style: italic; }
.dark .note-callout[data-callout-type="info"]      { background: rgba(24,95,165,0.12); }
.dark .note-callout[data-callout-type="success"]   { background: rgba(29,158,117,0.12); }
.dark .note-callout[data-callout-type="warning"]   { background: rgba(245,158,11,0.12); }
.dark .note-callout[data-callout-type="danger"]    { background: rgba(217,48,37,0.12); }
.dark .note-callout[data-callout-type="important"] { background: rgba(217,119,6,0.12); }
.dark .note-callout[data-callout-type="tip"]       { background: rgba(5,150,105,0.12); }
.dark .note-callout[data-callout-type="quote"]     { background: rgba(156,163,175,0.10); }

/* ── Toggle ───────────────────────────────────────────────────────────────── */
.note-toggle-header { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 8px; border-radius: 8px; user-select: none; }
.note-toggle-header:hover { background: rgba(24,95,165,0.04); }
.note-toggle-body { padding-left: 24px; border-left: 2px solid #D1DCE8; }
.dark .note-toggle-body { border-color: rgba(255,255,255,0.10); }

/* ── Video embed ──────────────────────────────────────────────────────────── */
.note-video-embed { margin: 8px 0; border-radius: 12px; overflow: hidden; background: #0D1117; }
.note-video-iframe { display: block; width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 12px; }

/* ── Highlight & selection ────────────────────────────────────────────────── */
mark { background: #FEF08A; border-radius: 2px; padding: 0 2px; }
.dark mark { background: rgba(254,240,138,0.3); }
.note-editor-content ::selection { background: rgba(24,95,165,0.15); }

/* ── Search highlights ────────────────────────────────────────────────────── */
.search-result { background: #FEF3C7; border-radius: 2px; }
.dark .search-result { background: rgba(254,243,199,0.25); }
.search-result-current { background: #F59E0B !important; color: white; border-radius: 2px; }

/* ── Block hover ──────────────────────────────────────────────────────────── */
.note-editor-content > * { position: relative; border-radius: 6px; transition: background 80ms; }
.note-editor-content > *:hover { background: rgba(24,95,165,0.02); }
.dark .note-editor-content > *:hover { background: rgba(24,95,165,0.04); }

/* ── Drag image drop target ───────────────────────────────────────────────── */
.note-editor.drag-image-over { outline: 2px dashed #185FA5; outline-offset: -3px; border-radius: 8px; }

/* ── Tag chips (#word) ────────────────────────────────────────────────────── */
.editor-tag {
  display: inline-flex; align-items: center;
  background: #E6F1FB; color: #185FA5;
  border-radius: 9999px; padding: 1px 8px;
  font-size: 0.9em; font-weight: 600; cursor: pointer;
  text-decoration: none; transition: background 150ms;
  line-height: 1.6;
}
.editor-tag:hover { background: #D4E8F8; }
.dark .editor-tag { background: rgba(24,95,165,0.20); color: #5B9FD4; }
.dark .editor-tag:hover { background: rgba(24,95,165,0.30); }

/* ── Wikilinks ([[Note Title]]) ───────────────────────────────────────────── */
.wikilink {
  display: inline; border-radius: 4px; padding: 1px 4px;
  font-size: 0.95em; cursor: pointer; transition: background 150ms;
}
.wikilink-resolved {
  color: #185FA5; background: rgba(24,95,165,0.08);
  text-decoration: underline; text-decoration-color: rgba(24,95,165,0.30);
  text-decoration-style: dotted;
}
.wikilink-resolved:hover { background: rgba(24,95,165,0.15); text-decoration-color: #185FA5; }
.wikilink-unresolved {
  color: #D93025; background: rgba(217,48,37,0.06);
  text-decoration: underline; text-decoration-style: dotted;
  text-decoration-color: rgba(217,48,37,0.40);
}
.wikilink-unresolved:hover { background: rgba(217,48,37,0.12); }
.dark .wikilink-resolved   { color: #5B9FD4; background: rgba(24,95,165,0.15); }
.dark .wikilink-unresolved { color: #F87171; background: rgba(217,48,37,0.10); }
`;
