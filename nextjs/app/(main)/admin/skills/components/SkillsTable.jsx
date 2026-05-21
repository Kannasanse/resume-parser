'use client';

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
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const COLS = [
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
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--c-text-muted)]">
                      No skills found.
                    </td>
                  </tr>
                )
                : skills.map(skill => {
                    const aliases = skill.aliases || [];
                    const shownAliases = aliases.slice(0, 3);
                    const extraAliases = aliases.length - 3;

                    return (
                      <tr key={skill.id} className="hover:bg-[var(--ds-bg,#f9fafb)]/50 transition-colors">

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
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                                Inactive
                              </span>
                            )}
                            {skill.is_trending && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
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
                            {/* Edit */}
                            <button
                              onClick={() => onEdit(skill)}
                              title="Edit skill"
                              className="p-1.5 rounded text-[var(--c-text-muted)] hover:text-[var(--c-primary)] hover:bg-[var(--c-primary)]/10 transition-colors"
                            >
                              <IconEdit />
                            </button>

                            {/* Toggle active */}
                            <button
                              onClick={() => onToggleActive(skill)}
                              title={skill.is_active ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded transition-colors ${
                                skill.is_active
                                  ? 'text-[var(--c-text-muted)] hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-[var(--c-text-muted)] hover:text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {skill.is_active ? <IconEyeOff /> : <IconEye />}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDelete(skill)}
                              title="Delete skill"
                              className="p-1.5 rounded text-[var(--c-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
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
              className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-[var(--c-text)] disabled:opacity-40 hover:bg-[var(--ds-bg,#f3f4f6)] transition-colors disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 border border-[var(--c-border)] rounded-lg text-[var(--c-text)] disabled:opacity-40 hover:bg-[var(--ds-bg,#f3f4f6)] transition-colors disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
