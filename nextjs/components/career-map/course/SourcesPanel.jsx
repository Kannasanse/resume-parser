'use client';
import { useState, useEffect, useRef } from 'react';
import AddSourceModal from './AddSourceModal';

const TYPE_ICONS = { pdf: '📄', url: '🔗', text: '📝', web: '🌐', ai: '🤖', youtube: '📹' };

function formatTokens(n) {
  if (!n) return '';
  if (n >= 1000) return `~${Math.round(n / 1000)}k tokens`;
  return `~${n} tokens`;
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SourceItem({ source, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '7px 8px', borderRadius: 8, marginBottom: 2,
        background: hovered ? 'rgba(24,95,165,0.08)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(24,95,165,0.20)' : 'transparent'}`,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>
        {TYPE_ICONS[source.type] || '📄'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: 'var(--c-text)', fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {source.title}
        </div>
        {source.subtitle && (
          <div style={{ fontSize: 9, color: 'var(--c-text-muted)', marginTop: 1 }}>
            {source.subtitle}
          </div>
        )}
      </div>
      {hovered && (
        <button
          onClick={() => onDelete(source.id)}
          style={{
            background: 'none', border: 'none', color: 'var(--c-text-muted)',
            cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0,
            lineHeight: 1,
          }}
          title="Remove source"
        >×</button>
      )}
    </div>
  );
}

export default function SourcesPanel({ courseId }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/sources`);
      const data = await res.json();
      setSources(data.sources || []);
    } catch (e) {
      console.error('Failed to load sources', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [courseId]);

  async function handleDelete(sourceId) {
    setSources(prev => prev.filter(s => s.id !== sourceId));
    await fetch(`/api/v1/courses/${courseId}/sources/${sourceId}`, { method: 'DELETE' });
  }

  function handleAdded(source) {
    setSources(prev => [...prev, source]);
    setAddOpen(false);
  }

  const totalTokens = sources.reduce((sum, s) => sum + (s.token_count || 0), 0);

  return (
    <>
      <div style={{
        width: 240, flexShrink: 0,
        background: 'var(--c-bg-surface, #0f1923)',
        borderRight: '1px solid var(--c-border)',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 8px', flexShrink: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--c-text-muted)',
            letterSpacing: '.1em', marginBottom: 10,
          }}>
            SOURCES
          </div>
          <button
            onClick={() => setAddOpen(true)}
            style={{
              width: '100%', padding: '7px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--c-border)',
              borderRadius: 8, fontSize: 12,
              color: 'var(--c-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,95,165,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add source
          </button>
        </div>

        {/* Source list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {loading ? (
            <div style={{ padding: '12px 8px', fontSize: 11, color: 'var(--c-text-muted)' }}>
              Loading…
            </div>
          ) : sources.length === 0 ? (
            <div style={{ padding: '16px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', lineHeight: 1.5 }}>
                Add PDFs, URLs, or text to ground the AI chat and study guide.
              </div>
            </div>
          ) : (
            sources.map(source => (
              <SourceItem key={source.id} source={source} onDelete={handleDelete} />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 14px', borderTop: '1px solid var(--c-border)',
          fontSize: 10, color: 'var(--c-text-muted)', flexShrink: 0,
        }}>
          {sources.length} source{sources.length !== 1 ? 's' : ''}
          {totalTokens > 0 && ` · ${formatTokens(totalTokens)}`}
        </div>
      </div>

      {addOpen && (
        <AddSourceModal
          courseId={courseId}
          onAdded={handleAdded}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}
