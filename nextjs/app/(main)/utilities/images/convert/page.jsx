'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function ConvertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}

export default function ConvertImagePage() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(92);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(newFiles) {
    setFiles(newFiles);
    setError('');
  }

  async function handleConvert() {
    if (!files.length) return;
    setProcessing(true); setError('');
    try {
      const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const ext = format === 'jpeg' ? 'jpg' : format;

      const blobs = [];
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const img = await new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = url;
        });
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const blob = await new Promise(res => canvas.toBlob(res, mime, quality / 100));
        blobs.push({ name: file.name.replace(/\.[^.]+$/, '') + '.' + ext, blob });
      }

      if (blobs.length === 1) {
        const url = URL.createObjectURL(blobs[0].blob);
        const a = document.createElement('a'); a.href = url; a.download = blobs[0].name; a.click();
        URL.revokeObjectURL(url);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const { name, blob } of blobs) zip.file(name, blob);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a'); a.href = url; a.download = `converted-to-${ext}.zip`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setError('Conversion failed. Make sure the files are valid images.');
    } finally {
      setProcessing(false);
    }
  }

  const btn = 'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border';
  const active = 'bg-[#185FA5] text-white border-[#185FA5]';
  const inactive = 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]';
  const showQuality = format === 'jpeg' || format === 'webp';

  return (
    <ToolPageLayout icon={<ConvertIcon />} title="Convert Image Format" description="Convert images between JPG, PNG, and WebP formats." parentHref="/utilities/images" parentLabel="Image Tools">
      {processing ? <ProcessingState message="Converting images…" /> :
       !files.length ? (
         <FileDropZone accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" multiple maxSizeMB={50} onFiles={handleFiles} />
       ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <button onClick={() => setFiles([])} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">
              Change files
            </button>
          </div>

          <div className="space-y-4 p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Output Format</p>
              <div className="flex gap-2">
                {[['jpeg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP']].map(([v, l]) => (
                  <button key={v} className={`${btn} ${format === v ? active : inactive}`} onClick={() => setFormat(v)}>{l}</button>
                ))}
              </div>
            </div>

            {showQuality && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Quality</p>
                  <span className="text-sm font-bold text-[#185FA5]">{quality}%</span>
                </div>
                <input
                  type="range" min="60" max="100" step="2" value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className="w-full accent-[#185FA5]"
                />
                <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
                  <span>Smaller file</span>
                  <span>Best quality</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleConvert} className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Convert to {format.toUpperCase()} →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
       )}
    </ToolPageLayout>
  );
}
