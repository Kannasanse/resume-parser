'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuilderResumes, deleteBuilderResume, duplicateBuilderResume } from '@/lib/builderApi';
import { TEMPLATES } from '@/components/builder/templates.js';
import ShareModal from '@/components/builder/ShareModal.jsx';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/>
      <path d="M14 3v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Overflow menu ─────────────────────────────────────────────────────────────

function OverflowMenu({ resume, onDelete, onDuplicate, onShare, onRename, duplicating }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const item = (label, onClick, danger = false) => (
    <button
      onClick={(e) => { e.stopPropagation(); setOpen(false); onClick(); }}
      className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-ds-bg rounded-sm ${danger ? 'text-ds-danger' : 'text-ds-text'}`}
    >
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={duplicating}
        className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors disabled:opacity-50"
      >
        {duplicating
          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          : <DotsIcon />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-ds-card border border-ds-border rounded-lg shadow-xl z-20 py-1 min-w-[150px]">
          {item('Open', () => window.location.href = `/builder/${resume.id}`)}
          {item('Rename', onRename)}
          {item('Duplicate', onDuplicate)}
          {item('Download PDF', () => window.open(`/print/${resume.id}`, '_blank'))}
          {item('Share', onShare)}
          <div className="my-1 border-t border-ds-border" />
          {item('Delete', onDelete, true)}
        </div>
      )}
    </div>
  );
}

// ── Inline rename ─────────────────────────────────────────────────────────────

function RenameInput({ value, onConfirm, onCancel }) {
  const [val, setVal] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const submit = () => { const t = val.trim(); if (t) onConfirm(t); else onCancel(); };

  return (
    <input
      ref={inputRef}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={submit}
      onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
      onClick={e => e.stopPropagation()}
      maxLength={100}
      className="w-full px-2 py-0.5 text-sm font-semibold border border-primary rounded bg-ds-card text-ds-text focus:outline-none"
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BuilderListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [renaming, setRenaming] = useState(null); // resume id
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['builder-resumes'],
    queryFn: getBuilderResumes,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBuilderResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-resumes'] });
      setDeleteTarget(null);
    },
    onError: () => showToast("Couldn't delete resume. Please try again.", 'error'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }) =>
      fetch(`/api/v1/builder/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-resumes'] });
      setRenaming(null);
    },
    onError: () => { showToast("Couldn't rename. Please try again.", 'error'); setRenaming(null); },
  });

  const handleDuplicate = async (resume) => {
    setDuplicatingId(resume.id);
    try {
      const res = await duplicateBuilderResume(resume.id);
      queryClient.invalidateQueries({ queryKey: ['builder-resumes'] });
      showToast('Resume duplicated successfully.');
      // Navigate to the new resume so user can rename inline
      setTimeout(() => router.push(`/builder/${res.data.id}`), 800);
    } catch {
      showToast("We couldn't duplicate your resume. Please try again.", 'error');
    } finally {
      setDuplicatingId(null);
    }
  };

  const resumes = data?.data || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading text-xl font-bold text-ds-text">My Resumes</h2>
          <p className="text-sm text-ds-textMuted mt-0.5">Build and manage your resumes</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/builder/new?upload=1" className="flex items-center gap-1.5 px-3.5 py-2 border border-ds-border text-ds-text rounded-btn text-sm font-medium hover:bg-ds-bg transition-colors">
            <UploadIcon />
            <span className="hidden sm:inline">New from Upload</span>
            <span className="sm:hidden">Upload</span>
          </Link>
          <Link href="/builder/new" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors">
            <PlusIcon />New Resume
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-ds-card rounded-lg border border-ds-border p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <Sk className="h-5 w-40" />
                  <Sk className="h-3 w-24" />
                </div>
                <Sk className="w-7 h-7 rounded" />
              </div>
              <Sk className="h-24 w-full rounded" />
              <div className="flex gap-2 pt-1">
                <Sk className="flex-1 h-8 rounded-btn" />
                <Sk className="h-8 w-20 rounded-btn" />
              </div>
            </div>
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4"><FileTextIcon /></div>
          <h2 className="font-heading font-bold text-ds-text mb-1">No resumes yet</h2>
          <p className="text-sm text-ds-textMuted mb-5">Create your first resume to get started.</p>
          <div className="flex items-center gap-2">
            <Link href="/builder/new?upload=1" className="flex items-center gap-1.5 px-4 py-2 border border-ds-border text-ds-text rounded-btn text-sm font-medium hover:bg-ds-bg transition-colors">
              <UploadIcon />New from Upload
            </Link>
            <Link href="/builder/new" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors">
              <PlusIcon />Create Resume
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map(r => {
            const tpl = TEMPLATES.find(t => t.id === r.template_id);
            const isRenaming = renaming === r.id;
            const isDuplicating = duplicatingId === r.id;

            const accentColor = tpl?.accent || '#185FA5';

            return (
              <div
                key={r.id}
                className={`bg-ds-card border border-ds-border rounded-xl flex flex-col transition-all duration-200 ${isDuplicating ? 'opacity-60 pointer-events-none' : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}`}
                style={{ borderTop: `4px solid ${accentColor}` }}
                onClick={() => !isRenaming && router.push(`/builder/${r.id}`)}
              >
                {/* Card body */}
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}18`, color: accentColor }}>
                        <FileTextIcon />
                      </div>
                      <div className="min-w-0 flex-1">
                        {isRenaming ? (
                          <RenameInput
                            value={r.title}
                            onConfirm={(title) => renameMutation.mutate({ id: r.id, title })}
                            onCancel={() => setRenaming(null)}
                          />
                        ) : (
                          <h3 className="font-heading font-semibold text-ds-text truncate text-sm">{r.title}</h3>
                        )}
                        {tpl && <span className="text-xs text-ds-textMuted">{tpl.style}</span>}
                      </div>
                    </div>
                    <OverflowMenu
                      resume={r}
                      duplicating={isDuplicating}
                      onDelete={() => setDeleteTarget(r)}
                      onDuplicate={() => handleDuplicate(r)}
                      onShare={() => setShareTarget(r.id)}
                      onRename={() => setRenaming(r.id)}
                    />
                  </div>
                  <p className="text-xs text-ds-textMuted mt-2">Updated {formatDate(r.updated_at)}</p>
                </div>

                {/* Card actions */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-ds-border bg-ds-bg rounded-b-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <Link
                    href={`/builder/${r.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <EditIcon />Edit
                  </Link>
                  <a
                    href={`/print/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-ds-border text-ds-text rounded text-xs font-semibold hover:bg-ds-card transition-colors"
                  >
                    <EyeIcon />Preview
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-heading font-bold text-ds-text">Delete resume?</h3>
            <p className="text-sm text-ds-textSecondary"><span className="font-medium">{deleteTarget.title}</span> will be permanently removed.</p>
            <div className="bg-ds-dangerLight rounded px-3 py-2"><p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p></div>
            <div className="flex gap-2">
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-ds-danger text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-ds-border text-ds-text rounded text-sm hover:bg-ds-bg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareTarget && <ShareModal resumeId={shareTarget} onClose={() => setShareTarget(null)} />}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg border shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-ds-dangerLight border-ds-danger/30 text-ds-danger' : 'bg-ds-successLight border-ds-success/30 text-ds-success'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
