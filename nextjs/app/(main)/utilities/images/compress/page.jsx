'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function CompressIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20"/>
      <polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
    </svg>
  );
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function CompressImagePage() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  function handleFiles(newFiles) {
    setFiles(newFiles);
    setResults([]);
    setError('');
  }

  async function handleCompress() {
    if (!files.length) return;
    setProcessing(true); setError(''); setResults([]);
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const newResults = [];

      for (const file of files) {
        const compressed = await imageCompression(file, {
          initialQuality: quality / 100,
          alwaysKeepResolution: true,
          useWebWorker: true,
          maxSizeMB: 100,
        });
        newResults.push({ name: file.name, before: file.size, after: compressed.size, blob: compressed });
      }
      setResults(newResults);

      if (files.length === 1) {
        const url = URL.createObjectURL(newResults[0].blob);
        const a = document.createElement('a'); a.href = url; a.download = newResults[0].name; a.click();
        URL.revokeObjectURL(url);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const r of newResults) zip.file(r.name, r.blob);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a'); a.href = url; a.download = 'compressed-images.zip'; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setError('Compression failed. Try a smaller file or different format.');
    } finally {
      setProcessing(false);
    }
  }

  const totalBefore = results.reduce((s, r) => s + r.before, 0);
  const totalAfter = results.reduce((s, r) => s + r.after, 0);
  const saving = totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;

  return (
    <ToolPageLayout icon={<CompressIcon />} title="Compress Image" description="Reduce image file size while preserving visual quality." parentHref="/utilities/images" parentLabel="Image Tools">
      {processing ? <ProcessingState message="Compressing images…" /> :
       !files.length ? (
         <FileDropZone accept="image/jpeg,image/png,image/webp" multiple maxSizeMB={50} onFiles={handleFiles} />
       ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <button onClick={() => { setFiles([]); setResults([]); }} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">
              Change files
            </button>
          </div>

          <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Quality</p>
              <span className="text-sm font-bold text-[#185FA5]">{quality}%</span>
            </div>
            <input
              type="range" min="10" max="100" step="5" value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="w-full accent-[#185FA5]"
            />
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
              <span>Smallest file</span>
              <span>Highest quality</span>
            </div>
          </div>

          <button onClick={handleCompress} className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Compress {files.length > 1 ? `${files.length} Images` : 'Image'} →
          </button>

          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-[#22C55E]">
                Done — {saving > 0 ? `${saving}% smaller overall` : 'already optimised'}
              </p>
              {results.map(r => (
                <div key={r.name} className="flex items-center justify-between p-3 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 text-xs">
                  <span className="font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate mr-3">{r.name}</span>
                  <span className="text-[#9CA3AF] whitespace-nowrap">
                    {fmt(r.before)} → <span className="text-[#22C55E] font-semibold">{fmt(r.after)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
       )}
    </ToolPageLayout>
  );
}
