import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getJobs, deleteJob } from '../lib/api';
import HoldToDelete from '../components/HoldToDelete';

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-50 text-purple-700',
  Advanced:      'bg-secondary-light text-secondary',
  Intermediate:  'bg-ds-successLight text-ds-success',
  Beginner:      'bg-ds-warningLight text-ds-warning',
  'Nice-to-have':'bg-ds-bg text-ds-textMuted',
};

function DeleteConfirmModal({ jobTitle, onCancel, onDelete }) {
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
            <h2 className="font-heading font-bold text-ds-text text-base">Delete Job Profile?</h2>
            <p className="text-sm text-ds-textSecondary mt-1 leading-relaxed">
              <span className="font-medium">{jobTitle}</span> and all associated candidate scores will be permanently removed.
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

export default function JobProfiles() {
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading, error } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const [deletingJob, setDeletingJob] = useState(null); // { id, title }

  const handleDeleteConfirmed = async () => {
    await deleteJob(deletingJob.id);
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    setDeletingJob(null);
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading job profiles...</p>;
  if (error)     return <p className="text-ds-danger">Failed to load job profiles.</p>;

  return (
    <div>
      {deletingJob && (
        <DeleteConfirmModal
          jobTitle={deletingJob.title}
          onCancel={() => setDeletingJob(null)}
          onDelete={handleDeleteConfirmed}
        />
      )}

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
          {jobs.map(job => {
            const skills    = job.job_skills || [];
            const topSkills = skills.slice(0, 3);
            const overflow  = skills.length - topSkills.length;

            return (
              <div key={job.id} className="bg-ds-card rounded border border-ds-border p-5 flex flex-col gap-4 hover:border-ds-borderStrong transition-colors">

                {/* Title + candidate count */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-heading font-semibold text-ds-text leading-snug">{job.title}</p>
                  <span className="flex-shrink-0 text-xs font-mono font-semibold bg-primary-light text-primary px-2 py-0.5 rounded-btn">
                    {job.candidate_count} {job.candidate_count === 1 ? 'candidate' : 'candidates'}
                  </span>
                </div>

                {/* Top 3 skills */}
                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                  {topSkills.length === 0 && (
                    <span className="text-xs text-ds-textMuted">No skills defined</span>
                  )}
                  {topSkills.map(s => (
                    <span key={s.skill}
                      className={`text-xs px-2 py-0.5 rounded-btn font-medium ${PROFICIENCY_COLORS[s.proficiency] || 'bg-ds-bg text-ds-textMuted'}`}>
                      {s.skill}
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-btn bg-ds-bg text-ds-textMuted font-medium">
                      +{overflow}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Link to={`/jobs/${job.id}`}
                    className="flex-1 text-center text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
                    View
                  </Link>
                  <Link to={`/jobs/${job.id}?edit=1`}
                    className="text-sm border border-ds-border text-ds-text px-3 py-1.5 rounded-btn hover:bg-ds-bg transition-colors">
                    Edit
                  </Link>
                  <button onClick={() => setDeletingJob({ id: job.id, title: job.title })}
                    className="text-sm text-ds-danger border border-ds-border px-3 py-1.5 rounded-btn hover:bg-ds-dangerLight transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
