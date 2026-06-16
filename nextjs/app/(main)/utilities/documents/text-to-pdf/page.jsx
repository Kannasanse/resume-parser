'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function NotebookIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}

const PAGE_SIZES = {
  A4:     [595.28, 841.89],
  Letter: [612, 792],
};
const MARGINS = { Normal: 50, Narrow: 28, Wide: 80 };

export default function TextToPDFPage() {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [pageSize, setPageSize] = useState('A4');
  const [marginKey, setMarginKey] = useState('Normal');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!text.trim()) return;
    setProcessing(true); setError('');
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const [pageWidth, pageHeight] = PAGE_SIZES[pageSize];
      const margin = MARGINS[marginKey];
      const lineHeight = fontSize * 1.45;
      const maxWidth = pageWidth - margin * 2;
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);

      function wrapLine(line) {
        if (!line.trim()) return [''];
        const words = line.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
            current = test;
          } else {
            if (current) lines.push(current);
            current = word;
          }
        }
        if (current) lines.push(current);
        return lines.length ? lines : [''];
      }

      const rawLines = text.split('\n');
      const wrapped = rawLines.flatMap(wrapLine);
      let y = pageHeight - margin;
      let page = doc.addPage([pageWidth, pageHeight]);

      for (const line of wrapped) {
        if (y < margin + lineHeight) {
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        if (line) {
          page.drawText(line, { x: margin, y: y - fontSize, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        }
        y -= lineHeight;
      }

      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'document.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Failed to generate PDF.'); }
    finally { setProcessing(false); }
  }

  const selCls = 'border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5]';

  return (
    <ToolPageLayout icon={<NotebookIcon />} title="Text to PDF" description="Turn plain text or pasted content into a PDF." parentHref="/utilities/documents" parentLabel="Document Tools">
      {processing ? <ProcessingState message="Generating PDF…" /> : (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type your text here…"
            rows={14}
            className="w-full border border-[#D1DCE8] dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5] resize-y mb-4"
          />

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Font size</label>
              <select value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className={selCls + ' w-full'}>
                {[10, 11, 12, 14].map(s => <option key={s} value={s}>{s}pt</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Page size</label>
              <select value={pageSize} onChange={e => setPageSize(e.target.value)} className={selCls + ' w-full'}>
                <option>A4</option>
                <option>Letter</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Margins</label>
              <select value={marginKey} onChange={e => setMarginKey(e.target.value)} className={selCls + ' w-full'}>
                {Object.keys(MARGINS).map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={!text.trim()} className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
            Generate PDF →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
