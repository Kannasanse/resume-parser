'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

export default function HtmlToPdfPage() {
  const [html, setHtml] = useState('');
  const [file, setFile] = useState(null);
  const [tab, setTab] = useState('paste');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(newFiles) {
    if (newFiles.length > 0) {
      setFile(newFiles[0]);
      setError('');
    }
  }

  function clearFile() {
    setFile(null);
  }

  const hasContent = tab === 'paste' ? html.trim().length > 0 : file !== null;

  async function handleConvert() {
    if (!hasContent) return;
    setProcessing(true);
    setError('');
    try {
      const form = new FormData();
      if (tab === 'file' && file) {
        form.append('html', await file.text());
      } else {
        form.append('html', html);
      }

      const res = await fetch('/api/v1/utilities/documents/html-to-pdf', { method: 'POST', body: form });
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

  const tabs = [
    { value: 'paste', label: 'Paste HTML' },
    { value: 'file', label: 'Upload File' },
  ];

  return (
    <ToolPageLayout
      icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
      title="HTML to PDF"
      description="Convert an HTML page or fragment to a PDF document. Paste markup directly or upload an .html file."
      parentHref="/utilities/documents"
      parentLabel="Document Tools"
    >
      {processing ? (
        <ProcessingState message="Converting HTML to PDF…" hint="Rendering your HTML with a headless browser on the server." />
      ) : (
        <div className="space-y-5">
          <div className="flex gap-2">
            {tabs.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  tab === value
                    ? 'bg-[#185FA5] text-white border-[#185FA5]'
                    : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'paste' ? (
            <textarea
              value={html}
              onChange={e => setHtml(e.target.value)}
              placeholder="Paste your HTML here…"
              rows={14}
              className="w-full px-4 py-3 text-sm font-mono text-[#2C2C2A] dark:text-[#E8EFF7] bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] border border-[#D1DCE8] dark:border-white/8 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-[#185FA5]/40"
            />
          ) : (
            <div className="space-y-3">
              {file ? (
                <div className="flex items-center justify-between p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
                  <span className="text-sm text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</span>
                  <button
                    onClick={clearFile}
                    className="shrink-0 ml-3 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <FileDropZone
                  accept=".html,.htm,text/html"
                  multiple={false}
                  maxSizeMB={10}
                  onFiles={handleFiles}
                />
              )}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            onClick={handleConvert}
            disabled={!hasContent}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Convert to PDF →
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
