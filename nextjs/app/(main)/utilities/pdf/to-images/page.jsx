'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function ImageIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
}

const DPI_SCALE = { '72': 1, '150': 150 / 72, '300': 300 / 72 };

export default function PDFToImagesPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState('jpeg');
  const [dpi, setDpi] = useState('150');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  async function handleFile([f]) {
    setFile(f); setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const bytes = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPageCount(pdf.numPages);
    } catch { setError('Could not read PDF.'); }
  }

  async function handleConvert() {
    if (!file || !pageCount) return;
    setProcessing(true); setProgress(0); setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const JSZip = (await import('jszip')).default;
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const scale = DPI_SCALE[dpi] || 1;
      const zip = new JSZip();
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const ext = format === 'jpeg' ? 'jpg' : 'png';

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const blob = await new Promise(res => canvas.toBlob(res, mimeType, 0.92));
        zip.file(`page-${String(i).padStart(3, '0')}.${ext}`, blob);
        setProgress(Math.round((i / pageCount) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a'); a.href = url; a.download = `pages-${ext}.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Conversion failed. Try a smaller file or fewer pages.');
    } finally {
      setProcessing(false);
    }
  }

  const btn = 'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border';
  const active = 'bg-[#185FA5] text-white border-[#185FA5]';
  const inactive = 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]';

  return (
    <ToolPageLayout icon={<ImageIcon />} title="PDF to Images" description="Export each PDF page as a JPG or PNG image." parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? (
        <ProcessingState message={`Converting pages… ${progress}%`} hint="Rendering each page to an image" />
      ) : !file ? (
        <FileDropZone accept=".pdf,application/pdf" maxSizeMB={50} onFiles={handleFile} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <span className="text-xs text-[#9CA3AF] ml-3">{pageCount} pages</span>
            <button onClick={() => { setFile(null); setPageCount(0); }} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">Change file</button>
          </div>

          <div className="space-y-4 p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Format</p>
              <div className="flex gap-2">
                <button className={`${btn} ${format === 'jpeg' ? active : inactive}`} onClick={() => setFormat('jpeg')}>JPG</button>
                <button className={`${btn} ${format === 'png' ? active : inactive}`} onClick={() => setFormat('png')}>PNG</button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Quality (DPI)</p>
              <div className="flex gap-2 flex-wrap">
                {[['72', 'Screen (72)'], ['150', 'Print (150)'], ['300', 'High (300)']].map(([v, l]) => (
                  <button key={v} className={`${btn} ${dpi === v ? active : inactive}`} onClick={() => setDpi(v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleConvert} className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Convert to {format.toUpperCase()} →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
