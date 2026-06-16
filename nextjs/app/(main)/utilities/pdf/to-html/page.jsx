'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

export default function PdfToHtmlPage() {
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
      const res = await fetch('/api/v1/utilities/pdf/to-html', { method: 'POST', body: form });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Conversion failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.html';
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
      icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
      title="PDF to HTML"
      description="Extract the text content from a PDF and convert it to a structured HTML document, with one section per page."
      parentHref="/utilities/pdf"
      parentLabel="PDF Tools"
    >
      {processing ? (
        <ProcessingState message="Converting PDF to HTML…" hint="Extracting text content from each page." />
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
            onClick={handleConvert}
            disabled={!file}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Convert to HTML →
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
