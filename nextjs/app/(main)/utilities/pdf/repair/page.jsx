'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

export default function RepairPdfPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(newFiles) {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setError('');
    }
  }

  async function handleRepair() {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/v1/utilities/pdf/repair', { method: 'POST', body: form });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Repair failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repaired-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Repair failed.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolPageLayout
      icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
      title="Repair PDF"
      description="Attempts to rebuild the PDF structure, fixing common errors and corruption. Works best on partially readable files."
      parentHref="/utilities/pdf"
      parentLabel="PDF Tools"
    >
      {processing ? (
        <ProcessingState message="Repairing PDF…" hint="Rebuilding PDF structure and resolving common errors." />
      ) : (
        <div className="space-y-5">
          {file ? (
            <div className="flex items-center justify-between p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
              <div>
                <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="shrink-0 ml-3 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <FileDropZone
              accept=".pdf,application/pdf"
              multiple={false}
              maxSizeMB={100}
              onFiles={handleFiles}
            />
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            onClick={handleRepair}
            disabled={!file}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Repair PDF →
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
