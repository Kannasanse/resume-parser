'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';
import { DownloadResult } from '@/components/utilities/DownloadResult';

function CompressIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>;
}

export default function CompressPDFPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState('medium');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { blob, afterBytes }
  const [error, setError] = useState('');

  async function handleCompress() {
    if (!file) return;
    setProcessing(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('quality', quality);
      const res = await fetch('/api/v1/utilities/pdf/compress', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Compression failed'); }
      const blob = await res.blob();
      setResult({ blob, afterBytes: blob.size });
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a'); a.href = url; a.download = `compressed-${file.name}`; a.click();
    URL.revokeObjectURL(url);
  }

  function reset() { setFile(null); setResult(null); setError(''); }

  const radioRow = 'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors';

  return (
    <ToolPageLayout icon={<CompressIcon />} title="Compress PDF" description="Reduce file size while keeping quality acceptable." parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? <ProcessingState message="Compressing PDF on server…" hint="This may take 10–30 seconds for large files" /> :
       result ? <DownloadResult onDownload={download} onReset={reset} beforeBytes={file.size} afterBytes={result.afterBytes} /> :
       !file ? <FileDropZone accept=".pdf,application/pdf" maxSizeMB={100} onFiles={([f]) => setFile(f)} /> : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <span className="text-xs text-[#9CA3AF] ml-3">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            <button onClick={() => setFile(null)} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">Change file</button>
          </div>

          <div className="space-y-2">
            {[
              { id: 'low',    label: 'Low compression',    note: 'Best quality · ~20% smaller' },
              { id: 'medium', label: 'Medium compression', note: 'Balanced · ~50% smaller', default: true },
              { id: 'high',   label: 'High compression',   note: 'Smaller file · some quality loss' },
            ].map(opt => (
              <label key={opt.id} className={`${radioRow} ${quality === opt.id ? 'border-[#185FA5] bg-[rgba(24,95,165,0.04)]' : 'border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5]/50'}`}>
                <input type="radio" value={opt.id} checked={quality === opt.id} onChange={() => setQuality(opt.id)} className="accent-[#185FA5] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">{opt.label}</p>
                  <p className="text-xs text-[#9CA3AF]">{opt.note}</p>
                </div>
              </label>
            ))}
          </div>

          <button onClick={handleCompress} className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Compress PDF →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
