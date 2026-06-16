'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { FileList } from '@/components/utilities/FileList';
import { ProcessingState } from '@/components/utilities/ProcessingState';
import { DownloadResult } from '@/components/utilities/DownloadResult';

function MergeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><line x1="12" y1="2" x2="12" y2="22"/></svg>;
}

export default function MergeWordPage() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function addFiles(incoming) {
    const valid = incoming.filter(f => f.name.match(/\.docx?$/i));
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))].slice(0, 20);
    });
  }

  async function handleMerge() {
    if (files.length < 2) return;
    setProcessing(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await fetch('/api/v1/utilities/documents/merge-word', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Merge failed'); }
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
    const a = document.createElement('a'); a.href = url; a.download = 'merged.docx'; a.click();
    URL.revokeObjectURL(url);
  }

  function reset() { setFiles([]); setResult(null); setError(''); }

  return (
    <ToolPageLayout icon={<MergeIcon />} title="Merge Word Documents" description="Combine multiple DOCX files into one document." parentHref="/utilities/documents" parentLabel="Document Tools">
      {processing ? <ProcessingState message="Merging Word documents…" /> :
       result ? <DownloadResult onDownload={download} onReset={reset} filename="merged.docx" /> : (
        <>
          <FileDropZone accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple maxSizeMB={50} onFiles={addFiles} />
          {files.length > 0 && (
            <>
              <FileList files={files} onRemove={i => setFiles(f => f.filter((_, idx) => idx !== i))} onReorder={setFiles} />
              <div className="mt-4 flex items-center gap-4">
                <button onClick={handleMerge} disabled={files.length < 2} className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
                  Merge {files.length} Documents →
                </button>
                <button onClick={() => setFiles([])} className="text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">Clear all</button>
              </div>
            </>
          )}
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
