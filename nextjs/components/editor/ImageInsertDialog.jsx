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

  // Revoke previous object URL to avoid memory leaks
  useEffect(() => {
    if (prevSrcRef.current && prevSrcRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevSrcRef.current);
    }
    prevSrcRef.current = previewSrc;
  }, [previewSrc]);

  if (!open) return null;

  async function handleFile(file) {
    if (!file?.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB');
      return;
    }
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
    setSelectedFile(null);
    setPreviewSrc('');
    setUploadError('');
    setUploadedUrl('');
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInsert() {
    if (tab === 'upload' && uploadedUrl) {
      onInsert(uploadedUrl);
    } else if (tab === 'url' && urlInput.trim()) {
      onInsert(urlInput.trim());
    }
  }

  const canInsert = (tab === 'upload' && uploadedUrl && !uploading) ||
                    (tab === 'url' && urlInput.trim());

  const TAB_STYLE = (active) => ({
    padding: '8px 16px', fontSize: 13, fontWeight: 600,
    background: 'none', border: 'none', cursor: 'pointer',
    borderBottom: active ? '2px solid #185FA5' : '2px solid transparent',
    color: active ? '#185FA5' : '#6B7280',
    marginBottom: -1,
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'white', borderRadius: 16,
        width: 460, maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
      }}>
        {/* Header + tabs */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #E8EFF7' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C2C2A', margin: '0 0 16px' }}>
            Insert image
          </h3>
          <div style={{ display: 'flex' }}>
            <button style={TAB_STYLE(tab === 'upload')} onClick={() => setTab('upload')}>Upload file</button>
            <button style={TAB_STYLE(tab === 'url')}    onClick={() => setTab('url')}>Paste URL</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', minHeight: 160 }}>
          {tab === 'upload' && (
            <>
              {!selectedFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => noteId ? fileInputRef.current?.click() : null}
                  style={{
                    border: `2px dashed ${isDragOver ? '#185FA5' : '#D1DCE8'}`,
                    borderRadius: 12, padding: '36px 24px', textAlign: 'center',
                    cursor: noteId ? 'pointer' : 'default',
                    background: isDragOver ? 'rgba(24,95,165,0.04)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDragOver ? '#185FA5' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                  </div>
                  {noteId ? (
                    <>
                      <p style={{ fontSize: 15, color: isDragOver ? '#185FA5' : '#6B7280', margin: '0 0 4px', fontWeight: 500 }}>
                        Drag an image here
                      </p>
                      <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 8px' }}>or click to browse</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>JPG, PNG, GIF, WebP · Max 10 MB</p>
                    </>
                  ) : (
                    <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>
                      Save the note first to enable file upload, or use the URL tab.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {previewSrc && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewSrc} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, margin: '0 auto 12px', display: 'block' }} />
                  )}
                  <p style={{ fontSize: 13, color: '#2C2C2A', margin: '0 0 6px', fontWeight: 500 }}>{selectedFile.name}</p>
                  {uploading && <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Uploading…</p>}
                  {uploadedUrl && <p style={{ fontSize: 13, color: '#1D9E75', margin: 0 }}>✓ Upload complete</p>}
                </div>
              )}

              {uploadError && (
                <p style={{ fontSize: 13, color: '#D93025', marginTop: 10, textAlign: 'center' }}>
                  {uploadError}&nbsp;
                  <button onClick={resetUpload} style={{ color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                    Try again
                  </button>
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
            </>
          )}

          {tab === 'url' && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '1.5px solid #D1DCE8', borderRadius: 8, overflow: 'hidden',
              }}>
                <span style={{ padding: '0 10px', color: '#9CA3AF', fontSize: 14, flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </span>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canInsert) handleInsert(); }}
                  placeholder="https://example.com/image.jpg"
                  autoFocus
                  style={{
                    flex: 1, padding: '9px 12px 9px 0', fontSize: 14,
                    border: 'none', outline: 'none', color: '#2C2C2A', background: 'transparent',
                  }}
                />
              </div>
              {urlPreview && (
                <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', maxHeight: 120, textAlign: 'center', background: '#F9FAFB' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlPreview}
                    alt=""
                    style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain' }}
                    onError={() => setUrlPreview('')}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: '1px solid #D1DCE8', background: 'white', color: '#6B7280', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!canInsert}
            style={{
              padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: 'none', cursor: canInsert ? 'pointer' : 'not-allowed',
              background: canInsert ? '#185FA5' : '#D1DCE8',
              color: canInsert ? 'white' : '#9CA3AF',
            }}
          >
            {uploading ? 'Uploading…' : 'Insert image'}
          </button>
        </div>
      </div>
    </div>
  );
}
