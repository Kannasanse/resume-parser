'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuilderResumes, deleteBuilderResume } from '@/lib/builderApi';
import { TEMPLATES } from '@/components/builder/templates.js';
import Link from 'next/link';

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BuilderListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

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
  });

  const resumes = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-ds-text">My Resumes</h1>
          <p className="text-sm text-ds-textMuted mt-0.5">Build and manage your resumes</p>
        </div>
        <Link
          href="/builder/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <PlusIcon />
          New Resume
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-ds-card rounded border border-ds-border animate-pulse" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-ds-bg flex items-center justify-center text-ds-textMuted mb-4">
            <FileTextIcon />
          </div>
          <h2 className="font-heading font-bold text-ds-text mb-1">No resumes yet</h2>
          <p className="text-sm text-ds-textMuted mb-5">Create your first resume to get started.</p>
          <Link
            href="/builder/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusIcon />
            Create Resume
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map(r => {
            const tpl = TEMPLATES.find(t => t.id === r.template_id);
            return (
              <div
                key={r.id}
                className="bg-ds-card border border-ds-border rounded-lg p-5 hover:border-primary/40 hover:shadow-sm transition-all group cursor-pointer"
                onClick={() => router.push(`/builder/${r.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: tpl ? `${tpl.accent}18` : '#f0f0f0' }}
                  >
                    <FileTextIcon />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
                <h3 className="font-heading font-semibold text-ds-text mb-1 truncate">{r.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {tpl && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ds-bg text-ds-textMuted border border-ds-border">{tpl.style}</span>
                  )}
                  <span className="text-xs text-ds-textMuted">Updated {formatDate(r.updated_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-heading font-bold text-ds-text">Delete resume?</h3>
            <p className="text-sm text-ds-textSecondary">
              <span className="font-medium">{deleteTarget.title}</span> will be permanently removed.
            </p>
            <div className="bg-ds-dangerLight rounded px-3 py-2">
              <p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-ds-danger text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-ds-border text-ds-text rounded text-sm hover:bg-ds-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
