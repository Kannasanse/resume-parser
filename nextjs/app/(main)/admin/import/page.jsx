'use client';
import { useState, useRef, useCallback } from 'react';

function parseCsvText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { error: 'CSV must have a header row and at least one data row.' };
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const req = ['first_name', 'last_name', 'email'];
  const missing = req.filter(c => !header.includes(c));
  if (missing.length) return { error: `Missing columns: ${missing.join(', ')}` };
  const rows = lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v => v.trim());
    const row = {};
    header.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    return { ...row, _line: i + 2 };
  });
  return { rows, header };
}

export default function AdminImportPage() {
  const [drag, setDrag]       = useState(false);
  const [preview, setPreview] = useState(null); // { rows, header }
  const [parseError, setParseError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState('');
  const fileRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setParseError('Please upload a .csv file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCsvText(text);
      if (parsed.error) { setParseError(parsed.error); setPreview(null); return; }
      setParseError('');
      setValidationErrors([]);
      setResults(null);
      setServerError('');
      setPreview(parsed);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (!preview?.rows?.length) return;
    setUploading(true);
    setServerError('');
    setValidationErrors([]);
    setResults(null);
    try {
      const res = await fetch('/api/v1/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: preview.rows }),
      });
      const data = await res.json();
      if (res.status === 422) {
        setValidationErrors(data.errors || []);
        return;
      }
      if (!res.ok) { setServerError(data.error || 'Import failed.'); return; }
      setResults(data);
      setPreview(null);
    } catch {
      setServerError('Import failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const res = await fetch('/api/v1/admin/import');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text font-heading">Bulk Import Users</h1>
          <p className="text-sm text-ds-textMuted mt-1">Upload a CSV to invite multiple users at once. Max 500 rows.</p>
        </div>
        <button onClick={handleDownloadTemplate}
          className="text-sm text-primary hover:underline font-medium flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download template
        </button>
      </div>

      {/* Drop zone */}
      {!preview && !results && (
        <div
          onDragEnter={() => setDrag(true)}
          onDragLeave={() => setDrag(false)}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${drag ? 'border-primary bg-primary/5' : 'border-ds-border hover:border-ds-borderStrong'}`}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => handleFile(e.target.files?.[0])} />
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-ds-textMuted mb-3">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="text-sm font-medium text-ds-text">Drag & drop a CSV file here</p>
          <p className="text-xs text-ds-textMuted mt-1">or click to browse</p>
          {parseError && <p className="text-sm text-ds-danger mt-3">{parseError}</p>}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ds-text font-medium">{preview.rows.length} row{preview.rows.length !== 1 ? 's' : ''} parsed</p>
            <button onClick={() => { setPreview(null); setValidationErrors([]); }}
              className="text-xs text-ds-textMuted hover:text-ds-text">Change file</button>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 rounded-lg p-4 space-y-1">
              <p className="text-sm font-semibold text-ds-danger">{validationErrors.length} validation error{validationErrors.length !== 1 ? 's' : ''}</p>
              {validationErrors.map((e, i) => (
                <p key={i} className="text-xs text-ds-danger">Line {e.line}: {e.email || '(empty)'} — {e.errors?.join(', ')}</p>
              ))}
              <p className="text-xs text-ds-textMuted mt-2">Fix the errors in your CSV and re-upload.</p>
            </div>
          )}

          {serverError && <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{serverError}</p>}

          <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-ds-border bg-ds-bg">
                  <tr>
                    {['first_name', 'last_name', 'email', 'role'].map(col => (
                      <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">
                        {col.replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ds-border">
                  {preview.rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-ds-bg/50">
                      <td className="px-4 py-2 text-ds-text">{row.first_name || '—'}</td>
                      <td className="px-4 py-2 text-ds-text">{row.last_name || '—'}</td>
                      <td className="px-4 py-2 text-ds-textMuted">{row.email || '—'}</td>
                      <td className="px-4 py-2 text-ds-textMuted capitalize">{row.role || 'user'}</td>
                    </tr>
                  ))}
                  {preview.rows.length > 20 && (
                    <tr><td colSpan={4} className="px-4 py-2 text-xs text-ds-textMuted text-center">… and {preview.rows.length - 20} more rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={handleImport} disabled={uploading}
            className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {uploading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Importing…</span>
              : `Import ${preview.rows.length} User${preview.rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Invited', count: results.counts?.invited || 0, color: 'text-ds-success bg-ds-successLight' },
              { label: 'Skipped', count: results.counts?.skipped || 0, color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
              { label: 'Errors',  count: results.counts?.error   || 0, color: 'text-ds-danger bg-ds-dangerLight' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-lg p-4 text-center ${color}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-ds-border bg-ds-bg">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border">
                {results.results?.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-ds-text">{r.email}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        r.status === 'invited' ? 'bg-ds-successLight text-ds-success' :
                        r.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                        'bg-ds-dangerLight text-ds-danger'
                      }`}>
                        {r.status}
                      </span>
                      {(r.reason || r.warning) && <span className="text-xs text-ds-textMuted ml-2">{r.reason || r.warning}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => setResults(null)}
            className="text-sm text-primary hover:underline">
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
