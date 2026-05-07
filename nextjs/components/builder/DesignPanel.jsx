'use client';
import { FONTS, COLOR_THEMES, SPACING_OPTIONS, MARGIN_OPTIONS, PAGE_SIZES } from './templates.js';

function SectionHeader({ title }) {
  return (
    <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest mb-2">{title}</p>
  );
}

// ── Spacing slider/input control ──────────────────────────────────────────────

function SpacingField({ label, value, min, max, step = 1, unit, onChange }) {
  const clamped = Math.min(max, Math.max(min, Number(value) || min));

  const handleBlur = (e) => {
    const raw = parseFloat(e.target.value);
    if (isNaN(raw)) {
      e.target.value = clamped;
      return;
    }
    const next = Math.min(max, Math.max(min, raw));
    e.target.value = next;
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-ds-textMuted">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            defaultValue={clamped}
            key={clamped}
            min={min}
            max={max}
            step={step}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className="w-14 px-1.5 py-0.5 text-xs border border-ds-inputBorder rounded text-ds-text text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <span className="text-xs text-ds-textMuted w-5">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-ds-textMuted mt-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex rounded border border-ds-border overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors
            ${value === o.value ? 'bg-primary text-white' : 'text-ds-text hover:bg-ds-bg'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function DesignPanel({
  design,
  onChange,
  footerSettings,
  onFooterChange,
  spacingSettings,
  onSpacingChange,
  layoutSettings,
  onLayoutChange,
  personalInfo,
  sections,
  onSectionDisplayChange,
}) {
  const d = design || {};
  const fs = footerSettings || { pageNumbers: false, email: false, name: false };
  const ss = spacingSettings || { fontSize: 11, lineHeight: 1.15, marginTop: 15, marginBottom: 15, marginLeft: 15, marginRight: 15, entrySpacing: 2 };
  const ls = layoutSettings || { columnLayout: 'one', sectionColumns: {}, pageBreaks: [], titleSize: 'medium', subtitleSize: 'medium', listStyle: 'bullet', headingIcon: 'none' };

  const set = (key, val) => onChange({ ...d, [key]: val });
  const setFs = (key, val) => onFooterChange({ ...fs, [key]: val });
  const setSs = (key, val) => onSpacingChange({ ...ss, [key]: val });
  const setLs = (key, val) => onLayoutChange({ ...ls, [key]: val });

  // Missing data warnings for footer
  const noEmail = fs.email && !personalInfo?.email;
  const noName = fs.name && !personalInfo?.name;

  // Sections available for column assignment (Story 1)
  const enabledSections = (sections || []).filter(s => s.enabled !== false);

  return (
    <div className="p-4 space-y-5 overflow-y-auto">

      {/* ── Font ── */}
      <div>
        <SectionHeader title="Font" />
        <div className="space-y-1">
          {FONTS.map(f => {
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

      {/* ── Colour Themes ── */}
      <div>
        <SectionHeader title="Colour Theme" />
        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_THEMES.map(t => {
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
          {(d.colorTheme && COLOR_THEMES.find(t => t.id === d.colorTheme)?.name) || 'Slate Blue'}
        </p>
      </div>

      {/* ── Spacing / Density (legacy presets) ── */}
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

      {/* ── Margins (legacy presets) ── */}
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

      {/* ── Page Size ── */}
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

      {/* ── Story 2: Fine-grained spacing ── */}
      {onSpacingChange && (
        <div>
          <SectionHeader title="Fine-grained Spacing" />
          <div className="space-y-4">
            <SpacingField
              label="Font size"
              value={ss.fontSize}
              min={9} max={14} step={0.5} unit="pt"
              onChange={v => setSs('fontSize', v)}
            />
            <SpacingField
              label="Line height"
              value={ss.lineHeight}
              min={1.0} max={1.16} step={0.01} unit=""
              onChange={v => setSs('lineHeight', v)}
            />
            <SpacingField
              label="Left margin"
              value={ss.marginLeft}
              min={10} max={25} step={1} unit="mm"
              onChange={v => setSs('marginLeft', v)}
            />
            <SpacingField
              label="Right margin"
              value={ss.marginRight}
              min={10} max={25} step={1} unit="mm"
              onChange={v => setSs('marginRight', v)}
            />
            <SpacingField
              label="Top margin"
              value={ss.marginTop}
              min={10} max={25} step={1} unit="mm"
              onChange={v => setSs('marginTop', v)}
            />
            <SpacingField
              label="Bottom margin"
              value={ss.marginBottom}
              min={10} max={25} step={1} unit="mm"
              onChange={v => setSs('marginBottom', v)}
            />
            <SpacingField
              label="Entry spacing"
              value={ss.entrySpacing}
              min={1} max={10} step={1} unit="ln"
              onChange={v => setSs('entrySpacing', Math.round(v))}
            />
          </div>
        </div>
      )}

      {/* ── Story 3: Footer options ── */}
      {onFooterChange && (
        <div>
          <SectionHeader title="Footer" />
          <div className="space-y-2">
            {[
              { key: 'pageNumbers', label: 'Page Numbers' },
              { key: 'email', label: 'Email' },
              { key: 'name', label: 'Name' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!fs[key]}
                  onChange={e => setFs(key, e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-ds-text">{label}</span>
              </label>
            ))}
            {noEmail && (
              <p className="text-xs text-amber-600 mt-1">No email address found. Please add one to your contact details.</p>
            )}
            {noName && (
              <p className="text-xs text-amber-600 mt-1">No name found. Please add your name to the resume.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Story 4: Section display options ── */}
      {onSectionDisplayChange && enabledSections.length > 0 && (() => {
        const skillsSec = enabledSections.find(s => s.type === 'skills');
        const eduSec = enabledSections.find(s => s.type === 'education');
        const workSec = enabledSections.find(s => s.type === 'work_experience');

        const SKILLS_STYLES = [
          { value: 'rows', label: 'Rows' },
          { value: 'grid', label: 'Grid' },
          { value: 'compact', label: 'Compact' },
          { value: 'bubble', label: 'Bubble' },
          { value: 'level', label: 'Level' },
        ];

        const hasAnyDisplaySection = skillsSec || eduSec || workSec;
        if (!hasAnyDisplaySection) return null;

        return (
          <div>
            <SectionHeader title="Section Display" />
            <div className="space-y-4">
              {skillsSec && (
                <div>
                  <p className="text-xs text-ds-textMuted mb-1.5">Skills layout</p>
                  <div className="grid grid-cols-3 gap-1">
                    {SKILLS_STYLES.map(o => {
                      const active = (skillsSec.display_settings?.skillsStyle || 'rows') === o.value;
                      return (
                        <button
                          key={o.value}
                          onClick={() => onSectionDisplayChange(skillsSec.id, { ...skillsSec.display_settings, skillsStyle: o.value })}
                          className={`py-1.5 text-xs font-medium rounded border transition-colors
                            ${active ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  {(skillsSec.display_settings?.skillsStyle === 'level') &&
                    !(skillsSec.content?.entries || []).some(e => e.proficiency) && (
                    <p className="text-xs text-amber-600 mt-1">
                      Skill levels are not set. Add proficiency levels to your skills to use this style.
                    </p>
                  )}
                </div>
              )}

              {eduSec && (
                <div>
                  <p className="text-xs text-ds-textMuted mb-1.5">Education order</p>
                  <Segmented
                    options={[
                      { value: 'school-first', label: 'School → Degree' },
                      { value: 'degree-first', label: 'Degree → School' },
                    ]}
                    value={eduSec.display_settings?.eduOrder || 'school-first'}
                    onChange={v => onSectionDisplayChange(eduSec.id, { ...eduSec.display_settings, eduOrder: v })}
                  />
                </div>
              )}

              {workSec && (
                <div>
                  <p className="text-xs text-ds-textMuted mb-1.5">Work experience order</p>
                  <Segmented
                    options={[
                      { value: 'title-first', label: 'Title → Employer' },
                      { value: 'employer-first', label: 'Employer → Title' },
                    ]}
                    value={workSec.display_settings?.workOrder || 'title-first'}
                    onChange={v => onSectionDisplayChange(workSec.id, { ...workSec.display_settings, workOrder: v })}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Story 1: Layout customization ── */}
      {onLayoutChange && (
        <div>
          <SectionHeader title="Layout" />
          <div className="space-y-4">
            {/* Column layout */}
            <div>
              <p className="text-xs text-ds-textMuted mb-1.5">Column layout</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'one', label: 'One Column', icon: (
                    <div className="w-full h-8 border border-current rounded flex items-center justify-center">
                      <div className="w-3/4 h-1 bg-current rounded opacity-40" />
                    </div>
                  )},
                  { id: 'two', label: 'Two Column', icon: (
                    <div className="w-full h-8 border border-current rounded flex gap-0.5 p-0.5">
                      <div className="flex-1 bg-current rounded opacity-20" />
                      <div className="flex-1 bg-current rounded opacity-20" />
                    </div>
                  )},
                  { id: 'mix', label: 'Mix', icon: (
                    <div className="w-full h-8 border border-current rounded flex flex-col gap-0.5 p-0.5">
                      <div className="flex-1 bg-current rounded opacity-20 w-full" />
                      <div className="flex gap-0.5 flex-1">
                        <div className="flex-1 bg-current rounded opacity-20" />
                        <div className="flex-1 bg-current rounded opacity-20" />
                      </div>
                    </div>
                  )},
                ].map(opt => {
                  const active = (ls.columnLayout || 'one') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setLs('columnLayout', opt.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded border text-[10px] font-medium transition-colors
                        ${active ? 'border-primary text-primary bg-primary/5' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two-column section assignment */}
            {ls.columnLayout === 'two' && enabledSections.length > 0 && (
              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">Assign sections to columns</p>
                <div className="space-y-1">
                  {enabledSections.map(sec => {
                    const col = ls.sectionColumns?.[sec.id] || 'left';
                    return (
                      <div key={sec.id} className="flex items-center justify-between text-xs">
                        <span className="text-ds-text truncate flex-1 mr-2">{sec.title}</span>
                        <div className="flex rounded border border-ds-border overflow-hidden flex-shrink-0">
                          {['left', 'right'].map(side => (
                            <button
                              key={side}
                              onClick={() => setLs('sectionColumns', { ...ls.sectionColumns, [sec.id]: side })}
                              className={`px-2 py-1 capitalize transition-colors
                                ${col === side ? 'bg-primary text-white' : 'text-ds-text hover:bg-ds-bg'}`}
                            >
                              {side}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mix mode per-section column width */}
            {ls.columnLayout === 'mix' && enabledSections.length > 0 && (
              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">Section width</p>
                <div className="space-y-1">
                  {enabledSections.map(sec => {
                    const width = ls.sectionColumns?.[sec.id] || 'full';
                    return (
                      <div key={sec.id} className="flex items-center justify-between text-xs">
                        <span className="text-ds-text truncate flex-1 mr-2">{sec.title}</span>
                        <div className="flex rounded border border-ds-border overflow-hidden flex-shrink-0">
                          {[{ v: 'full', l: '1-col' }, { v: 'half', l: '2-col' }].map(({ v, l }) => (
                            <button
                              key={v}
                              onClick={() => setLs('sectionColumns', { ...ls.sectionColumns, [sec.id]: v })}
                              className={`px-2 py-1 transition-colors
                                ${width === v ? 'bg-primary text-white' : 'text-ds-text hover:bg-ds-bg'}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Typography sizes */}
            <div>
              <p className="text-xs text-ds-textMuted mb-1.5">Section title size</p>
              <Segmented
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                value={ls.titleSize || 'medium'}
                onChange={v => setLs('titleSize', v)}
              />
            </div>
            <div>
              <p className="text-xs text-ds-textMuted mb-1.5">Subtitle size</p>
              <Segmented
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                value={ls.subtitleSize || 'medium'}
                onChange={v => {
                  const titleRank = { small: 0, medium: 1, large: 2 };
                  if (titleRank[v] > titleRank[ls.titleSize || 'medium']) {
                    // subtitleSize would exceed titleSize — show warning but still set
                    setLs('subtitleSize', v);
                  } else {
                    setLs('subtitleSize', v);
                  }
                }}
              />
              {(() => {
                const rank = { small: 0, medium: 1, large: 2 };
                return rank[ls.subtitleSize || 'medium'] > rank[ls.titleSize || 'medium'];
              })() && (
                <p className="text-xs text-amber-600 mt-1">Subtitle size is larger than title size.</p>
              )}
            </div>

            {/* List style */}
            <div>
              <p className="text-xs text-ds-textMuted mb-1.5">List style</p>
              <Segmented
                options={[
                  { value: 'bullet', label: '• Bullet' },
                  { value: 'hyphen', label: '– Hyphen' },
                ]}
                value={ls.listStyle || 'bullet'}
                onChange={v => setLs('listStyle', v)}
              />
            </div>

            {/* Heading icon style */}
            <div>
              <p className="text-xs text-ds-textMuted mb-1.5">Heading icon</p>
              <Segmented
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'outline', label: 'Outline' },
                  { value: 'filled', label: 'Filled' },
                ]}
                value={ls.headingIcon || 'none'}
                onChange={v => setLs('headingIcon', v)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Reset ── */}
      <button
        onClick={() => {
          onChange({ font: 'source-sans', colorTheme: 'slate-blue', spacing: 'normal', margins: 'normal', pageSize: 'a4' });
          if (onFooterChange) onFooterChange({ pageNumbers: false, email: false, name: false });
          if (onSpacingChange) onSpacingChange({ fontSize: 11, lineHeight: 1.15, marginTop: 15, marginBottom: 15, marginLeft: 15, marginRight: 15, entrySpacing: 2 });
          if (onLayoutChange) onLayoutChange({ columnLayout: 'one', sectionColumns: {}, pageBreaks: [], titleSize: 'medium', subtitleSize: 'medium', listStyle: 'bullet', headingIcon: 'none' });
        }}
        className="w-full text-xs text-ds-textMuted hover:text-ds-text underline transition-colors mt-2"
      >
        Reset to defaults
      </button>
    </div>
  );
}
