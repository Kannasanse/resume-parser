'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function parsePageRange(rangeStr, totalPages) {
  const indices = new Set();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeParts = trimmed.split('-');
    if (rangeParts.length === 2) {
      const start = parseInt(rangeParts[0].trim(), 10);
      const end = parseInt(rangeParts[1].trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) indices.add(i - 1);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) indices.add(num - 1);
    }
  }
  return Array.from(indices);
}

export default function CropPage() {
  const [file, setFile] = useState(null);
  const [top, setTop] = useState(0);
  const [right, setRight] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [applyTo, setApplyTo] = useState('all');
  const [pageRange, setPageRange] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(files) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError('');
  }

  function mmToPt(mm) {
    return Number(mm) * 2.8346;
  }

  async function handleCrop() {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const totalPages = doc.getPageCount();

      let targetIndices;
      if (applyTo === 'all') {
        targetIndices = Array.from({ length: totalPages }, (_, i) => i);
      } else {
        targetIndices = parsePageRange(pageRange, totalPages);
        if (targetIndices.length === 0) {
          setError('No valid pages found in the specified range.');
          setProcessing(false);
          return;
        }
      }

      for (const i of targetIndices) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const x = mmToPt(left);
        const y = mmToPt(bottom);
        const w = width - mmToPt(left) - mmToPt(right);
        const h = height - mmToPt(top) - mmToPt(bottom);
        if (w > 0 && h > 0) {
          page.setCropBox(x, y, w, h);
        }
      }

      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropped-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to crop PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  const marginInputClass =
    'w-full px-3 py-2 text-sm bg-white dark:bg-[rgba(255,255,255,0.06)] border border-[#D1DCE8] dark:border-white/10 rounded-lg text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:border-[#185FA5] transition-colors';

  return (
    <ToolPageLayout
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2v14a2 2 0 0 0 2 2h14"/>
          <path d="M18 22V8a2 2 0 0 0-2-2H2"/>
        </svg>
      }
      title="Crop PDF Pages"
      description="Set margins to crop pages in your PDF document."
      parentHref="/utilities/pdf"
      parentLabel="PDF Tools"
    >
      {!file && (
        <FileDropZone
          accept=".pdf,application/pdf"
          multiple={false}
          maxSizeMB={100}
          onFiles={handleFiles}
        />
      )}

      {processing && <ProcessingState message="Cropping PDF…" />}

      {file && !processing && (
        <div className="space-y-5">
          {/* File name */}
          <p className="text-sm text-[#2C2C2A] dark:text-[#E8EFF7] font-medium truncate">
            {file.name}
          </p>

          {/* Margin inputs */}
          <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 space-y-3">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Margins (mm)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Top</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={top}
                  onChange={e => setTop(e.target.value)}
                  className={marginInputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Right</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={right}
                  onChange={e => setRight(e.target.value)}
                  className={marginInputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Bottom</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={bottom}
                  onChange={e => setBottom(e.target.value)}
                  className={marginInputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Left</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={left}
                  onChange={e => setLeft(e.target.value)}
                  className={marginInputClass}
                />
              </div>
            </div>
          </div>

          {/* Apply to toggle */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Apply To</p>
            <div className="flex gap-2">
              <button
                onClick={() => setApplyTo('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  applyTo === 'all'
                    ? 'bg-[#185FA5] text-white border-[#185FA5]'
                    : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                }`}
              >
                All pages
              </button>
              <button
                onClick={() => setApplyTo('range')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  applyTo === 'range'
                    ? 'bg-[#185FA5] text-white border-[#185FA5]'
                    : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                }`}
              >
                Page range
              </button>
            </div>

            {applyTo === 'range' && (
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Page range (e.g. 1-3, 5, 7-9)</label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={e => setPageRange(e.target.value)}
                  placeholder="1-3, 5, 7-9"
                  className={marginInputClass}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCrop}
              disabled={processing}
              className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crop PDF →
            </button>
            <button
              onClick={() => { setFile(null); setError(''); }}
              className="text-sm text-[#9CA3AF] hover:text-[#185FA5] transition-colors"
            >
              Use a different file
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </ToolPageLayout>
  );
}
