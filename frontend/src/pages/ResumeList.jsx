import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getResumes, deleteResume } from '../lib/api';
import ResumeCard from '../components/ResumeCard';

export default function ResumeList() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumes', page],
    queryFn: () => getResumes(page),
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume?')) return;
    await deleteResume(id);
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading resumes...</p>;
  if (error) return <p className="text-ds-danger">Failed to load resumes.</p>;

  const totalPages = Math.ceil((data?.total || 0) / (data?.limit || 10));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-ds-text">
          Resumes <span className="text-ds-textMuted font-normal text-lg">({data?.total || 0})</span>
        </h1>
        <Link to="/upload"
          className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark transition-colors">
          + Upload
        </Link>
      </div>

      {data?.data?.length === 0 ? (
        <div className="text-center py-20 text-ds-textMuted">
          <p className="text-base font-medium">No resumes yet.</p>
          <Link to="/upload" className="text-primary hover:underline text-sm mt-2 inline-block">
            Upload your first resume →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map(resume => (
            <ResumeCard key={resume.id} resume={resume} onDelete={handleDelete} />
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
