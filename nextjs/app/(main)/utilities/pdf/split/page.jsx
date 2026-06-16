'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function SplitIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="m21 3-7 7"/><path d="M8 21H3v-5"/><path d="m3 21 7-7"/><line x1="3" y1="12" x2="21" y2="12"/></svg>;
}

function parseRanges(input, total) {
  const ranges = [];
  for (const part of input.split(',')) {
    const t = part.trim();
    if (!t) continue;
    const match = t.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;
    if (start < 1 || end > total || start > end) return null;
    ranges.push({ start, end, label: match[2] ? `pages-${start}-${end}` : `page-${start}` });
  }
  return ranges.length ? ranges : null;
}

export default function SplitPDFPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState('ranges'); // 'ranges' | 'every' | 'single'
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handleFile([f]) {
    setFile(f);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
    } catch {
      setError('Could not read PDF.');
    }
  }

  async function handleSplit() {
    if (!file || !pageCount) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const JSZip = (await import('jszip')).default;
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);

      let groups = [];
      if (mode === 'single') {
        groups = Array.from({ length: pageCount }, (_, i) => ({ indices: [i], label: `page-${i + 1}` }));
      } else if (mode === 'every') {
        const n = Math.max(1, everyN);
        for (let i = 0; i < pageCount; i += n) {
          const end = Math.min(i + n - 1, pageCount - 1);
          groups.push({ indices: Array.from({ length: end - i + 1 }, (_, k) => i + k), label: `pages-${i + 1}-${end + 1}` });
        }
      } else {
        const ranges = parseRanges(rangeInput, pageCount);
        if (!ranges) { setError(`Invalid range. Use format like "1-3, 5, 7-9" (pages 1–${pageCount}).`); setProcessing(false); return; }
        groups = ranges.map(r => ({ indices: Array.from({ length: r.end - r.start + 1 }, (_, k) => r.start - 1 + k), label: r.label }));
      }

      if (groups.length === 1) {
        const doc = await PDFDocument.create();
        const pages = await doc.copyPages(src, groups[0].indices);
        pages.forEach(p => doc.addPage(p));
        const out = await doc.save();
        triggerDownload(out, `${groups[0].label}.pdf`);
      } else {
        const zip = new JSZip();
        for (const g of groups) {
          const doc = await PDFDocument.create();
          const pages = await doc.copyPages(src, g.indices);
          pages.forEach(p => doc.addPage(p));
          zip.file(`${g.label}.pdf`, await doc.save());
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(blob, 'split-pages.zip', true);
      }
    } catch (err) {
      setError('Failed to split PDF.');
    } finally {
      setProcessing(false);
    }
  }

  function triggerDownload(data, name, isBlob = false) {
    const blob = isBlob ? data : new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  const radio = 'flex items-center gap-2 cursor-pointer text-sm text-[#2C2C2A] dark:text-[#E8EFF7]';

  return (
    <ToolPageLayout icon={<SplitIcon />} title="Split PDF" description="Extract pages or split a PDF into multiple files." parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? (
        <ProcessingState message="Splitting PDF…" />
      ) : !file ? (
        <FileDropZone accept=".pdf,application/pdf" maxSizeMB={50} onFiles={handleFile} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <span className="text-xs text-[#9CA3AF] ml-3 flex-shrink-0">{pageCount} pages</span>
            <button onClick={() => { setFile(null); setPageCount(0); setError(''); }} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors flex-shrink-0">Change file</button>
          </div>

          <div className="space-y-3 p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <label className={radio}>
              <input type="radio" value="ranges" checked={mode === 'ranges'} onChange={() => setMode('ranges')} className="accent-[#185FA5]" />
              Extract specific pages
            </label>
            {mode === 'ranges' && (
              <input
                value={rangeInput}
                onChange={e => setRangeInput(e.target.value)}
                placeholder={`e.g. 1-3, 5, 7-9  (max page: ${pageCount})`}
                className="ml-6 w-full border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
              />
            )}
            <label className={radio}>
              <input type="radio" value="every" checked={mode === 'every'} onChange={() => setMode('every')} className="accent-[#185FA5]" />
              Split every
              <input type="number" min={1} max={pageCount} value={everyN} onChange={e => setEveryN(parseInt(e.target.value) || 1)}
                className="mx-1 w-16 border border-[#D1DCE8] dark:border-white/10 rounded px-2 py-0.5 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-1 focus:ring-[#185FA5]" />
              pages
            </label>
            <label className={radio}>
              <input type="radio" value="single" checked={mode === 'single'} onChange={() => setMode('single')} className="accent-[#185FA5]" />
              Split into single pages ({pageCount} files)
            </label>
          </div>

          <button onClick={handleSplit} className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Split PDF →
          </button>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
