'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';
import { DownloadResult } from '@/components/utilities/DownloadResult';

function WordIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
}

export default function PDFToWordPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleConvert() {
    if (!file) return;
    setProcessing(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/utilities/pdf/to-word', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Conversion failed'); }
      const blob = await res.blob();
      setResult({ blob });
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(result.blob);
    const name = file.name.replace(/\.pdf$/i, '') + '.docx';
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function reset() { setFile(null); setResult(null); setError(''); }

  return (
    <ToolPageLayout icon={<WordIcon />} title="PDF to Word" description="Convert a PDF to an editable DOCX document." parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? <ProcessingState message="Converting PDF to Word…" hint="Extracting text and building document structure" /> :
       result ? <DownloadResult onDownload={download} onReset={reset} filename={file.name.replace(/\.pdf$/i, '') + '.docx'} /> :
       !file ? (
        <>
          <FileDropZone accept=".pdf,application/pdf" maxSizeMB={50} onFiles={([f]) => setFile(f)} />
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            Best results with text-based PDFs. Scanned PDFs may return plain text only. Complex layouts (multi-column, tables) may lose some formatting.
          </div>
        </>
       ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <span className="text-xs text-[#9CA3AF] ml-3">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            <button onClick={() => setFile(null)} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">Change file</button>
          </div>
          <button onClick={handleConvert} className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Convert to Word →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
       )}
    </ToolPageLayout>
  );
}
