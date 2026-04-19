import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getJobs, deleteJob } from '../lib/api';

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-100 text-purple-700',
  Advanced:      'bg-blue-100 text-blue-700',
  Intermediate:  'bg-green-100 text-green-700',
  Beginner:      'bg-yellow-100 text-yellow-700',
  'Nice-to-have':'bg-gray-100 text-gray-500',
};

export default function JobProfiles() {
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this job profile?')) return;
    await deleteJob(id);
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  if (isLoading) return <p className="text-gray-500">Loading job profiles...</p>;
  if (error)     return <p className="text-red-500">Failed to load job profiles.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Profiles ({jobs.length})</h1>
        <Link to="/jobs/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          + New Profile
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No job profiles yet.</p>
          <Link to="/jobs/new" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
            Create your first job profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
              <div>
                <p className="font-semibold text-gray-900">{job.title}</p>
                {job.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {new Date(job.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-auto">
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex-1 text-center text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
