'use client';

import { useState, useRef, useEffect } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function PenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

const PLACEMENT_OPTIONS = [
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const APPLY_OPTIONS = [
  { value: 'last', label: 'Last Page' },
  { value: 'all', label: 'All Pages' },
  { value: 'first', label: 'First Page' },
];

export default function SignPage() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [typedName, setTypedName] = useState('');
  const [sigFile, setSigFile] = useState(null);
  const [placement, setPlacement] = useState('bottom-right');
  const [applyTo, setApplyTo] = useState('last');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Initialize canvas size and clear
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 400;
      canvasRef.current.height = 150;
      initCanvas();
    }
  }, [mode]);

  function initCanvas() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 400, 150);
  }

  // Typed name preview
  useEffect(() => {
    if (mode !== 'type' || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 400, 150);
    if (typedName) {
      ctx.font = 'italic 48px Georgia, serif';
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 75);
    }
  }, [typedName, mode]);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 150 / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e);
  }

  function draw(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDraw() {
    drawing.current = false;
  }

  async function handleSign() {
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const numPages = doc.getPageCount();

      // Get signature as PNG bytes
      let pngBytes;
      if (mode === 'upload' && sigFile) {
        if (sigFile.type === 'image/png') {
          pngBytes = new Uint8Array(await sigFile.arrayBuffer());
        } else {
          // Convert to PNG via canvas
          const url = URL.createObjectURL(sigFile);
          const img = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = url;
          });
          URL.revokeObjectURL(url);
          const cv = document.createElement('canvas');
          cv.width = img.naturalWidth;
          cv.height = img.naturalHeight;
          cv.getContext('2d').drawImage(img, 0, 0);
          pngBytes = new Uint8Array(
            await new Promise(res =>
              cv.toBlob(async b => res(new Uint8Array(await b.arrayBuffer())), 'image/png')
            )
          );
        }
      } else {
        // Draw or type mode — get from canvas
        pngBytes = new Uint8Array(
          await new Promise(res =>
            canvasRef.current.toBlob(
              async b => res(new Uint8Array(await b.arrayBuffer())),
              'image/png'
            )
          )
        );
      }

      const sigImg = await doc.embedPng(pngBytes);
      const sigW = 180;
      const sigH = Math.round(sigW * (150 / 400)); // canvas aspect ratio

      // Determine which pages to sign
      let pageIndices = [];
      if (applyTo === 'first') pageIndices = [0];
      else if (applyTo === 'last') pageIndices = [numPages - 1];
      else pageIndices = Array.from({ length: numPages }, (_, i) => i);

      for (const pi of pageIndices) {
        const page = doc.getPage(pi);
        const { width, height } = page.getSize();
        const margin = 30;
        let x;
        if (placement === 'bottom-right') x = width - sigW - margin;
        else if (placement === 'bottom-left') x = margin;
        else x = (width - sigW) / 2;
        const y = margin;
        page.drawImage(sigImg, { x, y, width: sigW, height: sigH });
      }

      const blob = new Blob([await doc.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to sign PDF. ' + (err.message || 'Please try again.'));
    } finally {
      setProcessing(false);
    }
  }

  const modeTabs = [
    { value: 'draw', label: 'Draw' },
    { value: 'type', label: 'Type' },
    { value: 'upload', label: 'Upload Image' },
  ];

  return (
    <ToolPageLayout
      icon={<PenIcon />}
      title="Sign PDF"
      description="Add your signature to a PDF document."
      parentHref="/utilities/security"
      parentLabel="Security Tools"
    >
      {/* PDF drop zone */}
      {!file && (
        <FileDropZone
          accept="application/pdf"
          maxSizeMB={100}
          onFiles={files => { setFile(files[0]); setError(''); }}
        />
      )}

      {file && !processing && (
        <div className="space-y-5">
          {/* File info */}
          <div className="flex items-center justify-between p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#EDE9FE] flex items-center justify-center flex-shrink-0 text-[#185FA5]">
                <PenIcon />
              </div>
              <span className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</span>
            </div>
            <button
              onClick={() => { setFile(null); setError(''); }}
              className="ml-3 text-sm text-[#9CA3AF] hover:text-[#185FA5] transition-colors flex-shrink-0"
            >
              Change file
            </button>
          </div>

          {/* Signature mode tabs */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Signature</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {modeTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => { setMode(tab.value); setError(''); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    mode === tab.value
                      ? 'bg-[#185FA5] text-white border-[#185FA5]'
                      : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Draw mode */}
            {mode === 'draw' && (
              <div>
                <div className="relative rounded-xl overflow-hidden border border-[#D1DCE8] dark:border-white/10 bg-white"
                  style={{ touchAction: 'none' }}>
                  <canvas
                    ref={canvasRef}
                    style={{ width: '100%', maxWidth: 400, height: 150, display: 'block', cursor: 'crosshair' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={initCanvas}
                    className="text-xs text-[#9CA3AF] hover:text-[#185FA5] transition-colors"
                  >
                    Clear
                  </button>
                  <span className="text-xs text-[#9CA3AF]">Draw your signature above</span>
                </div>
              </div>
            )}

            {/* Type mode */}
            {mode === 'type' && (
              <div>
                <input
                  type="text"
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder="Type your name…"
                  className="w-full border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5] mb-3"
                />
                <div className="rounded-xl overflow-hidden border border-[#D1DCE8] dark:border-white/10 bg-white">
                  <canvas
                    ref={canvasRef}
                    style={{ width: '100%', maxWidth: 400, height: 150, display: 'block' }}
                  />
                </div>
                <p className="text-xs text-[#9CA3AF] mt-2">Preview of your typed signature</p>
              </div>
            )}

            {/* Upload mode */}
            {mode === 'upload' && (
              <div>
                {/* Hidden canvas for upload mode (used as fallback) */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {!sigFile ? (
                  <FileDropZone
                    accept="image/png,image/jpeg"
                    maxSizeMB={10}
                    onFiles={files => setSigFile(files[0])}
                  />
                ) : (
                  <div className="flex items-center justify-between p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={URL.createObjectURL(sigFile)}
                        alt="Signature preview"
                        className="h-12 w-auto rounded border border-[#D1DCE8] bg-white object-contain"
                      />
                      <span className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{sigFile.name}</span>
                    </div>
                    <button
                      onClick={() => setSigFile(null)}
                      className="ml-3 text-sm text-[#9CA3AF] hover:text-[#185FA5] transition-colors flex-shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Placement */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Placement</p>
            <div className="flex gap-2 flex-wrap">
              {PLACEMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPlacement(opt.value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    placement === opt.value
                      ? 'bg-[#185FA5] text-white border-[#185FA5]'
                      : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Apply to */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Apply To</p>
            <div className="flex gap-2 flex-wrap">
              {APPLY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setApplyTo(opt.value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    applyTo === opt.value
                      ? 'bg-[#185FA5] text-white border-[#185FA5]'
                      : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleSign}
            disabled={mode === 'upload' && !sigFile}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign &amp; Download →
          </button>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}

      {processing && <ProcessingState message="Signing your PDF…" hint="Embedding your signature" />}
    </ToolPageLayout>
  );
}
