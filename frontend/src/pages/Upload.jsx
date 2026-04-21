import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { uploadResume, getJobs } from '../lib/api';

export default function Upload() {
  const [searchParams] = useSearchParams();
  const [file, setFile]       = useState(null);
  const [jobId, setJobId]     = useState(searchParams.get('jobId') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });

  const handleFile = (f) => {
    setError('');
    if (!f) return;
    const ok = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!ok.includes(f.type)) { setError('Only PDF and DOCX files are supported.'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    if (!jobId) { setError('Please select a job profile before uploading.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await uploadResume(file, jobId);
      navigate(`/resumes/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>

      {/* Job profile selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Profile <span className="text-red-500">*</span>
        </label>
        <select
          value={jobId}
          onChange={e => { setJobId(e.target.value); setError(''); }}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">— Select a job profile —</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
        {jobs.length === 0 && (
          <p className="mt-1 text-xs text-gray-400">
            No job profiles yet.{' '}
            <a href="/jobs/new" className="text-indigo-600 hover:underline">Create one first.</a>
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        <div className="text-4xl mb-3">📄</div>
        {file ? (
          <p className="font-medium text-indigo-600">{file.name}</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">Drop your resume here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse — PDF or DOCX, max 10MB</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Parsing & scoring resume...' : 'Upload & Parse'}
      </button>
    </div>
  );
}
