'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function RotateCCWIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4"/>
    </svg>
  );
}

function RotateCWIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-.49-4"/>
    </svg>
  );
}

export default function RotatePage() {
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
        result.push({ index: i - 1, rotation: 0, thumbnail: canvas.toDataURL() });
      }
      setPages(result);
    } catch {
      setError('Failed to load PDF. Please try another file.');
    } finally {
      setRendering(false);
    }
  }

  function rotatePage(index, delta) {
    setPages(prev =>
      prev.map(p =>
        p.index === index ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 } : p
      )
    );
  }

  function rotateAll(delta) {
    setPages(prev =>
      prev.map(p => ({ ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 }))
    );
  }

  async function handleSave() {
    if (!file || !pages.length) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      for (const pg of pages) {
        const page = doc.getPage(pg.index);
        page.setRotation(degrees(pg.rotation));
      }
      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotated-${file.name}`;
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
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-.49-4"/>
        </svg>
      }
      title="Rotate PDF Pages"
      description="Rotate individual pages or all pages in your PDF."
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
          {/* Bulk actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => rotateAll(-90)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] border border-[#D1DCE8] dark:border-white/10 text-[#2C2C2A] dark:text-[#E8EFF7] text-sm font-medium rounded-xl hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
            >
              <RotateCCWIcon /> Rotate All Left
            </button>
            <button
              onClick={() => rotateAll(90)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] border border-[#D1DCE8] dark:border-white/10 text-[#2C2C2A] dark:text-[#E8EFF7] text-sm font-medium rounded-xl hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
            >
              <RotateCWIcon /> Rotate All Right
            </button>
            <div className="ml-auto">
              <button
                onClick={handleSave}
                disabled={processing}
                className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Saving…' : `Save PDF (${pages.length} page${pages.length !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>

          {/* Thumbnails grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {pages.map(pg => (
              <div
                key={pg.index}
                className="relative overflow-hidden rounded-xl border border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[rgba(255,255,255,0.04)]"
              >
                {/* Thumbnail */}
                <div className="flex items-center justify-center p-2 min-h-[120px] bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.02)]">
                  <img
                    src={pg.thumbnail}
                    alt={`Page ${pg.index + 1}`}
                    style={{ transform: `rotate(${pg.rotation}deg)`, transition: 'transform 0.2s ease' }}
                    className="max-w-full max-h-[110px] object-contain shadow-sm"
                  />
                </div>
                {/* Bottom overlay */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-[rgba(255,255,255,0.04)] border-t border-[#D1DCE8] dark:border-white/10">
                  <button
                    onClick={() => rotatePage(pg.index, -90)}
                    title="Rotate left"
                    className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#185FA5] hover:bg-[#F4F8FC] dark:hover:bg-white/10 transition-colors"
                  >
                    <RotateCCWIcon />
                  </button>
                  <span className="text-xs font-medium text-[#9CA3AF]">{pg.index + 1}</span>
                  <button
                    onClick={() => rotatePage(pg.index, 90)}
                    title="Rotate right"
                    className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#185FA5] hover:bg-[#F4F8FC] dark:hover:bg-white/10 transition-colors"
                  >
                    <RotateCWIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {/* Change file */}
          <button
            onClick={() => { setFile(null); setPages([]); setError(''); }}
            className="text-sm text-[#9CA3AF] hover:text-[#185FA5] transition-colors"
          >
            ← Use a different file
          </button>
        </div>
      )}

      {file && !rendering && pages.length === 0 && !error && (
        <ProcessingState message="Processing…" />
      )}

      {error && !rendering && !pages.length && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </ToolPageLayout>
  );
}
