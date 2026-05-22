'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const BLOCKS = [
  {
    id: 'paragraph',
    label: 'Text',
    desc: 'Plain paragraph',
    icon: '¶',
    group: 'BASIC',
    action: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: 'h1',
    label: 'Heading 1',
    desc: 'Large section heading',
    icon: 'H1',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    desc: 'Medium section heading',
    icon: 'H2',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    desc: 'Small section heading',
    icon: 'H3',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet',
    label: 'Bulleted List',
    desc: 'Create a simple list',
    icon: '•',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    desc: 'Create a numbered list',
    icon: '1.',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'todo',
    label: 'To-do',
    desc: 'Track tasks with checkboxes',
    icon: '☑',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'quote',
    label: 'Quote',
    desc: 'Highlight a quotation',
    icon: '"',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    desc: 'Visual section separator',
    icon: '—',
    group: 'BASIC',
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    id: 'code',
    label: 'Code Block',
    desc: 'Display code with syntax highlighting',
    icon: '<>',
    group: 'BASIC',
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'callout-info',
    label: 'Callout',
    desc: 'Highlight important info',
    icon: '💡',
    group: 'ADVANCED',
    action: (e) => e.chain().focus().insertCallout({ type: 'info' }).run(),
  },
  {
    id: 'callout-warning',
    label: 'Warning',
    desc: 'Highlight a warning',
    icon: '⚠️',
    group: 'ADVANCED',
    action: (e) => e.chain().focus().insertCallout({ type: 'warning' }).run(),
  },
  {
    id: 'toggle',
    label: 'Toggle',
    desc: 'Collapsible content block',
    icon: '▶',
    group: 'ADVANCED',
    action: (e) => e.chain().focus().insertToggle().run(),
  },
  {
    id: 'table',
    label: 'Table',
    desc: 'Insert a table',
    icon: '⊞',
    group: 'ADVANCED',
    action: (e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'image',
    label: 'Image',
    desc: 'Insert an image by URL',
    icon: '🖼',
    group: 'MEDIA',
    action: (e) => {
      const url = window.prompt('Image URL');
      if (url) e.chain().focus().setImage({ src: url }).run();
    },
  },
  {
    id: 'subpage',
    label: 'Sub-page',
    desc: 'Create a nested note inside this one',
    icon: '📄',
    group: 'PAGES',
    action: (_e, { onCreateSubpage }) => {
      onCreateSubpage?.();
    },
  },
];

const GROUPS = ['BASIC', 'ADVANCED', 'MEDIA', 'PAGES'];

export default function NoteSlashMenu({ editor, onCreateSubpage }) {
  const [slashState, setSlashState] = useState({ open: false, query: '', from: 0 });
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // ── Detect slash trigger on editor update ────────────────────────────────
  useEffect(() => {
    if (!editor) return;

    const handler = ({ editor: e }) => {
      const { selection } = e.state;
      const { $from } = selection;

      if ($from.parent.type.name === 'paragraph') {
        const text = $from.parent.textContent;
        if (text.startsWith('/')) {
          const query = text.slice(1);
          const from = $from.start();

          // Get cursor coordinates
          try {
            const domPos = e.view.coordsAtPos($from.pos);
            setCoords({ top: domPos.bottom, left: domPos.left });
          } catch (_) {
            // ignore coord errors
          }

          setSlashState({ open: true, query, from });
          setSelectedIndex(0);
          return;
        }
      }

      setSlashState({ open: false, query: '', from: 0 });
    };

    editor.on('update', handler);
    return () => editor.off('update', handler);
  }, [editor]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!slashState.open) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setSlashState({ open: false, query: '', from: 0 });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [slashState.open]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (!slashState.open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashState({ open: false, query: '', from: 0 });
        editor?.commands.focus();
        return;
      }

      const filtered = getFiltered(slashState.query);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          insertBlock(filtered[selectedIndex]);
        }
      }
    },
    [slashState, selectedIndex, editor]
  );

  useEffect(() => {
    if (!slashState.open) return;
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [slashState.open, handleKeyDown]);

  // ── Filter helpers ────────────────────────────────────────────────────────
  function getFiltered(query) {
    if (!query) return BLOCKS;
    const q = query.toLowerCase();
    return BLOCKS.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
    );
  }

  // ── Insert block ──────────────────────────────────────────────────────────
  function insertBlock(block) {
    if (!editor) return;

    const { from, query } = slashState;

    setSlashState({ open: false, query: '', from: 0 });

    const deleteFrom = from - 1;
    const deleteTo = from + query.length;

    editor
      .chain()
      .focus()
      .deleteRange({ from: deleteFrom, to: deleteTo })
      .run();

    block.action(editor, { onCreateSubpage });
  }

  if (!slashState.open) return null;

  const filtered = getFiltered(slashState.query);

  // Group filtered results
  const groupedFiltered = GROUPS.map((g) => ({
    group: g,
    items: filtered.filter((b) => b.group === g),
  })).filter((g) => g.items.length > 0);

  // Flat index for keyboard nav
  let flatIdx = 0;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: coords.top + 4,
        left: coords.left,
        zIndex: 1000,
      }}
      className="bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-xl shadow-xl w-72 max-h-80 overflow-y-auto py-2"
    >
      {/* Query display / filter hint */}
      {slashState.query.length > 0 && filtered.length === 0 && (
        <p className="text-xs text-[#9CA3AF] dark:text-[#4A6380] px-3 py-2">
          No blocks match &ldquo;{slashState.query}&rdquo;
        </p>
      )}

      {groupedFiltered.map(({ group, items }) => (
        <div key={group}>
          <p className="text-[10px] font-semibold text-[#9CA3AF] dark:text-[#4A6380] uppercase tracking-widest px-3 py-1 mt-1">
            {group}
          </p>
          {items.map((block) => {
            const currentIdx = flatIdx++;
            const isSelected = currentIdx === selectedIndex;
            return (
              <button
                key={block.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertBlock(block);
                }}
                onMouseEnter={() => setSelectedIndex(currentIdx)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg mx-0 transition-colors
                  ${isSelected
                    ? 'bg-[rgba(24,95,165,0.08)] dark:bg-[rgba(24,95,165,0.15)]'
                    : 'hover:bg-[rgba(24,95,165,0.04)] dark:hover:bg-[rgba(24,95,165,0.08)]'
                  }`}
              >
                <span className="w-8 h-8 flex items-center justify-center text-base bg-[#F4F8FC] dark:bg-[#0D1830] rounded-lg flex-shrink-0 font-mono">
                  {block.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] leading-tight">
                    {block.label}
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] leading-tight truncate">
                    {block.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
