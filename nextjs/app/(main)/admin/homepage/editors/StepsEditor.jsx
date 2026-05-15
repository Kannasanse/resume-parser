'use client';
import { RepeatableCardList } from '../RepeatableList.jsx';
import { Field, GroupLabel } from './shared.jsx';

export default function StepsEditor({ content, section, onChange, onSectionChange }) {
  const c = content || {};
  const items = c.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Overline label" value={section?.overline || ''} onChange={v => onSectionChange({ overline: v })} placeholder="HOW IT WORKS" />
      <Field label="Section heading" value={section?.title || ''} onChange={v => onSectionChange({ title: v })} placeholder="From blank page to job application in minutes" />

      <GroupLabel>Steps</GroupLabel>
      <RepeatableCardList
        items={items}
        onChange={v => onChange({ ...c, items: v.map((s, i) => ({ ...s, step_number: i + 1 })) })}
        min={2} max={6}
        addLabel="+ Add step"
        itemLabel={(_, i) => `Step ${i + 1}`}
        onAdd={() => ({ id: crypto.randomUUID(), step_number: items.length + 1, title: '', description: '', sort_order: items.length + 1 })}
        renderItem={(item, _, update) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Step title" value={item.title || ''} onChange={v => update({ title: v })} placeholder="Create Your Account" />
            <Field label="Step description" value={item.description || ''} onChange={v => update({ description: v })} multiline rows={2} placeholder="Sign up free in seconds…" />
          </div>
        )}
      />
    </div>
  );
}
