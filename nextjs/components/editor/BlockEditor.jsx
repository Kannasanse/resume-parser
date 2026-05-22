'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import CharacterCount from '@tiptap/extension-character-count';
import { createLowlight, common } from 'lowlight';

import { CalloutExtension } from './extensions/CalloutNode';
import { ToggleExtension } from './extensions/ToggleNode';
import NoteBubbleMenu from './NoteBubbleMenu';
import NoteSlashMenu from './NoteSlashMenu';

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

export default function BlockEditor({
  content,
  onChange,
  placeholder,
  autoFocus = false,
  readOnly = false,
  className,
}) {
  const debounceTimer = useRef(null);
  const onChangeRef = useRef(onChange);

  // Keep ref fresh so the debounced callback always uses latest onChange
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
      StarterKit.configure({ codeBlock: false }),
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
    ],

    editorProps: {
      attributes: {
        class: 'note-editor-content outline-none min-h-[300px]',
      },
    },

    editable: !readOnly,
    autofocus: autoFocus ? 'end' : false,
    content: isValidDoc(content) ? content : undefined,
    onUpdate: handleUpdate,
  });

  // Sync external content changes when editor is not focused
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.isFocused) return;
    if (!isValidDoc(content)) return;

    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(content)) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Sync readOnly prop
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  return (
    <>
      <style>{EDITOR_STYLES}</style>
      <div className={`note-editor ${className || ''}`}>
        <EditorContent editor={editor} />
        {editor && !readOnly && <NoteBubbleMenu editor={editor} />}
        {editor && !readOnly && <NoteSlashMenu editor={editor} />}
      </div>
    </>
  );
}

const EDITOR_STYLES = `
.note-editor-content h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; margin-top: 32px; margin-bottom: 8px; }
.note-editor-content h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-top: 24px; margin-bottom: 6px; }
.note-editor-content h3 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin-top: 20px; margin-bottom: 4px; }
.note-editor-content p { line-height: 1.75; margin: 2px 0; }
.note-editor-content ul { list-style-type: disc; padding-left: 20px; }
.note-editor-content ol { list-style-type: decimal; padding-left: 20px; }
.note-editor-content li { margin: 2px 0; }
.note-editor-content blockquote { border-left: 4px solid #185FA5; padding-left: 16px; margin: 8px 0; font-style: italic; color: #6B7280; background: rgba(24,95,165,0.04); border-radius: 0 8px 8px 0; }
.dark .note-editor-content blockquote { color: #8BA3C1; background: rgba(24,95,165,0.08); }
.note-editor-content hr { border: none; height: 1px; background: linear-gradient(90deg, transparent, #D1DCE8, transparent); margin: 24px 0; }
.dark .note-editor-content hr { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent); }
.note-editor-content code { background: #F1F5F9; color: #185FA5; border-radius: 4px; padding: 2px 6px; font-family: monospace; font-size: 0.9em; }
.dark .note-editor-content code { background: rgba(255,255,255,0.10); color: #5B9FD4; }
.note-editor-content pre { background: #1E293B; border-radius: 12px; padding: 16px 20px; color: #F1F5F9; overflow-x: auto; }
.note-editor-content pre code { background: none; color: inherit; padding: 0; }
.note-editor-content a { color: #185FA5; text-decoration: underline; }
.dark .note-editor-content a { color: #5B9FD4; }
.note-editor-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
.note-editor-content td, .note-editor-content th { border: 1px solid #D1DCE8; padding: 8px 12px; }
.dark .note-editor-content td, .dark .note-editor-content th { border-color: rgba(255,255,255,0.10); }
.note-editor-content th { background: #F4F8FC; font-weight: 600; }
.dark .note-editor-content th { background: #0D1830; }
.note-editor-content ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.note-editor-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; }
.note-editor-content ul[data-type="taskList"] li label { cursor: pointer; margin-top: 2px; }
.note-editor-content ul[data-type="taskList"] input[type="checkbox"] { width: 16px; height: 16px; border-radius: 4px; cursor: pointer; accent-color: #185FA5; }
.note-editor-content p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #D1DCE8; pointer-events: none; float: left; height: 0; }
.dark .note-editor-content p.is-editor-empty:first-child::before { color: #4A6380; }
/* Callout node */
.note-callout { display: flex; gap: 12px; padding: 14px 16px; border-radius: 0 12px 12px 0; margin: 8px 0; border-left-width: 4px; border-left-style: solid; }
.note-callout-icon { font-size: 20px; flex-shrink: 0; cursor: pointer; }
.note-callout-content { flex: 1; outline: none; }
.note-callout[data-callout-type="info"] { background: #E6F1FB; border-color: #185FA5; }
.note-callout[data-callout-type="success"] { background: #D1FAE5; border-color: #1D9E75; }
.note-callout[data-callout-type="warning"] { background: #FEF3C7; border-color: #F59E0B; }
.note-callout[data-callout-type="danger"] { background: #FEE2E2; border-color: #D93025; }
.dark .note-callout[data-callout-type="info"] { background: rgba(24,95,165,0.12); }
.dark .note-callout[data-callout-type="success"] { background: rgba(29,158,117,0.12); }
.dark .note-callout[data-callout-type="warning"] { background: rgba(245,158,11,0.12); }
.dark .note-callout[data-callout-type="danger"] { background: rgba(217,48,37,0.12); }
/* Toggle node */
.note-toggle-header { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 8px; border-radius: 8px; user-select: none; }
.note-toggle-header:hover { background: rgba(24,95,165,0.04); }
.note-toggle-body { padding-left: 24px; border-left: 2px solid #D1DCE8; }
.dark .note-toggle-body { border-color: rgba(255,255,255,0.10); }
/* Highlight */
mark { background: #FEF08A; border-radius: 2px; padding: 0 2px; }
.dark mark { background: rgba(254,240,138,0.3); }
/* Selection */
.note-editor-content ::selection { background: rgba(24,95,165,0.15); }
/* Placeholder for non-first empty paragraphs */
.note-editor-content .is-empty::before { content: attr(data-placeholder); color: #D1DCE8; pointer-events: none; float: left; height: 0; }
.dark .note-editor-content .is-empty::before { color: #4A6380; }
`;
