'use client';
import { Field, GroupLabel } from './shared.jsx';

export default function CtaEditor({ content, onChange }) {
  const c = content || {};
  const set = (k, v) => onChange({ ...c, [k]: v });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Heading" value={c.heading || ''} onChange={v => set('heading', v)} multiline rows={2} placeholder="Ready to land your next job?" />
      <Field label="Subtext" value={c.subtext || ''} onChange={v => set('subtext', v)} multiline rows={2} placeholder="Join 50,000+ professionals…" />

      <GroupLabel>Primary CTA</GroupLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Button label" value={c.primary_cta_label || ''} onChange={v => set('primary_cta_label', v)} placeholder="Create my resume — it's free" />
        <Field label="Button URL"   value={c.primary_cta_href || ''}  onChange={v => set('primary_cta_href', v)}  placeholder="/signup" />
      </div>

      <GroupLabel>Secondary CTA</GroupLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Button label" value={c.secondary_cta_label || ''} onChange={v => set('secondary_cta_label', v)} placeholder="See pricing" />
        <Field label="Button URL"   value={c.secondary_cta_href || ''}  onChange={v => set('secondary_cta_href', v)}  placeholder="#pricing" />
      </div>
    </div>
  );
}
