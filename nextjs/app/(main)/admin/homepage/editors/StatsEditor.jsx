'use client';
import { RepeatableCardList } from '../RepeatableList.jsx';
import { Field, GroupLabel } from './shared.jsx';

export default function StatsEditor({ content, onChange }) {
  const c = content || {};
  const items = c.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GroupLabel>Stat items</GroupLabel>
      <RepeatableCardList
        items={items}
        onChange={v => onChange({ ...c, items: v })}
        min={1} max={6}
        addLabel="+ Add stat"
        itemLabel={(_, i) => `Stat ${i + 1}`}
        onAdd={() => ({ id: crypto.randomUUID(), value: '', label: '' })}
        renderItem={(item, _, update) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <Field label="Value" value={item.value || ''} onChange={v => update({ value: v })} placeholder="50,000+" />
            <Field label="Label" value={item.label || ''} onChange={v => update({ label: v })} placeholder="Resumes Created" />
          </div>
        )}
      />
    </div>
  );
}
