'use client';
import { RepeatableCardList, RepeatableTextList } from '../RepeatableList.jsx';
import { Field, GroupLabel } from './shared.jsx';

export default function FooterEditor({ content, onChange }) {
  const c = content || {};
  const cols = c.columns || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Brand tagline" value={c.tagline || ''} onChange={v => onChange({ ...c, tagline: v })} placeholder="Build resumes that get you hired." />
      <Field label="Copyright text" value={c.copyright || ''} onChange={v => onChange({ ...c, copyright: v })} placeholder="© 2025 Proflect. All rights reserved." />

      <GroupLabel>Footer columns</GroupLabel>
      <RepeatableCardList
        items={cols}
        onChange={v => onChange({ ...c, columns: v })}
        min={1} max={5}
        addLabel="+ Add column"
        itemLabel={(item) => item.heading || 'Column'}
        onAdd={() => ({ id: crypto.randomUUID(), heading: '', links: [] })}
        renderItem={(col, _, update) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Column heading" value={col.heading || ''} onChange={v => update({ heading: v })} placeholder="Product" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>Links</p>
              <RepeatableCardList
                items={col.links || []}
                onChange={v => update({ links: v })}
                min={1} max={8}
                addLabel="+ Add link"
                itemLabel={(link) => link.label || 'Link'}
                onAdd={() => ({ id: crypto.randomUUID(), label: '', href: '#' })}
                renderItem={(link, __, updateLink) => (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="Label" value={link.label || ''} onChange={v => updateLink({ label: v })} placeholder="Features" />
                    <Field label="URL"   value={link.href || ''}  onChange={v => updateLink({ href: v })}  placeholder="#features" />
                  </div>
                )}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
