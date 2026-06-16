'use client';
import { TEMPLATE_PREVIEWS } from './ResumeTemplatePreviews.jsx';
import { TemplateThumbnail } from './ResumePreview.jsx';

export function StarBadge({ small = false }) {
  if (small) return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-400/20 text-yellow-700 rounded border border-yellow-400/40">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      Featured
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-yellow-400 text-yellow-900 rounded-sm shadow-sm">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      Featured
    </span>
  );
}

export function TemplatePreviewCard({ templateId, active, label, style, plan, featured = false }) {
  const entry = TEMPLATE_PREVIEWS[templateId];
  if (entry) {
    const Comp = entry.component;
    return (
      <div className={`rounded-lg overflow-hidden border-2 transition-colors ${active ? 'border-primary' : 'border-ds-border'}`}>
        <div style={{ aspectRatio: '210/297', overflow: 'hidden' }}>
          <Comp />
        </div>
        <div className="bg-ds-card px-2 py-1.5 border-t border-ds-border flex items-center justify-between gap-1">
          <p className="text-xs font-medium text-ds-text truncate">{label}</p>
          {featured && <StarBadge />}
        </div>
      </div>
    );
  }
  // Fallback: live render thumbnail
  return (
    <div className="relative">
      <TemplateThumbnail templateId={templateId} active={active} label={label} style={style} plan={plan} />
      {featured && (
        <div className="absolute bottom-[2.2rem] right-1.5 z-10">
          <StarBadge />
        </div>
      )}
    </div>
  );
}
