'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function NumberIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
}

const POSITIONS = [
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right',  label: 'Bottom Right' },
  { id: 'bottom-left',   label: 'Bottom Left' },
  { id: 'top-center',    label: 'Top Center' },
];
const FORMATS = [
  { id: 'n',       label: '1' },
  { id: 'page-n',  label: 'Page 1' },
  { id: 'n-of-t',  label: '1 of 10' },
  { id: 'dash-n',  label: '- 1 -' },
];

export default function PageNumbersPage() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [format, setFormat] = useState('page-n');
  const [startFrom, setStartFrom] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function formatLabel(n, total, fmt) {
    if (fmt === 'n') return String(n);
    if (fmt === 'page-n') return `Page ${n}`;
    if (fmt === 'n-of-t') return `${n} of ${total}`;
    if (fmt === 'dash-n') return `- ${n} -`;
    return String(n);
  }

  async function handleApply() {
    if (!file) return;
    setProcessing(true); setError('');
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const total = doc.getPageCount();

      for (let i = 0; i < total; i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const label = formatLabel(startFrom + i, startFrom + total - 1, format);
        const textWidth = font.widthOfTextAtSize(label, fontSize);
        const margin = 20;
        let x, y;
        if (position === 'bottom-center') { x = (width - textWidth) / 2; y = margin; }
        else if (position === 'bottom-right') { x = width - textWidth - margin; y = margin; }
        else if (position === 'bottom-left') { x = margin; y = margin; }
        else { x = (width - textWidth) / 2; y = height - margin - fontSize; }
        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3), opacity: 0.85 });
      }

      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `numbered-${file.name}`; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Failed to add page numbers.'); }
    finally { setProcessing(false); }
  }

  const selCls = 'border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5]';

  return (
    <ToolPageLayout icon={<NumberIcon />} title="Add Page Numbers" description="Stamp page numbers onto every page of a PDF." parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? <ProcessingState message="Adding page numbers…" /> :
       !file ? <FileDropZone accept=".pdf,application/pdf" maxSizeMB={50} onFiles={([f]) => setFile(f)} /> : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <button onClick={() => setFile(null)} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">Change file</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Position</label>
              <select value={position} onChange={e => setPosition(e.target.value)} className={selCls}>
                {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className={selCls}>
                {FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Start from page</label>
              <input type="number" min={1} value={startFrom} onChange={e => setStartFrom(parseInt(e.target.value) || 1)} className={selCls + ' w-full'} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Font size</label>
              <select value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className={selCls}>
                {[8, 10, 11, 12, 14].map(s => <option key={s} value={s}>{s}pt</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleApply} className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Apply Page Numbers →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
