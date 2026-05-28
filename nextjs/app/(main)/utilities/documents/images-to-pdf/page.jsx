'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

export default function ImagesToPdfPage() {
  const [files, setFiles] = useState([]);
  const [pageSize, setPageSize] = useState('a4');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(newFiles) {
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleConvert() {
    if (files.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');

      const doc = await PDFDocument.create();

      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let img;

        if (file.type === 'image/jpeg' || file.name.match(/\.jpe?g$/i)) {
          img = await doc.embedJpg(bytes);
        } else if (file.type === 'image/webp' || file.name.match(/\.webp$/i)) {
          const url = URL.createObjectURL(file);
          const image = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = url;
          });
          URL.revokeObjectURL(url);
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          canvas.getContext('2d').drawImage(image, 0, 0);
          const pngBytes = await new Promise(res =>
            canvas.toBlob(async b => res(new Uint8Array(await b.arrayBuffer())), 'image/png')
          );
          img = await doc.embedPng(pngBytes);
        } else {
          img = await doc.embedPng(bytes);
        }

        const dims = img.scale(1);
        let w, h;
        if (pageSize === 'a4') {
          w = 595.28;
          h = 841.89;
        } else if (pageSize === 'letter') {
          w = 612;
          h = 792;
        } else {
          w = dims.width;
          h = dims.height;
        }

        const page = doc.addPage([w, h]);
        const scale = Math.min(w / dims.width, h / dims.height);
        const iw = dims.width * scale;
        const ih = dims.height * scale;
        page.drawImage(img, {
          x: (w - iw) / 2,
          y: (h - ih) / 2,
          width: iw,
          height: ih,
        });
      }

      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Conversion failed.');
    } finally {
      setProcessing(false);
    }
  }

  const pageSizes = [
    { value: 'a4', label: 'A4' },
    { value: 'letter', label: 'Letter' },
    { value: 'auto', label: 'Auto' },
  ];

  return (
    <ToolPageLayout
      icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="13" height="13" rx="2"/><circle cx="7.5" cy="7.5" r="1.5"/><path d="M16 13 13 10 5 18"/><path d="M20 8v9M20 17h-5"/></svg>}
      title="Images to PDF"
      description="Combine JPG, PNG, or WebP images into a single PDF document — entirely in your browser, nothing uploaded."
      parentHref="/utilities/documents"
      parentLabel="Document Tools"
    >
      {processing ? (
        <ProcessingState message="Building PDF…" hint="Converting images client-side with pdf-lib." />
      ) : (
        <div className="space-y-5">
          <FileDropZone
            accept="image/jpeg,image/png,image/webp"
            multiple={true}
            maxSizeMB={50}
            onFiles={handleFiles}
          />

          {files.length > 0 && (
            <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">
                {files.length} image{files.length !== 1 ? 's' : ''} selected
              </p>
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{f.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="shrink-0 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] mb-2">Page Size</p>
            <div className="flex gap-2">
              {pageSizes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPageSize(value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    pageSize === value
                      ? 'bg-[#185FA5] text-white border-[#185FA5]'
                      : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            onClick={handleConvert}
            disabled={files.length === 0}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create PDF →
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
