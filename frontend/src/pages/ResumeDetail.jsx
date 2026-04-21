import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getResume, deleteResume, reparseResume, exportResume } from '../lib/api';

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
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

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (error || !resume) return <p className="text-red-500">Resume not found.</p>;

  const pd = resume.parsed_data?.[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/resumes')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => handleExport('json')} className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50">
            Export JSON
          </button>
          <button onClick={() => handleExport('csv')} className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50">
            Export CSV
          </button>
          <button onClick={handleReparse} className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50">
            Reparse
          </button>
          <button onClick={handleDelete} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <Section title="Candidate">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-400">Name</p><p className="font-medium">{pd?.candidate_name || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Email</p><p>{pd?.email || '—'}</p></div>
          <div><p className="text-xs text-gray-400">Phone</p><p>{pd?.phone || '—'}</p></div>
          <div><p className="text-xs text-gray-400">File</p><p className="text-sm text-gray-600">{resume.file_name}</p></div>
        </div>
        {pd?.summary && <p className="mt-4 text-sm text-gray-600 border-t pt-4">{pd.summary}</p>}
      </Section>

      {/* Skills */}
      {pd?.skills?.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {pd.skills.map(skill => (
              <span key={skill} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Work Experience */}
      {pd?.work_experience?.length > 0 && (
        <Section title="Work Experience">
          <div className="space-y-4">
            {pd.work_experience.map((w, i) => (
              <div key={i} className="border-l-2 border-indigo-200 pl-4">
                <p className="font-semibold text-gray-800">{w.title} — {w.company}</p>
                <p className="text-sm text-gray-400">{w.start_date} – {w.end_date || 'Present'}</p>
                {w.description && <p className="text-sm text-gray-600 mt-1">{w.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {pd?.education?.length > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {pd.education.map((e, i) => (
              <div key={i}>
                <p className="font-semibold text-gray-800">{e.institution}</p>
                <p className="text-sm text-gray-500">
                  {e.degree}{e.field ? ` in ${e.field}` : ''}{e.graduation_year ? ` · ${e.graduation_year}` : ''}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
