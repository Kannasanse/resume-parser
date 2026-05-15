'use client';
import { Field } from './shared.jsx';

export default function CustomTextEditor({ content, onChange }) {
  const c = content || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Text content" value={c.content || ''} onChange={v => onChange({ ...c, content: v })} multiline rows={10} placeholder="Enter plain text or basic HTML (bold, italic, links)…" />
      <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Plain text or basic HTML (bold, italic, links)</p>
    </div>
  );
}
