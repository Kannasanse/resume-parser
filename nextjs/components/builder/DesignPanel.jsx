'use client';
import { useState } from 'react';
import { FONTS, PAGE_SIZES } from './templates.js';

// ── Preset accent swatches (matches prototype) ────────────────────────────────
const PRESET_COLORS = [
  '#185FA5', '#0C447C', '#1D9E75', '#B45309',
  '#D93025', '#6D28D9', '#0F766E', '#2C2C2A',
];

const ACCENT_TARGETS = [
  { key: 'name',           label: 'Name' },
  { key: 'jobTitle',       label: 'Job title' },
  { key: 'headings',       label: 'Headings' },
  { key: 'headingsLine',   label: 'Headings line' },
  { key: 'headerIcons',    label: 'Header icons' },
  { key: 'dotsBarsBubbles',label: 'Dots / Bars / Bubbles' },
  { key: 'dates',          label: 'Dates' },
  { key: 'entrySubtitle',  label: 'Entry subtitle' },
  { key: 'linkIcons',      label: 'Link icons' },
];

// ── Collapsible section (matches prototype .section pattern) ──────────────────
function PanelSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ds-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-[18px] py-3 text-left"
      >
        <span className="text-[11px] font-semibold text-ds-text uppercase tracking-[0.06em]">{title}</span>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-ds-textMuted transition-transform duration-150"
          style={{ transform: open ? 'none' : 'rotate(-90deg)' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-[18px] pb-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Slider with inline value display ─────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ds-text">{label}</span>
        <span className="text-xs text-ds-textMuted tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full h-[4px] accent-primary cursor-pointer"
        style={{ accentColor: 'var(--primary, #185FA5)' }}
      />
    </div>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────
function Seg({ options, value, onChange }) {
  return (
    <div className="flex p-[3px] bg-ds-bg rounded-lg gap-[2px]">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-[6px] px-2 text-[11px] font-semibold rounded-md transition-all ${
            value === o.value
              ? 'bg-white text-primary shadow-sm'
              : 'text-ds-textMuted hover:text-ds-text'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Checkbox row ──────────────────────────────────────────────────────────────
function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none py-[3px]" onClick={() => onChange(!checked)}>
      <span className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex-shrink-0 grid place-items-center transition-all ${
        checked ? 'bg-primary border-primary' : 'border-ds-border bg-white'
      }`}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </span>
      <span className="text-[13px] text-ds-text">{children}</span>
    </label>
  );
}

// ── Tile button grid ──────────────────────────────────────────────────────────
function TileGrid({ cols, children }) {
  return (
    <div className="grid gap-[6px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  );
}

function Tile({ active, onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-lg grid place-items-center transition-all text-[11px] cursor-pointer ${
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-ds-border bg-white text-ds-textMuted hover:border-primary/50'
      }`}
      style={{ aspectRatio: '1', ...style }}
    >
      {children}
    </button>
  );
}

// ── HexInput ──────────────────────────────────────────────────────────────────
function HexInput({ value, onChange }) {
  const [local, setLocal] = useState((value || '').replace('#', ''));
  const [err, setErr] = useState('');

  const commit = () => {
    const v = local.replace('#', '').trim();
    if (/^[0-9A-Fa-f]{6}$/.test(v)) { setErr(''); onChange('#' + v.toUpperCase()); }
    else if (v.length > 0) setErr('Enter a valid 6-digit hex');
  };

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-ds-textMuted">#</span>
        <input
          value={local}
          onChange={e => { setLocal(e.target.value); setErr(''); }}
          onBlur={commit}
          maxLength={6}
          placeholder="185FA5"
          className="flex-1 px-2 py-1 text-xs border border-ds-inputBorder rounded bg-white text-ds-text focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
      {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
    </div>
  );
}

// ── ArrangementGlyph (matches prototype) ─────────────────────────────────────
function ArrangementGlyph({ n }) {
  const dot = <span className="w-[4px] h-[4px] bg-ds-textMuted/60 rounded-sm" />;
  if (n === 1) return <div className="flex gap-[3px]">{dot}{dot}{dot}{dot}</div>;
  if (n === 2) return (
    <div className="grid gap-[3px]">
      <div className="flex gap-[3px]">{dot}{dot}</div>
      <div className="flex gap-[3px]">{dot}{dot}</div>
    </div>
  );
  return <div className="grid gap-[3px]">{dot}{dot}{dot}{dot}</div>;
}

// ── SkillsLayoutGlyph ─────────────────────────────────────────────────────────
function SkillsGlyph({ layout }) {
  const c = 'var(--c-muted, #9CA3AF)';
  if (layout === 'grid') return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: '1fr 1fr', width: 20, height: 14 }}>
      {[0,1,2,3].map(i => <span key={i} className="bg-ds-textMuted/50 rounded-[1px]" />)}
    </div>
  );
  if (layout === 'rows') return (
    <div className="grid gap-[3px]" style={{ width: 22 }}>
      <span className="h-[3px] bg-ds-textMuted/50 rounded-[1px]" />
      <span className="h-[3px] bg-ds-textMuted/50 rounded-[1px]" style={{ width: '70%' }} />
      <span className="h-[3px] bg-ds-textMuted/50 rounded-[1px]" style={{ width: '85%' }} />
    </div>
  );
  if (layout === 'compact') return <span className="text-[8px] text-ds-textMuted/70">A·B·C</span>;
  if (layout === 'bubble') return (
    <div className="flex gap-[2px] flex-wrap" style={{ width: 26 }}>
      {[6, 8, 5, 7].map((w, i) => <span key={i} style={{ width: w, height: 5 }} className="bg-ds-textMuted/50 rounded-full" />)}
    </div>
  );
  if (layout === 'level') return (
    <div className="grid gap-[2px]">
      {[[3,0],[2,1],[3,0]].map(([n,_], i) => (
        <div key={i} className="flex gap-[2px]">
          {[1,2,3].map(d => <span key={d} style={{ width: 3, height: 3 }} className={`rounded-full ${d <= n ? 'bg-ds-textMuted/60' : 'bg-ds-border'}`} />)}
        </div>
      ))}
    </div>
  );
  return null;
}

// ── Main DesignPanel ──────────────────────────────────────────────────────────

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
  activeTab = 'design',
}) {
  const d = design || {};
  const fs = footerSettings || { pageNumbers: false, email: false, name: false };
  const ss = spacingSettings || { fontSize: 11, lineHeight: 1.15, leftRightMargin: 15, topBottomMargin: 15, marginTop: 15, marginBottom: 15, marginLeft: 15, marginRight: 15, entrySpacing: 2 };
  const ls = layoutSettings || { columnLayout: 'one', sectionColumns: {}, titleSize: 'medium', subtitleSize: 'medium', listStyle: 'bullet', headingIcon: 'none' };

  const set = (key, val) => onChange({ ...d, [key]: val });
  const setFs = (key, val) => onFooterChange({ ...fs, [key]: val });
  const setSs = (key, val) => onSpacingChange({ ...ss, [key]: val });
  const setLs = (key, val) => onLayoutChange({ ...ls, [key]: val });

  const enabledSections = (sections || []).filter(s => s.enabled !== false);
  const skillsSec = enabledSections.find(s => s.type === 'skills');
  const eduSec = enabledSections.find(s => s.type === 'education');
  const workSec = enabledSections.find(s => s.type === 'work_experience');

  // ── DESIGN TAB ──────────────────────────────────────────────────────────────
  if (activeTab === 'design') return (
    <div>
      {/* Accent Color */}
      <PanelSection title="Accent Color">
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => set('accentColor', c)}
              className="w-[26px] h-[26px] rounded-md transition-all"
              style={{
                background: c,
                border: (d.accentColor === c) ? '2px solid #2C2C2A' : '2px solid transparent',
                boxShadow: (d.accentColor === c) ? 'inset 0 0 0 2px #fff' : 'none',
              }}
              title={c}
            />
          ))}
          {/* Custom color picker */}
          <label
            className="w-[26px] h-[26px] rounded-md cursor-pointer overflow-hidden relative"
            style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
            title="Custom color"
          >
            <input
              type="color"
              value={d.accentColor || '#185FA5'}
              onChange={e => set('accentColor', e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
        <HexInput value={d.accentColor} onChange={v => set('accentColor', v)} />
      </PanelSection>

      {/* Apply accent to */}
      <PanelSection title="Apply Accent Color To" defaultOpen={false}>
        <div>
          {ACCENT_TARGETS.map(t => (
            <Check
              key={t.key}
              checked={!!(d.accentTargets || {})[t.key]}
              onChange={v => set('accentTargets', { ...(d.accentTargets || {}), [t.key]: v })}
            >
              {t.label}
            </Check>
          ))}
        </div>
      </PanelSection>

      {/* Font Family */}
      <PanelSection title="Font Family">
        <div className="space-y-[5px]">
          {FONTS.map(f => {
            const active = (d.font || 'source-sans') === f.id;
            return (
              <button
                key={f.id}
                onClick={() => set('font', f.id)}
                className={`w-full flex items-center justify-between px-[10px] py-2 border rounded-lg text-left transition-all ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-ds-border bg-white hover:border-primary/40'
                }`}
                style={{ fontFamily: f.family }}
              >
                <div>
                  <div className={`text-[13px] font-semibold ${active ? 'text-primary' : 'text-ds-text'}`}>{f.name}</div>
                  <div className="text-[11px] text-ds-textMuted">{f.sample || 'Sample text'}</div>
                </div>
                {active && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </PanelSection>

      {/* Header Alignment */}
      <PanelSection title="Header Alignment">
        <Seg
          value={d.headerAlignment || 'left'}
          onChange={v => set('headerAlignment', v)}
          options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }]}
        />
      </PanelSection>

      {/* Details Arrangement */}
      <PanelSection title="Details Arrangement">
        <TileGrid cols={3}>
          {[1, 2, 3].map(n => (
            <Tile key={n} active={(d.detailsArrangement || 1) === n} onClick={() => set('detailsArrangement', n)}>
              <ArrangementGlyph n={n} />
            </Tile>
          ))}
        </TileGrid>
        <p className="text-[11px] text-ds-textMuted">
          {(d.detailsArrangement || 1) === 1 && 'Single inline row'}
          {(d.detailsArrangement || 1) === 2 && 'Wrap across two lines'}
          {(d.detailsArrangement || 1) === 3 && 'Stacked, one per line'}
        </p>
      </PanelSection>

      {/* Details Separator */}
      <PanelSection title="Details Separator">
        <Seg
          value={d.detailsSeparator || 'icon'}
          onChange={v => set('detailsSeparator', v)}
          options={[{ value: 'icon', label: 'Icon' }, { value: 'bullet', label: 'Bullet' }, { value: 'bar', label: 'Bar' }]}
        />
      </PanelSection>

      {/* Icon Style */}
      <PanelSection title="Icon Style">
        <TileGrid cols={7}>
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <Tile key={n} active={(d.headerIconStyle || 1) === n} onClick={() => set('headerIconStyle', n)}>
              <span className="text-[9px] font-semibold">{n}</span>
            </Tile>
          ))}
        </TileGrid>
      </PanelSection>

      {/* Page Size */}
      <PanelSection title="Page Size">
        <Seg
          value={d.pageSize || 'a4'}
          onChange={v => set('pageSize', v)}
          options={PAGE_SIZES.map(p => ({ value: p.id, label: p.label }))}
        />
      </PanelSection>

      {/* Reset */}
      <div className="px-[18px] py-4">
        <button
          onClick={() => onChange({ font: 'source-sans', pageSize: 'a4', headerAlignment: 'left', detailsArrangement: 1, detailsSeparator: 'icon', headerIconStyle: 1, accentColor: '#185FA5', accentTargets: { name: true, headings: true, headingsLine: true }, multiColors: {}, borderColor: null })}
          className="text-xs text-ds-textMuted hover:text-ds-text underline transition-colors"
        >
          Reset design to defaults
        </button>
      </div>
    </div>
  );

  // ── SPACING TAB ──────────────────────────────────────────────────────────────
  if (activeTab === 'spacing') return (
    <div>
      <PanelSection title="Text">
        <Slider
          label="Font size" value={ss.fontSize} min={8} max={14} step={0.5} unit="pt"
          onChange={v => setSs('fontSize', v)}
        />
        <Slider
          label="Line height" value={ss.lineHeight} min={1} max={1.8} step={0.05}
          onChange={v => setSs('lineHeight', Math.round(v * 100) / 100)}
        />
      </PanelSection>

      <PanelSection title="Page Margins">
        <Slider
          label="Left & right margin" value={ss.leftRightMargin ?? ss.marginLeft ?? 15} min={5} max={30} unit="mm"
          onChange={v => onSpacingChange({ ...ss, leftRightMargin: v, marginLeft: v, marginRight: v })}
        />
        <Slider
          label="Top & bottom margin" value={ss.topBottomMargin ?? ss.marginTop ?? 15} min={5} max={30} unit="mm"
          onChange={v => onSpacingChange({ ...ss, topBottomMargin: v, marginTop: v, marginBottom: v })}
        />
      </PanelSection>

      <PanelSection title="Entries">
        <Slider
          label="Space between entries" value={ss.entrySpacing ?? 2} min={0} max={6} step={0.5}
          onChange={v => setSs('entrySpacing', v)}
        />
      </PanelSection>

      {/* Footer */}
      {onFooterChange && (
        <PanelSection title="Footer">
          {[{ key: 'pageNumbers', label: 'Page Numbers' }, { key: 'email', label: 'Email in footer' }, { key: 'name', label: 'Name in footer' }].map(({ key, label }) => (
            <Check key={key} checked={!!fs[key]} onChange={v => setFs(key, v)}>{label}</Check>
          ))}
        </PanelSection>
      )}

      <div className="px-[18px] py-4">
        <button
          onClick={() => onSpacingChange({ fontSize: 11, lineHeight: 1.15, leftRightMargin: 15, topBottomMargin: 15, marginTop: 15, marginBottom: 15, marginLeft: 15, marginRight: 15, entrySpacing: 2 })}
          className="text-xs text-ds-textMuted hover:text-ds-text underline transition-colors"
        >
          Reset spacing to defaults
        </button>
      </div>
    </div>
  );

  // ── SECTIONS TAB ─────────────────────────────────────────────────────────────
  const skillsDs = skillsSec?.display_settings || {};
  const skillsLayout = skillsDs.layout || skillsDs.skillsStyle || 'rows';
  const setSkillsDs = patch => skillsSec && onSectionDisplayChange(skillsSec.id, { ...skillsDs, ...patch, skillsStyle: patch.layout || skillsLayout });

  return (
    <div>
      {/* Skills */}
      {onSectionDisplayChange && skillsSec && (
        <PanelSection title="Skills">
          <div>
            <p className="text-xs font-medium text-ds-text mb-2">Layout</p>
            <TileGrid cols={5}>
              {['grid', 'rows', 'compact', 'bubble', 'level'].map(l => (
                <Tile key={l} active={skillsLayout === l} onClick={() => setSkillsDs({ layout: l })} style={{ aspectRatio: '1' }}>
                  <SkillsGlyph layout={l} />
                </Tile>
              ))}
            </TileGrid>
            <p className="text-[11px] text-ds-textMuted mt-1.5 capitalize">{skillsLayout}</p>
          </div>

          {skillsLayout === 'grid' && (
            <div>
              <p className="text-xs font-medium text-ds-text mb-1.5">Columns</p>
              <Seg
                value={skillsDs.columns || 2}
                onChange={v => setSkillsDs({ columns: v })}
                options={[2, 3, 4].map(n => ({ value: n, label: `${n} cols` }))}
              />
            </div>
          )}

          {skillsLayout === 'rows' && (
            <>
              <div>
                <p className="text-xs font-medium text-ds-text mb-1.5">Row spacing</p>
                <Seg
                  value={skillsDs.rowSpacing || 'tight'}
                  onChange={v => setSkillsDs({ rowSpacing: v })}
                  options={[{ value: 'tight', label: 'Compact' }, { value: 'spacious', label: 'Spacious' }]}
                />
              </div>
              <Check checked={!!skillsDs.startWithBullets} onChange={v => setSkillsDs({ startWithBullets: v })}>
                Start with bullets
              </Check>
              <div>
                <p className="text-xs font-medium text-ds-text mb-1.5">Subinfo style</p>
                <Seg
                  value={skillsDs.subinfoStyle || 'colon'}
                  onChange={v => setSkillsDs({ subinfoStyle: v })}
                  options={[{ value: 'dash', label: '— Dash' }, { value: 'bracket', label: '( ) Paren' }, { value: 'colon', label: ': Colon' }]}
                />
              </div>
            </>
          )}

          {skillsLayout === 'level' && (
            <div>
              <p className="text-xs font-medium text-ds-text mb-1.5">Level indicator</p>
              <Seg
                value={skillsDs.levelStyle || 'dots'}
                onChange={v => setSkillsDs({ levelStyle: v })}
                options={[{ value: 'dots', label: 'Dots' }, { value: 'bar', label: 'Bars' }, { value: 'text', label: 'Text' }]}
              />
            </div>
          )}
        </PanelSection>
      )}

      {/* Education */}
      {eduSec && onSectionDisplayChange && (
        <PanelSection title="Education">
          <p className="text-xs font-medium text-ds-text mb-1.5">Display order</p>
          <Seg
            value={eduSec.display_settings?.eduOrder || 'school-first'}
            onChange={v => onSectionDisplayChange(eduSec.id, { ...eduSec.display_settings, eduOrder: v })}
            options={[{ value: 'school-first', label: 'School → Degree' }, { value: 'degree-first', label: 'Degree → School' }]}
          />
        </PanelSection>
      )}

      {/* Work Experience */}
      {workSec && onSectionDisplayChange && (
        <PanelSection title="Work Experience">
          <p className="text-xs font-medium text-ds-text mb-1.5">Display order</p>
          <Seg
            value={workSec.display_settings?.workOrder || 'title-first'}
            onChange={v => onSectionDisplayChange(workSec.id, { ...workSec.display_settings, workOrder: v })}
            options={[{ value: 'title-first', label: 'Title → Employer' }, { value: 'employer-first', label: 'Employer → Title' }]}
          />
        </PanelSection>
      )}

      {/* Column layout */}
      {onLayoutChange && (
        <PanelSection title="Column Layout" defaultOpen={false}>
          <TileGrid cols={3}>
            {[
              { id: 'one', label: 'One col', glyph: <div className="w-full h-7 border border-current rounded flex items-center justify-center"><div className="w-3/4 h-[3px] bg-current rounded opacity-40" /></div> },
              { id: 'two', label: 'Two col', glyph: <div className="w-full h-7 border border-current rounded flex gap-0.5 p-0.5"><div className="flex-1 bg-current rounded opacity-20" /><div className="flex-1 bg-current rounded opacity-20" /></div> },
              { id: 'mix', label: 'Mix', glyph: <div className="w-full h-7 border border-current rounded flex flex-col gap-0.5 p-0.5"><div className="flex-1 bg-current rounded opacity-20" /><div className="flex gap-0.5 flex-1"><div className="flex-1 bg-current rounded opacity-20" /><div className="flex-1 bg-current rounded opacity-20" /></div></div> },
            ].map(opt => (
              <Tile key={opt.id} active={(ls.columnLayout || 'one') === opt.id} onClick={() => setLs('columnLayout', opt.id)} style={{ aspectRatio: 'auto', padding: '8px 4px 4px', flexDirection: 'column', gap: 4, display: 'flex', alignItems: 'center' }}>
                {opt.glyph}
                <span className="text-[10px]">{opt.label}</span>
              </Tile>
            ))}
          </TileGrid>

          {ls.columnLayout === 'two' && enabledSections.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-ds-textMuted mb-1">Assign to columns</p>
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
          )}
        </PanelSection>
      )}

      {/* Typography */}
      {onLayoutChange && (
        <PanelSection title="Typography" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-ds-text mb-1.5">Section title size</p>
              <Seg options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
                value={ls.titleSize || 'medium'} onChange={v => setLs('titleSize', v)} />
            </div>
            <div>
              <p className="text-xs font-medium text-ds-text mb-1.5">List style</p>
              <Seg options={[{ value: 'bullet', label: '• Bullet' }, { value: 'hyphen', label: '– Hyphen' }]}
                value={ls.listStyle || 'bullet'} onChange={v => setLs('listStyle', v)} />
            </div>
            <div>
              <p className="text-xs font-medium text-ds-text mb-1.5">Heading icon</p>
              <Seg options={[{ value: 'none', label: 'None' }, { value: 'outline', label: 'Outline' }, { value: 'filled', label: 'Filled' }]}
                value={ls.headingIcon || 'none'} onChange={v => setLs('headingIcon', v)} />
            </div>
          </div>
        </PanelSection>
      )}
    </div>
  );
}
