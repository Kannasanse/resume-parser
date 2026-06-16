'use client';
import { useState, useRef, useEffect } from 'react';
import { uploadImageFile } from '@/lib/editor/uploadImage';

export default function ImageInsertDialog({ open, noteId, onInsert, onCancel }) {
  const [tab, setTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlPreview, setUrlPreview] = useState('');

  const fileInputRef = useRef(null);
  const urlDebounceRef = useRef(null);
  const prevSrcRef = useRef('');

  useEffect(() => {
    if (open) {
      setTab('upload');
      setUploading(false);
      setUploadError('');
      setUploadedUrl('');
      setIsDragOver(false);
      setSelectedFile(null);
      setPreviewSrc('');
      setUrlInput('');
      setUrlPreview('');
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(urlDebounceRef.current);
    if (urlInput.trim()) {
      urlDebounceRef.current = setTimeout(() => setUrlPreview(urlInput.trim()), 500);
    } else {
      setUrlPreview('');
    }
    return () => clearTimeout(urlDebounceRef.current);
  }, [urlInput]);

  useEffect(() => {
    if (prevSrcRef.current && prevSrcRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevSrcRef.current);
    }
    prevSrcRef.current = previewSrc;
  }, [previewSrc]);

  if (!open) return null;

  async function handleFile(file) {
    if (!file?.type.startsWith('image/')) { setUploadError('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('Image must be under 10 MB'); return; }
    setSelectedFile(file);
    setPreviewSrc(URL.createObjectURL(file));
    setUploadError('');
    setUploadedUrl('');
    setUploading(true);
    try {
      const url = await uploadImageFile(file, noteId);
      setUploadedUrl(url);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
      setSelectedFile(null);
      setPreviewSrc('');
    } finally {
      setUploading(false);
    }
  }

  function resetUpload() {
    setSelectedFile(null); setPreviewSrc(''); setUploadError(''); setUploadedUrl('');
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInsert() {
    if (tab === 'upload' && uploadedUrl) onInsert(uploadedUrl);
    else if (tab === 'url' && urlInput.trim()) onInsert(urlInput.trim());
  }

  const canInsert = (tab === 'upload' && uploadedUrl && !uploading) || (tab === 'url' && urlInput.trim());

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/35"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white dark:bg-[#1A2C45] rounded-2xl overflow-hidden shadow-2xl w-[460px] max-w-[calc(100vw-32px)]">

        {/* Header + tabs */}
        <div className="px-6 pt-5 pb-0 border-b border-[#E8EFF7] dark:border-white/10">
          <h3 className="text-base font-bold text-[#2C2C2A] dark:text-[#E8EFF7] mb-4">Insert image</h3>
          <div className="flex">
            {['upload', 'url'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-[13px] font-semibold transition-colors -mb-px ${
                  tab === t
                    ? 'border-b-2 border-[#185FA5] text-[#185FA5]'
                    : 'border-b-2 border-transparent text-[#6B7280] dark:text-[#8BA3C1] hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7]'
                }`}
              >
                {t === 'upload' ? 'Upload file' : 'Paste URL'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[160px]">
          {tab === 'upload' && (
            <>
              {!selectedFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => noteId ? fileInputRef.current?.click() : null}
                  className={`border-2 border-dashed rounded-xl p-9 text-center transition-all ${
                    isDragOver
                      ? 'border-[#185FA5] bg-[rgba(24,95,165,0.04)]'
                      : 'border-[#D1DCE8] dark:border-white/15'
                  } ${noteId ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex justify-center mb-2.5">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDragOver ? '#185FA5' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                  </div>
                  {noteId ? (
                    <>
                      <p className={`text-[15px] font-medium mb-1 ${isDragOver ? 'text-[#185FA5]' : 'text-[#6B7280] dark:text-[#8BA3C1]'}`}>Drag an image here</p>
                      <p className="text-[13px] text-[#9CA3AF] mb-2">or click to browse</p>
                      <p className="text-xs text-[#9CA3AF]">JPG, PNG, GIF, WebP · Max 10 MB</p>
                    </>
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">Save the note first to enable file upload, or use the URL tab.</p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  {previewSrc && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewSrc} alt="" className="w-18 h-18 object-cover rounded-lg mx-auto mb-3" style={{ width: 72, height: 72 }} />
                  )}
                  <p className="text-[13px] font-medium text-[#2C2C2A] dark:text-[#E8EFF7] mb-1.5">{selectedFile.name}</p>
                  {uploading && <p className="text-[13px] text-[#6B7280] dark:text-[#8BA3C1]">Uploading…</p>}
                  {uploadedUrl && <p className="text-[13px] text-[#1D9E75]">✓ Upload complete</p>}
                </div>
              )}

              {uploadError && (
                <p className="text-[13px] text-[#D93025] mt-2.5 text-center">
                  {uploadError}&nbsp;
                  <button onClick={resetUpload} className="text-[#185FA5] font-semibold hover:underline">Try again</button>
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
            </>
          )}

          {tab === 'url' && (
            <>
              <div className="flex items-center border border-[#D1DCE8] dark:border-white/10 rounded-lg overflow-hidden focus-within:border-[#185FA5] focus-within:ring-2 focus-within:ring-[#185FA5]/20 transition-all">
                <span className="px-2.5 text-[#9CA3AF] flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </span>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canInsert) handleInsert(); }}
                  placeholder="https://example.com/image.jpg"
                  autoFocus
                  className="flex-1 py-2 pr-3 text-sm border-none outline-none bg-transparent text-[#2C2C2A] dark:text-[#E8EFF7] placeholder:text-[#9CA3AF]"
                />
              </div>
              {urlPreview && (
                <div className="mt-3 rounded-lg overflow-hidden max-h-[120px] text-center bg-[#F9FAFB] dark:bg-[#0D1830]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlPreview} alt="" className="max-h-[120px] max-w-full object-contain" onError={() => setUrlPreview('')} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-[7px] text-[13px] font-semibold rounded-lg border border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#1A2C45] text-[#6B7280] dark:text-[#8BA3C1] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!canInsert}
            className={`px-4 py-[7px] text-[13px] font-semibold rounded-lg transition-colors ${
              canInsert
                ? 'bg-[#185FA5] text-white hover:bg-[#0C447C] cursor-pointer'
                : 'bg-[#D1DCE8] dark:bg-white/10 text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            {uploading ? 'Uploading…' : 'Insert image'}
          </button>
        </div>
      </div>
    </div>
  );
}
