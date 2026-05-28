'use client';
import { useState, useEffect } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function OrganiseIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}

function RotateCCW() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>;
}
function RotateCW() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-4"/></svg>;
}

export default function OrganisePDFPage() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // [{index, rotation, deleted, thumbnail}]
  const [processing, setProcessing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  async function handleFile([f]) {
    setFile(f); setError(''); setRendering(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
      const bytes = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const count = pdf.numPages;
      const pagesData = [];
      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        pagesData.push({ index: i - 1, rotation: 0, deleted: false, thumbnail: canvas.toDataURL() });
      }
      setPages(pagesData);
    } catch { setError('Could not read PDF.'); }
    finally { setRendering(false); }
  }

  function rotate(idx, deg) {
    setPages(p => p.map((pg, i) => i === idx ? { ...pg, rotation: (pg.rotation + deg + 360) % 360 } : pg));
  }
  function deletePage(idx) {
    setPages(p => p.map((pg, i) => i === idx ? { ...pg, deleted: true } : pg));
  }
  function restore(idx) {
    setPages(p => p.map((pg, i) => i === idx ? { ...pg, deleted: false } : pg));
  }

  function handleDrop(e, targetIdx) {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === targetIdx) { setDraggingIdx(null); setOverIdx(null); return; }
    const next = [...pages];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(targetIdx, 0, moved);
    setPages(next);
    setDraggingIdx(null); setOverIdx(null);
  }

  async function handleSave() {
    if (!file) return;
    setProcessing(true); setError('');
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const active = pages.filter(p => !p.deleted);
      const copied = await out.copyPages(src, active.map(p => p.index));
      copied.forEach((page, i) => {
        if (active[i].rotation) page.setRotation(degrees(active[i].rotation));
        out.addPage(page);
      });
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `organised-${file.name}`; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Failed to save PDF.'); }
    finally { setProcessing(false); }
  }

  const active = pages.filter(p => !p.deleted);

  return (
    <ToolPageLayout icon={<OrganiseIcon />} title="Organise Pages" description="Reorder, rotate, or delete pages in a PDF." parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? <ProcessingState message="Saving PDF…" /> :
       rendering ? <ProcessingState message="Loading page previews…" /> :
       !file ? <FileDropZone accept=".pdf,application/pdf" maxSizeMB={50} onFiles={handleFile} /> : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <button onClick={() => { setFile(null); setPages([]); }} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">Change file</button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {pages.map((pg, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDraggingIdx(i)}
                onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
                onDrop={e => handleDrop(e, i)}
                onDragEnd={() => { setDraggingIdx(null); setOverIdx(null); }}
                className={`relative rounded-xl border-2 overflow-hidden cursor-grab transition-all
                  ${pg.deleted ? 'opacity-30 grayscale' : ''}
                  ${overIdx === i ? 'border-[#185FA5] scale-105' : 'border-[#D1DCE8] dark:border-white/10'}
                  ${draggingIdx === i ? 'opacity-40' : ''}`}
              >
                <img
                  src={pg.thumbnail} alt={`Page ${pg.index + 1}`}
                  style={{ transform: `rotate(${pg.rotation}deg)`, transition: 'transform 0.2s' }}
                  className="w-full object-contain bg-white"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 flex items-center justify-between px-1 py-0.5">
                  <span className="text-white text-[10px]">{pg.index + 1}</span>
                  <div className="flex gap-1">
                    {pg.deleted ? (
                      <button onClick={() => restore(i)} title="Restore" className="text-white/70 hover:text-white text-[10px]">↩</button>
                    ) : (
                      <>
                        <button onClick={() => rotate(i, -90)} title="Rotate left" className="text-white/70 hover:text-white"><RotateCCW /></button>
                        <button onClick={() => rotate(i, 90)} title="Rotate right" className="text-white/70 hover:text-white"><RotateCW /></button>
                        <button onClick={() => deletePage(i)} title="Delete" className="text-white/70 hover:text-red-400 text-xs ml-0.5">×</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button onClick={handleSave} disabled={active.length === 0} className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
              Save PDF ({active.length} page{active.length !== 1 ? 's' : ''}) →
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
