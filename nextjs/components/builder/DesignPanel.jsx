'use client';
import { FONTS, COLOR_THEMES, SPACING_OPTIONS, MARGIN_OPTIONS, PAGE_SIZES } from './templates.js';

function SectionHeader({ title }) {
  return (
    <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest mb-2">{title}</p>
  );
}


export default function DesignPanel({ design, onChange }) {
  const d = design || {};

  const set = (key, val) => onChange({ ...d, [key]: val });

  const visibleFonts = FONTS;
  const visibleThemes = COLOR_THEMES;

  return (
    <div className="p-4 space-y-5 overflow-y-auto">

      {/* Font */}
      <div>
        <SectionHeader title="Font" />
        <div className="space-y-1">
          {visibleFonts.map(f => {
            const active = (d.font || 'source-sans') === f.id;
            return (
              <button
                key={f.id}
                onClick={() => set('font', f.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer transition-colors
                  ${active ? 'bg-primary/10 border border-primary text-primary' : 'border border-ds-border text-ds-text hover:bg-ds-bg'}`}
                style={{ fontFamily: f.family }}
              >
                <span>{f.name}</span>
                {active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colour Themes */}
      <div>
        <SectionHeader title="Colour Theme" />
        <div className="grid grid-cols-5 gap-1.5">
          {visibleThemes.map(t => {
            const active = (d.colorTheme || 'slate-blue') === t.id;
            return (
              <button
                key={t.id}
                onClick={() => set('colorTheme', t.id)}
                title={t.name}
                className={`relative w-full aspect-square rounded cursor-pointer transition-all
                  ${active ? 'ring-2 ring-primary ring-offset-1' : 'hover:scale-110'}`}
                style={{ background: t.primary }}
              >
                {active && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ds-textMuted mt-1.5">
          {(d.colorTheme && visibleThemes.find(t => t.id === d.colorTheme)?.name) || 'Slate Blue'}
        </p>
      </div>

      {/* Spacing */}
      <div>
        <SectionHeader title="Spacing / Density" />
        <div className="flex gap-2">
          {SPACING_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => set('spacing', s.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors
                ${(d.spacing || 'normal') === s.id ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Margins */}
      <div>
        <SectionHeader title="Margins" />
        <div className="flex gap-2">
          {MARGIN_OPTIONS.map(m => (
            <button
              key={m.id}
              onClick={() => set('margins', m.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors
                ${(d.margins || 'normal') === m.id ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Size */}
      <div>
        <SectionHeader title="Page Size" />
        <div className="flex gap-2">
          {PAGE_SIZES.map(p => (
            <button
              key={p.id}
              onClick={() => set('pageSize', p.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors
                ${(d.pageSize || 'a4') === p.id ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange({ font: 'source-sans', colorTheme: 'slate-blue', spacing: 'normal', margins: 'normal', pageSize: 'a4' })}
        className="w-full text-xs text-ds-textMuted hover:text-ds-text underline transition-colors mt-2"
      >
        Reset to defaults
      </button>
    </div>
  );
}
