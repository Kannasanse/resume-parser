import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJob, deleteJob, getJobCandidates, rescoreCandidate } from '../lib/api';
import ScoreBreakdown from '../components/ScoreBreakdown';

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-100 text-purple-700',
  Advanced:      'bg-blue-100 text-blue-700',
  Intermediate:  'bg-green-100 text-green-700',
  Beginner:      'bg-yellow-100 text-yellow-700',
  'Nice-to-have':'bg-gray-100 text-gray-500',
};

const SENIORITY_LABELS = { entry: 'Entry', junior: 'Junior', mid: 'Mid', senior: 'Senior' };
const ROLE_TYPE_LABELS  = { technical: 'Technical', 'entry-level': 'Entry-level', specialized: 'Specialized' };

export default function JobProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [expandedId, setExpandedId] = useState(null);
  const [rescoring, setRescoring] = useState(null);

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

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (error || !job) return <p className="text-red-500">Job profile not found.</p>;

  const required   = job.job_skills?.filter(s => s.is_required) || [];
  const niceToHave = job.job_skills?.filter(s => !s.is_required) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/jobs')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <div className="flex gap-2">
          <Link
            to={`/upload?jobId=${id}`}
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700"
          >
            Upload Resume
          </Link>
          <button onClick={handleDelete}
            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-xs text-gray-400 mt-1">{new Date(job.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2 text-xs">
            {job.role_type && (
              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
                {ROLE_TYPE_LABELS[job.role_type] || job.role_type}
              </span>
            )}
            {job.seniority && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                {SENIORITY_LABELS[job.seniority] || job.seniority}
              </span>
            )}
          </div>
        </div>

        {/* Scoring params summary */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 border-t pt-4">
          {job.required_years_experience > 0 && (
            <span>{job.required_years_experience}+ yrs experience</span>
          )}
          {job.required_degree && job.required_degree !== 'None' && (
            <span>Min degree: {job.required_degree}{job.required_field ? ` in ${job.required_field}` : ''}</span>
          )}
          {job.required_certs?.length > 0 && (
            <span>Certs: {job.required_certs.join(', ')}</span>
          )}
        </div>

        {job.description && (
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-line border-t pt-4">{job.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {['overview', 'candidates'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t}
            {t === 'candidates' && candidates.length > 0 && (
              <span className="ml-1.5 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">{candidates.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <>
          {required.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Required Skills <span className="text-sm font-normal text-gray-400">({required.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {required.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5">
                    <span className="text-sm font-medium text-gray-800">{s.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PROFICIENCY_COLORS[s.proficiency]}`}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {niceToHave.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Nice-to-have Skills <span className="text-sm font-normal text-gray-400">({niceToHave.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {niceToHave.map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5">
                    <span className="text-sm font-medium text-gray-800">{s.skill}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PROFICIENCY_COLORS[s.proficiency]}`}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.job_skills?.length === 0 && (
            <p className="text-center text-gray-400 py-8">No skills recorded for this job profile.</p>
          )}
        </>
      )}

      {/* Candidates tab */}
      {tab === 'candidates' && (
        <div className="space-y-4">
          {candidatesLoading && <p className="text-gray-500 text-sm">Loading candidates...</p>}

          {!candidatesLoading && candidates.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 text-sm">No resumes submitted for this job yet.</p>
              <Link to={`/upload?jobId=${id}`}
                className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                Upload the first resume →
              </Link>
            </div>
          )}

          {candidates.map(c => (
            <div key={c.resume_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Candidate row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 truncate">{c.candidate_name || c.file_name}</p>
                    {c.candidate_name && <p className="text-xs text-gray-400 truncate">{c.file_name}</p>}
                  </div>
                  {c.email && <p className="text-xs text-gray-500 mt-0.5">{c.email}</p>}
                  {c.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.skills.slice(0, 6).map(s => (
                        <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {c.skills.length > 6 && <span className="text-xs text-gray-400">+{c.skills.length - 6} more</span>}
                    </div>
                  )}
                </div>

                {/* Score compact view */}
                <div className="flex-shrink-0">
                  {c.score
                    ? <ScoreBreakdown score={c.score} compact />
                    : <span className="text-xs text-gray-400">Not scored</span>
                  }
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === c.resume_id ? null : c.resume_id)}
                    className="text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    {expandedId === c.resume_id ? 'Hide' : 'Details'}
                  </button>
                  <button
                    onClick={() => handleRescore(c.resume_id)}
                    disabled={rescoring === c.resume_id}
                    className="text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {rescoring === c.resume_id ? 'Scoring...' : 'Rescore'}
                  </button>
                  <Link to={`/resumes/${c.resume_id}`}
                    className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100">
                    View
                  </Link>
                </div>
              </div>

              {/* Expanded score breakdown */}
              {expandedId === c.resume_id && c.score && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <ScoreBreakdown score={c.score} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
