'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

export default function ExtractImagesPage() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [format, setFormat] = useState('jpeg');
  const [dpi, setDpi] = useState('150');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
        const vp = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        result.push({ index: i - 1, thumbnail: canvas.toDataURL(), selected: true });
      }
      setPages(result);
    } catch {
      setError('Failed to load PDF. Please try another file.');
    } finally {
      setRendering(false);
    }
  }

  function togglePage(index) {
    setPages(prev => prev.map(p => p.index === index ? { ...p, selected: !p.selected } : p));
  }

  function selectAll() {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  }

  function deselectAll() {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  }

  const selectedCount = pages.filter(p => p.selected).length;

  async function handleExtract() {
    if (!file || selectedCount === 0) return;
    setProcessing(true);
    setProgress(0);
    setError('');
    try {
      const JSZip = (await import('jszip')).default;
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;

      const scaleMap = { '72': 1, '150': 150 / 72, '300': 300 / 72 };
      const scale = scaleMap[dpi] || 1;
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const ext = format === 'jpeg' ? 'jpg' : 'png';

      const zip = new JSZip();
      const selected = pages.filter(p => p.selected);

      for (let idx = 0; idx < selected.length; idx++) {
        const pageNum = selected[idx].index + 1;
        const page = await pdf.getPage(pageNum);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        const blob = await new Promise(res => canvas.toBlob(res, mime, 0.92));
        zip.file(`page-${String(pageNum).padStart(3, '0')}.${ext}`, blob);
        setProgress(Math.round(((idx + 1) / selected.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pages-${ext}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to extract images. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  const dpiOptions = ['72', '150', '300'];

  return (
    <ToolPageLayout
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      }
      title="Extract Pages as Images"
      description="Render PDF pages as high-quality images and download them as a ZIP."
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

      {rendering && <ProcessingState message="Rendering page previews…" />}

      {processing && (
        <ProcessingState
          message={`Extracting images… ${progress}%`}
          hint="This may take a while for high DPI exports."
        />
      )}

      {file && !rendering && !processing && pages.length > 0 && (
        <div className="space-y-5">
          {/* Settings panel */}
          <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 space-y-4">
            {/* Format */}
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Format</p>
              <div className="flex gap-2">
                {['jpeg', 'png'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      format === f
                        ? 'bg-[#185FA5] text-white border-[#185FA5]'
                        : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                    }`}
                  >
                    {f === 'jpeg' ? 'JPG' : 'PNG'}
                  </button>
                ))}
              </div>
            </div>

            {/* DPI */}
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Resolution (DPI)</p>
              <div className="flex gap-2">
                {dpiOptions.map(d => (
                  <button
                    key={d}
                    onClick={() => setDpi(d)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      dpi === d
                        ? 'bg-[#185FA5] text-white border-[#185FA5]'
                        : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selection controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={selectAll}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]"
            >
              Deselect All
            </button>
            <div className="ml-auto">
              <button
                onClick={handleExtract}
                disabled={selectedCount === 0}
                className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Extract {selectedCount} Page{selectedCount !== 1 ? 's' : ''} →
              </button>
            </div>
          </div>

          {/* Thumbnails grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {pages.map(pg => (
              <div
                key={pg.index}
                onClick={() => togglePage(pg.index)}
                className={`relative overflow-hidden rounded-xl border cursor-pointer transition-all select-none ${
                  pg.selected
                    ? 'border-[#185FA5] ring-2 ring-[#185FA5]/20'
                    : 'border-[#D1DCE8] dark:border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-center justify-center p-2 min-h-[100px] bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.02)]">
                  <img
                    src={pg.thumbnail}
                    alt={`Page ${pg.index + 1}`}
                    className="max-w-full max-h-[90px] object-contain shadow-sm"
                  />
                </div>
                {/* Checkbox indicator */}
                <div className="absolute top-2 right-2">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                    pg.selected
                      ? 'bg-[#185FA5] border-[#185FA5]'
                      : 'bg-white dark:bg-[rgba(255,255,255,0.1)] border-[#D1DCE8] dark:border-white/20'
                  }`}>
                    {pg.selected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="px-2 py-1.5 bg-white dark:bg-[rgba(255,255,255,0.04)] border-t border-[#D1DCE8] dark:border-white/10 text-center">
                  <span className="text-xs font-medium text-[#9CA3AF]">Page {pg.index + 1}</span>
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

      {error && !rendering && !processing && !pages.length && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </ToolPageLayout>
  );
}
