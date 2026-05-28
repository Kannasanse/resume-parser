'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

export default function RedactPage() {
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(files) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setMatches([]);
    setSearchTerm('');
    setError('');
  }

  async function handleFind() {
    if (!file || !searchTerm.trim()) return;
    setSearching(true);
    setMatches([]);
    setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const found = [];
      const term = searchTerm.toLowerCase();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        for (const item of content.items) {
          if (item.str.toLowerCase().includes(term)) {
            found.push({
              page: i - 1,
              x: item.transform[4],
              y: item.transform[5],
              width: item.width || 50,
              height: Math.abs(item.height) || 12,
              text: item.str,
            });
          }
        }
      }
      setMatches(found);
      if (found.length === 0) setError('No matches found.');
    } catch {
      setError('Failed to search PDF.');
    } finally {
      setSearching(false);
    }
  }

  async function handleRedact() {
    if (!file || !matches.length) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      for (const m of matches) {
        const page = doc.getPage(m.page);
        page.drawRectangle({
          x: m.x - 1,
          y: m.y - 1,
          width: Math.max(m.width + 2, 20),
          height: Math.max(m.height + 2, 8),
          color: rgb(0, 0, 0),
          opacity: 1,
        });
      }
      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redacted-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to apply redactions.');
    } finally {
      setProcessing(false);
    }
  }

  // Group matches by page
  const matchesByPage = matches.reduce((acc, m) => {
    const key = m.page;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const uniquePages = Object.keys(matchesByPage).length;

  return (
    <ToolPageLayout
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="15" x2="11" y2="15"/>
        </svg>
      }
      title="Redact PDF Text"
      description="Find text in your PDF and cover it with black redaction rectangles."
      parentHref="/utilities/pdf"
      parentLabel="PDF Tools"
    >
      {!file && (
        <FileDropZone
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          maxSizeMB={100}
          onFiles={handleFiles}
        />
      )}

      {(searching || processing) && (
        <ProcessingState
          message={searching ? 'Searching for matches…' : 'Applying redactions…'}
        />
      )}

      {file && !searching && !processing && (
        <div className="space-y-5">
          {/* File name */}
          <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>

          {/* Warning banner */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
            <div className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
              <AlertIcon />
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Note:</strong> This tool redraws over text in the visual layer. It does not cryptographically remove the underlying text data.
            </p>
          </div>

          {/* Search input */}
          <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 space-y-3">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Text to Redact</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFind()}
                placeholder="Enter text to find and redact…"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[rgba(255,255,255,0.06)] border border-[#D1DCE8] dark:border-white/10 rounded-lg text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:border-[#185FA5] transition-colors"
              />
              <button
                onClick={handleFind}
                disabled={!searchTerm.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SearchIcon />
                Find
              </button>
            </div>
          </div>

          {/* Match results */}
          {matches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">
                  Found <span className="text-[#185FA5]">{matches.length}</span> match{matches.length !== 1 ? 'es' : ''} across{' '}
                  <span className="text-[#185FA5]">{uniquePages}</span> page{uniquePages !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={handleRedact}
                  className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Apply Redactions →
                </button>
              </div>

              {/* Per-page summary */}
              <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 space-y-2">
                {Object.entries(matchesByPage)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([pageIdx, pageMatches]) => (
                    <div key={pageIdx} className="flex items-start gap-3">
                      <span className="shrink-0 text-xs font-semibold text-[#185FA5] bg-[#185FA5]/10 px-2 py-0.5 rounded">
                        Page {Number(pageIdx) + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-[#6B7280]">
                          {pageMatches.length} match{pageMatches.length !== 1 ? 'es' : ''}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pageMatches.slice(0, 4).map((m, i) => (
                            <span
                              key={i}
                              className="inline-block text-xs bg-black text-white px-1.5 py-0.5 rounded font-mono max-w-[120px] truncate"
                              title={m.text}
                            >
                              {m.text.length > 20 ? m.text.slice(0, 20) + '…' : m.text}
                            </span>
                          ))}
                          {pageMatches.length > 4 && (
                            <span className="text-xs text-[#9CA3AF]">+{pageMatches.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            onClick={() => { setFile(null); setMatches([]); setSearchTerm(''); setError(''); }}
            className="text-sm text-[#9CA3AF] hover:text-[#185FA5] transition-colors"
          >
            ← Use a different file
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
