'use client';
import { RepeatableCardList, RepeatableTextList } from '../RepeatableList.jsx';
import { Field, SelectField, Toggle, GroupLabel } from './shared.jsx';

export default function PricingEditor({ content, section, onChange, onSectionChange }) {
  const c = content || {};
  const items = c.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Overline label" value={section?.overline || ''} onChange={v => onSectionChange({ overline: v })} placeholder="PRICING" />
      <Field label="Section heading" value={section?.title || ''} onChange={v => onSectionChange({ title: v })} placeholder="Start free. Upgrade when you're ready." />
      <Field label="Section subtext" value={section?.subtitle || ''} onChange={v => onSectionChange({ subtitle: v })} placeholder="No hidden fees. Cancel anytime." />

      <GroupLabel>Pricing plans</GroupLabel>
      <RepeatableCardList
        items={items}
        onChange={v => onChange({ ...c, items: v })}
        min={1} max={4}
        addLabel="+ Add plan"
        itemLabel={(item) => item.plan_name || 'Plan'}
        onAdd={() => ({ id: crypto.randomUUID(), plan_name: '', price: '$0', period: 'per month', description: '', is_highlighted: false, highlight_label: '', cta_label: 'Get started free', cta_href: '/signup', cta_variant: 'outlined', features: [''], sort_order: items.length + 1 })}
        renderItem={(item, _, update) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Plan name"     value={item.plan_name || ''}  onChange={v => update({ plan_name: v })} placeholder="Pro" />
              <Field label="Price"         value={item.price || ''}      onChange={v => update({ price: v })}     placeholder="$9" />
              <Field label="Billing period" value={item.period || ''}    onChange={v => update({ period: v })}    placeholder="per month" />
            </div>
            <Field label="Description" value={item.description || ''} onChange={v => update({ description: v })} multiline rows={2} placeholder="For serious job seekers…" />
            <Toggle label="Mark as most popular" checked={!!item.is_highlighted} onChange={v => update({ is_highlighted: v })} />
            {item.is_highlighted && (
              <Field label="Badge label" value={item.highlight_label || ''} onChange={v => update({ highlight_label: v })} placeholder="Most Popular" />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="CTA button label" value={item.cta_label || ''} onChange={v => update({ cta_label: v })} placeholder="Get started free" />
              <Field label="CTA button URL"   value={item.cta_href || ''}  onChange={v => update({ cta_href: v })}  placeholder="/signup" />
            </div>
            <SelectField label="Button style" value={item.cta_variant || 'outlined'} onChange={v => update({ cta_variant: v })}
              options={[{ value: 'outlined', label: 'Outlined' }, { value: 'contained', label: 'Contained (solid)' }]} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>Feature bullets</p>
              <RepeatableTextList
                items={item.features || []}
                onChange={v => update({ features: v })}
                min={1} max={10}
                placeholder="e.g. Unlimited resumes"
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
