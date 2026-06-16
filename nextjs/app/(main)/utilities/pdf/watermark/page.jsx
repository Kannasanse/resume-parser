'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function WatermarkIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/></svg>;
}

const COLOR_MAP = {
  grey:  [0.5, 0.5, 0.5],
  red:   [0.8, 0.1, 0.1],
  blue:  [0.1, 0.2, 0.8],
  black: [0,   0,   0  ],
};
const FONT_SIZES = { small: 32, medium: 56, large: 80 };

export default function WatermarkPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(-45);
  const [size, setSize] = useState('medium');
  const [color, setColor] = useState('grey');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handleApply() {
    if (!file || !text.trim()) return;
    setProcessing(true); setError('');
    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = FONT_SIZES[size];
      const [r, g, b] = COLOR_MAP[color];

      for (let i = 0; i < doc.getPageCount(); i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: (height - fontSize) / 2,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(rotation),
        });
      }

      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `watermarked-${file.name}`; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Failed to add watermark.'); }
    finally { setProcessing(false); }
  }

  const selCls = 'border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5]';

  return (
    <ToolPageLayout icon={<WatermarkIcon />} title="Add Watermark" description='Overlay text (DRAFT, CONFIDENTIAL…) on all pages.' parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? <ProcessingState message="Applying watermark…" /> :
       !file ? <FileDropZone accept=".pdf,application/pdf" maxSizeMB={50} onFiles={([f]) => setFile(f)} /> : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <button onClick={() => setFile(null)} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">Change file</button>
          </div>

          <div className="space-y-4 p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Watermark text</label>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL" className={selCls + ' w-full'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Opacity: {opacity}%</label>
                <input type="range" min={5} max={80} value={opacity} onChange={e => setOpacity(parseInt(e.target.value))} className="w-full accent-[#185FA5]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Rotation</label>
                <select value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className={selCls + ' w-full'}>
                  <option value={-45}>-45° (diagonal)</option>
                  <option value={0}>0° (horizontal)</option>
                  <option value={45}>+45° (diagonal)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Size</label>
                <select value={size} onChange={e => setSize(e.target.value)} className={selCls + ' w-full'}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">Color</label>
                <select value={color} onChange={e => setColor(e.target.value)} className={selCls + ' w-full'}>
                  <option value="grey">Grey</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="black">Black</option>
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleApply} disabled={!text.trim()} className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
            Apply Watermark →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
