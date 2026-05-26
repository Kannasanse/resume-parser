'use client';
import { useState, useEffect, Fragment } from 'react';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function IconChevron({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// ── Source label helper ───────────────────────────────────────────────────────

const SOURCE_LABELS = {
  manual: 'Manual',
  esco: 'ESCO',
  user_submitted: 'User Submitted',
};

function sourceLabel(src) {
  return SOURCE_LABELS[src] || src || '—';
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ col, sort, dir }) {
  if (sort !== col) return <span className="ml-1 text-[var(--c-border)]">↕</span>;
  return <span className="ml-1 text-[var(--c-primary)]">{dir === 'asc' ? '↑' : '↓'}</span>;
}

// ── Topics panel (lazy loaded per skill) ──────────────────────────────────────

function TopicsPanel({ skillId, skillName }) {
  const [topics, setTopics] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`/api/v1/admin/skills/${skillId}/topics`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!cancelled) setTopics(d.topics || []);
      } catch (e) {
        if (!cancelled) { setLoadError(e.message); setTopics([]); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [skillId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setAddError('');
    try {
      const r = await fetch(`/api/v1/admin/skills/${skillId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setTopics(prev => [...(prev || []), d.topic]);
      setNewName('');
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (topicId) => {
    try {
      const r = await fetch(`/api/v1/admin/skills/${skillId}/topics/${topicId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setTopics(prev => prev.filter(t => t.id !== topicId));
    } catch {
      // silently fail
    }
  };

  if (topics === null) {
    return (
      <div className="flex gap-1.5 flex-wrap py-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ds-skel h-5 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Topic chips */}
      <div className="flex flex-wrap gap-1.5">
        {topics.length === 0 && (
          <span className="text-xs text-[var(--c-text-muted)] italic">No topics yet — add the first one below.</span>
        )}
        {topics.map(t => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--c-primary)]/10 text-[var(--c-primary)] border border-[var(--c-primary)]/20 font-medium"
          >
            {t.name}
            <button
              onClick={() => handleDelete(t.id)}
              title={`Remove "${t.name}"`}
              className="ml-0.5 text-[var(--c-primary)]/60 hover:text-red-500 transition-colors leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add topic form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={newName}
          onChange={e => { setNewName(e.target.value); setAddError(''); }}
          placeholder={`Add topic under ${skillName}…`}
          className="flex-1 max-w-xs px-2.5 py-1 text-xs border border-[var(--c-border)] rounded-lg bg-white dark:bg-[#0D1830] text-[var(--c-text)] focus:outline-none focus:ring-1 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)]"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--c-primary)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          <IconPlus /> Add
        </button>
        {addError && <span className="text-xs text-red-500">{addError}</span>}
      </form>
    </div>
  );
}

// ── SkillsTable ───────────────────────────────────────────────────────────────

export default function SkillsTable({
  skills,
  loading,
  total,
  page,
  limit,
  sort,
  dir,
  onSort,
  onPageChange,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const COLS = [
    { key: 'expand',   label: '',         sortable: false, width: 36 },
    { key: 'name',     label: 'Name',     sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'status',   label: 'Status',   sortable: false },
    { key: 'source',   label: 'Source',   sortable: true },
    { key: 'usage',    label: 'Usage',    sortable: false },
    { key: 'actions',  label: '',         sortable: false },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--c-border)] bg-[var(--ds-bg,#f9fafb)]">
              {COLS.map(col => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`text-left px-4 py-3 text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide whitespace-nowrap select-none ${col.sortable ? 'cursor-pointer hover:text-[var(--c-text)]' : ''}`}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} sort={sort} dir={dir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-border)]">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="ds-skel h-4 w-4 rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="ds-skel h-4 w-32 rounded mb-1" />
                      <div className="ds-skel h-3 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3"><div className="ds-skel h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="ds-skel h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="ds-skel h-4 w-20 rounded" /></td>
                    <td className="px-4 py-3"><div className="ds-skel h-4 w-28 rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="ds-skel h-7 w-7 rounded" />
                        <div className="ds-skel h-7 w-7 rounded" />
                        <div className="ds-skel h-7 w-7 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              : skills.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--c-text-muted)]">
                      No skills found.
                    </td>
                  </tr>
                )
                : skills.map(skill => {
                    const isOpen = expanded.has(skill.id);
                    const aliases = skill.aliases || [];
                    const shownAliases = aliases.slice(0, 3);
                    const extraAliases = aliases.length - 3;

                    return (
                      <Fragment key={skill.id}>
                        <tr className="hover:bg-[var(--ds-bg,#f9fafb)]/50 transition-colors">

                          {/* Expand toggle */}
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => toggleExpand(skill.id)}
                              title={isOpen ? 'Collapse topics' : 'Show topics'}
                              className="p-1 rounded text-[var(--c-text-muted)] hover:text-[var(--c-primary)] hover:bg-[var(--c-primary)]/10 transition-colors"
                            >
                              <IconChevron open={isOpen} />
                            </button>
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-[var(--c-text)]">{skill.name}</span>
                            {shownAliases.length > 0 && (
                              <div className="text-[11px] text-[var(--c-text-muted)] mt-0.5">
                                {shownAliases.join(' · ')}
                                {extraAliases > 0 && (
                                  <span className="ml-1">+{extraAliases} more</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            {skill.category_name || skill.category ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--ds-bg,#f3f4f6)] border border-[var(--c-border)] text-[var(--c-text-muted)] font-medium">
                                {skill.category_name ?? skill.category}
                              </span>
                            ) : (
                              <span className="text-[var(--c-text-muted)]">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {skill.is_active ? (
                                <span className="chip-success text-xs px-2 py-0.5 rounded-full font-medium">
                                  Active
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-[#8BA3C1] border border-gray-200 dark:border-white/10 font-medium">
                                  Inactive
                                </span>
                              )}
                              {skill.is_trending && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 font-medium">
                                  Trending
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Source */}
                          <td className="px-4 py-3 text-[var(--c-text-muted)] text-xs">
                            {sourceLabel(skill.source)}
                          </td>

                          {/* Usage */}
                          <td className="px-4 py-3">
                            <div className="text-xs text-[var(--c-text-muted)] whitespace-nowrap">
                              {(skill.selection_count ?? 0).toLocaleString()} selections
                              <span className="mx-1">·</span>
                              {(skill.search_count ?? 0).toLocaleString()} searches
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onEdit(skill)}
                                title="Edit skill"
                                className="p-1.5 rounded text-[var(--c-text-muted)] hover:text-[var(--c-primary)] hover:bg-[var(--c-primary)]/10 transition-colors"
                              >
                                <IconEdit />
                              </button>
                              <button
                                onClick={() => onToggleActive(skill)}
                                title={skill.is_active ? 'Deactivate' : 'Activate'}
                                className={`p-1.5 rounded transition-colors ${
                                  skill.is_active
                                    ? 'text-[var(--c-text-muted)] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                    : 'text-[var(--c-text-muted)] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                                }`}
                              >
                                {skill.is_active ? <IconEyeOff /> : <IconEye />}
                              </button>
                              <button
                                onClick={() => onDelete(skill)}
                                title="Delete skill"
                                className="p-1.5 rounded text-[var(--c-text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Topics expansion row */}
                        {isOpen && (
                          <tr className="bg-[var(--c-primary)]/[0.03] dark:bg-[var(--c-primary)]/[0.06]">
                            <td />
                            <td colSpan={6} className="px-4 pb-4 pt-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-text-muted)] mb-2">
                                Topics under {skill.name}
                              </p>
                              <TopicsPanel skillId={skill.id} skillName={skill.name} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="px-4 py-3 border-t border-[var(--c-border)] flex items-center justify-between text-xs text-[var(--c-text-muted)]">
          <span>
            {total === 0
              ? 'No results'
              : `Showing ${startItem}–${endItem} of ${total.toLocaleString()}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-[var(--c-text)] disabled:opacity-40 hover:bg-[var(--ds-bg,#f3f4f6)] dark:hover:bg-[#0D1830] transition-colors disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-[var(--c-text)] disabled:opacity-40 hover:bg-[var(--ds-bg,#f3f4f6)] dark:hover:bg-[#0D1830] transition-colors disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
