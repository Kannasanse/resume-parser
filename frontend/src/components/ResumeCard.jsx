import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  completed:  'bg-ds-successLight text-ds-success',
  processing: 'bg-ds-warningLight text-ds-warning',
  failed:     'bg-ds-dangerLight text-ds-danger',
  pending:    'bg-ds-bg text-ds-textMuted',
};

export default function ResumeCard({ resume, onDelete }) {
  const pd = resume.parsed_data?.[0];
  const status = resume.status;

  return (
    <div className="bg-ds-card rounded border border-ds-border p-5 flex flex-col gap-3 hover:border-ds-borderStrong transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading font-semibold text-ds-text truncate">{pd?.candidate_name || 'Unknown'}</p>
          <p className="text-sm text-ds-textMuted truncate mt-0.5">{pd?.email || resume.file_name}</p>
        </div>
        <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-btn font-medium ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
          {status}
        </span>
      </div>

      {resume.job_profiles?.title && (
        <p className="text-xs text-ds-textTertiary bg-secondary-light px-2 py-1 rounded truncate">
          {resume.job_profiles.title}
        </p>
      )}

      {pd?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pd.skills.slice(0, 5).map(skill => (
            <span key={skill} className="bg-primary-light text-primary text-xs px-2.5 py-0.5 rounded-btn font-medium">
              {skill}
            </span>
          ))}
          {pd.skills.length > 5 && (
            <span className="text-xs text-ds-textMuted">+{pd.skills.length - 5} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <Link
          to={`/resumes/${resume.id}`}
          className="flex-1 text-center text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors"
        >
          View
        </Link>
        <button
          onClick={() => onDelete(resume.id)}
          className="text-sm text-ds-danger border border-ds-border px-3 py-1.5 rounded-btn hover:bg-ds-dangerLight transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
