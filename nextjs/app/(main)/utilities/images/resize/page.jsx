'use client';
import { useState, useRef, useEffect } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function ResizeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}

const PRESETS = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
  { label: '800×600', w: 800, h: 600 },
  { label: '400×300', w: 400, h: 300 },
];

export default function ResizeImagePage() {
  const [file, setFile] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState('jpeg');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const objUrlRef = useRef(null);

  useEffect(() => () => { if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current); }, []);

  function handleFile([f]) {
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    setFile(f); setError('');
    const url = URL.createObjectURL(f);
    objUrlRef.current = url;
    setImgSrc(url);
    const img = new Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    };
    img.src = url;
  }

  function onWidthChange(v) {
    setWidth(v);
    if (lockAspect && naturalW > 0) {
      setHeight(String(Math.round(Number(v) * naturalH / naturalW)));
    }
  }

  function onHeightChange(v) {
    setHeight(v);
    if (lockAspect && naturalH > 0) {
      setWidth(String(Math.round(Number(v) * naturalW / naturalH)));
    }
  }

  function applyPercent(pct) {
    setWidth(String(Math.round(naturalW * pct / 100)));
    setHeight(String(Math.round(naturalH * pct / 100)));
  }

  function applyPreset({ w, h }) {
    setWidth(String(w));
    if (!lockAspect) {
      setHeight(String(h));
    } else {
      setHeight(String(Math.round(h)));
    }
  }

  function handleResize() {
    if (!file || !imgSrc) return;
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (!w || !h || w <= 0 || h <= 0) { setError('Enter valid dimensions.'); return; }
    setProcessing(true); setError('');
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg';
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.[^.]+$/, '') + `-${w}x${h}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        setProcessing(false);
      }, mime, 0.92);
    };
    img.onerror = () => { setError('Failed to load image.'); setProcessing(false); };
    img.src = imgSrc;
  }

  function clearFile() {
    if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
    setFile(null); setImgSrc('');
  }

  const btn = 'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border';
  const active = 'bg-[#185FA5] text-white border-[#185FA5]';
  const inactive = 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]';

  return (
    <ToolPageLayout icon={<ResizeIcon />} title="Resize Image" description="Change image dimensions by pixels, percentage, or preset size." parentHref="/utilities/images" parentLabel="Image Tools">
      {processing ? <ProcessingState message="Resizing image…" /> :
       !file ? (
         <FileDropZone accept="image/jpeg,image/png,image/webp,image/gif" maxSizeMB={50} onFiles={handleFile} />
       ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate flex-1">{file.name}</p>
            {naturalW > 0 && <span className="text-xs text-[#9CA3AF] whitespace-nowrap">{naturalW}×{naturalH}</span>}
            <button onClick={clearFile} className="text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors whitespace-nowrap">Change</button>
          </div>

          <div className="space-y-4 p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Dimensions (px)</p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number" value={width} onChange={e => onWidthChange(e.target.value)} min="1"
                  placeholder="W"
                  className="w-24 border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                />
                <span className="text-[#9CA3AF] text-sm">×</span>
                <input
                  type="number" value={height} onChange={e => onHeightChange(e.target.value)} min="1"
                  placeholder="H"
                  className="w-24 border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
                />
                <button
                  onClick={() => setLockAspect(l => !l)}
                  title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors font-medium ${lockAspect ? 'bg-[#185FA5] text-white border-[#185FA5]' : 'text-[#9CA3AF] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5]'}`}
                >
                  {lockAspect ? 'Lock' : 'Free'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">By Percentage</p>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75].map(p => (
                  <button key={p} onClick={() => applyPercent(p)} className={`${btn} ${inactive}`}>{p}%</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Presets</p>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)} className={`${btn} ${inactive}`}>{p.label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Output Format</p>
              <div className="flex gap-2">
                {[['jpeg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP']].map(([v, l]) => (
                  <button key={v} className={`${btn} ${format === v ? active : inactive}`} onClick={() => setFormat(v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleResize} className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
            Resize to {width || '?'}×{height || '?'} →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
       )}
    </ToolPageLayout>
  );
}
