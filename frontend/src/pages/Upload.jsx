import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { uploadResume, getJobs } from '../lib/api';

export default function Upload() {
  const [searchParams] = useSearchParams();
  const [file, setFile]         = useState(null);
  const [jobId, setJobId]       = useState(searchParams.get('jobId') || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
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

  const selectedJob = jobs.find(j => j.id === jobId);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="font-heading text-2xl font-bold text-ds-text">Upload Resume</h1>

      {/* Job selector */}
      <div className="bg-ds-card rounded border border-ds-border p-5 space-y-3">
        <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide">
          Job Profile <span className="text-ds-danger">*</span>
        </label>
        <select
          value={jobId}
          onChange={e => { setJobId(e.target.value); setError(''); }}
          className="w-full border border-ds-inputBorder rounded px-3 py-2.5 text-sm bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        >
          <option value="">— Select a job profile —</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
        {jobs.length === 0 && (
          <p className="text-xs text-ds-textMuted">
            No job profiles yet.{' '}
            <Link to="/jobs/new" className="text-primary hover:underline">Create one first.</Link>
          </p>
        )}
        {selectedJob && (
          <div className="flex gap-2">
            {selectedJob.role_type && (
              <span className="text-xs bg-primary-light text-primary px-2.5 py-0.5 rounded-btn font-medium">
                {selectedJob.role_type}
              </span>
            )}
            {selectedJob.seniority && (
              <span className="text-xs bg-ds-bg text-ds-textMuted px-2.5 py-0.5 rounded-btn">
                {selectedJob.seniority}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded p-12 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-primary bg-primary-light'
            : file
              ? 'border-primary bg-primary-light'
              : 'border-ds-inputBorder hover:border-primary hover:bg-primary-light'
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        <div className="text-3xl mb-3">{file ? '✓' : '↑'}</div>
        {file ? (
          <div>
            <p className="font-semibold text-primary">{file.name}</p>
            <p className="text-xs text-ds-textMuted mt-1">Click to replace</p>
          </div>
        ) : (
          <>
            <p className="font-medium text-ds-text">Drop your resume here</p>
            <p className="text-sm text-ds-textMuted mt-1">or click to browse — PDF or DOCX, max 10 MB</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-ds-danger">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full bg-primary text-white py-3 rounded-btn font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Parsing &amp; scoring…
          </span>
        ) : 'Upload & Parse'}
      </button>
    </div>
  );
}
