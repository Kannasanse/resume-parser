'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

export default function ExcelToPdfPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(newFiles) {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setError('');
    }
  }

  async function handleConvert() {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/v1/utilities/documents/excel-to-pdf', { method: 'POST', body: form });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Conversion failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Conversion failed.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolPageLayout
      icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="14" y2="9"/></svg>}
      title="Excel to PDF"
      description="Convert Excel spreadsheets (.xlsx / .xls) to PDF. The first sheet is rendered as a table."
      parentHref="/utilities/documents"
      parentLabel="Document Tools"
    >
      {processing ? (
        <ProcessingState message="Converting spreadsheet to PDF…" hint="Reading the sheet and rendering it server-side." />
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
              accept=".xlsx,.xls"
              multiple={false}
              maxSizeMB={100}
              onFiles={handleFiles}
            />
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            onClick={handleConvert}
            disabled={!file}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Convert to PDF →
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
