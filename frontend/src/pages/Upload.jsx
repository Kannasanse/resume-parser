import { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { uploadResume, getJobs } from '../lib/api';

const ALLOWED = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function fileId(f) { return `${f.name}-${f.size}`; }

export default function Upload() {
  const [searchParams] = useSearchParams();
  const [files, setFiles]   = useState([]);   // { id, file, status, resumeId, error }
  const [jobId, setJobId]   = useState(searchParams.get('jobId') || '');
  const [dragging, setDragging] = useState(false);
  const [jobError, setJobError] = useState('');
  const inputRef = useRef();

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    setFiles(prev => {
      const existingIds = new Set(prev.map(f => f.id));
      const next = incoming
        .filter(f => ALLOWED.includes(f.type))
        .filter(f => !existingIds.has(fileId(f)))
        .map(f => ({ id: fileId(f), file: f, status: 'pending', resumeId: null, error: null }));
      return [...prev, ...next];
    });
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const pendingCount   = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const doneCount      = files.filter(f => f.status === 'done').length;
  const errorCount     = files.filter(f => f.status === 'error').length;
  const isUploading    = uploadingCount > 0;
  const allDone        = files.length > 0 && doneCount + errorCount === files.length;

  const handleUploadAll = async () => {
    if (!jobId) { setJobError('Please select a job profile before uploading.'); return; }
    setJobError('');

    const pending = files.filter(f => f.status === 'pending');
    for (const entry of pending) {
      setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'uploading' } : f));
      try {
        const { data } = await uploadResume(entry.file, jobId);
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'done', resumeId: data.id } : f
        ));
      } catch (err) {
        const msg = err.response?.data?.error || 'Upload failed';
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'error', error: msg } : f
        ));
      }
    }
  };

  const selectedJob = jobs.find(j => j.id === jobId);

  const STATUS_STYLES = {
    pending:   'bg-ds-bg text-ds-textMuted',
    uploading: 'bg-secondary-light text-secondary',
    done:      'bg-ds-successLight text-ds-success',
    error:     'bg-ds-dangerLight text-ds-danger',
  };
  const STATUS_LABEL = { pending: 'Pending', uploading: 'Uploading…', done: 'Done', error: 'Error' };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="font-heading text-2xl font-bold text-ds-text">Upload Resumes</h1>

      {/* Job selector */}
      <div className="bg-ds-card rounded border border-ds-border p-5 space-y-3">
        <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide">
          Job Profile <span className="text-ds-danger">*</span>
        </label>
        <select
          value={jobId}
          onChange={e => { setJobId(e.target.value); setJobError(''); }}
          className="w-full border border-ds-inputBorder rounded px-3 py-2.5 text-sm bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        >
          <option value="">— Select a job profile —</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
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
        {jobError && <p className="text-sm text-ds-danger">{jobError}</p>}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-primary bg-primary-light' : 'border-ds-inputBorder hover:border-primary hover:bg-primary-light'
        }`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden"
          onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        <div className="text-3xl mb-3">↑</div>
        <p className="font-medium text-ds-text">Drop resumes here or click to browse</p>
        <p className="text-sm text-ds-textMuted mt-1">PDF or DOCX · max 10 MB each · multiple files supported</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-ds-card rounded border border-ds-border divide-y divide-ds-border">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide">
              {files.length} file{files.length !== 1 ? 's' : ''}
              {isUploading && ` · uploading ${doneCount + errorCount + 1} of ${files.length}`}
              {allDone && ` · ${doneCount} succeeded, ${errorCount} failed`}
            </p>
            {!isUploading && !allDone && (
              <button onClick={() => setFiles([])}
                className="text-xs text-ds-textMuted hover:text-ds-danger transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* Rows */}
          {files.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ds-text truncate">{entry.file.name}</p>
                {entry.error && <p className="text-xs text-ds-danger mt-0.5">{entry.error}</p>}
              </div>

              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-btn flex-shrink-0 ${STATUS_STYLES[entry.status]}`}>
                {entry.status === 'uploading'
                  ? <span className="flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading…
                    </span>
                  : STATUS_LABEL[entry.status]
                }
              </span>

              {entry.status === 'done' && entry.resumeId && (
                <Link to={`/resumes/${entry.resumeId}`}
                  className="text-xs text-primary hover:underline flex-shrink-0">
                  View →
                </Link>
              )}

              {entry.status === 'pending' && (
                <button onClick={() => removeFile(entry.id)}
                  className="text-ds-textMuted hover:text-ds-danger text-lg leading-none flex-shrink-0">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {files.length > 0 && !allDone && (
        <button
          onClick={handleUploadAll}
          disabled={isUploading || pendingCount === 0}
          className="w-full bg-primary text-white py-3 rounded-btn font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading
            ? <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading…
              </span>
            : `Upload ${pendingCount} Resume${pendingCount !== 1 ? 's' : ''}`
          }
        </button>
      )}

      {allDone && (
        <div className="flex gap-3">
          <Link to="/resumes"
            className="flex-1 text-center bg-primary text-white py-3 rounded-btn font-semibold hover:bg-primary-dark transition-colors">
            View All Profiles
          </Link>
          <button onClick={() => setFiles([])}
            className="px-5 py-3 rounded-btn border border-ds-border text-sm text-ds-textMuted hover:bg-ds-card transition-colors">
            Upload More
          </button>
        </div>
      )}
    </div>
  );
}
