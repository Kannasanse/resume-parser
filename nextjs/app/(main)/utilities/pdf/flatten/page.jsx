'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function FileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function FlattenPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function handleFiles(files) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError('');
    setDone(false);
  }

  async function handleFlatten() {
    if (!file) return;
    setProcessing(true);
    setError('');
    setDone(false);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const form = doc.getForm();
      form.flatten();
      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flattened-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setError('Failed to flatten PDF. The file may not have form fields or may be encrypted.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolPageLayout
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
        </svg>
      }
      title="Flatten PDF Forms"
      description="Bake interactive form fields into static content so fields can no longer be edited."
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

      {processing && <ProcessingState message="Flattening form fields…" hint="This may take a moment for large PDFs." />}

      {file && !processing && (
        <div className="space-y-4">
          {/* File info */}
          <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 flex items-center gap-3">
            <div className="text-[#185FA5]">
              <FileIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
              <p className="text-xs text-[#9CA3AF]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>

          {/* Success state */}
          {done && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-3">
              <div className="text-green-600 dark:text-green-400">
                <CheckIcon />
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Done — form fields have been flattened.
              </p>
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleFlatten}
              disabled={processing}
              className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Flatten PDF →
            </button>
            <button
              onClick={() => { setFile(null); setError(''); setDone(false); }}
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
