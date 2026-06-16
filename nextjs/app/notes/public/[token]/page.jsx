'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';

const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), {
  ssr: false,
  loading: () => <div style={{ minHeight: 200 }} />,
});

function TagChip({ tag }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: '#E6F1FB', color: '#185FA5',
      border: '1px solid rgba(24,95,165,0.2)',
      borderRadius: 9999, padding: '2px 10px', fontSize: 12, fontWeight: 600,
    }}>
      #{tag}
    </span>
  );
}

export default function PublicNotePage() {
  const { token } = useParams();
  const [note,    setNote]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/v1/notes/public/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setNote(d.note);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC', fontFamily: 'inherit' }}>
      {/* Minimal header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid #E8EFF7',
        background: 'white',
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#185FA5', letterSpacing: '-0.03em' }}>Proflect</span>
        </a>
        <a
          href="/login"
          style={{
            fontSize: 13, fontWeight: 600, color: '#185FA5',
            border: '1px solid #185FA5', borderRadius: 8,
            padding: '5px 14px', textDecoration: 'none',
          }}
        >
          View in Proflect
        </a>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                height: i === 1 ? 40 : 16, borderRadius: 8,
                background: '#E8EFF7', width: `${i === 1 ? 60 : 70 + (i*7)}%`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2C2C2A', margin: '0 0 8px' }}>
              Note not found
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              This note is no longer public or the link has expired.
            </p>
          </div>
        )}

        {note && (
          <>
            {/* Cover */}
            {note.cover_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={note.cover_url}
                alt=""
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 24 }}
              />
            )}

            {/* Icon */}
            {note.icon && (
              <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}>{note.icon}</div>
            )}

            {/* Title */}
            <h1 style={{
              fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em',
              color: '#2C2C2A', lineHeight: 1.2, margin: '0 0 10px',
            }}>
              {note.title || 'Untitled'}
            </h1>

            {/* Tags */}
            {note.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {note.tags.map(tag => <TagChip key={tag} tag={tag} />)}
              </div>
            )}

            {/* Meta */}
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>
              {note.updated_at && `Updated ${formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}`}
            </p>

            <hr style={{ border: 'none', height: 1, background: '#E8EFF7', marginBottom: 28 }} />

            {/* Read-only content */}
            <BlockEditor
              content={note.content}
              readOnly
              mode="readonly"
            />

            {/* Footer */}
            <div style={{ marginTop: 64, textAlign: 'center' }}>
              <a
                href="/"
                style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}
              >
                Made with Proflect →
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
