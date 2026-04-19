import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
};

export default function ResumeCard({ resume, onDelete }) {
  const pd = resume.parsed_data?.[0];
  const status = resume.status;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900 truncate">{pd?.candidate_name || 'Unknown'}</p>
          <p className="text-sm text-gray-500 truncate">{pd?.email || resume.file_name}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
          {status}
        </span>
      </div>

      {pd?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pd.skills.slice(0, 5).map(skill => (
            <span key={skill} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
          {pd.skills.length > 5 && (
            <span className="text-xs text-gray-400">+{pd.skills.length - 5} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <Link
          to={`/resumes/${resume.id}`}
          className="flex-1 text-center text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
        >
          View
        </Link>
        <button
          onClick={() => onDelete(resume.id)}
          className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
