'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useRef } from 'react';

// ── Toolbar icons ─────────────────────────────────────────────────────────────

function TbBtn({ active, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-[13px]
        ${active
          ? 'bg-primary text-white'
          : 'text-ds-text hover:bg-ds-bg'
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-ds-border mx-0.5 flex-shrink-0" />;
}

function Toolbar({ editor }) {
  if (!editor) return null;

  const align = editor.getAttributes('paragraph')?.textAlign || 'left';

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-ds-border flex-wrap">
      {/* Bold */}
      <TbBtn active={editor.isActive('bold')} title="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
      </TbBtn>

      {/* Italic */}
      <TbBtn active={editor.isActive('italic')} title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </TbBtn>

      {/* Underline */}
      <TbBtn active={editor.isActive('underline')} title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
      </TbBtn>

      <Divider />

      {/* Bullet list */}
      <TbBtn active={editor.isActive('bulletList')} title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
      </TbBtn>

      {/* Link */}
      <TbBtn active={editor.isActive('link')} title="Link" onClick={() => {
        if (editor.isActive('link')) {
          editor.chain().focus().unsetLink().run();
        } else {
          const url = window.prompt('URL');
          if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
        }
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </TbBtn>

      <Divider />

      {/* Align left */}
      <TbBtn active={align === 'left'} title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
      </TbBtn>

      {/* Align center */}
      <TbBtn active={align === 'center'} title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </TbBtn>

      {/* Align right */}
      <TbBtn active={align === 'right'} title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
      </TbBtn>

      {/* Align justify */}
      <TbBtn active={align === 'justify'} title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </TbBtn>
    </div>
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────

export default function RichTextEditor({ value, onChange, placeholder }) {
  const isFocused = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[80px] px-3 py-2 text-[13px] leading-relaxed text-ds-text prose-rte',
      },
    },
    onFocus: () => { isFocused.current = true; },
    onBlur: ({ editor }) => {
      isFocused.current = false;
      // Flush final value on blur so parent always has the latest
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html);
    },
    onUpdate: ({ editor }) => {
      if (!isFocused.current) return;
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html);
    },
  });

  // Only sync external value when the editor is not focused (e.g. switching entries)
  useEffect(() => {
    if (!editor || isFocused.current) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if ((value || '') !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="border border-ds-inputBorder rounded-[7px] bg-ds-card focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10 transition-colors overflow-hidden">
      <Toolbar editor={editor} />
      <div className="relative">
        {editor?.isEmpty && placeholder && (
          <div className="absolute top-2 left-3 text-[13px] text-ds-textMuted pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
      {/* Reset default bullet styles that Tailwind removes */}
      <style>{`
        .prose-rte ul { list-style-type: disc; padding-left: 1.25em; margin: 0.25em 0; }
        .prose-rte ol { list-style-type: decimal; padding-left: 1.25em; margin: 0.25em 0; }
        .prose-rte li { display: list-item; }
        .prose-rte p { margin: 0; }
        .prose-rte p + p { margin-top: 0.25em; }
        .prose-rte a { color: #185FA5; text-decoration: underline; }
      `}</style>
    </div>
  );
}
