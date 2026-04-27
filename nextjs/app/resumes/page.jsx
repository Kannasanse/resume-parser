'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { getResumes, deleteResume } from '@/lib/api';
import ResumeCard from '@/components/ResumeCard';

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

export default function ResumeList() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumes', page],
    queryFn: () => getResumes(page),
  });

  const handleDelete = async (id) => {
    await deleteResume(id);
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading resumes...</p>;
  if (error) return <p className="text-ds-danger">Failed to load resumes.</p>;

  const deduplicated = deduplicateByEmail(data?.data || []);
  const totalPages   = Math.ceil((data?.total || 0) / (data?.limit || 10));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-ds-text">
          Profiles <span className="text-ds-textMuted font-normal text-lg">({deduplicated.length})</span>
        </h1>
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
            <ResumeCard key={resume.id} resume={resume} jobs={jobs} onDelete={handleDelete} />
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
    </div>
  );
}
