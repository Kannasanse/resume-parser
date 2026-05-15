'use client';
import { RepeatableCardList } from '../RepeatableList.jsx';
import { Field, SelectField, GroupLabel } from './shared.jsx';

const ICON_OPTIONS = [
  { value: 'preview',   label: 'Live Preview' },
  { value: 'ai',        label: 'AI / Sparkles' },
  { value: 'ats',       label: 'Bar Chart' },
  { value: 'export',    label: 'Download / Export' },
  { value: 'templates', label: 'Templates / Layout' },
  { value: 'speed',     label: 'Speed / Lightning' },
  { value: 'default',   label: 'Circle (generic)' },
];

export default function FeaturesEditor({ content, section, onChange, onSectionChange }) {
  const c = content || {};
  const items = c.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Overline label" value={section?.overline || ''} onChange={v => onSectionChange({ overline: v })} placeholder="WHAT PROFLECT DOES" />
      <Field label="Section heading" value={section?.title || ''} onChange={v => onSectionChange({ title: v })} placeholder="Everything you need to land the job" />
      <Field label="Section subheading" value={section?.subtitle || ''} onChange={v => onSectionChange({ subtitle: v })} multiline rows={2} placeholder="From building to exporting…" />

      <GroupLabel>Feature cards</GroupLabel>
      <RepeatableCardList
        items={items}
        onChange={v => onChange({ ...c, items: v })}
        min={3} max={9}
        addLabel="+ Add feature card"
        itemLabel={(item) => item.title || 'Feature card'}
        onAdd={() => ({ id: crypto.randomUUID(), icon: 'default', title: '', description: '', sort_order: items.length + 1 })}
        renderItem={(item, _, update) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SelectField label="Icon" value={item.icon || 'default'} onChange={v => update({ icon: v })} options={ICON_OPTIONS} />
            <Field label="Card title" value={item.title || ''} onChange={v => update({ title: v })} placeholder="Live Resume Preview" />
            <Field label="Card description" value={item.description || ''} onChange={v => update({ description: v })} multiline rows={2} placeholder="See exactly how your resume looks…" />
          </div>
        )}
      />
    </div>
  );
}
