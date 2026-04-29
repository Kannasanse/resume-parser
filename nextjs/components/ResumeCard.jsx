'use client';
import { useState } from 'react';
import Link from 'next/link';
import HoldToDelete from '@/components/HoldToDelete';

const STATUS_STYLES = {
  completed:  'bg-ds-successLight text-ds-success',
  partial:    'bg-ds-warningLight text-ds-warning',
  processing: 'bg-ds-warningLight text-ds-warning',
  failed:     'bg-ds-dangerLight text-ds-danger',
  pending:    'bg-ds-bg text-ds-textMuted border border-ds-border',
};

const STATUS_LABELS = {
  completed:  'Parsed',
  partial:    'Partial',
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

function Initials({ name }) {
  const letters = (name || '??')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded bg-ds-bg border border-ds-border flex items-center justify-center
      font-heading text-[13px] font-bold text-ds-textSecondary flex-shrink-0 select-none">
      {letters}
    </div>
  );
}

function PulsingDot({ status }) {
  if (status === 'processing') {
    return (
      <span className="relative inline-flex w-1.5 h-1.5 mr-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
        <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-secondary" />
      </span>
    );
  }
  const dotCls = {
    completed: 'bg-ds-success',
    partial:   'bg-ds-warning',
    failed:    'bg-ds-danger',
    pending:   'bg-ds-textMuted',
  }[status] || 'bg-ds-textMuted';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${dotCls}`} />;
}

export default function ResumeCard({ resume, jobs = [], onDelete, selected = false, onToggleSelect }) {
  const [showModal, setShowModal] = useState(false);
  const pd = resume.parsed_data?.[0];
  const bestScore = jobs.reduce((best, j) =>
    (j.overall_score ?? 0) > (best?.overall_score ?? 0) ? j : best, null);

  const name = pd?.candidate_name || resume.file_name || 'Unknown';
  const email = pd?.email || null;
  const uploadedAt = resume.created_at
    ? new Date(resume.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <>
      {showModal && (
        <DeleteModal
          name={name}
          onCancel={() => setShowModal(false)}
          onDelete={() => { setShowModal(false); onDelete(resume.id); }}
        />
      )}

      <div className={`bg-ds-card rounded border flex flex-col gap-3 p-4 transition-colors ${
        selected ? 'border-primary ring-1 ring-primary' : 'border-ds-border hover:border-ds-borderStrong'
      }`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                onClick={e => e.stopPropagation()}
                className="flex-shrink-0 w-4 h-4 accent-primary cursor-pointer"
              />
            )}
            <Initials name={name} />
            <div className="min-w-0">
              <p className="font-heading font-semibold text-ds-text text-sm leading-tight truncate">{name}</p>
              {email && <p className="text-xs text-ds-textMuted truncate mt-0.5">{email}</p>}
            </div>
          </div>
          <span className={`flex-shrink-0 inline-flex items-center text-xs px-2 py-0.5 rounded-btn font-medium ${STATUS_STYLES[resume.status] || STATUS_STYLES.pending}`}>
            <PulsingDot status={resume.status} />
            {STATUS_LABELS[resume.status] || resume.status}
          </span>
        </div>

        {/* Best score */}
        {bestScore && (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${BAND_DOT[bestScore.band] || 'bg-ds-textMuted'}`} />
            <span className="text-xs text-ds-textMuted font-mono">
              <span className="font-semibold text-ds-text">{Math.round((bestScore.overall_score ?? 0) * 100)}</span>
              {' · '}{bestScore.band}
            </span>
          </div>
        )}

        {/* Skill chips — neutral style matching design */}
        {pd?.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pd.skills.slice(0, 5).map(skill => (
              <span key={skill}
                className="text-xs px-2 py-0.5 rounded bg-ds-bg text-ds-textSecondary border border-ds-border font-medium">
                {skill}
              </span>
            ))}
            {pd.skills.length > 5 && (
              <span className="text-xs text-ds-textMuted font-mono px-1">+{pd.skills.length - 5}</span>
            )}
          </div>
        )}

        {/* Job score tags */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {jobs.slice(0, 2).map(j => (
              <span key={j.job_profile_id}
                className="flex items-center gap-1 text-xs bg-secondary-light text-secondary px-2 py-0.5 rounded-btn">
                {j.band && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${BAND_DOT[j.band] || 'bg-ds-textMuted'}`} />}
                <span className="truncate max-w-[100px]">{j.job_profiles?.title || 'Job'}</span>
              </span>
            ))}
            {jobs.length > 2 && <span className="text-xs text-ds-textMuted px-1">+{jobs.length - 2}</span>}
          </div>
        )}

        {/* Footer: date + icon actions */}
        <div className="flex items-center justify-between pt-2 border-t border-ds-border mt-auto">
          <span className="font-mono text-xs text-ds-textMuted">{uploadedAt || resume.file_name}</span>
          <div className="flex items-center gap-1">
            <Link
              href={`/resumes/${resume.id}`}
              className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted
                hover:text-ds-text hover:bg-ds-bg transition-colors"
              title="View profile"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted
                hover:text-ds-danger hover:bg-ds-dangerLight transition-colors"
              title="Delete resume"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
