import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJob, deleteJob } from '../lib/api';

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-100 text-purple-700',
  Advanced:      'bg-blue-100 text-blue-700',
  Intermediate:  'bg-green-100 text-green-700',
  Beginner:      'bg-yellow-100 text-yellow-700',
  'Nice-to-have':'bg-gray-100 text-gray-500',
};

export default function JobProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
  });

  const handleDelete = async () => {
    if (!confirm('Delete this job profile?')) return;
    await deleteJob(id);
    navigate('/jobs');
  };

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (error || !job) return <p className="text-red-500">Job profile not found.</p>;

  const required    = job.job_skills?.filter(s => s.is_required) || [];
  const niceToHave  = job.job_skills?.filter(s => !s.is_required) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/jobs')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <button onClick={handleDelete}
          className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600">
          Delete
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
        <p className="text-xs text-gray-400 mt-1">{new Date(job.created_at).toLocaleDateString()}</p>
        {job.description && (
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-line border-t pt-4">{job.description}</p>
        )}
      </div>

      {/* Required Skills */}
      {required.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Required Skills
            <span className="ml-2 text-sm font-normal text-gray-400">({required.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {required.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-gray-800">{s.skill}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PROFICIENCY_COLORS[s.proficiency]}`}>
                  {s.proficiency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nice-to-have Skills */}
      {niceToHave.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Nice-to-have Skills
            <span className="ml-2 text-sm font-normal text-gray-400">({niceToHave.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {niceToHave.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-gray-800">{s.skill}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PROFICIENCY_COLORS[s.proficiency]}`}>
                  {s.proficiency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {job.job_skills?.length === 0 && (
        <p className="text-center text-gray-400 py-8">No skills recorded for this job profile.</p>
      )}
    </div>
  );
}
