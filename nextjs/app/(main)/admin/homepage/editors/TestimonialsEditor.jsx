'use client';
import { RepeatableCardList } from '../RepeatableList.jsx';
import { Field, GroupLabel } from './shared.jsx';

export default function TestimonialsEditor({ content, section, onChange, onSectionChange }) {
  const c = content || {};
  const items = c.items || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Overline label" value={section?.overline || ''} onChange={v => onSectionChange({ overline: v })} placeholder="WHAT OUR USERS SAY" />
      <Field label="Section heading" value={section?.title || ''} onChange={v => onSectionChange({ title: v })} placeholder="Loved by job seekers" />
      <Field label="Section subheading" value={section?.subtitle || ''} onChange={v => onSectionChange({ subtitle: v })} placeholder="Join thousands who've landed jobs with Proflect." />
      <GroupLabel>Testimonials</GroupLabel>
      <RepeatableCardList
        items={items}
        onChange={v => onChange({ ...c, items: v })}
        min={1} max={12}
        addLabel="+ Add testimonial"
        itemLabel={(item) => item.author || 'Testimonial'}
        onAdd={() => ({ id: crypto.randomUUID(), quote: '', author: '', role: '', company: '', sort_order: items.length + 1 })}
        renderItem={(item, _, update) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Quote text" value={item.quote || ''} onChange={v => update({ quote: v })} multiline rows={3} placeholder="Proflect helped me land 5 interviews in 2 weeks…" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Author name" value={item.author || ''} onChange={v => update({ author: v })} placeholder="Jane Smith" />
              <Field label="Role / title" value={item.role || ''} onChange={v => update({ role: v })} placeholder="Senior Engineer" />
            </div>
            <Field label="Company" value={item.company || ''} onChange={v => update({ company: v })} placeholder="Acme Corp" />
          </div>
        )}
      />
    </div>
  );
}
