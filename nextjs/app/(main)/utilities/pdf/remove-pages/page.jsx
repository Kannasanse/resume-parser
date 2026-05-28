'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function RemovePagesPage() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(files) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setPages([]);
    setError('');
    setRendering(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const bytes = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const result = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        result.push({ index: i - 1, thumbnail: canvas.toDataURL(), remove: false });
      }
      setPages(result);
    } catch {
      setError('Failed to load PDF. Please try another file.');
    } finally {
      setRendering(false);
    }
  }

  function togglePage(index) {
    setPages(prev =>
      prev.map(p => p.index === index ? { ...p, remove: !p.remove } : p)
    );
  }

  const removedCount = pages.filter(p => p.remove).length;
  const remainingCount = pages.length - removedCount;

  async function handleSave() {
    if (!file || remainingCount === 0) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const keepIndices = pages.filter(p => !p.remove).map(p => p.index);
      const copied = await out.copyPages(src, keepIndices);
      for (const p of copied) out.addPage(p);
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trimmed-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to save PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolPageLayout
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      }
      title="Remove PDF Pages"
      description="Click pages to mark them for removal, then save the trimmed PDF."
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

      {rendering && <ProcessingState message="Loading page previews…" />}

      {file && !rendering && pages.length > 0 && (
        <div className="space-y-4">
          {/* Status + action bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              {removedCount > 0 ? (
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {removedCount} page{removedCount !== 1 ? 's' : ''} selected for removal
                </span>
              ) : (
                <span className="text-sm text-[#9CA3AF]">No pages selected — click a page to mark it for removal</span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={processing || remainingCount === 0}
              className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Saving…' : `Save PDF (${remainingCount} page${remainingCount !== 1 ? 's' : ''})`}
            </button>
          </div>

          {remainingCount === 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">At least one page must remain.</p>
          )}

          {/* Thumbnails grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {pages.map(pg => (
              <div
                key={pg.index}
                onClick={() => togglePage(pg.index)}
                className={`relative overflow-hidden rounded-xl border cursor-pointer transition-all select-none ${
                  pg.remove
                    ? 'border-red-400 dark:border-red-500 opacity-60'
                    : 'border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5]'
                }`}
              >
                {/* Thumbnail */}
                <div className="flex items-center justify-center p-2 min-h-[120px] bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.02)]">
                  <img
                    src={pg.thumbnail}
                    alt={`Page ${pg.index + 1}`}
                    className="max-w-full max-h-[110px] object-contain shadow-sm"
                  />
                </div>

                {/* Red overlay when marked */}
                {pg.remove && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <div className="bg-red-500 text-white rounded-full p-1">
                      <XIcon />
                    </div>
                  </div>
                )}

                {/* Page number */}
                <div className={`px-2 py-1.5 text-center border-t ${
                  pg.remove
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : 'bg-white dark:bg-[rgba(255,255,255,0.04)] border-[#D1DCE8] dark:border-white/10'
                }`}>
                  <span className={`text-xs font-medium ${pg.remove ? 'text-red-600 dark:text-red-400' : 'text-[#9CA3AF]'}`}>
                    {pg.remove ? 'Remove' : `Page ${pg.index + 1}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            onClick={() => { setFile(null); setPages([]); setError(''); }}
            className="text-sm text-[#9CA3AF] hover:text-[#185FA5] transition-colors"
          >
            ← Use a different file
          </button>
        </div>
      )}

      {error && !rendering && !pages.length && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </ToolPageLayout>
  );
}
