import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getResume, deleteResume, exportResume } from '../lib/api';
import ScoreBreakdown from '../components/ScoreBreakdown';

const BAND_STYLES = {
  'Strong Match':   'bg-ds-successLight text-ds-success',
  'Good Match':     'bg-secondary-light text-secondary',
  'Moderate Match': 'bg-ds-warningLight text-ds-warning',
  'Weak Match':     'bg-ds-dangerLight text-ds-danger',
};

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
  const [selectedScoreIdx, setSelectedScoreIdx] = useState(0);

  const { data: resume, isLoading, error } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => getResume(id),
  });

  const handleDelete = async () => {
    if (!confirm('Delete this resume?')) return;
    await deleteResume(id);
    navigate('/resumes');
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
  const scores = resume.scores || [];
  const activeScore = scores[selectedScoreIdx] || null;

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

        {/* Right column — score panel with job switcher */}
        {scores.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-ds-card rounded border border-ds-border overflow-hidden sticky top-4">
              {/* Job profile switcher */}
              <div className="border-b border-ds-border px-4 pt-4 pb-0">
                <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest mb-2">Match Score</p>
                <div className="flex flex-wrap gap-1.5 pb-3">
                  {scores.map((s, i) => {
                    const title = s.job_profiles?.title || 'Job Profile';
                    const pct   = Math.round((s.overall_score ?? 0) * 100);
                    const isActive = i === selectedScoreIdx;
                    return (
                      <button
                        key={s.job_profile_id}
                        onClick={() => setSelectedScoreIdx(i)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors ${
                          isActive
                            ? 'bg-primary text-white border-primary'
                            : 'bg-ds-bg text-ds-text border-ds-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        <span className="truncate max-w-[110px]">{title}</span>
                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-btn text-xs font-mono ${
                          isActive ? 'bg-white/20 text-white' : `${BAND_STYLES[s.band] || 'bg-ds-bg text-ds-textMuted'}`
                        }`}>
                          {pct}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active score breakdown */}
              {activeScore && (
                <div className="p-5">
                  {scores.length > 1 && activeScore.job_profiles && (
                    <div className="flex gap-1.5 mb-4">
                      {activeScore.job_profiles.role_type && (
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-btn">
                          {activeScore.job_profiles.role_type}
                        </span>
                      )}
                      {activeScore.job_profiles.seniority && (
                        <span className="text-xs bg-ds-bg text-ds-textMuted px-2 py-0.5 rounded-btn">
                          {activeScore.job_profiles.seniority}
                        </span>
                      )}
                    </div>
                  )}
                  <ScoreBreakdown score={activeScore} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
