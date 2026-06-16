'use client';
import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';

function CropIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v14a2 2 0 0 0 2 2h14"/>
      <path d="M18 22V8a2 2 0 0 0-2-2H2"/>
    </svg>
  );
}

const ASPECTS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
];

export default function CropImagePage() {
  const [file, setFile] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [aspectKey, setAspectKey] = useState('Free');
  const [error, setError] = useState('');
  const imgRef = useRef(null);

  const aspect = ASPECTS.find(a => a.label === aspectKey)?.value;

  function handleFile([f]) {
    setFile(f); setError(''); setCrop(undefined); setCompletedCrop(undefined);
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result);
    reader.readAsDataURL(f);
  }

  function onImageLoad(e) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (aspect !== undefined) {
      setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, aspect, w, h), w, h));
    } else {
      setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
    }
  }

  function handleAspectChange(label) {
    setAspectKey(label);
    if (!imgRef.current) return;
    const { naturalWidth: w, naturalHeight: h } = imgRef.current;
    const asp = ASPECTS.find(a => a.label === label)?.value;
    if (asp !== undefined) {
      setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, asp, w, h), w, h));
    }
  }

  function handleCrop() {
    if (!completedCrop || !imgRef.current || !file) { setError('Select a crop area first.'); return; }
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const cw = Math.round(completedCrop.width * scaleX);
    const ch = Math.round(completedCrop.height * scaleY);
    if (cw === 0 || ch === 0) { setError('Crop area is too small.'); return; }

    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d').drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cw, ch, 0, 0, cw, ch
    );

    const isPng = file.type === 'image/png';
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.[^.]+$/, '') + '-cropped.' + (isPng ? 'png' : 'jpg');
      a.click();
      URL.revokeObjectURL(url);
    }, isPng ? 'image/png' : 'image/jpeg', 0.95);
  }

  const cropW = completedCrop && imgRef.current
    ? Math.round(completedCrop.width * imgRef.current.naturalWidth / imgRef.current.width)
    : 0;
  const cropH = completedCrop && imgRef.current
    ? Math.round(completedCrop.height * imgRef.current.naturalHeight / imgRef.current.height)
    : 0;

  const btn = 'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border';
  const activeBtn = 'bg-[#185FA5] text-white border-[#185FA5]';
  const inactiveBtn = 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]';

  return (
    <ToolPageLayout icon={<CropIcon />} title="Crop Image" description="Select and crop a region from any image." parentHref="/utilities/images" parentLabel="Image Tools">
      {!file ? (
        <FileDropZone accept="image/jpeg,image/png,image/webp,image/gif" maxSizeMB={50} onFiles={handleFile} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <button onClick={() => { setFile(null); setImgSrc(''); }} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">
              Change file
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center mb-3">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mr-1">Aspect:</p>
            {ASPECTS.map(a => (
              <button key={a.label} onClick={() => handleAspectChange(a.label)} className={`${btn} ${aspectKey === a.label ? activeBtn : inactiveBtn}`}>
                {a.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl overflow-auto border border-[#D1DCE8] dark:border-white/10 bg-[#F4F8FC] dark:bg-[#0D1830] flex justify-center p-2">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={c => setCompletedCrop(c)}
                aspect={aspect}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', display: 'block' }}
                />
              </ReactCrop>
            )}
          </div>

          {cropW > 0 && (
            <p className="text-xs text-[#9CA3AF] mt-2">Selected: {cropW} × {cropH} px</p>
          )}

          <button
            onClick={handleCrop}
            disabled={!completedCrop || cropW === 0}
            className="mt-3 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Crop & Download →
          </button>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
