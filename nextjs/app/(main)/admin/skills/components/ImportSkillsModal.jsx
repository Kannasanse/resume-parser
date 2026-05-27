'use client';
import { useState, useRef } from 'react';

// ── Client-side file parsers ──────────────────────────────────────────────────

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  });
}

function parseJSON(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.skills)) return data.skills;
  throw new Error('JSON must be an array or { "skills": [...] }');
}

function parseFile(filename, text) {
  const looksJSON = text.trimStart().startsWith('[') || text.trimStart().startsWith('{');
  if (filename.endsWith('.json') || looksJSON) return parseJSON(text);
  return parseCSV(text);
}

// ── Sample file download ──────────────────────────────────────────────────────

function downloadSample(type) {
  let content, filename, mime;
  if (type === 'csv') {
    content = [
      'name,slug,category,subcategory,aliases,description,is_active,is_trending',
      'React,react,Frontend,JavaScript,"ReactJS|React.js",JavaScript UI library,true,true',
      'Python,python,Programming,Backend,"Python3|py",General-purpose language,true,true',
      'Docker,docker,DevOps,Containers,,Container platform,true,false',
    ].join('\n');
    filename = 'skills_sample.csv';
    mime = 'text/csv';
  } else {
    content = JSON.stringify([
      { name: 'React', slug: 'react', category: 'Frontend', subcategory: 'JavaScript', aliases: ['ReactJS', 'React.js'], description: 'JavaScript UI library', is_active: true, is_trending: true },
      { name: 'Python', slug: 'python', category: 'Programming', subcategory: 'Backend', aliases: ['Python3', 'py'], description: 'General-purpose language', is_active: true, is_trending: true },
      { name: 'Docker', slug: 'docker', category: 'DevOps', subcategory: 'Containers', aliases: [], description: 'Container platform', is_active: true, is_trending: false },
    ], null, 2);
    filename = 'skills_sample.json';
    mime = 'application/json';
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImportSkillsModal({ open, onClose, onImported }) {
  const [file, setFile]         = useState(null);
  const [rows, setRows]         = useState([]);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult]     = useState(null);
  const fileRef = useRef(null);

  const reset = () => {
    setFile(null);
    setRows([]);
    setParseError('');
    setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const processFile = (f) => {
    setFile(f);
    setResult(null);
    setParseError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setRows(parseFile(f.name, e.target.result));
      } catch (err) {
        setParseError(`Could not parse file: ${err.message}`);
        setRows([]);
      }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleImport = async () => {
    if (!file || importing) return;
    setImporting(true);
    setParseError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/v1/admin/skills/import', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Import failed');
      setResult(d);
      if (d.imported > 0) onImported?.();
    } catch (err) {
      setParseError(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  const validRows   = rows.filter(r => (r.name || '').trim());
  const invalidRows = rows.filter(r => !(r.name || '').trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative bg-white dark:bg-[#111F35] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)] dark:border-white/10 flex-shrink-0">
          <h2 className="font-bold text-base font-heading text-[var(--c-text)]">Import Skills</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--c-text-muted)] hover:text-[var(--c-text)] text-xl leading-none p-1 rounded"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Format hint */}
          {!file && (
            <div className="text-xs bg-[var(--c-bg-subtle,#F4F8FC)] dark:bg-white/5 border border-[var(--c-border)] dark:border-white/10 rounded-xl p-4 space-y-1.5">
              <p className="font-semibold text-[var(--c-text)] text-xs mb-2">Accepted formats</p>
              <p className="text-[var(--c-text-muted)]">
                <span className="font-medium text-[var(--c-text)]">CSV</span> — headers:{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">name*</code>{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">slug</code>{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">category</code>{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">subcategory</code>{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">aliases</code>{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">description</code>{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">is_active</code>{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">is_trending</code>
              </p>
              <p className="text-[var(--c-text-muted)]">
                Aliases column: pipe-separated values, e.g.{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">ReactJS|React.js</code>
              </p>
              <p className="text-[var(--c-text-muted)]">
                <span className="font-medium text-[var(--c-text)]">JSON</span> — array{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">[{'{'}...{'}'}]</code>
                {' '}or{' '}
                <code className="font-mono bg-black/5 dark:bg-white/10 px-1 rounded">{'{"skills":[...]}'}</code>
                {' '}with the same fields
              </p>
              <p className="text-[var(--c-text-muted)] pt-1">* required — rows missing name are skipped</p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => downloadSample('csv')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#185FA5] dark:text-[#5B9FD4] hover:underline"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download sample CSV
                </button>
                <span className="text-[var(--c-border)] dark:text-white/20">|</span>
                <button
                  type="button"
                  onClick={() => downloadSample('json')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#185FA5] dark:text-[#5B9FD4] hover:underline"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download sample JSON
                </button>
              </div>
            </div>
          )}

          {/* Drop zone */}
          {!file && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-[var(--c-primary)] bg-[var(--c-primary)]/5'
                  : 'border-[var(--c-border)] dark:border-white/15 hover:border-[var(--c-primary)] hover:bg-[var(--c-primary)]/5'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".json,.csv,application/json,text/csv,text/plain"
                className="hidden"
                onChange={e => e.target.files[0] && processFile(e.target.files[0])}
              />
              <svg className="mx-auto mb-3 text-[var(--c-text-muted)]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="text-sm font-medium text-[var(--c-text)]">Drop a JSON or CSV file here</p>
              <p className="text-xs text-[var(--c-text-muted)] mt-1">or click to browse</p>
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
              {parseError}
            </div>
          )}

          {/* Preview table */}
          {file && !result && rows.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--c-text)] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] underline flex-shrink-0"
                >
                  Change file
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
                  {validRows.length} ready to import
                </span>
                {invalidRows.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                    {invalidRows.length} missing name (will be skipped)
                  </span>
                )}
              </div>

              <div className="border border-[var(--c-border)] dark:border-white/10 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-[var(--c-text-muted)] w-8">#</th>
                        <th className="text-left px-3 py-2 font-semibold text-[var(--c-text-muted)]">Name</th>
                        <th className="text-left px-3 py-2 font-semibold text-[var(--c-text-muted)]">Category</th>
                        <th className="text-left px-3 py-2 font-semibold text-[var(--c-text-muted)]">Aliases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 200).map((row, i) => {
                        const hasName = (row.name || '').trim();
                        return (
                          <tr
                            key={i}
                            className={`border-t border-[var(--c-border)] dark:border-white/5 ${!hasName ? 'opacity-40' : ''}`}
                          >
                            <td className="px-3 py-1.5 text-[var(--c-text-muted)]">{i + 1}</td>
                            <td className="px-3 py-1.5 font-medium text-[var(--c-text)]">
                              {hasName
                                ? row.name
                                : <span className="text-red-400 italic">missing</span>
                              }
                            </td>
                            <td className="px-3 py-1.5 text-[var(--c-text-muted)]">{row.category || '—'}</td>
                            <td className="px-3 py-1.5 text-[var(--c-text-muted)] max-w-[12rem] truncate">
                              {row.aliases || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {rows.length > 200 && (
                    <p className="text-xs text-center text-[var(--c-text-muted)] py-2">
                      …and {rows.length - 200} more rows (all will be imported)
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* No rows warning */}
          {file && !result && rows.length === 0 && !parseError && (
            <p className="text-sm text-[var(--c-text-muted)] text-center py-4">
              No data rows found in this file.
            </p>
          )}

          {/* Results */}
          {result && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold">
                  {result.imported} imported
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[var(--c-text-muted)] text-sm font-semibold">
                  {result.skipped} skipped (already exist)
                </span>
                {result.failed > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold">
                    {result.failed} failed
                  </span>
                )}
              </div>

              {(result.skipped > 0 || result.failed > 0) && (
                <div className="border border-[var(--c-border)] dark:border-white/10 rounded-xl overflow-hidden">
                  <p className="text-xs font-semibold text-[var(--c-text-muted)] px-3 py-2 bg-gray-50 dark:bg-white/5 border-b border-[var(--c-border)] dark:border-white/5">
                    Skipped / failed rows
                  </p>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <tbody>
                        {result.results.filter(r => r.status !== 'imported').map((r, i) => (
                          <tr key={i} className="border-t border-[var(--c-border)] dark:border-white/5 first:border-0">
                            <td className="px-3 py-1.5 font-medium text-[var(--c-text)] w-1/3">{r.name || <span className="italic text-[var(--c-text-muted)]">—</span>}</td>
                            <td className="px-3 py-1.5 w-24">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                r.status === 'skipped'
                                  ? 'bg-gray-100 dark:bg-white/10 text-[var(--c-text-muted)]'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-[var(--c-text-muted)]">{r.reason || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--c-border)] dark:border-white/10 flex-shrink-0 bg-white dark:bg-[#111F35]">
          {result ? (
            <button
              type="button"
              onClick={handleClose}
              className="bg-[var(--c-primary)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-[var(--c-text-muted)] border border-[var(--c-border)] dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || validRows.length === 0 || importing}
                className="bg-[var(--c-primary)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importing
                  ? 'Importing…'
                  : `Import ${validRows.length} skill${validRows.length !== 1 ? 's' : ''}`
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
