'use client';
import { useState, useRef } from 'react';

const TABS = ['PDF', 'URL', 'Text'];

export default function AddSourceModal({ courseId, onAdded, onClose }) {
  const [tab, setTab] = useState('PDF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  async function submitPdf(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError('File must be under 25 MB');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/v1/courses/${courseId}/sources`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onAdded(data.source);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitUrl() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onAdded(data.source);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitText() {
    if (!textContent.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', title: textTitle.trim() || 'Pasted text', content: textContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onAdded(data.source);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) submitPdf(file);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--c-bg-surface, #111c27)', borderRadius: 16,
        border: '1px solid var(--c-border)', width: 440, maxWidth: '92vw',
        padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--c-text)' }}>
            Add source
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--c-text-muted)',
            cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px',
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 8, border: 'none',
                fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
                background: tab === t ? 'var(--c-primary)' : 'transparent',
                color: tab === t ? 'white' : 'var(--c-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'PDF' && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--c-primary)' : 'var(--c-border)'}`,
                borderRadius: 12, padding: '32px 20px', textAlign: 'center',
                cursor: 'pointer', transition: 'border-color 0.15s',
                background: dragOver ? 'rgba(24,95,165,0.08)' : 'transparent',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13, color: 'var(--c-text)', fontWeight: 500 }}>
                Drop a PDF here
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
                or click to browse · max 25 MB
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) submitPdf(e.target.files[0]); }}
            />
          </div>
        )}

        {tab === 'URL' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)', display: 'block', marginBottom: 6 }}>
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitUrl()}
              placeholder="https://..."
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--c-border)',
                color: 'var(--c-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
              autoFocus
            />
            <button
              onClick={submitUrl}
              disabled={loading || !url.trim()}
              style={{
                marginTop: 12, width: '100%', padding: '9px 0',
                background: loading || !url.trim() ? 'rgba(255,255,255,0.06)' : 'var(--c-primary)',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: 'white', cursor: loading || !url.trim() ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Fetching…' : 'Add URL'}
            </button>
          </div>
        )}

        {tab === 'Text' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)', display: 'block', marginBottom: 6 }}>
              Title (optional)
            </label>
            <input
              type="text"
              value={textTitle}
              onChange={e => setTextTitle(e.target.value)}
              placeholder="e.g. Lecture notes"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--c-border)',
                color: 'var(--c-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)', display: 'block', marginBottom: 6 }}>
              Content
            </label>
            <textarea
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              placeholder="Paste your notes, lecture content, or any text here…"
              rows={7}
              autoFocus
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--c-border)',
                color: 'var(--c-text)', fontSize: 12, outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', lineHeight: 1.5,
              }}
            />
            <button
              onClick={submitText}
              disabled={loading || !textContent.trim()}
              style={{
                marginTop: 12, width: '100%', padding: '9px 0',
                background: loading || !textContent.trim() ? 'rgba(255,255,255,0.06)' : 'var(--c-primary)',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: 'white', cursor: loading || !textContent.trim() ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Adding…' : 'Add text'}
            </button>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(217,48,37,0.12)', border: '1px solid rgba(217,48,37,0.3)',
            fontSize: 12, color: '#F87171',
          }}>
            {error}
          </div>
        )}

        {loading && tab === 'PDF' && (
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--c-text-muted)' }}>
            Extracting text…
          </div>
        )}
      </div>
    </div>
  );
}
