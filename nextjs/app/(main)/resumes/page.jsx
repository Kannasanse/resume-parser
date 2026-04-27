'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { getResumes, deleteResume, bulkDeleteResumes } from '@/lib/api';
import ResumeCard from '@/components/ResumeCard';
import HoldToDelete from '@/components/HoldToDelete';

function deduplicateByEmail(resumes) {
  const map = new Map();

  for (const r of resumes) {
    const email = r.parsed_data?.[0]?.email || `__no_email_${r.id}`;
    const scores = r.resume_scores || [];

    if (!map.has(email)) {
      map.set(email, { resume: r, jobs: scores });
    } else {
      const existing = map.get(email);
      const existingBest = Math.max(...existing.jobs.map(s => s.overall_score ?? 0), 0);
      const newBest      = Math.max(...scores.map(s => s.overall_score ?? 0), 0);
      if (newBest > existingBest) {
        map.set(email, { resume: r, jobs: scores });
      } else {
        const knownIds = new Set(existing.jobs.map(j => j.job_profile_id));
        for (const s of scores) {
          if (!knownIds.has(s.job_profile_id)) {
            existing.jobs.push(s);
            knownIds.add(s.job_profile_id);
          }
        }
      }
    }
  }

  return [...map.values()];
}

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

export default function ResumeList() {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumes', page],
    queryFn: () => getResumes(page),
  });

  const deduplicated = deduplicateByEmail(data?.data || []);
  const totalPages   = Math.ceil((data?.total || 0) / (data?.limit || 10));
  const allIds       = deduplicated.map(({ resume }) => resume.id);
  const allSelected  = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleDelete = async (id) => {
    await deleteResume(id);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
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

  if (isLoading) return <p className="text-ds-textMuted">Loading resumes...</p>;
  if (error)     return <p className="text-ds-danger">Failed to load resumes.</p>;

  return (
    <div className="pb-28">
      {showBulkModal && (
        <BulkDeleteModal
          count={selectedIds.size}
          onCancel={() => setShowBulkModal(false)}
          onDelete={handleBulkDelete}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-ds-text">
            Profiles <span className="text-ds-textMuted font-normal text-lg">({deduplicated.length})</span>
          </h1>
          {deduplicated.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-ds-textMuted hover:text-ds-text border border-ds-border rounded-btn px-2.5 py-1 transition-colors"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>
        <Link href="/upload"
          className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark transition-colors">
          + Upload
        </Link>
      </div>

      {deduplicated.length === 0 ? (
        <div className="text-center py-20 text-ds-textMuted">
          <p className="text-base font-medium">No profiles yet.</p>
          <Link href="/upload" className="text-primary hover:underline text-sm mt-2 inline-block">
            Upload your first profile →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deduplicated.map(({ resume, jobs }) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              jobs={jobs}
              onDelete={handleDelete}
              selected={selectedIds.has(resume.id)}
              onToggleSelect={() => toggleSelect(resume.id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
            className="px-4 py-2 rounded-btn border border-ds-border text-sm text-ds-text disabled:opacity-40 hover:bg-ds-card transition-colors">
            ← Previous
          </button>
          <span className="px-4 py-2 text-sm text-ds-textMuted">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
            className="px-4 py-2 rounded-btn border border-ds-border text-sm text-ds-text disabled:opacity-40 hover:bg-ds-card transition-colors">
            Next →
          </button>
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
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-ds-textMuted hover:text-ds-text underline underline-offset-2"
              >
                Clear
              </button>
            </div>
            <button
              onClick={() => setShowBulkModal(true)}
              disabled={bulkDeleting}
              className="flex items-center gap-2 bg-ds-danger text-white text-sm font-semibold px-5 py-2 rounded-btn hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
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
