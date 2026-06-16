'use client';
import { useState, useEffect, useCallback } from 'react';
import NoteListItem from './NoteListItem';
import NoteContextMenu from './NoteContextMenu';

function SectionLabel({ children }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#4A6380] select-none">
      {children}
    </p>
  );
}

// Build a { id -> { ...note, children: [] } } map and return root nodes
function buildTree(notes) {
  const map = {};
  notes.forEach(n => { map[n.id] = { ...n, children: [] }; });
  const roots = [];
  notes.forEach(n => {
    if (n.parent_id && map[n.parent_id]) {
      map[n.parent_id].children.push(map[n.id]);
    } else {
      roots.push(map[n.id]);
    }
  });
  return { map, roots };
}

function TagDot({ color }) {
  return (
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color || '#185FA5', display: 'inline-block', flexShrink: 0 }} />
  );
}

export default function NotesSidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onNoteAction,
  search,
  onSearchChange,
  onOpenSearch,
  tagFilter,
  onTagFilter,
  loading,
  collapsed,
  onToggleCollapse,
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [menuState, setMenuState] = useState(null); // { noteId }
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [tagDefs, setTagDefs] = useState([]);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  useEffect(() => {
    fetch('/api/v1/notes/tags')
      .then(r => r.json())
      .then(d => setTagDefs(Array.isArray(d.tags) ? d.tags.slice(0, 12) : []))
      .catch(() => {});
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  function handleMenuAction(action, noteId) {
    if (action === 'menu') {
      setMenuState(prev => (prev?.noteId === noteId ? null : { noteId }));
    } else {
      onNoteAction(noteId, action);
      setMenuState(null);
    }
  }

  const isSearching = search.trim().length > 0;

  // Flat search results
  const searchFiltered = isSearching
    ? notes.filter(
        n =>
          !n.is_archived &&
          (n.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Tree from non-archived notes, optionally filtered by tag
  const nonArchived = notes.filter(n => {
    if (n.is_archived) return false;
    if (tagFilter) return n.tags?.includes(tagFilter);
    return true;
  });
  const { map, roots } = buildTree(nonArchived);
  const pinned = roots.filter(n => n.is_pinned);
  const regular = roots.filter(n => !n.is_pinned);
  const archived = notes.filter(n => n.is_archived);

  function renderNote(note, depth = 0) {
    const nodeData = map[note.id] ?? note;
    const hasChildren = nodeData.children?.length > 0;
    const isExpanded = expandedIds.has(note.id);
    const menuNote = notes.find(n => n.id === note.id) ?? note;

    return (
      <div key={note.id}>
        <div className="relative">
          <NoteListItem
            note={note}
            isSelected={selectedNoteId === note.id}
            depth={depth}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleExpand(note.id)}
            onClick={() => { onSelectNote(note.id); setMenuState(null); }}
            onAction={handleMenuAction}
          />
          {menuState?.noteId === note.id && (
            <NoteContextMenu
              noteId={note.id}
              note={menuNote}
              onAction={(action, id) => { onNoteAction(id, action); setMenuState(null); }}
              onClose={() => setMenuState(null)}
            />
          )}
        </div>
        {hasChildren && isExpanded && nodeData.children.map(child => renderNote(child, depth + 1))}
      </div>
    );
  }

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const kbdHint = isMac ? '⌘K' : 'Ctrl+K';

  const sidebarContent = (
    <div className="w-[280px] flex-shrink-0 flex flex-col h-full bg-[#FAFBFC] dark:bg-[#0D1830] border-r border-[#D1DCE8] dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="w-6 h-6 flex items-center justify-center rounded-lg text-[#9CA3AF] dark:text-[#4A6380] hover:bg-[rgba(24,95,165,0.08)] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="6.25" width="7" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="10.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
          <h2 className="text-lg font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">Notes</h2>
        </div>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-1 text-xs bg-[#185FA5] text-white px-3 py-1.5 rounded-[10px] font-semibold hover:bg-[#1454a0] transition-colors"
        >
          <span className="text-base leading-none">+</span> New note
        </button>
      </div>

      {/* Search — click opens full search modal */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#9CA3AF] dark:text-[#4A6380] hover:border-[#185FA5] hover:text-[#6B7280] transition-colors text-left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <span className="flex-1">Search notes…</span>
          <span className="text-[10px] font-mono bg-[#F4F8FC] dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10 rounded px-1 py-0.5 flex-shrink-0">
            {kbdHint}
          </span>
        </button>
      </div>

      {/* Tag filter indicator */}
      {tagFilter && (
        <div className="px-3 pb-2 flex items-center gap-1.5">
          <span className="text-xs text-[#185FA5] dark:text-[#5B9FD4] font-semibold">#{tagFilter}</span>
          <button
            onClick={() => onTagFilter?.(null)}
            className="text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors"
            title="Clear tag filter"
          >×</button>
        </div>
      )}

      {/* Note list — scrollable */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="flex flex-col gap-2 px-1 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-[10px] bg-[#E8EFF7] dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : isSearching ? (
          /* Flat search results */
          <>
            {searchFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 pt-10 text-center px-4">
                <span className="text-3xl">🔍</span>
                <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1]">No notes match your search</p>
              </div>
            ) : (
              searchFiltered.map(n => renderNote(n, 0))
            )}
          </>
        ) : (
          /* Tree view */
          <>
            {pinned.length > 0 && (
              <>
                <SectionLabel>Pinned</SectionLabel>
                {pinned.map(n => renderNote(n, 0))}
              </>
            )}
            {regular.length > 0 && (
              <>
                {pinned.length > 0 && <SectionLabel>Notes</SectionLabel>}
                {regular.map(n => renderNote(n, 0))}
              </>
            )}
            {pinned.length === 0 && regular.length === 0 && archived.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 pt-10 text-center px-4">
                <span className="text-3xl">📝</span>
                <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1]">No notes yet</p>
              </div>
            )}

            {/* Archived section */}
            {archived.length > 0 && (
              <>
                <button
                  onClick={() => setShowArchived(v => !v)}
                  className="w-full flex items-center gap-1.5 px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#6B7280] dark:hover:text-[#8BA3C1] transition-colors select-none"
                >
                  <span className={`transition-transform ${showArchived ? 'rotate-90' : ''}`}>▶</span>
                  Archived ({archived.length})
                </button>
                {showArchived && archived.map(n => renderNote(n, 0))}
              </>
            )}
          </>
        )}
      </div>

      {/* Tags index */}
      {tagDefs.length > 0 && (
        <div className="flex-shrink-0 border-t border-[#D1DCE8] dark:border-white/10 px-2 py-2">
          <button
            onClick={() => setTagsExpanded(v => !v)}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#6B7280] dark:hover:text-[#8BA3C1] transition-colors select-none"
          >
            <span className={`transition-transform text-[8px] ${tagsExpanded ? 'rotate-90' : ''}`}>▶</span>
            Tags
          </button>
          {tagsExpanded && (
            <div className="flex flex-wrap gap-1.5 px-2 pb-1 pt-1">
              {tagDefs.map(tag => (
                <button
                  key={tag.slug}
                  onClick={() => onTagFilter?.(tagFilter === tag.slug ? null : tag.slug)}
                  className="flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 transition-all"
                  style={{
                    background: tagFilter === tag.slug ? (tag.color || '#185FA5') : `${tag.color || '#185FA5'}1A`,
                    color: tagFilter === tag.slug ? 'white' : (tag.color || '#185FA5'),
                    border: `1px solid ${tag.color || '#185FA5'}40`,
                  }}
                >
                  <TagDot color={tagFilter === tag.slug ? 'white' : (tag.color || '#185FA5')} />
                  #{tag.slug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return sidebarContent;
}
