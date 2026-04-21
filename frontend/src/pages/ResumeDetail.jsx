import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getResume, deleteResume, reparseResume, exportResume } from '../lib/api';
import ScoreBreakdown from '../components/ScoreBreakdown';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm text-ds-text mt-0.5">{value}</p>
    </div>
  );
}

export default function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: resume, isLoading, error } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => getResume(id),
  });

  const handleDelete = async () => {
    if (!confirm('Delete this resume?')) return;
    await deleteResume(id);
    navigate('/resumes');
  };

  const handleReparse = async () => {
    await reparseResume(id);
    queryClient.invalidateQueries({ queryKey: ['resume', id] });
  };

  const handleExport = async (format) => {
    const { data } = await exportResume(id, format);
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading...</p>;
  if (error || !resume) return <p className="text-ds-danger">Resume not found.</p>;

  const pd = resume.parsed_data?.[0];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/resumes')} className="text-sm text-ds-textMuted hover:text-ds-text transition-colors">
          ← Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => handleExport('json')}
            className="text-sm border border-ds-border px-3 py-1.5 rounded-btn text-ds-text hover:bg-ds-card transition-colors">
            Export JSON
          </button>
          <button onClick={() => handleExport('csv')}
            className="text-sm border border-ds-border px-3 py-1.5 rounded-btn text-ds-text hover:bg-ds-card transition-colors">
            Export CSV
          </button>
          <button onClick={handleReparse}
            className="text-sm border border-ds-border px-3 py-1.5 rounded-btn text-ds-text hover:bg-ds-card transition-colors">
            Reparse
          </button>
          <button onClick={handleDelete}
            className="text-sm bg-ds-dangerLight text-ds-danger border border-ds-dangerLight px-3 py-1.5 rounded-btn hover:bg-ds-danger hover:text-white transition-colors">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column — resume data */}
        <div className="lg:col-span-2 space-y-4">
          {/* Candidate info */}
          <div className="bg-ds-card rounded border border-ds-border p-6">
            <h1 className="font-heading text-xl font-bold text-ds-text mb-1">
              {pd?.candidate_name || 'Unknown Candidate'}
            </h1>
            {resume.job_profiles?.title && (
              <p className="text-xs text-secondary bg-secondary-light px-2.5 py-1 rounded-btn inline-block mb-4">
                {resume.job_profiles.title}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Field label="Email" value={pd?.email} />
              <Field label="Phone" value={pd?.phone} />
              <Field label="File" value={resume.file_name} />
              <Field label="Status" value={resume.status} />
            </div>
            {pd?.summary && (
              <p className="mt-4 text-sm text-ds-textSecondary border-t border-ds-border pt-4 leading-relaxed">
                {pd.summary}
              </p>
            )}
          </div>

          {/* Skills */}
          {pd?.skills?.length > 0 && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">
                Skills <span className="text-ds-textMuted font-normal text-sm">({pd.skills.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {pd.skills.map(skill => (
                  <span key={skill} className="bg-primary-light text-primary text-sm px-3 py-1 rounded-btn font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {pd?.work_experience?.length > 0 && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">Work Experience</h2>
              <div className="space-y-5">
                {pd.work_experience.map((w, i) => (
                  <div key={i} className="border-l-2 border-primary-light pl-4">
                    <p className="font-semibold text-ds-text">{w.title}</p>
                    <p className="text-sm text-ds-textTertiary">{w.company}</p>
                    <p className="text-xs text-ds-textMuted mt-0.5 font-mono">
                      {w.start_date} – {w.end_date || 'Present'}
                    </p>
                    {w.description && (
                      <p className="text-sm text-ds-textSecondary mt-2 leading-relaxed">{w.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {pd?.education?.length > 0 && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">Education</h2>
              <div className="space-y-3">
                {pd.education.map((e, i) => (
                  <div key={i}>
                    <p className="font-semibold text-ds-text">{e.institution}</p>
                    <p className="text-sm text-ds-textMuted">
                      {e.degree}{e.field ? ` in ${e.field}` : ''}
                      {e.graduation_year ? <span className="font-mono ml-1">· {e.graduation_year}</span> : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — score */}
        {resume.score && (
          <div className="lg:col-span-1">
            <div className="bg-ds-card rounded border border-ds-border p-6 sticky top-4">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">Match Score</h2>
              <ScoreBreakdown score={resume.score} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
