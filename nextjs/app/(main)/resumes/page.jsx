'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getResumes, deleteResume, bulkDeleteResumes } from '@/lib/api';
import { deduplicateByEmail } from '@/lib/resumeUtils';
import ResumeCard from '@/components/ResumeCard';
import HoldToDelete from '@/components/HoldToDelete';
import { Sk } from '@/components/Skeleton';

const BAND_DOT = {
  'Strong Match':   'bg-ds-success',
  'Good Match':     'bg-secondary',
  'Moderate Match': 'bg-ds-warning',
  'Weak Match':     'bg-ds-danger',
};

const STATUS_STYLES = {
  completed:  'bg-ds-successLight text-ds-success',
  partial:    'bg-ds-warningLight text-ds-warning',
  processing: 'bg-ds-warningLight text-ds-warning',
  failed:     'bg-ds-dangerLight text-ds-danger',
  pending:    'bg-ds-bg text-ds-textMuted',
};
const STATUS_LABELS = {
  completed: 'Parsed', partial: 'Partial', processing: 'Processing',
  failed: 'Failed', pending: 'Pending',
};

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

function BulkDeleteModal({ count, onCancel, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-ds-card rounded-lg border border-ds-border shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-ds-dangerLight flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ds-danger">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="font-heading font-bold text-ds-text text-base">Delete {count} Profile{count > 1 ? 's' : ''}?</h2>
            <p className="text-sm text-ds-textSecondary mt-1 leading-relaxed">
              All selected profiles, their AI-parsed data, and associated scores will be permanently removed.
            </p>
          </div>
        </div>
        <div className="bg-ds-dangerLight rounded px-4 py-3">
          <p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <HoldToDelete onDelete={onDelete} />
          <button onClick={onCancel}
            className="w-full px-5 py-2.5 text-sm font-medium text-ds-textMuted border border-ds-border rounded-btn hover:bg-ds-bg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumeTable({ items, selectedIds, onToggleSelect, onDelete, onDeleteRequest }) {
  return (
    <div className="rounded border border-ds-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ds-bg border-b border-ds-border">
          <tr>
            <th className="w-10 px-4 py-3" />
            <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide hidden md:table-cell">Skills</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide hidden sm:table-cell">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide hidden lg:table-cell">Best Score</th>
            <th className="w-24 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ds-border">
          {items.map(({ resume, jobs }) => {
            const pd = resume.parsed_data?.[0];
            const bestScore = jobs.reduce((b, j) => (j.overall_score ?? 0) > (b?.overall_score ?? 0) ? j : b, null);
            const skills = pd?.skills || [];
            return (
              <tr key={resume.id}
                className={`transition-colors ${selectedIds.has(resume.id) ? 'bg-primary/5' : 'hover:bg-ds-bg'}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.has(resume.id)}
                    onChange={() => onToggleSelect(resume.id)}
                    className="w-4 h-4 accent-primary cursor-pointer" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ds-text truncate max-w-[180px]">{pd?.candidate_name || 'Unknown'}</p>
                  <p className="text-xs text-ds-textMuted truncate max-w-[180px] mt-0.5">{pd?.email || resume.file_name}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 3).map(s => (
                      <span key={s} className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded-btn font-medium">{s}</span>
                    ))}
                    {skills.length > 3 && <span className="text-xs text-ds-textMuted">+{skills.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2.5 py-1 rounded-btn font-medium ${STATUS_STYLES[resume.status] || STATUS_STYLES.pending}`}>
                    {STATUS_LABELS[resume.status] || resume.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {bestScore ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${BAND_DOT[bestScore.band] || 'bg-ds-textMuted'}`} />
                      <span className="font-semibold text-ds-text">{Math.round((bestScore.overall_score ?? 0) * 100)}</span>
                      <span className="text-xs text-ds-textMuted">— {bestScore.band}</span>
                    </div>
                  ) : <span className="text-xs text-ds-textMuted">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/resumes/${resume.id}`}
                      className="text-xs bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
                      View
                    </Link>
                    <button onClick={() => onDeleteRequest(resume.id)}
                      className="text-xs text-ds-danger border border-ds-border px-3 py-1.5 rounded-btn hover:bg-ds-dangerLight transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ResumeList() {
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(50);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDeleting, setBulkDeleting]   = useState(false);
  const [viewMode, setViewMode]     = useState('grid');
  const [sort, setSort]             = useState('');
  const [singleDeleteId, setSingleDeleteId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const saved = localStorage.getItem('profiles-view-mode');
    if (saved === 'table' || saved === 'grid') setViewMode(saved);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when page size changes
  useEffect(() => { setPage(1); }, [pageSize]);

  const setView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('profiles-view-mode', mode);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumes', page, pageSize, search, sort],
    queryFn: () => getResumes(page, pageSize, search, sort),
  });

  const deduplicated = deduplicateByEmail(data?.data || []);
  const total      = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allIds     = deduplicated.map(({ resume }) => resume.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  };

  const handleDelete = async (id) => {
    await deleteResume(id);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setSingleDeleteId(null);
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await bulkDeleteResumes([...selectedIds]);
      setSelectedIds(new Set());
      setShowBulkModal(false);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    } finally {
      setBulkDeleting(false);
    }
  };

  if (isLoading) return (
    <div className="pb-28">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <Sk className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Sk className="h-8 w-16" />
          <Sk className="h-8 w-20" />
          <Sk className="h-8 w-24" />
        </div>
      </div>
      <Sk className="h-9 w-72 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded border border-ds-border bg-ds-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-4 w-36" />
                <Sk className="h-3 w-28" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Sk className="h-5 w-16 rounded-btn" />
              <Sk className="h-5 w-14 rounded-btn" />
              <Sk className="h-5 w-12 rounded-btn" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Sk className="h-5 w-16 rounded-btn" />
              <Sk className="h-6 w-24 rounded-btn" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  if (error)     return <p className="text-ds-danger">Failed to load resumes.</p>;

  const pageStart = (page - 1) * pageSize + 1;
  const pageEnd   = Math.min(page * pageSize, total);

  return (
    <div className="pb-28">
      {showBulkModal && (
        <BulkDeleteModal count={selectedIds.size} onCancel={() => setShowBulkModal(false)} onDelete={handleBulkDelete} />
      )}

      {singleDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSingleDeleteId(null)} />
          <div className="relative bg-ds-card rounded-lg border border-ds-border shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-heading font-bold text-ds-text text-base">Delete Profile?</h2>
            <div className="bg-ds-dangerLight rounded px-4 py-3">
              <p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p>
            </div>
            <div className="flex flex-col gap-2">
              <HoldToDelete onDelete={() => handleDelete(singleDeleteId)} />
              <button onClick={() => setSingleDeleteId(null)}
                className="w-full px-5 py-2.5 text-sm font-medium text-ds-textMuted border border-ds-border rounded-btn hover:bg-ds-bg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-ds-text">
            Profiles{' '}
            <span className="text-ds-textMuted font-normal text-lg">
              ({search ? `${total} found` : total})
            </span>
          </h1>
          {deduplicated.length > 0 && (
            <button onClick={toggleSelectAll}
              className="text-xs text-ds-textMuted hover:text-ds-text border border-ds-border rounded-btn px-2.5 py-1 transition-colors">
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSort(s => s === 'name_asc' ? '' : 'name_asc'); setPage(1); }}
            title={sort === 'name_asc' ? 'Currently: A-Z — click to reset' : 'Sort A-Z by name'}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-btn border transition-colors ${
              sort === 'name_asc'
                ? 'bg-primary text-white border-primary'
                : 'border-ds-border text-ds-textMuted hover:bg-ds-bg hover:text-ds-text'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M7 12h10M11 18h2"/>
            </svg>
            A-Z
          </button>
          <div className="flex rounded-btn border border-ds-border overflow-hidden">
            <button onClick={() => setView('grid')} title="Grid view"
              className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-ds-textMuted hover:bg-ds-bg'}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button onClick={() => setView('table')} title="Table view"
              className={`px-3 py-2 transition-colors border-l border-ds-border ${viewMode === 'table' ? 'bg-primary text-white' : 'text-ds-textMuted hover:bg-ds-bg'}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
          <Link href="/upload"
            className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark transition-colors">
            + Upload
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-textMuted pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-9 py-2 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        {searchInput && (
          <button
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-textMuted hover:text-ds-text text-lg leading-none"
          >×</button>
        )}
      </div>

      {/* Content */}
      {deduplicated.length === 0 ? (
        search ? (
          <div className="text-center py-16 text-ds-textMuted">
            <p className="text-base font-medium">No profiles match &quot;{search}&quot;.</p>
            <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="text-primary hover:underline text-sm mt-2 inline-block">
              Clear search
            </button>
          </div>
        ) : (
          <div className="text-center py-20 text-ds-textMuted">
            <p className="text-base font-medium">No profiles yet.</p>
            <Link href="/upload" className="text-primary hover:underline text-sm mt-2 inline-block">
              Upload your first profile →
            </Link>
          </div>
        )
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deduplicated.map(({ resume, jobs }) => (
            <ResumeCard key={resume.id} resume={resume} jobs={jobs} onDelete={handleDelete}
              selected={selectedIds.has(resume.id)} onToggleSelect={() => toggleSelect(resume.id)} />
          ))}
        </div>
      ) : (
        <ResumeTable
          items={deduplicated}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDelete={handleDelete}
          onDeleteRequest={setSingleDeleteId}
        />
      )}

      {/* Pagination — always shown when there are results */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
          <p className="text-xs text-ds-textMuted">
            Showing {pageStart}–{pageEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="text-xs border border-ds-inputBorder rounded px-2 py-1.5 bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
            </select>
            <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
              className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
              ← Prev
            </button>
            <span className="text-xs text-ds-textMuted font-mono">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
              className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-ds-card border-t border-ds-border shadow-xl px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-ds-text">
                {selectedIds.size} profile{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button onClick={() => setSelectedIds(new Set())}
                className="text-xs text-ds-textMuted hover:text-ds-text underline underline-offset-2">
                Clear
              </button>
            </div>
            <button onClick={() => setShowBulkModal(true)} disabled={bulkDeleting}
              className="flex items-center gap-2 bg-ds-danger text-white text-sm font-semibold px-5 py-2 rounded-btn hover:opacity-90 disabled:opacity-50 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Delete {selectedIds.size} selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
