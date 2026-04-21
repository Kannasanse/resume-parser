import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getJobs, deleteJob } from '../lib/api';

const SENIORITY_STYLES = {
  senior: 'bg-purple-50 text-purple-700',
  mid:    'bg-secondary-light text-secondary',
  junior: 'bg-ds-successLight text-ds-success',
  entry:  'bg-ds-bg text-ds-textMuted',
};

const ROLE_LABELS = {
  technical:   'Technical',
  'entry-level': 'Entry-level',
  specialized: 'Specialized',
};

export default function JobProfiles() {
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this job profile?')) return;
    await deleteJob(id);
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading job profiles...</p>;
  if (error)     return <p className="text-ds-danger">Failed to load job profiles.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-ds-text">
          Job Profiles <span className="text-ds-textMuted font-normal text-lg">({jobs.length})</span>
        </h1>
        <Link to="/jobs/new"
          className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark transition-colors">
          + New Profile
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 text-ds-textMuted">
          <p className="text-base font-medium">No job profiles yet.</p>
          <Link to="/jobs/new" className="text-primary hover:underline text-sm mt-2 inline-block">
            Create your first job profile →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-ds-card rounded border border-ds-border p-5 flex flex-col gap-3 hover:border-ds-borderStrong transition-colors">
              <div>
                <p className="font-heading font-semibold text-ds-text">{job.title}</p>
                {job.description && (
                  <p className="text-sm text-ds-textMuted mt-1 line-clamp-2">{job.description}</p>
                )}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {job.role_type && (
                  <span className="text-xs bg-primary-light text-primary px-2.5 py-0.5 rounded-btn font-medium">
                    {ROLE_LABELS[job.role_type] || job.role_type}
                  </span>
                )}
                {job.seniority && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-btn font-medium ${SENIORITY_STYLES[job.seniority] || 'bg-ds-bg text-ds-textMuted'}`}>
                    {job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1)}
                  </span>
                )}
              </div>

              <p className="text-xs text-ds-textMuted font-mono">
                {new Date(job.created_at).toLocaleDateString()}
              </p>

              <div className="flex gap-2 mt-auto">
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex-1 text-center text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-sm text-ds-danger border border-ds-border px-3 py-1.5 rounded-btn hover:bg-ds-dangerLight transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
