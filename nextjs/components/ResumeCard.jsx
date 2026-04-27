'use client';
import { useState } from 'react';
import Link from 'next/link';
import HoldToDelete from '@/components/HoldToDelete';

const STATUS_STYLES = {
  completed:  'bg-ds-successLight text-ds-success',
  partial:    'bg-ds-warningLight text-ds-warning',
  processing: 'bg-ds-warningLight text-ds-warning',
  failed:     'bg-ds-dangerLight text-ds-danger',
  pending:    'bg-ds-bg text-ds-textMuted',
};

const STATUS_LABELS = {
  completed:  'Parsed',
  partial:    'Partial — Re-parse',
  processing: 'Processing',
  failed:     'Failed',
  pending:    'Pending',
};

const BAND_DOT = {
  'Strong Match':   'bg-ds-success',
  'Good Match':     'bg-secondary',
  'Moderate Match': 'bg-ds-warning',
  'Weak Match':     'bg-ds-danger',
};

function DeleteModal({ name, onCancel, onDelete }) {
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
            <h2 className="font-heading font-bold text-ds-text text-base">Delete Resume?</h2>
            <p className="text-sm text-ds-textSecondary mt-1 leading-relaxed">
              <span className="font-medium">{name}</span> and all associated scores will be permanently removed.
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

export default function ResumeCard({ resume, jobs = [], onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const pd = resume.parsed_data?.[0];
  const bestScore = jobs.reduce((best, j) =>
    (j.overall_score ?? 0) > (best?.overall_score ?? 0) ? j : best, null);

  const name = pd?.candidate_name || resume.file_name || 'this resume';

  return (
    <>
      {showModal && (
        <DeleteModal
          name={name}
          onCancel={() => setShowModal(false)}
          onDelete={() => { setShowModal(false); onDelete(resume.id); }}
        />
      )}

      <div className="bg-ds-card rounded border border-ds-border p-5 flex flex-col gap-3 hover:border-ds-borderStrong transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading font-semibold text-ds-text truncate">{pd?.candidate_name || 'Unknown'}</p>
            <p className="text-sm text-ds-textMuted truncate mt-0.5">{pd?.email || resume.file_name}</p>
          </div>
          <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-btn font-medium ${STATUS_STYLES[resume.status] || STATUS_STYLES.pending}`}>
            {STATUS_LABELS[resume.status] || resume.status}
          </span>
        </div>

        {jobs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {jobs.slice(0, 2).map(j => (
              <span key={j.job_profile_id}
                className="flex items-center gap-1 text-xs bg-secondary-light text-secondary px-2 py-0.5 rounded-btn">
                {j.band && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${BAND_DOT[j.band] || 'bg-ds-textMuted'}`} />}
                <span className="truncate max-w-[100px]">{j.job_profiles?.title || 'Job'}</span>
              </span>
            ))}
            {jobs.length > 2 && <span className="text-xs text-ds-textMuted px-1">+{jobs.length - 2} more</span>}
          </div>
        )}

        {bestScore && (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${BAND_DOT[bestScore.band] || 'bg-ds-textMuted'}`} />
            <span className="text-xs text-ds-textMuted">
              Best: <span className="font-semibold text-ds-text">{Math.round((bestScore.overall_score ?? 0) * 100)}</span>
              <span className="ml-1 text-ds-textMuted">— {bestScore.band}</span>
            </span>
          </div>
        )}

        {pd?.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pd.skills.slice(0, 5).map(skill => (
              <span key={skill} className="bg-primary-light text-primary text-xs px-2.5 py-0.5 rounded-btn font-medium">{skill}</span>
            ))}
            {pd.skills.length > 5 && <span className="text-xs text-ds-textMuted">+{pd.skills.length - 5} more</span>}
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          <Link href={`/resumes/${resume.id}`}
            className="flex-1 text-center text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
            View
          </Link>
          <button onClick={() => setShowModal(true)}
            className="text-sm text-ds-danger border border-ds-border px-3 py-1.5 rounded-btn hover:bg-ds-dangerLight transition-colors">
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
