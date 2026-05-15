'use client';
import { RepeatableTextList } from '../RepeatableList.jsx';
import { Field, GroupLabel } from './shared.jsx';

export default function HeroEditor({ content, onChange }) {
  const c = content || {};
  const set = (k, v) => onChange({ ...c, [k]: v });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Badge text (overline)" value={c.badge_text || ''} onChange={v => set('badge_text', v)} placeholder="AI-POWERED RESUME BUILDER" />
      <Field label="Main heading" value={c.heading || ''} onChange={v => set('heading', v)} multiline rows={2} placeholder="Build a Resume That Gets You Hired" />
      <Field label="Subheading" value={c.subheading || ''} onChange={v => set('subheading', v)} multiline rows={3} placeholder="Proflect creates ATS-optimised resumes…" />

      <GroupLabel>Primary CTA</GroupLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Button label" value={c.primary_cta_label || ''} onChange={v => set('primary_cta_label', v)} placeholder="Get started free" />
        <Field label="Button URL" value={c.primary_cta_href || ''} onChange={v => set('primary_cta_href', v)} placeholder="/signup" />
      </div>

      <GroupLabel>Secondary CTA</GroupLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Button label" value={c.secondary_cta_label || ''} onChange={v => set('secondary_cta_label', v)} placeholder="See how it works" />
        <Field label="Button URL" value={c.secondary_cta_href || ''} onChange={v => set('secondary_cta_href', v)} placeholder="#how-it-works" />
      </div>

      <GroupLabel>Trust line items</GroupLabel>
      <RepeatableTextList
        items={c.trust_items || []}
        onChange={v => set('trust_items', v)}
        min={1} max={5}
        placeholder="e.g. Free forever plan"
      />
    </div>
  );
}
