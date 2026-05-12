'use client';
import { useState } from 'react';
import { FONTS, PAGE_SIZES } from './templates.js';

// ── Preset colors ─────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  null, '#185FA5', '#0B8BC8', '#1D9E75', '#177A17',
  '#6B21A8', '#7c3aed', '#c0392b', '#DC2626',
  '#D97706', '#F59E0B', '#0f4c75', '#1a2744',
  '#333333', '#6c3fc5', '#059669',
];

const ACCENT_TARGETS = [
  { key: 'name', label: 'Name' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'headings', label: 'Headings' },
  { key: 'headingsLine', label: 'Headings line' },
  { key: 'headerIcons', label: 'Header icons' },
  { key: 'dotsBarsBubbles', label: 'Dots/Bars/Bubbles' },
  { key: 'dates', label: 'Dates' },
  { key: 'entrySubtitle', label: 'Entry subtitle' },
  { key: 'linkIcons', label: 'Link icons' },
];

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest mb-2">{title}</p>
  );
}

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

function Stepper({ label, value, min, max, step = 1, unit, onChange }) {
  const clamped = Math.min(max, Math.max(min, Number(value) || min));
  const atMin = clamped <= min;
  const atMax = clamped >= max;
  const dec = () => !atMin && onChange(parseFloat((clamped - step).toFixed(4)));
  const inc = () => !atMax && onChange(parseFloat((clamped + step).toFixed(4)));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-ds-textMuted">{label}</span>
        <span className="text-xs text-ds-text font-medium">{clamped}{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={dec}
          className={`w-7 h-7 flex items-center justify-center rounded border border-ds-border text-sm font-bold transition-colors ${atMin ? 'opacity-30 cursor-default' : 'hover:bg-ds-bg text-ds-text'}`}
        >–</button>
        <input
          type="range"
          min={min} max={max} step={step}
          value={clamped}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 accent-primary cursor-pointer"
        />
        <button
          onClick={inc}
          className={`w-7 h-7 flex items-center justify-center rounded border border-ds-border text-sm font-bold transition-colors ${atMax ? 'opacity-30 cursor-default' : 'hover:bg-ds-bg text-ds-text'}`}
        >+</button>
      </div>
    </div>
  );
}

function ColorSwatch({ color, selected, onClick }) {
  if (color === null) {
    return (
      <button
        onClick={onClick}
        title="None"
        className={`w-full aspect-square rounded border-2 flex items-center justify-center transition-all
          ${selected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-ds-border hover:scale-110'}`}
        style={{ background: '#fff' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      title={color}
      className={`w-full aspect-square rounded transition-all
        ${selected ? 'ring-2 ring-primary ring-offset-1' : 'hover:scale-110'}`}
      style={{ background: color }}
    >
      {selected && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="m-auto">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  );
}

function HexInput({ value, onChange }) {
  const [local, setLocal] = useState(value || '');
  const [err, setErr] = useState('');

  const handleBlur = () => {
    const v = local.replace('#', '').trim();
    if (v.length === 6 && /^[0-9A-Fa-f]{6}$/.test(v)) {
      setErr('');
      onChange('#' + v.toUpperCase());
    } else if (v.length > 0) {
      setErr('Enter a valid 6-digit hex code');
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ds-textMuted">#</span>
        <input
          value={local.replace('#', '')}
          onChange={e => { setLocal(e.target.value); setErr(''); }}
          onBlur={handleBlur}
          maxLength={6}
          placeholder="e.g. 185FA5"
          className="flex-1 px-2 py-1 text-xs border border-ds-inputBorder rounded bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
    </div>
  );
}

// ── Colors section ─────────────────────────────────────────────────────────────

function ColorsSection({ design, onChange }) {
  const d = design || {};
  const mode = d.colorMode || 'accent';
  const accentColor = d.accentColor || null;
  const accentTargets = d.accentTargets || {};
  const multiColors = d.multiColors || {};
  const borderColor = d.borderColor || null;

  const set = (key, val) => onChange({ ...d, [key]: val });

  return (
    <div>
      <SectionHeader title="Colors" />
      <div className="space-y-3">
        <Segmented
          options={[{ value: 'accent', label: 'Accent' }, { value: 'multi', label: 'Multi' }, { value: 'border', label: 'Border' }]}
          value={mode}
          onChange={v => set('colorMode', v)}
        />

        {mode === 'accent' && (
          <div className="space-y-3">
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((c, i) => (
                <ColorSwatch key={i} color={c} selected={accentColor === c} onClick={() => set('accentColor', c)} />
              ))}
            </div>
            <HexInput value={accentColor} onChange={v => set('accentColor', v)} />
            <div>
              <p className="text-xs text-ds-textMuted mb-1.5">Apply accent to</p>
              <div className="space-y-1">
                {ACCENT_TARGETS.map(t => (
                  <label key={t.key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!accentTargets[t.key]}
                      onChange={e => set('accentTargets', { ...accentTargets, [t.key]: e.target.checked })}
                      className="w-3.5 h-3.5 accent-primary rounded"
                    />
                    <span className="text-xs text-ds-text">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'multi' && (
          <div className="space-y-3">
            {ACCENT_TARGETS.map(t => (
              <div key={t.key}>
                <p className="text-xs text-ds-textMuted mb-1">{t.label}</p>
                <div className="grid grid-cols-8 gap-1">
                  {PRESET_COLORS.map((c, i) => (
                    <ColorSwatch key={i} color={c} selected={multiColors[t.key] === c} onClick={() => set('multiColors', { ...multiColors, [t.key]: c })} />
                  ))}
                </div>
                <HexInput value={multiColors[t.key]} onChange={v => set('multiColors', { ...multiColors, [t.key]: v })} />
              </div>
            ))}
          </div>
        )}

        {mode === 'border' && (
          <div className="space-y-3">
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((c, i) => (
                <ColorSwatch key={i} color={c} selected={borderColor === c} onClick={() => set('borderColor', c)} />
              ))}
            </div>
            <HexInput value={borderColor} onChange={v => set('borderColor', v)} />
          </div>
        )}
      </div>
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
  activeTab = 'design', // 'design' | 'spacing' | 'sections' — controlled by parent
}) {
  const d = design || {};
  const fs = footerSettings || { pageNumbers: false, email: false, name: false };
  const ss = spacingSettings || { fontSize: 11, lineHeight: 1.15, leftRightMargin: 15, topBottomMargin: 15, marginTop: 15, marginBottom: 15, marginLeft: 15, marginRight: 15, entrySpacing: 2 };
  const ls = layoutSettings || { columnLayout: 'one', sectionColumns: {}, pageBreaks: [], titleSize: 'medium', subtitleSize: 'medium', listStyle: 'bullet', headingIcon: 'none' };

  const set = (key, val) => onChange({ ...d, [key]: val });
  const setFs = (key, val) => onFooterChange({ ...fs, [key]: val });
  const setSs = (key, val) => onSpacingChange({ ...ss, [key]: val });
  const setLs = (key, val) => onLayoutChange({ ...ls, [key]: val });

  const noEmail = fs.email && !personalInfo?.email;
  const noName = fs.name && !personalInfo?.name;

  const enabledSections = (sections || []).filter(s => s.enabled !== false);
  const skillsSec = enabledSections.find(s => s.type === 'skills');
  const eduSec = enabledSections.find(s => s.type === 'education');
  const workSec = enabledSections.find(s => s.type === 'work_experience');

  // ── DESIGN TAB ──────────────────────────────────────────────────────────────
  // ── SECTIONS TAB ────────────────────────────────────────────────────────────
  if (activeTab === 'sections') {
    const skillsDs = skillsSec?.display_settings || {};
    const skillsLayout = skillsDs.layout || skillsDs.skillsStyle || 'rows';
    const hasLevels = (skillsSec?.content?.entries || []).some(e => e.proficiency);
    const setSkillsDs = (patch) => skillsSec && onSectionDisplayChange(skillsSec.id, { ...skillsDs, ...patch, skillsStyle: patch.layout || skillsLayout });

    return (
      <div className="p-4 space-y-6">

        {/* Skills layout */}
        {onSectionDisplayChange && skillsSec && (
          <div>
            <SectionHeader title="Skills" />
            <div className="space-y-3">
              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">Layout</p>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'rows', label: 'Rows' },
                    { value: 'grid', label: 'Grid' },
                    { value: 'compact', label: 'Compact' },
                    { value: 'bubble', label: 'Bubble' },
                    { value: 'level', label: 'Level' },
                  ].map(o => (
                    <button key={o.value} onClick={() => setSkillsDs({ layout: o.value })}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors ${skillsLayout === o.value ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {skillsLayout === 'grid' && (
                <div>
                  <p className="text-xs text-ds-textMuted mb-1.5">Columns</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} onClick={() => setSkillsDs({ columns: n })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${(skillsDs.columns || 3) === n ? 'border-primary text-primary bg-primary/5' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(skillsLayout === 'rows' || skillsLayout === 'compact' || skillsLayout === 'bubble') && (
                <div>
                  <p className="text-xs text-ds-textMuted mb-1">Category separator</p>
                  <Segmented
                    options={[{ value: 'colon', label: ': Colon' }, { value: 'dash', label: '– Dash' }, { value: 'bracket', label: '() Bracket' }]}
                    value={skillsDs.subinfoStyle || 'colon'}
                    onChange={v => setSkillsDs({ subinfoStyle: v })}
                  />
                </div>
              )}

              {skillsLayout === 'rows' && (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-ds-textMuted mb-1">Row spacing</p>
                    <Segmented
                      options={[{ value: 'tight', label: 'Tight' }, { value: 'spacious', label: 'Spacious' }]}
                      value={skillsDs.rowSpacing || 'tight'}
                      onChange={v => setSkillsDs({ rowSpacing: v })}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={!!skillsDs.startWithBullets}
                      onChange={e => setSkillsDs({ startWithBullets: e.target.checked })}
                      className="w-3.5 h-3.5 accent-primary rounded" />
                    <span className="text-xs text-ds-text">Start rows with bullets</span>
                  </label>
                </div>
              )}

              {skillsLayout === 'level' && (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-ds-textMuted mb-1">Indicator style</p>
                    <Segmented
                      options={[{ value: 'text', label: 'Text' }, { value: 'dots', label: 'Dots' }, { value: 'bar', label: 'Bar' }]}
                      value={skillsDs.levelStyle || 'dots'}
                      onChange={v => setSkillsDs({ levelStyle: v })}
                    />
                  </div>
                  {!hasLevels && (
                    <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">None of your skills have a level yet. Add one to a skill to use this style.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Column layout */}
        {onLayoutChange && (
          <div>
            <SectionHeader title="Layout" />
            <div className="space-y-4">
              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">Column layout</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'one', label: 'One Column', icon: <div className="w-full h-8 border border-current rounded flex items-center justify-center"><div className="w-3/4 h-1 bg-current rounded opacity-40" /></div> },
                    { id: 'two', label: 'Two Column', icon: <div className="w-full h-8 border border-current rounded flex gap-0.5 p-0.5"><div className="flex-1 bg-current rounded opacity-20" /><div className="flex-1 bg-current rounded opacity-20" /></div> },
                    { id: 'mix', label: 'Mix', icon: <div className="w-full h-8 border border-current rounded flex flex-col gap-0.5 p-0.5"><div className="flex-1 bg-current rounded opacity-20 w-full" /><div className="flex gap-0.5 flex-1"><div className="flex-1 bg-current rounded opacity-20" /><div className="flex-1 bg-current rounded opacity-20" /></div></div> },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setLs('columnLayout', opt.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded border text-[10px] font-medium transition-colors ${(ls.columnLayout || 'one') === opt.id ? 'border-primary text-primary bg-primary/5' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

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
                              <button key={side} onClick={() => setLs('sectionColumns', { ...ls.sectionColumns, [sec.id]: side })}
                                className={`px-2 py-1 capitalize transition-colors ${col === side ? 'bg-primary text-white' : 'text-ds-text hover:bg-ds-bg'}`}>
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
                              <button key={v} onClick={() => setLs('sectionColumns', { ...ls.sectionColumns, [sec.id]: v })}
                                className={`px-2 py-1 transition-colors ${width === v ? 'bg-primary text-white' : 'text-ds-text hover:bg-ds-bg'}`}>
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

              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">Section title size</p>
                <Segmented options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
                  value={ls.titleSize || 'medium'} onChange={v => setLs('titleSize', v)} />
              </div>
              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">Subtitle size</p>
                <Segmented options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
                  value={ls.subtitleSize || 'medium'} onChange={v => setLs('subtitleSize', v)} />
                {(({ small: 0, medium: 1, large: 2 })[ls.subtitleSize || 'medium'] > ({ small: 0, medium: 1, large: 2 })[ls.titleSize || 'medium']) && (
                  <p className="text-xs text-amber-600 mt-1">Subtitle size is larger than title size.</p>
                )}
              </div>
              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">List style</p>
                <Segmented options={[{ value: 'bullet', label: '• Bullet' }, { value: 'hyphen', label: '– Hyphen' }]}
                  value={ls.listStyle || 'bullet'} onChange={v => setLs('listStyle', v)} />
              </div>
              <div>
                <p className="text-xs text-ds-textMuted mb-1.5">Heading icon</p>
                <Segmented options={[{ value: 'none', label: 'None' }, { value: 'outline', label: 'Outline' }, { value: 'filled', label: 'Filled' }]}
                  value={ls.headingIcon || 'none'} onChange={v => setLs('headingIcon', v)} />
              </div>
            </div>
          </div>
        )}

        {/* Section Order */}
        {onSectionDisplayChange && (eduSec || workSec) && (
          <div>
            <SectionHeader title="Section Order" />
            <div className="space-y-3">
              {eduSec && (
                <div>
                  <p className="text-xs text-ds-textMuted mb-1.5">Education order</p>
                  <Segmented
                    options={[{ value: 'school-first', label: 'School → Degree' }, { value: 'degree-first', label: 'Degree → School' }]}
                    value={eduSec.display_settings?.eduOrder || 'school-first'}
                    onChange={v => onSectionDisplayChange(eduSec.id, { ...eduSec.display_settings, eduOrder: v })}
                  />
                </div>
              )}
              {workSec && (
                <div>
                  <p className="text-xs text-ds-textMuted mb-1.5">Work experience order</p>
                  <Segmented
                    options={[{ value: 'title-first', label: 'Title → Employer' }, { value: 'employer-first', label: 'Employer → Title' }]}
                    value={workSec.display_settings?.workOrder || 'title-first'}
                    onChange={v => onSectionDisplayChange(workSec.id, { ...workSec.display_settings, workOrder: v })}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── SPACING TAB ──────────────────────────────────────────────────────────────
  if (activeTab === 'spacing') return (
    <div className="p-4 space-y-6">
      <div>
        <SectionHeader title="Typography" />
        <div className="space-y-4">
          <Stepper label="Font size" value={ss.fontSize} min={9} max={14} step={0.5} unit="pt" onChange={v => setSs('fontSize', v)} />
          <Stepper label="Line height" value={ss.lineHeight} min={1.00} max={1.8} step={0.01} unit="" onChange={v => setSs('lineHeight', v)} />
        </div>
      </div>
      <div>
        <SectionHeader title="Margins" />
        <div className="space-y-4">
          <Stepper label="Left & right" value={ss.leftRightMargin ?? ss.marginLeft ?? 15} min={5} max={30} step={1} unit="mm"
            onChange={v => onSpacingChange({ ...ss, leftRightMargin: v, marginLeft: v, marginRight: v })} />
          <Stepper label="Top & bottom" value={ss.topBottomMargin ?? ss.marginTop ?? 15} min={5} max={30} step={1} unit="mm"
            onChange={v => onSpacingChange({ ...ss, topBottomMargin: v, marginTop: v, marginBottom: v })} />
          <Stepper label="Entry spacing" value={ss.entrySpacing} min={0} max={10} step={1} unit="ln" onChange={v => setSs('entrySpacing', Math.round(v))} />
        </div>
      </div>
      {onFooterChange && (
        <div>
          <SectionHeader title="Footer" />
          <div className="space-y-2">
            {[{ key: 'pageNumbers', label: 'Page Numbers' }, { key: 'email', label: 'Email' }, { key: 'name', label: 'Name' }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={!!fs[key]} onChange={e => setFs(key, e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm text-ds-text">{label}</span>
              </label>
            ))}
            {noEmail && <p className="text-xs text-amber-600 mt-1">No email address found in your personal details.</p>}
            {noName && <p className="text-xs text-amber-600 mt-1">No name found in your personal details.</p>}
          </div>
        </div>
      )}
      <button
        onClick={() => onSpacingChange({ fontSize: 11, lineHeight: 1.15, leftRightMargin: 15, topBottomMargin: 15, marginTop: 15, marginBottom: 15, marginLeft: 15, marginRight: 15, entrySpacing: 2 })}
        className="text-xs text-ds-textMuted hover:text-ds-text underline transition-colors"
      >
        Reset spacing to defaults
      </button>
    </div>
  );

  // ── DESIGN TAB (default) ─────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-6">

      {/* Header Layout */}
      <div>
        <SectionHeader title="Header Layout" />
        <div className="space-y-3">
          <div>
            <p className="text-xs text-ds-textMuted mb-1.5">Text alignment</p>
            <Segmented
              options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }]}
              value={d.headerAlignment || 'left'}
              onChange={v => set('headerAlignment', v)}
            />
          </div>
          <div>
            <p className="text-xs text-ds-textMuted mb-1.5">Details arrangement</p>
            <div className="flex gap-2">
              {[
                { v: 1, label: '1-row', icon: <div className="w-full h-5 flex items-center gap-0.5">{[1,2,3].map(i => <div key={i} className="flex-1 h-1.5 bg-current rounded opacity-50" />)}</div> },
                { v: 2, label: '2-row', icon: <div className="w-full space-y-0.5"><div className="flex gap-0.5">{[1,2].map(i => <div key={i} className="flex-1 h-1.5 bg-current rounded opacity-50"/>)}</div><div className="flex gap-0.5">{[1,2].map(i => <div key={i} className="flex-1 h-1.5 bg-current rounded opacity-50"/>)}</div></div> },
                { v: 3, label: 'Stack', icon: <div className="w-full space-y-0.5">{[1,2,3].map(i => <div key={i} className="h-1.5 bg-current rounded opacity-50"/>)}</div> },
              ].map(({ v, label, icon }) => (
                <button key={v} onClick={() => set('detailsArrangement', v)}
                  className={`flex-1 flex flex-col items-center py-2 px-2 rounded border transition-colors gap-1 ${(d.detailsArrangement || 1) === v ? 'border-primary text-primary bg-primary/5' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                  {icon}
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-ds-textMuted mb-1.5">Separator</p>
            <Segmented
              options={[{ value: 'icon', label: 'Icon' }, { value: 'bullet', label: 'Bullet' }, { value: 'bar', label: 'Bar' }]}
              value={d.detailsSeparator || 'icon'}
              onChange={v => set('detailsSeparator', v)}
            />
          </div>
          <div>
            <p className="text-xs text-ds-textMuted mb-1.5">Icon style</p>
            <div className={`flex gap-1 ${(d.detailsSeparator || 'icon') !== 'icon' ? 'opacity-40 pointer-events-none' : ''}`}>
              {[1,2,3,4,5,6,7].map(n => (
                <button key={n} onClick={() => set('headerIconStyle', n)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${(d.headerIconStyle || 1) === n ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Colors */}
      <ColorsSection design={d} onChange={onChange} />

      {/* Font */}
      <div>
        <SectionHeader title="Font" />
        <div className="space-y-1">
          {FONTS.map(f => {
            const active = (d.font || 'source-sans') === f.id;
            return (
              <button key={f.id} onClick={() => set('font', f.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer transition-colors ${active ? 'bg-primary/10 border border-primary text-primary' : 'border border-ds-border text-ds-text hover:bg-ds-bg'}`}
                style={{ fontFamily: f.family }}>
                <span>{f.name}</span>
                {active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Size */}
      <div>
        <SectionHeader title="Page Size" />
        <div className="flex gap-2">
          {PAGE_SIZES.map(p => (
            <button key={p.id} onClick={() => set('pageSize', p.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${(d.pageSize || 'a4') === p.id ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          onChange({ font: 'source-sans', pageSize: 'a4', headerAlignment: 'left', detailsArrangement: 1, detailsSeparator: 'icon', headerIconStyle: 1, colorMode: 'accent', accentColor: null, accentTargets: {}, multiColors: {}, borderColor: null });
        }}
        className="w-full text-xs text-ds-textMuted hover:text-ds-text underline transition-colors mt-2"
      >
        Reset design to defaults
      </button>
    </div>
  );
}
