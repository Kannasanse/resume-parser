'use client';
import { useState, useEffect, useRef } from 'react';

export default function NoteSharePanel({ noteId, initialIsPublic, initialShareToken, onClose }) {
  const [isPublic,    setIsPublic]    = useState(initialIsPublic  || false);
  const [shareToken,  setShareToken]  = useState(initialShareToken || null);
  const [loading,     setLoading]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const panelRef = useRef(null);

  const origin   = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = shareToken ? `${origin}/notes/public/${shareToken}` : '';

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  async function togglePublic(value) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/v1/notes/${noteId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: value }),
      });
      const data = await res.json();
      if (res.ok) { setIsPublic(data.note.is_public); setShareToken(data.note.share_token); }
    } finally { setLoading(false); }
  }

  async function revokeLink() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/v1/notes/${noteId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: false, regenerate_token: true }),
      });
      const data = await res.json();
      if (res.ok) { setIsPublic(false); setShareToken(data.note.share_token); setConfirmRevoke(false); }
    } finally { setLoading(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const PANEL = {
    position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 200,
    width: 340, background: 'white', border: '1px solid #D1DCE8',
    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: 20,
  };

  return (
    <div ref={panelRef} style={PANEL}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2A', margin: '0 0 4px' }}>
        Share note
      </h3>
      <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>
        Anyone with the link can view this note.
      </p>

      {/* Toggle row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2A' }}>Public link</span>
        <button
          type="button"
          onClick={() => !loading && togglePublic(!isPublic)}
          aria-label={isPublic ? 'Disable public link' : 'Enable public link'}
          style={{
            width: 44, height: 24, borderRadius: 9999, border: 'none',
            cursor: loading ? 'wait' : 'pointer', position: 'relative',
            background: isPublic ? '#185FA5' : '#D1DCE8',
            transition: 'background 0.15s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: isPublic ? 22 : 2,
            width: 20, height: 20,
            background: 'white', borderRadius: 9999,
            transition: 'left 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          }} />
        </button>
      </div>

      {/* Link area */}
      {isPublic && shareUrl && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input
              readOnly
              value={shareUrl}
              style={{
                flex: 1, padding: '7px 10px', fontSize: 12, borderRadius: 8,
                border: '1px solid #D1DCE8', background: '#F9FAFB', outline: 'none',
                color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            />
            <button
              type="button"
              onClick={copyLink}
              style={{
                padding: '7px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                border: 'none', cursor: 'pointer', flexShrink: 0,
                background: copied ? '#1D9E75' : '#185FA5', color: 'white',
                transition: 'background 0.15s',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href={shareUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, color: '#185FA5', textDecoration: 'none' }}>
              Open ↗
            </a>
            {!confirmRevoke ? (
              <button type="button" onClick={() => setConfirmRevoke(true)}
                style={{ fontSize: 13, color: '#D93025', background: 'none', border: 'none', cursor: 'pointer' }}>
                Revoke link
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Break existing link?</span>
                <button type="button" onClick={() => setConfirmRevoke(false)}
                  style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" onClick={revokeLink}
                  style={{ fontSize: 12, color: '#D93025', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  Revoke
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 14, marginBottom: 0 }}>
        Recipients can view but not edit this note.
      </p>
    </div>
  );
}
