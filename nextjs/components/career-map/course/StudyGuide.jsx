'use client';
import { useState, useEffect } from 'react';

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Minimal markdown renderer — handles ##, ###, bullet lists, Q:, A:
function GuideRenderer({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginTop: 18, marginBottom: 6 }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text)', marginTop: 12, marginBottom: 4 }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.match(/^[-•*] /)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
          <span style={{ color: 'var(--c-primary)', flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 12, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
            {line.replace(/^[-•*] /, '')}
          </span>
        </div>
      );
    } else if (line.startsWith('Q:')) {
      elements.push(
        <div key={i} style={{ marginTop: 10, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)' }}>
            {line}
          </span>
        </div>
      );
    } else if (line.startsWith('A:')) {
      elements.push(
        <div key={i} style={{ paddingLeft: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
            {line}
          </span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 4 }} />);
    } else {
      elements.push(
        <p key={i} style={{ fontSize: 12, color: 'var(--c-text-muted)', lineHeight: 1.6, margin: '2px 0' }}>
          {line}
        </p>
      );
    }
    i++;
  }

  return <div>{elements}</div>;
}

export default function StudyGuide({ courseId, skillName }) {
  const [guide, setGuide] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/v1/courses/${courseId}/study-guide/generate`, { method: 'GET' })
      .then(r => r.json())
      .then(d => { setGuide(d.guide || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  async function generate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/study-guide/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGuide({ content: data.guide, source_count: data.source_count, generated_at: data.generated_at });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function exportPdf() {
    if (!guide?.content) return;
    try {
      const res = await fetch('/api/v1/utilities/documents/markdown-to-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: `# Study Guide: ${skillName}\n\n${guide.content}` }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `study-guide-${skillName?.toLowerCase().replace(/\s+/g, '-') || 'course'}.pdf`;
      a.click();
    } catch (e) {
      alert('PDF export failed. Try again.');
    }
  }

  async function sendToNotes() {
    if (!guide?.content) return;
    try {
      const res = await fetch('/api/v1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Study Guide: ${skillName}`,
          content: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: guide.content }] },
            ],
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to save to notes');
      alert('Saved to Notes!');
    } catch {
      alert('Failed to save to Notes.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px', borderBottom: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text)' }}>Study Guide</div>
          <div style={{ fontSize: 10, color: 'var(--c-text-muted)', marginTop: 1 }}>
            {loading
              ? 'Loading…'
              : guide
                ? `${guide.source_count > 0 ? `${guide.source_count} sources · ` : ''}${timeAgo(guide.generated_at)}`
                : 'Not generated yet'}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating || loading}
          style={{
            background: generating || loading ? 'rgba(255,255,255,0.06)' : 'var(--c-primary)',
            border: 'none', borderRadius: 7, padding: '5px 12px',
            fontSize: 11, fontWeight: 600, color: 'white',
            cursor: generating || loading ? 'default' : 'pointer',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          {generating ? '…' : guide ? '↺ Regen' : '✦ Generate'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px' }}>
        {loading ? (
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Loading…</div>
        ) : !guide ? (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📖</div>
            <div style={{ fontSize: 12, color: 'var(--c-text)', fontWeight: 600, marginBottom: 6 }}>
              Generate a study guide
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
              Creates a key concepts summary, comparisons, common patterns, and a quick quiz — synthesised from your sources.
            </div>
          </div>
        ) : (
          <GuideRenderer content={guide.content} />
        )}
      </div>

      {error && (
        <div style={{
          margin: '0 12px 8px', padding: '7px 10px', borderRadius: 8,
          background: 'rgba(217,48,37,0.12)', border: '1px solid rgba(217,48,37,0.3)',
          fontSize: 11, color: '#F87171',
        }}>
          {error}
        </div>
      )}

      {/* Export */}
      {guide && (
        <div style={{
          padding: '8px 10px', borderTop: '1px solid var(--c-border)',
          display: 'flex', gap: 6, flexShrink: 0,
        }}>
          <button
            onClick={exportPdf}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--c-border)', borderRadius: 8,
              padding: '6px 0', fontSize: 11, color: 'var(--c-text-muted)',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            ↓ Export PDF
          </button>
          <button
            onClick={sendToNotes}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--c-border)', borderRadius: 8,
              padding: '6px 0', fontSize: 11, color: 'var(--c-text-muted)',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            📓 Send to Notes
          </button>
        </div>
      )}
    </div>
  );
}
