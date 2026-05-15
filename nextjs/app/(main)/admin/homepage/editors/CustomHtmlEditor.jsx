'use client';
import { Field } from './shared.jsx';

export default function CustomHtmlEditor({ content, onChange }) {
  const c = content || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="HTML / embed code" value={c.html || ''} onChange={v => onChange({ ...c, html: v })} multiline rows={12} placeholder="Paste raw HTML, iframe embeds, or custom markup…" />
      <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E' }}>
        ⚠️ Custom HTML is rendered as-is. Ensure it is safe and trusted.
      </div>
    </div>
  );
}
