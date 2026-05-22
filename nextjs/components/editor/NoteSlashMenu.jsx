'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const BLOCKS = [
  { id: 'paragraph',      label: 'Text',          desc: 'Plain paragraph',                    icon: '¶',  group: 'BASIC',    shortcut: 'Enter',      action: (e) => e.chain().focus().setParagraph().run() },
  { id: 'h1',             label: 'Heading 1',     desc: 'Large section heading',              icon: 'H1', group: 'BASIC',    shortcut: '# + Space',  action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2',             label: 'Heading 2',     desc: 'Medium section heading',             icon: 'H2', group: 'BASIC',    shortcut: '## + Space', action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3',             label: 'Heading 3',     desc: 'Small section heading',              icon: 'H3', group: 'BASIC',    shortcut: '### + Space',action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet',         label: 'Bulleted List', desc: 'Create a simple list',              icon: '•',  group: 'BASIC',    shortcut: '- + Space',  action: (e) => e.chain().focus().toggleBulletList().run() },
  { id: 'numbered',       label: 'Numbered List', desc: 'Create a numbered list',            icon: '1.', group: 'BASIC',    shortcut: '1. + Space', action: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: 'todo',           label: 'To-do',         desc: 'Track tasks with checkboxes',       icon: '☑',  group: 'BASIC',    shortcut: '[] + Space', action: (e) => e.chain().focus().toggleTaskList().run() },
  { id: 'quote',          label: 'Quote',         desc: 'Highlight a quotation',             icon: '"',  group: 'BASIC',    shortcut: '> + Space',  action: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: 'divider',        label: 'Divider',       desc: 'Visual section separator',          icon: '—',  group: 'BASIC',                             action: (e) => e.chain().focus().setHorizontalRule().run() },
  { id: 'code',           label: 'Code Block',    desc: 'Display code with highlighting',    icon: '<>', group: 'BASIC',    shortcut: '``` + Enter', action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: 'callout-info',   label: 'Callout',       desc: 'Highlight important info',          icon: '💡', group: 'ADVANCED',                           action: (e) => e.chain().focus().insertCallout({ type: 'info' }).run() },
  { id: 'callout-warning',label: 'Warning',       desc: 'Highlight a warning',               icon: '⚠️', group: 'ADVANCED',                           action: (e) => e.chain().focus().insertCallout({ type: 'warning' }).run() },
  { id: 'toggle',         label: 'Toggle',        desc: 'Collapsible content block',         icon: '▶', group: 'ADVANCED',                           action: (e) => e.chain().focus().insertToggle().run() },
  { id: 'table',          label: 'Table',         desc: 'Insert a table',                    icon: '⊞', group: 'ADVANCED',                           action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { id: 'image',          label: 'Image',         desc: 'Insert an image by URL',            icon: '🖼', group: 'MEDIA',                              action: (e) => { const url = window.prompt('Image URL'); if (url) e.chain().focus().setImage({ src: url }).run(); } },
  { id: 'subpage',        label: 'Sub-page',      desc: 'Create a nested note inside this',  icon: '📄', group: 'PAGES',                              action: (_e, { onCreateSubpage }) => { onCreateSubpage?.(); } },
];

const GROUPS = ['BASIC', 'ADVANCED', 'MEDIA', 'PAGES'];

const RECENT_KEY = 'editor_recent_blocks';
const MAX_RECENT = 3;

function getRecentIds() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []; } catch { return []; }
}
function saveRecentId(id) {
  try {
    const ids = [id, ...getRecentIds().filter(r => r !== id)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {}
}

export default function NoteSlashMenu({ editor, onCreateSubpage }) {
  const [slashState, setSlashState] = useState({ open: false, query: '', from: 0 });
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState([]);
  const menuRef = useRef(null);

  // Load recent blocks when menu opens
  useEffect(() => {
    if (slashState.open) setRecentIds(getRecentIds());
  }, [slashState.open]);

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
      const recentBlks = slashState.query ? [] : getRecentIds().map(id => BLOCKS.find(b => b.id === id)).filter(Boolean);
      const recentSet = new Set(recentBlks.map(b => b.id));
      const flat = [...recentBlks, ...filtered.filter(b => !recentSet.has(b.id))];

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flat.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (flat[selectedIndex]) {
          insertBlock(flat[selectedIndex]);
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
    saveRecentId(block.id);

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

  // Recent blocks — shown only when no query is typed
  const recentBlocks = slashState.query
    ? []
    : recentIds.map(id => BLOCKS.find(b => b.id === id)).filter(Boolean);

  // Group filtered results (exclude items shown in recent)
  const recentSet = new Set(recentBlocks.map(b => b.id));
  const groupedFiltered = GROUPS.map((g) => ({
    group: g,
    items: filtered.filter((b) => b.group === g && !recentSet.has(b.id)),
  })).filter((g) => g.items.length > 0);

  // Flat list for keyboard nav (recent first, then groups)
  const flatList = [...recentBlocks, ...groupedFiltered.flatMap(g => g.items)];

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: coords.top + 4, left: coords.left, zIndex: 1000 }}
      className="bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-xl shadow-xl w-72 max-h-80 overflow-y-auto py-2"
    >
      {slashState.query.length > 0 && filtered.length === 0 && (
        <p className="text-xs text-[#9CA3AF] dark:text-[#4A6380] px-3 py-2">
          No blocks match &ldquo;{slashState.query}&rdquo;
        </p>
      )}

      {/* Recently used section */}
      {recentBlocks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#9CA3AF] dark:text-[#4A6380] uppercase tracking-widest px-3 py-1 mt-1">
            Recently used
          </p>
          {recentBlocks.map((block) => {
            const currentIdx = flatList.indexOf(block);
            const isSelected = currentIdx === selectedIndex;
            return <BlockItem key={block.id} block={block} isSelected={isSelected} onInsert={() => insertBlock(block)} onHover={() => setSelectedIndex(currentIdx)} />;
          })}
        </div>
      )}

      {groupedFiltered.map(({ group, items }) => (
        <div key={group}>
          <p className="text-[10px] font-semibold text-[#9CA3AF] dark:text-[#4A6380] uppercase tracking-widest px-3 py-1 mt-1">
            {group}
          </p>
          {items.map((block) => {
            const currentIdx = flatList.indexOf(block);
            const isSelected = currentIdx === selectedIndex;
            return <BlockItem key={block.id} block={block} isSelected={isSelected} onInsert={() => insertBlock(block)} onHover={() => setSelectedIndex(currentIdx)} />;
          })}
        </div>
      ))}
    </div>
  );
}

function BlockItem({ block, isSelected, onInsert, onHover }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onInsert(); }}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors
        ${isSelected
          ? 'bg-[rgba(24,95,165,0.08)] dark:bg-[rgba(24,95,165,0.15)]'
          : 'hover:bg-[rgba(24,95,165,0.04)] dark:hover:bg-[rgba(24,95,165,0.08)]'
        }`}
    >
      <span className="w-8 h-8 flex items-center justify-center text-base bg-[#F4F8FC] dark:bg-[#0D1830] rounded-lg flex-shrink-0 font-mono">
        {block.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] leading-tight">
          {block.label}
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] leading-tight truncate">
          {block.desc}
        </p>
      </div>
      {block.shortcut && (
        <span className="text-[10px] font-mono text-[#9CA3AF] dark:text-[#4A6380] bg-[#F4F8FC] dark:bg-[#0D1830] px-1.5 py-0.5 rounded border border-[#D1DCE8] dark:border-white/10 whitespace-nowrap flex-shrink-0">
          {block.shortcut}
        </span>
      )}
    </button>
  );
}
