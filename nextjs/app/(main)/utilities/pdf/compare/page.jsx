'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

async function renderFile(f) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const bytes = await f.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 0.8 });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    pages.push(canvas.toDataURL());
  }
  return pages;
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function DropPanel({ label, file, loading, onFiles }) {
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">{label}</p>
      {loading ? (
        <ProcessingState message={`Loading ${label}…`} />
      ) : !file ? (
        <FileDropZone
          accept=".pdf,application/pdf"
          multiple={false}
          maxSizeMB={100}
          onFiles={onFiles}
        />
      ) : (
        <div className="p-3 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
          <p className="text-xs font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
          <button
            onClick={() => onFiles(null)}
            className="mt-1 text-xs text-[#9CA3AF] hover:text-[#185FA5] transition-colors"
          >
            Change file
          </button>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [pagesA, setPagesA] = useState([]);
  const [pagesB, setPagesB] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const totalPages = Math.min(pagesA.length, pagesB.length);

  async function handleFilesA(files) {
    if (!files) {
      setFileA(null);
      setPagesA([]);
      setPageNum(1);
      return;
    }
    const f = files[0];
    if (!f) return;
    setFileA(f);
    setError('');
    setLoading('a');
    try {
      const rendered = await renderFile(f);
      setPagesA(rendered);
      setPageNum(1);
    } catch {
      setError('Failed to load File A.');
    } finally {
      setLoading('');
    }
  }

  async function handleFilesB(files) {
    if (!files) {
      setFileB(null);
      setPagesB([]);
      setPageNum(1);
      return;
    }
    const f = files[0];
    if (!f) return;
    setFileB(f);
    setError('');
    setLoading('b');
    try {
      const rendered = await renderFile(f);
      setPagesB(rendered);
      setPageNum(1);
    } catch {
      setError('Failed to load File B.');
    } finally {
      setLoading('');
    }
  }

  const bothLoaded = pagesA.length > 0 && pagesB.length > 0;

  return (
    <ToolPageLayout
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="9" height="18" rx="2"/>
          <rect x="13" y="3" width="9" height="18" rx="2"/>
        </svg>
      }
      title="Compare PDFs"
      description="View two PDF documents side-by-side to spot differences."
      parentHref="/utilities/pdf"
      parentLabel="PDF Tools"
    >
      <div className="space-y-5">
        {/* Drop zones row */}
        {(!bothLoaded || loading) && (
          <div className="flex flex-col sm:flex-row gap-4">
            <DropPanel
              label="File A"
              file={fileA}
              loading={loading === 'a'}
              onFiles={handleFilesA}
            />
            <div className="hidden sm:flex items-center justify-center">
              <div className="w-px h-full min-h-[80px] bg-[#D1DCE8] dark:bg-white/10" />
            </div>
            <DropPanel
              label="File B"
              file={fileB}
              loading={loading === 'b'}
              onFiles={handleFilesB}
            />
          </div>
        )}

        {/* Side-by-side comparison */}
        {bothLoaded && !loading && (
          <div className="space-y-4">
            {/* File labels + change buttons */}
            <div className="flex gap-4">
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mr-2">File A</span>
                  <span className="text-xs text-[#9CA3AF] truncate">{fileA?.name}</span>
                </div>
                <button
                  onClick={() => { setFileA(null); setPagesA([]); setPageNum(1); }}
                  className="text-xs text-[#9CA3AF] hover:text-[#185FA5] transition-colors ml-2 shrink-0"
                >
                  Change
                </button>
              </div>
              <div className="w-px bg-[#D1DCE8] dark:bg-white/10 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mr-2">File B</span>
                  <span className="text-xs text-[#9CA3AF] truncate">{fileB?.name}</span>
                </div>
                <button
                  onClick={() => { setFileB(null); setPagesB([]); setPageNum(1); }}
                  className="text-xs text-[#9CA3AF] hover:text-[#185FA5] transition-colors ml-2 shrink-0"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Page count mismatch notice */}
            {pagesA.length !== pagesB.length && (
              <p className="text-xs text-[#9CA3AF]">
                File A has {pagesA.length} page{pagesA.length !== 1 ? 's' : ''}, File B has {pagesB.length} page{pagesB.length !== 1 ? 's' : ''}.
                Showing first {totalPages} page{totalPages !== 1 ? 's' : ''}.
              </p>
            )}

            {/* Side-by-side pages */}
            <div className="flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="rounded-xl overflow-hidden border border-[#D1DCE8] dark:border-white/10 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.02)] flex items-center justify-center p-2 min-h-[200px]">
                  {pagesA[pageNum - 1] ? (
                    <img
                      src={pagesA[pageNum - 1]}
                      alt={`File A — Page ${pageNum}`}
                      className="max-w-full object-contain shadow-sm"
                    />
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">No page</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:flex flex-col items-center self-stretch">
                <div className="w-px flex-1 bg-[#D1DCE8] dark:bg-white/10" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="rounded-xl overflow-hidden border border-[#D1DCE8] dark:border-white/10 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.02)] flex items-center justify-center p-2 min-h-[200px]">
                  {pagesB[pageNum - 1] ? (
                    <img
                      src={pagesB[pageNum - 1]}
                      alt={`File B — Page ${pageNum}`}
                      className="max-w-full object-contain shadow-sm"
                    />
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">No page</span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPageNum(p => Math.max(1, p - 1))}
                  disabled={pageNum === 1}
                  className="p-2 rounded-lg border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] hover:border-[#185FA5] hover:text-[#185FA5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon />
                </button>
                <span className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">
                  Page {pageNum} of {totalPages}
                </span>
                <button
                  onClick={() => setPageNum(p => Math.min(totalPages, p + 1))}
                  disabled={pageNum === totalPages}
                  className="p-2 rounded-lg border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] hover:border-[#185FA5] hover:text-[#185FA5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </ToolPageLayout>
  );
}
