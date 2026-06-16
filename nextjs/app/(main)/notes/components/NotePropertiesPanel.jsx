'use client';
import { useState, useEffect, useRef } from 'react';

function TagChip({ slug, color, onRemove }) {
  const bg  = color ? `${color}1A` : '#E6F1FB';
  const fg  = color || '#185FA5';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color: fg, border: `1px solid ${fg}40`,
      borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 600,
      lineHeight: 1.6, whiteSpace: 'nowrap',
    }}>
      #{slug}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(slug)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: fg, padding: 0, fontSize: 14, lineHeight: 1, marginLeft: 1 }}
        >×</button>
      )}
    </span>
  );
}

export default function NotePropertiesPanel({ tags = [], allTagDefs = [], onChange }) {
  const [expanded, setExpanded]   = useState(false);
  const [input, setInput]         = useState('');
  const [suggestions, setSugg]    = useState([]);
  const inputRef                  = useRef(null);

  // Enrich slugs with color from allTagDefs
  const tagObjects = tags.map(slug => allTagDefs.find(t => t.slug === slug) || { slug, color: '#185FA5' });

  useEffect(() => {
    if (!input.trim()) { setSugg([]); return; }
    const q = input.toLowerCase();
    setSugg(
      allTagDefs.filter(t => t.slug.includes(q) && !tags.includes(t.slug)).slice(0, 6)
    );
  }, [input, allTagDefs, tags]);

  function addTag(slug, label, color) {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!clean || tags.includes(clean)) return;
    // Register in global tag registry (fire-and-forget)
    fetch('/api/v1/notes/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: clean, label: label || clean, color: color || '#185FA5' }),
    }).catch(() => {});
    onChange?.([...tags, clean]);
    setInput('');
    setSugg([]);
  }

  function removeTag(slug) {
    onChange?.(tags.filter(t => t !== slug));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      addTag(input.trim(), input.trim());
    }
    if (e.key === 'Escape') { setInput(''); setSugg([]); }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px 0', fontSize: 12, color: '#9CA3AF',
        }}
      >
        <span style={{ fontSize: 13 }}>🏷</span>
        {tagObjects.length > 0 ? (
          <>
            {tagObjects.slice(0, 3).map(t => <TagChip key={t.slug} slug={t.slug} color={t.color} />)}
            {tagObjects.length > 3 && <span>+{tagObjects.length - 3} more</span>}
          </>
        ) : (
          <span style={{ color: '#C4CEDD' }}>Add tags</span>
        )}
        <span style={{
          display: 'inline-block', marginLeft: 2,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
        }}>▾</span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          marginTop: 8, padding: 12, background: '#F9FAFB',
          border: '1px solid #E8EFF7', borderRadius: 10,
        }}>
          {tagObjects.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tagObjects.map(t => (
                <TagChip key={t.slug} slug={t.slug} color={t.color} onRemove={removeTag} />
              ))}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag…"
              autoFocus
              style={{
                width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 8,
                border: '1.5px solid #D1DCE8', outline: 'none', background: 'white',
                boxSizing: 'border-box', color: '#2C2C2A',
              }}
              onFocus={e => { e.target.style.borderColor = '#185FA5'; }}
              onBlur={e => { e.target.style.borderColor = '#D1DCE8'; }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'white', border: '1px solid #D1DCE8', borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)', marginTop: 2, overflow: 'hidden',
              }}>
                {suggestions.map(s => (
                  <button
                    key={s.slug}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); addTag(s.slug, s.label, s.color); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '7px 12px',
                      border: 'none', background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <TagChip slug={s.slug} color={s.color} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9CA3AF' }}>
            Press Enter to add a new tag
          </p>
        </div>
      )}
    </div>
  );
}
