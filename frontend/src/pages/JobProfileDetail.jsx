import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJob, deleteJob, getJobCandidates, rescoreCandidate } from '../lib/api';
import ScoreBreakdown from '../components/ScoreBreakdown';

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-50 text-purple-700',
  Advanced:      'bg-secondary-light text-secondary',
  Intermediate:  'bg-ds-successLight text-ds-success',
  Beginner:      'bg-ds-warningLight text-ds-warning',
  'Nice-to-have':'bg-ds-bg text-ds-textMuted',
};

const SENIORITY_LABELS = { entry: 'Entry', junior: 'Junior', mid: 'Mid', senior: 'Senior' };
const ROLE_TYPE_LABELS  = { technical: 'Technical', 'entry-level': 'Entry-level', specialized: 'Specialized' };

function ParamTile({ label, value }) {
  if (!value) return null;
  return (
    <div className="bg-ds-bg rounded px-3 py-2">
      <p className="text-xs text-ds-textMuted uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-ds-text mt-0.5">{value}</p>
    </div>
  );
}

export default function JobProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [expandedId, setExpandedId] = useState(null);
  const [rescoring, setRescoring] = useState(null);
  const [filterBand, setFilterBand] = useState('all');
  const [sortBy, setSortBy] = useState('score_desc');

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['job-candidates', id],
    queryFn: () => getJobCandidates(id),
    enabled: tab === 'candidates',
  });

  const handleDelete = async () => {
    if (!confirm('Delete this job profile?')) return;
    await deleteJob(id);
    navigate('/jobs');
  };

  const handleRescore = async (resumeId) => {
    setRescoring(resumeId);
    try {
      await rescoreCandidate(id, resumeId);
      queryClient.invalidateQueries({ queryKey: ['job-candidates', id] });
    } finally {
      setRescoring(null);
    }
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading...</p>;
  if (error || !job) return <p className="text-ds-danger">Job profile not found.</p>;

  const required   = job.job_skills?.filter(s => s.is_required) || [];
  const niceToHave = job.job_skills?.filter(s => !s.is_required) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/jobs')} className="text-sm text-ds-textMuted hover:text-ds-text transition-colors">
          ← Back
        </button>
        <div className="flex gap-2">
          <Link
            to={`/upload?jobId=${id}`}
            className="text-sm bg-primary text-white px-4 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors"
          >
            Upload Resume
          </Link>
          <button onClick={handleDelete}
            className="text-sm bg-ds-dangerLight text-ds-danger border border-ds-dangerLight px-3 py-1.5 rounded-btn hover:bg-ds-danger hover:text-white transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-ds-card rounded border border-ds-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-ds-text">{job.title}</h1>
            <p className="text-xs text-ds-textMuted font-mono mt-1">{new Date(job.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {job.role_type && (
              <span className="bg-primary-light text-primary text-xs px-2.5 py-1 rounded-btn font-medium">
                {ROLE_TYPE_LABELS[job.role_type] || job.role_type}
              </span>
            )}
            {job.seniority && (
              <span className="bg-ds-bg text-ds-textTertiary text-xs px-2.5 py-1 rounded-btn font-medium">
                {SENIORITY_LABELS[job.seniority] || job.seniority}
              </span>
            )}
          </div>
        </div>

        {/* Scoring param tiles */}
        {(job.required_years_experience > 0 || (job.required_degree && job.required_degree !== 'None') || job.required_certs?.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ds-border pt-4">
            {job.required_years_experience > 0 && (
              <ParamTile label="Experience" value={`${job.required_years_experience}+ years`} />
            )}
            {job.required_degree && job.required_degree !== 'None' && (
              <ParamTile label="Min Degree" value={`${job.required_degree}${job.required_field ? ` in ${job.required_field}` : ''}`} />
            )}
            {job.required_certs?.length > 0 && (
              <ParamTile label="Certifications" value={job.required_certs.join(', ')} />
            )}
          </div>
        )}

        {job.description && (
          <div
            className="mt-4 text-sm text-ds-textSecondary border-t border-ds-border pt-4 leading-relaxed rich-content"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ds-border">
        {['overview', 'candidates'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-ds-textMuted hover:text-ds-text'
            }`}>
            {t}
            {t === 'candidates' && candidates.length > 0 && (
              <span className="ml-1.5 bg-primary-light text-primary text-xs px-1.5 py-0.5 rounded-btn">{candidates.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <>
          {required.length > 0 && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">
                Required Skills <span className="text-ds-textMuted font-normal text-sm">({required.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {required.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 border border-ds-border rounded px-3 py-1.5">
                    <span className="text-sm font-medium text-ds-text">{s.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-btn ${PROFICIENCY_COLORS[s.proficiency]}`}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {niceToHave.length > 0 && (
            <div className="bg-ds-card rounded border border-ds-border p-6">
              <h2 className="font-heading text-base font-semibold text-ds-text mb-4">
                Nice-to-have Skills <span className="text-ds-textMuted font-normal text-sm">({niceToHave.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {niceToHave.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 border border-ds-border rounded px-3 py-1.5">
                    <span className="text-sm font-medium text-ds-text">{s.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-btn ${PROFICIENCY_COLORS[s.proficiency]}`}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.job_skills?.length === 0 && (
            <p className="text-center text-ds-textMuted py-8">No skills recorded for this job profile.</p>
          )}
        </>
      )}

      {/* Candidates tab */}
      {tab === 'candidates' && (
        <div className="space-y-3">
          {candidatesLoading && <p className="text-ds-textMuted text-sm">Loading candidates…</p>}

          {!candidatesLoading && candidates.length === 0 && (
            <div className="text-center py-12 bg-ds-card rounded border border-ds-border">
              <p className="text-ds-textMuted text-sm">No resumes submitted for this job yet.</p>
              <Link to={`/upload?jobId=${id}`}
                className="mt-3 inline-block text-sm text-primary hover:underline">
                Upload the first resume →
              </Link>
            </div>
          )}

          {/* Filter + sort toolbar */}
          {!candidatesLoading && candidates.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-ds-card border border-ds-border rounded px-4 py-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'Strong Match', 'Good Match', 'Moderate Match', 'Weak Match'].map(b => (
                  <button key={b} onClick={() => setFilterBand(b)}
                    className={`text-xs px-3 py-1 rounded-btn font-medium transition-colors ${
                      filterBand === b
                        ? 'bg-primary text-white'
                        : 'bg-ds-bg text-ds-textMuted hover:text-ds-text hover:bg-ds-border'
                    }`}>
                    {b === 'all' ? 'All' : b}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-xs border border-ds-inputBorder rounded px-2.5 py-1.5 bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="score_desc">Score: High to Low</option>
                <option value="score_asc">Score: Low to High</option>
                <option value="name">Name A–Z</option>
                <option value="date">Date: Newest</option>
              </select>
            </div>
          )}

          {(() => {
            const filtered = candidates
              .filter(c => filterBand === 'all' || c.score?.band === filterBand)
              .sort((a, b) => {
                if (sortBy === 'score_asc') return (a.score?.overall_score ?? -1) - (b.score?.overall_score ?? -1);
                if (sortBy === 'name') return (a.candidate_name || a.file_name).localeCompare(b.candidate_name || b.file_name);
                if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at);
                return (b.score?.overall_score ?? -1) - (a.score?.overall_score ?? -1);
              });

            if (!candidatesLoading && candidates.length > 0 && filtered.length === 0) {
              return <p className="text-sm text-ds-textMuted text-center py-6">No candidates match the selected filter.</p>;
            }

            return filtered.map(c => (
            <div key={c.resume_id} className="bg-ds-card rounded border border-ds-border overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ds-text truncate">{c.candidate_name || c.file_name}</p>
                    {c.candidate_name && <p className="text-xs text-ds-textMuted truncate">{c.file_name}</p>}
                  </div>
                  {c.email && <p className="text-xs text-ds-textMuted mt-0.5">{c.email}</p>}
                  {c.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.skills.slice(0, 6).map(s => (
                        <span key={s} className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded-btn">{s}</span>
                      ))}
                      {c.skills.length > 6 && <span className="text-xs text-ds-textMuted">+{c.skills.length - 6} more</span>}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {c.score
                    ? <ScoreBreakdown score={c.score} compact />
                    : <span className="text-xs text-ds-textMuted">Not scored</span>
                  }
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === c.resume_id ? null : c.resume_id)}
                    className="text-xs border border-ds-border px-2.5 py-1.5 rounded-btn text-ds-text hover:bg-ds-bg transition-colors"
                  >
                    {expandedId === c.resume_id ? 'Hide' : 'Details'}
                  </button>
                  <button
                    onClick={() => handleRescore(c.resume_id)}
                    disabled={rescoring === c.resume_id}
                    className="text-xs border border-ds-border px-2.5 py-1.5 rounded-btn text-ds-text hover:bg-ds-bg disabled:opacity-50 transition-colors"
                  >
                    {rescoring === c.resume_id ? 'Scoring…' : 'Rescore'}
                  </button>
                  <Link to={`/resumes/${c.resume_id}`}
                    className="text-xs bg-primary-light text-primary px-2.5 py-1.5 rounded-btn hover:bg-primary hover:text-white transition-colors">
                    View
                  </Link>
                </div>
              </div>

              {expandedId === c.resume_id && c.score && (
                <div className="border-t border-ds-border p-5 bg-ds-bg">
                  <ScoreBreakdown score={c.score} />
                </div>
              )}
            </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
