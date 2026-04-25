'use client';
import Link from 'next/link';

const STATUS_STYLES = {
  completed:  'bg-ds-successLight text-ds-success',
  processing: 'bg-ds-warningLight text-ds-warning',
  failed:     'bg-ds-dangerLight text-ds-danger',
  pending:    'bg-ds-bg text-ds-textMuted',
};

const BAND_DOT = {
  'Strong Match':   'bg-ds-success',
  'Good Match':     'bg-secondary',
  'Moderate Match': 'bg-ds-warning',
  'Weak Match':     'bg-ds-danger',
};

export default function ResumeCard({ resume, jobs = [], onDelete }) {
  const pd = resume.parsed_data?.[0];
  const bestScore = jobs.reduce((best, j) =>
    (j.overall_score ?? 0) > (best?.overall_score ?? 0) ? j : best, null);

  return (
    <div className="bg-ds-card rounded border border-ds-border p-5 flex flex-col gap-3 hover:border-ds-borderStrong transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading font-semibold text-ds-text truncate">{pd?.candidate_name || 'Unknown'}</p>
          <p className="text-sm text-ds-textMuted truncate mt-0.5">{pd?.email || resume.file_name}</p>
        </div>
        <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-btn font-medium ${STATUS_STYLES[resume.status] || STATUS_STYLES.pending}`}>
          {resume.status}
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
        <button onClick={() => onDelete(resume.id)}
          className="text-sm text-ds-danger border border-ds-border px-3 py-1.5 rounded-btn hover:bg-ds-dangerLight transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
