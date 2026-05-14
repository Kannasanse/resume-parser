'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_DESIGN = {
  accentColor: '#185FA5',
  accentTargets: {
    name: true, jobTitle: true, headings: true, headingsLine: true,
    headerIcons: true, dotsBarsBubbles: true, dates: false, entrySubtitle: false,
  },
  font: 'source-sans',
  headerAlignment: 'left',
  detailsArrangement: 2,
  detailsSeparator: 'icon',
  headerIconStyle: 1,
  pageSize: 'a4',
  template: 'modern',
};

const DEFAULT_SPACING = {
  fontSize: 11, lineHeight: 1.15,
  leftRightMargin: 15, topBottomMargin: 15, entrySpacing: 2,
};

const FONT_FAMILIES = {
  'source-sans':  "'Source Sans 3', 'Helvetica Neue', sans-serif",
  'montserrat':   "'Montserrat', sans-serif",
  'georgia':      "Georgia, 'Times New Roman', serif",
  'inter':        "'Inter', 'Arial', sans-serif",
  'roboto':       "'Roboto', 'Arial', sans-serif",
  'lato':         "'Lato', sans-serif",
  'playfair':     "'Playfair Display', Georgia, serif",
  'open-sans':    "'Open Sans', sans-serif",
  'raleway':      "'Raleway', sans-serif",
  'nunito':       "'Nunito', sans-serif",
  'merriweather': "'Merriweather', Georgia, serif",
  'poppins':      "'Poppins', sans-serif",
};

const SEC_ICONS = {
  summary: 'edit', work_experience: 'briefcase', education: 'book',
  skills: 'droplet', languages: 'globe', certifications: 'award',
  projects: 'folder', hobbies: 'heart', references: 'userBadge', custom: 'puzzle',
};

// ── Icon component (full set) ──────────────────────────────────────────────────

function Icon({ name, size = 14, color = 'currentColor', strokeWidth = 2 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    mail:       <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    phone:      <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></>,
    pin:        <><path d="M12 22s8-7.6 8-13a8 8 0 0 0-16 0c0 5.4 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></>,
    link:       <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></>,
    briefcase:  <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>,
    book:       <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    droplet:    <><path d="M12 2 5.5 11A6.5 6.5 0 1 0 18.5 11L12 2z"/></>,
    globe:      <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z"/></>,
    award:      <><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/></>,
    heart:      <><path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.79 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    folder:     <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    trophy:     <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 18h4v4h-4z"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>,
    users:      <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
    fileText:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>,
    userBadge:  <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
    edit:       <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    puzzle:     <><path d="M20 14.5a2.5 2.5 0 0 0 0-5h-1V6a2 2 0 0 0-2-2h-3.5a2.5 2.5 0 0 0-5 0H5a2 2 0 0 0-2 2v3.5a2.5 2.5 0 0 1 0 5V20a2 2 0 0 0 2 2h3.5a2.5 2.5 0 0 1 5 0H17a2 2 0 0 0 2-2v-3.5z"/></>,
  };
  if (!paths[name]) return null;
  return <svg {...p}>{paths[name]}</svg>;
}

// ── HdrIcon: 7 contact icon style variants ────────────────────────────────────

function HdrIcon({ kind, style, color, size = 11 }) {
  const paths = {
    mail:  <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></>,
    pin:   <><path d="M12 22s8-7.6 8-13a8 8 0 0 0-16 0c0 5.4 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></>,
    link:  <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></>,
  };
  const iconColor = (style === 4 || style === 5) ? '#fff' : color;
  const inner = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor}
      strokeWidth={style === 6 ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      {paths[kind]}
    </svg>
  );
  const base = { width: size + 8, height: size + 8, display: 'inline-grid', placeItems: 'center', flexShrink: 0 };
  if (style === 2) return <span style={{ ...base, border: `1px solid ${color}`, borderRadius: '50%' }}>{inner}</span>;
  if (style === 3) return <span style={{ ...base, border: `1px solid ${color}`, borderRadius: 4 }}>{inner}</span>;
  if (style === 4) return <span style={{ ...base, background: color, borderRadius: '50%' }}>{inner}</span>;
  if (style === 5) return <span style={{ ...base, background: color, borderRadius: 4 }}>{inner}</span>;
  if (style === 7) return <span style={{ ...base, borderBottom: `1px solid ${color}` }}>{inner}</span>;
  return <span style={base}>{inner}</span>;
}

// ── Photo placeholder (initials avatar) ───────────────────────────────────────

function PhotoPlaceholder({ size = 72, shape = 'circle', name = '', src = null }) {
  const initials = (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? 6 : 0;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(135deg, #94A3B8, #64748B)', display: 'inline-grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.34, flexShrink: 0, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
      {initials || '?'}
    </div>
  );
}

// ── Utility: compute render values from merged settings ────────────────────────

function tmplUtils(ds, ss, ls = {}, blockAdj = {}) {
  const safe = (n, lo, hi, d) => (typeof n === 'number' && !isNaN(n) ? Math.max(lo, Math.min(hi, n)) : d);
  const fontSize   = safe(ss.fontSize, 8, 14, 11);
  const lineHeight = safe(ss.lineHeight, 1, 1.8, 1.15);
  const padX       = safe(ss.leftRightMargin, 5, 30, 15);
  const padY       = safe(ss.topBottomMargin, 5, 30, 15);
  const entryGapPx = safe(ss.entrySpacing, 0, 6, 2) * fontSize * lineHeight;
  const hexOk  = c => typeof c === 'string' && /^#([0-9a-f]{3}){1,2}$/i.test(c);
  const accent = hexOk(ds.accentColor) ? ds.accentColor : '#185FA5';
  const t      = ds.accentTargets || {};
  const colIf  = on => on ? accent : undefined;
  const fontId = ds.font || 'source-sans';
  const fontFamily = FONT_FAMILIES[fontId] || FONT_FAMILIES['source-sans'];
  const titleSizeMult = { small: 0.82, medium: 1.0, large: 1.22 }[ls.titleSize || 'medium'];
  const listStyle = ls.listStyle || 'bullet';
  const hIconSz       = Math.round(11 * titleSizeMult);
  const hFilledSz     = Math.round(15 * titleSizeMult);
  const hFilledIconSz = Math.round(8  * titleSizeMult);
  return { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf, fontFamily, titleSizeMult, listStyle, hIconSz, hFilledSz, hFilledIconSz, blockAdj };
}

// ── Extract structured data from DB resume ────────────────────────────────────

function buildRenderData(resume) {
  const pi       = resume?.personal_info || {};
  const sections = (resume?.sections || []).filter(s => s.enabled !== false);
  return { pi, sections };
}

// ── Shared section body renderers ─────────────────────────────────────────────

const SKILL_LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced'];

function SkillLevelDots({ level, color }) {
  if (!level) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
      {[1,2,3].map(lv => <span key={lv} style={{ width: 6, height: 6, borderRadius: '50%', background: lv <= level ? color : '#E5E7EB' }} />)}
    </span>
  );
}

function SkillSubSkills({ subSkills, dotColor }) {
  const subs = (subSkills || []).filter(Boolean);
  if (!subs.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 1 }}>
      {subs.map((ss, i) => (
        <span key={i} style={{ fontSize: '0.85em', color: '#6B7280' }}>
          {i > 0 && <span style={{ marginRight: 8, color: '#D1DCE8' }}>·</span>}{ss}
        </span>
      ))}
    </div>
  );
}

function SkillsBody({ sec, util, variantCols }) {
  const { accent, t, colIf } = util;
  const entries  = sec?.content?.entries || [];
  if (!entries.length) return null;
  const dss      = sec.display_settings || {};
  const layout   = dss.layout || 'rows';
  const dotColor = colIf(t.dotsBarsBubbles) || accent;

  if (layout === 'grid' || variantCols) {
    const cols = variantCols || dss.columns || 2;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: 18, rowGap: 4 }}>
        {entries.map((s, i) => (
          <div key={i}>
            <div>• {s.name}</div>
            <SkillSubSkills subSkills={s.subSkills} dotColor={dotColor} />
          </div>
        ))}
      </div>
    );
  }
  if (layout === 'compact') {
    return (
      <div>
        {entries.map((s, i) => {
          const subs = (s.subSkills || []).filter(Boolean);
          return (
            <span key={i}>
              {i > 0 && ' · '}
              <strong>{s.name}</strong>
              {subs.length > 0 && <span style={{ color: '#6B7280' }}> ({subs.join(', ')})</span>}
            </span>
          );
        })}
      </div>
    );
  }
  if (layout === 'bubble') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entries.map((s, i) => {
          const subs = (s.subSkills || []).filter(Boolean);
          return (
            <span key={i} style={{ padding: '3px 10px', borderRadius: 999, background: colIf(t.dotsBarsBubbles) ? accent + '1A' : '#F3F4F6', color: colIf(t.dotsBarsBubbles) || '#2C2C2A', fontSize: '0.9em' }}>
              {s.name}
              {subs.length > 0 && <span style={{ opacity: 0.65, fontSize: '0.88em' }}> · {subs.join(', ')}</span>}
            </span>
          );
        })}
      </div>
    );
  }
  if (layout === 'level') {
    const lvlStyle = dss.levelStyle || 'dots';
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18, rowGap: 5 }}>
        {entries.map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>{s.name}</span>
              {lvlStyle === 'dots' && <SkillLevelDots level={s.level} color={dotColor} />}
              {(lvlStyle === 'bars' || lvlStyle === 'bar') && (
                <span style={{ display: 'inline-flex', alignItems: 'center', width: 60, height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                  <span style={{ width: `${Math.round(((s.level || 2) / 3) * 100)}%`, height: '100%', background: dotColor, borderRadius: 3 }} />
                </span>
              )}
              {lvlStyle === 'text' && <span style={{ color: '#6B7280', fontSize: '0.85em' }}>{SKILL_LEVELS[s.level] || ''}</span>}
            </div>
            <SkillSubSkills subSkills={s.subSkills} dotColor={dotColor} />
          </div>
        ))}
      </div>
    );
  }
  // rows (default)
  const rowGap   = dss.rowSpacing === 'compact' ? 2 : 6;
  const subStyle = dss.subinfoStyle || 'dash';
  return (
    <div style={{ display: 'grid', rowGap }}>
      {entries.map((s, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
            {dss.startWithBullets && <span style={{ color: dotColor }}>•</span>}
            <span style={{ fontWeight: 500 }}>{s.name}</span>
            {s.level > 0 && (
              <span style={{ color: '#6B7280', fontSize: '0.9em' }}>
                {subStyle === 'dash'  ? `— ${SKILL_LEVELS[s.level] || ''}` :
                 subStyle === 'paren' ? `(${SKILL_LEVELS[s.level] || ''})` :
                 `: ${SKILL_LEVELS[s.level] || ''}`}
              </span>
            )}
          </div>
          <SkillSubSkills subSkills={s.subSkills} dotColor={dotColor} />
        </div>
      ))}
    </div>
  );
}

// Renders rich HTML body (new format) or falls back to old bullets array / plain text.
// listStyle only affects the old bullets fallback (hyphen vs disc).
function RichBody({ entry, listStyle, style }) {
  // New: HTML body stored by RichTextEditor
  if (entry.body) {
    return (
      <div
        className="resume-rich-body"
        dangerouslySetInnerHTML={{ __html: entry.body }}
        style={{ marginTop: 3, ...style }}
      />
    );
  }
  // Legacy: bullets array
  const bullets = (entry.bullets || []).filter(b => b?.trim());
  if (!bullets.length) return null;
  if (listStyle === 'hyphen') {
    return (
      <div style={{ margin: '3px 0 0', ...style }}>
        {bullets.map((b, j) => (
          <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 1 }}>
            <span style={{ flexShrink: 0, color: '#6B7280' }}>–</span>
            <span>{b}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul style={{ margin: '3px 0 0', paddingLeft: 18, listStyleType: 'disc', ...style }}>
      {bullets.map((b, j) => <li key={j} style={{ marginBottom: 1, display: 'list-item' }}>{b}</li>)}
    </ul>
  );
}

// Keep BulletList for backwards compat with any remaining callers
function BulletList({ bullets, listStyle }) {
  return <RichBody entry={{ bullets }} listStyle={listStyle} />;
}

function ExperienceBody({ secs, util, variant }) {
  const { entryGapPx, t, colIf, listStyle, blockAdj } = util;
  const allEntries = secs.flatMap(sec => {
    const order = sec.display_settings?.workOrder || sec.display_settings?.order || 'title-first';
    return (sec.content?.entries || []).map((e, idx) => ({ ...e, _order: order, _secId: sec.id, _idx: idx }));
  });
  if (!allEntries.length) return null;

  return (
    <div>
      {allEntries.map((e, i) => {
        const gap        = i < allEntries.length - 1 ? entryGapPx : 0;
        const titleFirst = e._order !== 'employer-first';
        const primary    = titleFirst ? (e.title || '') : (e.employer || '');
        const secondary  = titleFirst ? (e.employer || '') : (e.title || '');
        const entryId    = `${e._secId}-${e._idx}`;
        const adjTop     = blockAdj?.[entryId];
        if (variant === 'date-column') {
          return (
            <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
              <div style={{ fontSize: '0.88em', color: colIf(t.dates) || '#374151' }}>
                <div>{e.dates}</div>
                <div style={{ color: '#6B7280' }}>{e.location}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{primary}</div>
                <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
                <RichBody entry={e} listStyle={listStyle} />
              </div>
            </div>
          );
        }
        if (variant === 'stacked') {
          return (
            <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', marginBottom: 3 }}>{e.dates}{e.location ? ` | ${e.location}` : ''}</div>
              <RichBody entry={e} listStyle={listStyle} />
            </div>
          );
        }
        if (variant === 'inline-title-role') {
          return (
            <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
              <div style={{ fontSize: '0.88em', color: colIf(t.dates) || '#374151' }}>
                <div>{e.dates}</div>
                <div style={{ color: '#6B7280' }}>{e.location}</div>
              </div>
              <div>
                <div><strong>{primary},</strong> <em style={{ color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</em></div>
                <RichBody entry={e} listStyle={listStyle} />
              </div>
            </div>
          );
        }
        // default
        return (
          <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', whiteSpace: 'nowrap' }}>{e.dates}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
              {e.location && <div style={{ fontSize: '0.85em', color: '#6B7280' }}>{e.location}</div>}
            </div>
            <RichBody entry={e} listStyle={listStyle} />
          </div>
        );
      })}
    </div>
  );
}

function EducationBody({ secs, util, variant }) {
  const { entryGapPx, t, colIf, blockAdj } = util;
  const allEntries = secs.flatMap(sec => {
    const order = sec.display_settings?.eduOrder || sec.display_settings?.order || 'school-first';
    return (sec.content?.entries || []).map((e, idx) => ({ ...e, _order: order, _secId: sec.id, _idx: idx }));
  });
  if (!allEntries.length) return null;

  return (
    <div>
      {allEntries.map((e, i) => {
        const gap        = i < allEntries.length - 1 ? entryGapPx : 0;
        const schoolFirst = e._order !== 'degree-first';
        const primary    = schoolFirst ? (e.school || '') : (e.degree || '');
        const secondary  = schoolFirst ? (e.degree || '') : (e.school || '');
        const entryId    = `${e._secId}-${e._idx}`;
        const adjTop     = blockAdj?.[entryId];

        if (variant === 'date-column') {
          return (
            <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
              <div style={{ fontSize: '0.88em', color: colIf(t.dates) || '#374151' }}>
                <div>{e.dates}</div>
                <div style={{ color: '#6B7280' }}>{e.location}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{primary}</div>
                <div style={{ fontSize: '0.92em', color: '#6B7280' }}>{secondary}</div>
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{e.dates}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
              {e.location && <div style={{ fontSize: '0.85em', color: '#6B7280' }}>{e.location}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LanguagesBody({ sec, util }) {
  const { t, colIf } = util;
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;
  const lvlMap = { Beginner: 1, Intermediate: 2, Advanced: 3, Fluent: 4, Native: 5 };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 4 }}>
      {entries.map((l, i) => {
        const n = typeof l.level === 'number' ? Math.round(l.level * 5 / 3) : (lvlMap[l.level] || 3);
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{l.name}</span>
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[1,2,3,4,5].map(j => <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: j <= n ? (colIf(t.dotsBarsBubbles) || '#2C2C2A') : '#D1D5DB' }} />)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CertsBody({ sec, util, variant }) {
  const { entryGapPx, t, colIf } = util;
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;

  if (variant === 'three-col-bullets') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 14, rowGap: 4 }}>
        {entries.map((c, i) => <div key={i}>• {c.name}</div>)}
      </div>
    );
  }
  if (variant === 'compact-list') {
    return (
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {entries.map((c, i) => <li key={i} style={{ marginBottom: 1 }}>{c.name}{c.issuer ? `, ${c.issuer}` : ''}{c.date ? ` — ${c.date}` : ''}</li>)}
      </ul>
    );
  }
  return (
    <div>
      {entries.map((c, i) => (
        <div key={i} style={{ marginBottom: i < entries.length - 1 ? entryGapPx * 0.75 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            {c.date && <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{c.date}</div>}
          </div>
          {c.issuer && <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{c.issuer}</div>}
        </div>
      ))}
    </div>
  );
}

function ProjectsBody({ sec, util }) {
  const { entryGapPx, t, colIf, listStyle, blockAdj } = util;
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;
  return (
    <div>
      {entries.map((p, i) => {
        const entryId = `${sec.id}-${i}`;
        const adjTop  = blockAdj?.[entryId];
        return (
          <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ marginBottom: i < entries.length - 1 ? entryGapPx * 0.75 : 0, ...(adjTop ? { marginTop: adjTop } : {}) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              {p.dates && <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{p.dates}</div>}
            </div>
            {p.role && <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{p.role}</div>}
            {p.link && <div style={{ fontSize: '0.85em', color: '#6B7280' }}>{p.link}</div>}
            <RichBody entry={p} listStyle={listStyle} />
          </div>
        );
      })}
    </div>
  );
}

// Dispatch section body by type
function renderSectionBody(sec, util, opts = {}) {
  const type = sec.type;
  if (type === 'summary') {
    const txt = sec.content?.text || '';
    const isHtml = txt.trim().startsWith('<');
    return isHtml
      ? <div className="resume-rich-body" style={{ fontSize: '0.95em' }} dangerouslySetInnerHTML={{ __html: txt }} />
      : <div style={{ fontSize: '0.95em' }}>{txt}</div>;
  }
  if (type === 'work_experience') return <ExperienceBody secs={[sec]} util={util} variant={opts.expVariant} />;
  if (type === 'education')      return <EducationBody secs={[sec]} util={util} variant={opts.eduVariant} />;
  if (type === 'skills')         return <SkillsBody sec={sec} util={util} variantCols={opts.skillsCols} />;
  if (type === 'languages')      return <LanguagesBody sec={sec} util={util} />;
  if (type === 'certifications') return <CertsBody sec={sec} util={util} variant={opts.certVariant} />;
  if (type === 'projects')       return <ProjectsBody sec={sec} util={util} />;
  if (type === 'hobbies' || type === 'references') {
    const text = sec.content?.text;
    return text ? <div style={{ fontSize: '0.95em' }}>{text}</div> : null;
  }
  // custom / unknown
  const text = sec.content?.text;
  if (text) return <div style={{ fontSize: '0.95em', whiteSpace: 'pre-wrap' }}>{text}</div>;
  const entries = sec.content?.entries;
  if (Array.isArray(entries) && entries.length) {
    return (
      <div>
        {entries.map((e, i) => {
          const body = e.body || e.description || '';
          const isHtml = body.trim().startsWith('<');
          return (
            <div key={i} style={{ marginBottom: 6 }}>
              {e.title && <div style={{ fontWeight: 600 }}>{e.title}</div>}
              {body && (isHtml
                ? <div className="resume-rich-body" dangerouslySetInnerHTML={{ __html: body }} style={{ fontSize: '0.95em' }} />
                : <div style={{ fontSize: '0.95em', whiteSpace: 'pre-wrap' }}>{body}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

// ── Contact detail item (for Modern header) ───────────────────────────────────

function buildDetailsBlock(pi, ds, util) {
  const { fontSize, t, colIf } = util;
  const details = [
    { kind: 'mail',  val: pi.email },
    { kind: 'phone', val: pi.phone },
    { kind: 'pin',   val: pi.location },
    { kind: 'link',  val: pi.link },
  ].filter(d => d.val);
  if (!details.length) return null;

  const sep   = ds.detailsSeparator || 'icon';
  const arr   = ds.detailsArrangement || 2;
  const align = ds.headerAlignment === 'center' ? 'center' : 'flex-start';

  const item = ({ kind, val }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      {sep === 'icon' && <HdrIcon kind={kind} style={ds.headerIconStyle || 1} color={colIf(t.headerIcons) || '#6B7280'} size={fontSize - 2} />}
      <span>{val}</span>
    </span>
  );

  if (arr === 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 7, fontSize: '0.92em', color: '#6B7280', alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        {details.map(d => <div key={d.kind}>{item(d)}</div>)}
      </div>
    );
  }
  if (arr === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 7, fontSize: '0.92em', color: '#6B7280', maxWidth: ds.headerAlignment === 'center' ? '70%' : '85%', marginLeft: ds.headerAlignment === 'center' ? 'auto' : 0, marginRight: ds.headerAlignment === 'center' ? 'auto' : 0 }}>
        {details.map(d => <div key={d.kind}>{item(d)}</div>)}
      </div>
    );
  }
  // arr === 1: inline row with separator
  const sepEl = sep === 'bullet' ? <span style={{ color: '#9CA3AF', margin: '0 5px' }}>·</span>
    : sep === 'bar' ? <span style={{ color: '#9CA3AF', margin: '0 7px' }}>|</span>
    : <span style={{ width: 8 }} />;
  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', marginTop: 7, fontSize: '0.92em', color: '#6B7280', justifyContent: align }}>
      {details.map((d, i) => (
        <span key={d.kind} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && sepEl}
          {item(d)}
        </span>
      ))}
    </div>
  );
}

// ── Template 1: Modern ────────────────────────────────────────────────────────

function TemplateModern({ resume, ds, ss, sectionAdjustments }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#2C2C2A' };

  const Heading = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || '#2C2C2A';
    return (
      <div style={{ marginTop: '1.4em', marginBottom: '0.4em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: `${0.85 * titleSizeMult}em`, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: hColor }}>
          {headingIcon !== 'none' && iconName && (
            headingIcon === 'filled'
              ? <span style={{ background: colIf(t.headings) || accent, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
              : <Icon name={iconName} size={hIconSz} color={hColor} />
          )}
          {children}
        </div>
        <div style={{ height: 1.5, background: colIf(t.headingsLine) || '#D1DCE8', marginTop: 4 }} />
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: ds.headerAlignment }}>
        <div style={{ fontSize: '2.2em', fontWeight: 700, letterSpacing: '-0.02em', color: colIf(t.name) || '#2C2C2A', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
        {pi.title && <div style={{ fontSize: '1.05em', fontWeight: 500, color: colIf(t.jobTitle) || accent, marginTop: 4 }}>{pi.title}</div>}
        {buildDetailsBlock(pi, ds, util)}
      </div>
      {sections.map(sec => {
        const body = renderSectionBody(sec, util);
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        return <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}><Heading iconName={SEC_ICONS[sec.type]}>{sec.title}</Heading>{body}</div>;
      })}
    </div>
  );
}

// ── Template 2: Atlantic Blue (dark sidebar) ──────────────────────────────────

const ATLANTIC_SIDEBAR_TYPES = new Set(['summary', 'languages', 'hobbies', 'references']);

function TemplateAtlanticBlue({ resume, ds, ss, sectionAdjustments }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments);
  const { fontSize, lineHeight, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const sideColor = '#1F2A44';
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const sideIds = sections.filter(s => ATLANTIC_SIDEBAR_TYPES.has(s.type));
  const bodyIds = sections.filter(s => !ATLANTIC_SIDEBAR_TYPES.has(s.type));

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A', display: 'grid', gridTemplateColumns: '32% 1fr', minHeight: '100%' };

  const PillHead = ({ iconName, children }) => (
    <div style={{ background: '#E5E7EB', padding: '5px 10px', marginTop: '0.9em', marginBottom: '0.4em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {headingIcon !== 'none' && iconName && (
        headingIcon === 'filled'
          ? <span style={{ background: colIf(t.headings) || sideColor, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
          : <Icon name={iconName} size={hIconSz} color={colIf(t.headerIcons) || sideColor} />
      )}
      <span style={{ fontSize: `${0.78 * titleSizeMult}em`, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colIf(t.headings) || sideColor }}>{children}</span>
    </div>
  );
  const SideHead = ({ iconName, children }) => (
    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '5px 10px', marginTop: '0.9em', marginBottom: '0.4em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {headingIcon !== 'none' && iconName && (
        headingIcon === 'filled'
          ? <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
          : <Icon name={iconName} size={hIconSz} color="#fff" />
      )}
      <span style={{ fontSize: `${0.78 * titleSizeMult}em`, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>{children}</span>
    </div>
  );
  const contactRow = (icon, txt) => txt ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: '0.85em', color: '#D1DCE8' }}>
      <Icon name={icon} size={11} color="#D1DCE8" /><span>{txt}</span>
    </div>
  ) : null;

  return (
    <div style={pageStyle}>
      {/* Sidebar */}
      <div style={{ background: sideColor, color: '#fff', padding: '24px 20px' }}>
        <div style={{ fontSize: '1.7em', fontWeight: 700, color: colIf(t.name) || '#fff', lineHeight: 1.05 }}>{pi.name || 'Your Name'}</div>
        <div style={{ fontSize: '1em', color: colIf(t.jobTitle) || '#B6C2D6', marginTop: 4 }}>{pi.title}</div>
        <div style={{ marginTop: 14, display: 'flex' }}>
          <PhotoPlaceholder size={86} shape="circle" name={pi.name} src={pi.photo || null} />
        </div>
        <div style={{ marginTop: 14 }}>
          {contactRow('mail', pi.email)}
          {contactRow('phone', pi.phone)}
          {contactRow('pin', pi.location)}
          {contactRow('link', pi.link)}
        </div>
        <div style={{ color: '#E8EEF7' }}>
          {sideIds.map(sec => {
            const body = renderSectionBody(sec, util, { certVariant: 'compact-list' });
            if (!body) return null;
            const adj = sectionAdjustments?.[sec.id];
            return (
              <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
                <SideHead iconName={SEC_ICONS[sec.type]}>{sec.title}</SideHead>
                {body}
              </div>
            );
          })}
        </div>
      </div>
      {/* Main body */}
      <div style={{ padding: '24px 22px' }}>
        {bodyIds.map(sec => {
          const body = renderSectionBody(sec, util, { expVariant: 'stacked' });
          if (!body) return null;
          const adj = sectionAdjustments?.[sec.id];
          return (
            <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
              <PillHead iconName={SEC_ICONS[sec.type]}>{sec.title}</PillHead>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template 3: Corporate (centered, classic) ─────────────────────────────────

function TemplateCorporate({ resume, ds, ss, sectionAdjustments }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#1F2937' };

  const Heading = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || '#1F2937';
    return (
      <div style={{ marginTop: '1em', marginBottom: '0.45em', textAlign: 'center' }}>
        <div style={{ height: 1, background: colIf(t.headingsLine) || '#9CA3AF' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: `${0.9 * titleSizeMult}em`, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: hColor, padding: '3px 0' }}>
          {headingIcon !== 'none' && iconName && (
            headingIcon === 'filled'
              ? <span style={{ background: colIf(t.headings) || accent, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
              : <Icon name={iconName} size={hIconSz} color={hColor} />
          )}
          {children}
        </div>
        <div style={{ height: 1, background: colIf(t.headingsLine) || '#9CA3AF' }} />
      </div>
    );
  };

  const contactItems = [['pin', pi.location], ['mail', pi.email], ['phone', pi.phone], ['link', pi.link]].filter(([, v]) => v);

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2em', fontWeight: 700, color: colIf(t.name) || '#1F2937', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
        {pi.title && <div style={{ fontSize: '1.05em', fontStyle: 'italic', color: colIf(t.jobTitle) || '#374151', marginTop: 4 }}>{pi.title}</div>}
        {contactItems.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 10, fontSize: '0.9em', color: '#374151', justifyContent: 'center' }}>
            {contactItems.map(([k, v], i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name={k} size={11} color={colIf(t.headerIcons) || '#374151'} />{v}
              </span>
            ))}
          </div>
        )}
      </div>
      {sections.map(sec => {
        const certVariant = sec.type === 'certifications' ? 'three-col-bullets' : undefined;
        const skillsCols  = (sec.type === 'skills' && (sec.display_settings?.layout === 'rows' || !sec.display_settings?.layout)) ? 3 : undefined;
        const body = renderSectionBody(sec, util, { certVariant, skillsCols });
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        return <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}><Heading iconName={SEC_ICONS[sec.type]}>{sec.title}</Heading>{body}</div>;
      })}
    </div>
  );
}

// ── Template 4: Atlantic Crest (dark banner + two-column) ─────────────────────

const CREST_LEFT_TYPES = new Set(['summary', 'skills', 'languages', 'certifications', 'hobbies']);

function TemplateAtlanticCrest({ resume, ds, ss, sectionAdjustments }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const bannerColor = '#1F2A44';
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const leftIds  = sections.filter(s => CREST_LEFT_TYPES.has(s.type));
  const rightIds = sections.filter(s => !CREST_LEFT_TYPES.has(s.type));

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#1F2937', background: '#fff' };

  const PillHead = ({ iconName, children }) => (
    <div style={{ background: '#E5E7EB', padding: '5px 10px', marginTop: '0.9em', marginBottom: '0.4em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {headingIcon !== 'none' && iconName && (
        headingIcon === 'filled'
          ? <span style={{ background: colIf(t.headings) || bannerColor, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
          : <Icon name={iconName} size={hIconSz} color={colIf(t.headerIcons) || bannerColor} />
      )}
      <span style={{ fontSize: `${0.78 * titleSizeMult}em`, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colIf(t.headings) || bannerColor }}>{children}</span>
    </div>
  );
  const contact = (icon, txt) => txt ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.88em', color: '#D1DCE8' }}>
      <Icon name={icon} size={11} color="#D1DCE8" />{txt}
    </span>
  ) : null;

  return (
    <div style={pageStyle}>
      {/* Dark banner */}
      <div style={{ background: bannerColor, color: '#fff', padding: `${padY}mm ${padX}mm`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.9em', fontWeight: 700, color: colIf(t.name) || '#fff', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '1em', color: colIf(t.jobTitle) || '#B6C2D6', marginTop: 4 }}>{pi.title}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 10, maxWidth: 460 }}>
            {contact('mail', pi.email)}
            {contact('phone', pi.phone)}
            {contact('link', pi.link)}
            {contact('pin', pi.location)}
          </div>
        </div>
        <PhotoPlaceholder size={96} shape="circle" name={pi.name} src={pi.photo || null} />
      </div>
      {/* Two-column body */}
      <div style={{ padding: `${padY * 0.6}mm ${padX}mm`, display: 'grid', gridTemplateColumns: '38% 1fr', gap: 18 }}>
        <div>
          {leftIds.map(sec => {
            const body = renderSectionBody(sec, util);
            if (!body) return null;
            const adj = sectionAdjustments?.[sec.id];
            return <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}><PillHead iconName={SEC_ICONS[sec.type]}>{sec.title}</PillHead>{body}</div>;
          })}
        </div>
        <div>
          {rightIds.map(sec => {
            const body = renderSectionBody(sec, util, { expVariant: 'stacked' });
            if (!body) return null;
            const adj = sectionAdjustments?.[sec.id];
            return <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}><PillHead iconName={SEC_ICONS[sec.type]}>{sec.title}</PillHead>{body}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ── Template 5: Mercury Flow (gray banner + date column) ──────────────────────

function TemplateMercuryFlow({ resume, ds, ss, sectionAdjustments }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#1F2937' };

  const BarHead = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || '#1F2937';
    return (
      <div style={{ background: '#EEF1F5', padding: '5px 12px', marginTop: '0.9em', marginBottom: '0.45em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {headingIcon !== 'none' && iconName && (
          headingIcon === 'filled'
            ? <span style={{ background: hColor, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
            : <Icon name={iconName} size={hIconSz} color={hColor} />
        )}
        <span style={{ fontSize: `${0.92 * titleSizeMult}em`, fontWeight: 600, color: hColor }}>{children}</span>
      </div>
    );
  };
  const contact = (icon, txt) => txt ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.88em', color: '#374151' }}>
      <Icon name={icon} size={11} color={colIf(t.headerIcons) || '#374151'} />{txt}
    </span>
  ) : null;

  return (
    <div style={pageStyle}>
      {/* Gray banner */}
      <div style={{ background: '#E5E7EB', padding: `${padY * 0.7}mm ${padX}mm`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <PhotoPlaceholder size={70} shape="circle" name={pi.name} src={pi.photo || null} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.5em', fontWeight: 700, color: colIf(t.name) || '#1F2937', lineHeight: 1.05 }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '0.95em', color: colIf(t.jobTitle) || '#374151', marginTop: 2 }}>{pi.title}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 14px', marginTop: 6 }}>
            {contact('mail', pi.email)}
            {contact('phone', pi.phone)}
            {contact('link', pi.link)}
            {contact('pin', pi.location)}
          </div>
        </div>
      </div>
      <div style={{ padding: `${padY * 0.5}mm ${padX}mm` }}>
        {sections.map(sec => {
          const isDateCol = sec.type === 'work_experience' || sec.type === 'education';
          const body = renderSectionBody(sec, util, isDateCol ? { expVariant: 'date-column', eduVariant: 'date-column' } : {});
          if (!body) return null;
          const adj = sectionAdjustments?.[sec.id];
          return <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}><BarHead iconName={SEC_ICONS[sec.type]}>{sec.title}</BarHead>{body}</div>;
        })}
      </div>
    </div>
  );
}

// ── Template 6: Steady Form (photo right + gray bar headings) ─────────────────

function TemplateSteadyForm({ resume, ds, ss, sectionAdjustments }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#1F2937' };

  const BarHead = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || '#1F2937';
    return (
      <div style={{ background: '#EEF1F5', padding: '5px 12px', marginTop: '1em', marginBottom: '0.5em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {headingIcon !== 'none' && iconName && (
          headingIcon === 'filled'
            ? <span style={{ background: hColor, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
            : <Icon name={iconName} size={hIconSz} color={hColor} />
        )}
        <span style={{ fontSize: `${0.92 * titleSizeMult}em`, fontWeight: 600, color: hColor }}>{children}</span>
      </div>
    );
  };
  const contact = (icon, txt) => txt ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.88em', color: '#374151' }}>
      <span style={{ width: 16, height: 16, border: '1px solid #9CA3AF', borderRadius: 2, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={9} color={colIf(t.headerIcons) || '#374151'} />
      </span>
      {txt}
    </div>
  ) : null;

  return (
    <div style={pageStyle}>
      {/* Name+contacts left, photo right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: '1.6em' }}>
            <span style={{ fontWeight: 700, color: colIf(t.name) || '#1F2937' }}>{pi.name || 'Your Name'}</span>
            {pi.title && <span style={{ fontStyle: 'italic', fontWeight: 400, color: colIf(t.jobTitle) || '#374151', marginLeft: 10 }}>{pi.title}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginTop: 10 }}>
            {contact('mail', pi.email)}
            {contact('phone', pi.phone)}
            {contact('link', pi.link)}
            {contact('pin', pi.location)}
          </div>
        </div>
        <PhotoPlaceholder size={78} shape="circle" name={pi.name} src={pi.photo || null} />
      </div>
      {sections.map(sec => {
        const skillsCols   = (sec.type === 'skills' && (sec.display_settings?.layout === 'rows' || !sec.display_settings?.layout)) ? 3 : undefined;
        const certVariant  = sec.type === 'certifications' ? 'three-col-bullets' : undefined;
        const body = renderSectionBody(sec, util, {
          expVariant: sec.type === 'work_experience' ? 'inline-title-role' : undefined,
          eduVariant: sec.type === 'education' ? 'date-column' : undefined,
          skillsCols,
          certVariant,
        });
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        return <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}><BarHead iconName={SEC_ICONS[sec.type]}>{sec.title}</BarHead>{body}</div>;
      })}
    </div>
  );
}

// ── Template 7: Executive (editorial serif, date-column) ──────────────────────

function TemplateExecutive({ resume, ds, ss, sectionAdjustments }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#1F2937' };

  const Heading = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || '#1F2937';
    return (
      <div style={{ marginTop: '1em', marginBottom: '0.35em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: `${0.95 * titleSizeMult}em`, fontWeight: 600, color: hColor, letterSpacing: '0.01em' }}>
          {headingIcon !== 'none' && iconName && (
            headingIcon === 'filled'
              ? <span style={{ background: colIf(t.headings) || accent, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
              : <Icon name={iconName} size={hIconSz} color={hColor} />
          )}
          {children}
        </div>
        <div style={{ height: 0.5, background: colIf(t.headingsLine) || '#9CA3AF', marginTop: 2 }} />
      </div>
    );
  };
  const contactItems = [['pin', pi.location], ['mail', pi.email], ['phone', pi.phone], ['link', pi.link]].filter(([, v]) => v);

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.8em', fontWeight: 700, color: colIf(t.name) || '#1F2937' }}>{pi.name || 'Your Name'}</span>
        {pi.title && <span style={{ fontSize: '1.05em', fontStyle: 'italic', color: colIf(t.jobTitle) || '#374151' }}>{pi.title}</span>}
      </div>
      {contactItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 8, fontSize: '0.9em', color: '#374151' }}>
          {contactItems.map(([k, v], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name={k} size={11} color={colIf(t.headerIcons) || '#374151'} />{v}
            </span>
          ))}
        </div>
      )}
      {sections.map(sec => {
        const body = renderSectionBody(sec, util, {
          expVariant: sec.type === 'work_experience' ? 'date-column' : undefined,
          eduVariant: sec.type === 'education' ? 'date-column' : undefined,
        });
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        return <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}><Heading iconName={SEC_ICONS[sec.type]}>{sec.title}</Heading>{body}</div>;
      })}
    </div>
  );
}

// ── Template registry ─────────────────────────────────────────────────────────

const TEMPLATE_COMPONENTS = {
  'modern':         TemplateModern,
  'atlantic-blue':  TemplateAtlanticBlue,
  'corporate':      TemplateCorporate,
  'atlantic-crest': TemplateAtlanticCrest,
  'mercury-flow':   TemplateMercuryFlow,
  'steady-form':    TemplateSteadyForm,
  'executive':      TemplateExecutive,
};

// ── ResumePreview default export ──────────────────────────────────────────────

// Detect headings (section titles and entry headers) that would be orphaned at
// a page bottom with no room for content beneath them.
// Rule: push to the next page only when the element STARTS in the orphan zone
// (last ~8% of the page). Long entries are allowed to break naturally across
// pages — we never push an entire multi-bullet entry just because it spans a
// boundary. Returns { id: extraMarginPx }, cumulative so cascade effects are handled.
// pageBreakYs: sorted array of content-space Y positions where page breaks occur.
// Page 1 fills [0, page1Height]. Pages 2+ each fill effectivePageHeight.
// This mirrors the PDF's @page rule: @page :first has no top/bottom margin,
// pages 2+ get padY top+bottom margins, shrinking their content area.
function buildPageBreaks(totalHeight, page1Height, effectivePageHeight) {
  const breaks = [];
  let y = page1Height;
  while (y < totalHeight) {
    breaks.push(y);
    y += effectivePageHeight;
  }
  return breaks;
}

function detectOrphanAdjustments(contentEl, page1Height, effectivePageHeight) {
  const ORPHAN_ZONE_RATIO = 0.08;
  const blocks = contentEl.querySelectorAll('[data-section-id], [data-entry-id]');
  const adj = {};
  let cumulative = 0;
  blocks.forEach(el => {
    const effectiveTop = el.offsetTop + cumulative;
    // Determine which page and position within that page
    let posOnPage;
    if (effectiveTop < page1Height) {
      posOnPage = effectiveTop;
      const orphanZone = page1Height * ORPHAN_ZONE_RATIO;
      if (posOnPage > page1Height - orphanZone) {
        const key = el.dataset.sectionId || el.dataset.entryId;
        const push = page1Height - posOnPage;
        adj[key] = push;
        cumulative += push;
      }
    } else {
      const offsetIntoP2 = effectiveTop - page1Height;
      posOnPage = offsetIntoP2 % effectivePageHeight;
      const orphanZone = effectivePageHeight * ORPHAN_ZONE_RATIO;
      if (posOnPage > effectivePageHeight - orphanZone) {
        const key = el.dataset.sectionId || el.dataset.entryId;
        const push = effectivePageHeight - posOnPage;
        adj[key] = push;
        cumulative += push;
      }
    }
  });
  return adj;
}

export default function ResumePreview({ resume, designSettings = {}, scale = null, className = '', printMode = false }) {
  const containerRef = useRef(null);
  const contentRef  = useRef(null);
  const [computedScale, setComputedScale] = useState(scale || 0.6);
  const [contentHeight, setContentHeight] = useState(0);
  const [sectionAdjustments, setSectionAdjustments] = useState({});

  const ds = { ...DEFAULT_DESIGN, ...(designSettings || {}) };
  const ss = { ...DEFAULT_SPACING, ...(resume?.spacing_settings || {}) };

  const pageId = ds.pageSize || 'a4';
  const page   = pageId === 'letter' ? { id: 'letter', width: 816, height: 1056 } : { id: 'a4', width: 794, height: 1123 };

  const updateScale = useCallback(() => {
    if (scale !== null || !containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 16;
    setComputedScale(Math.min(containerW / page.width, 1));
  }, [scale, page.width]);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(() => {
      updateScale();
      if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
    });
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current)   ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  // Re-run orphan detection whenever raw content height changes
  useEffect(() => {
    if (!contentRef.current || !contentHeight) return;
    const padYMm = ss.topBottomMargin ?? 15;
    const padYPx = padYMm * (96 / 25.4);
    const effectivePageHeight = page.height - 2 * padYPx;
    const newAdj = detectOrphanAdjustments(contentRef.current, page.height, effectivePageHeight);
    setSectionAdjustments(prev => {
      if (JSON.stringify(newAdj) === JSON.stringify(prev)) return prev;
      return newAdj;
    });
  }, [contentHeight, page.height, ss.topBottomMargin]);

  const s = scale !== null ? scale : computedScale;

  const templateId = resume?.template_id || ds.template || 'modern';
  const TemplateComp = TEMPLATE_COMPONENTS[templateId] || TemplateModern;

  const pi = resume?.personal_info || {};
  const fs = resume?.footer_settings;
  const hasFooter = fs && (fs.pageNumbers || (fs.email && pi.email) || (fs.name && pi.name));

  // In printMode we render a plain div — no scaling, no wrapper chrome.
  // We use the same two-div pattern as non-printMode:
  //   1. A hidden measurement div (no adjustments) — contentRef attaches here so
  //      height is stable and the ResizeObserver loop cannot oscillate.
  //   2. The visible content with sectionAdjustments applied.
  if (printMode) {
    return (
      <div style={{ width: page.width, background: '#fff', position: 'relative' }}>
        <style>{`
          @media print {
            .resume-section-block { page-break-inside: avoid; }
            .resume-entry-block   { page-break-inside: avoid; }
          }
        `}</style>
        {/* Hidden measurement — no adjustments so height never changes after first measure */}
        <div ref={contentRef} style={{ position: 'absolute', top: 0, left: 0, width: page.width, visibility: 'hidden', pointerEvents: 'none' }}>
          <TemplateComp resume={resume || {}} ds={ds} ss={ss} />
        </div>
        {/* Visible content with page-break adjustments applied */}
        <TemplateComp resume={resume || {}} ds={ds} ss={ss} sectionAdjustments={sectionAdjustments} />
        {hasFooter && (
          <div style={{ borderTop: '1px solid #e0e0e0', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt', color: '#888', background: '#fff' }}>
            <span>{[fs.name && pi.name, fs.email && pi.email].filter(Boolean).join(' · ')}</span>
            {fs.pageNumbers && <span>Page 1</span>}
          </div>
        )}
      </div>
    );
  }

  const padYMm = ss.topBottomMargin ?? 15;
  const padYPx = padYMm * (96 / 25.4);
  const effectivePageHeight = page.height - 2 * padYPx;

  const totalAdjustment = Object.values(sectionAdjustments).reduce((sum, v) => sum + v, 0);
  const adjustedHeight = contentHeight + totalAdjustment;
  const pageBreaks = adjustedHeight > 0 ? buildPageBreaks(adjustedHeight, page.height, effectivePageHeight) : [];
  const numPages = pageBreaks.length + 1;

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`} style={{ background: '#CBD5E1' }}>
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Hidden measurement div — raw layout, no adjustments applied */}
        <div style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', top: 0, left: 0, width: page.width }}>
          <div ref={contentRef}>
            <TemplateComp resume={resume || {}} ds={ds} ss={ss} />
          </div>
        </div>

        {/* Single render wrapper — no overflow:hidden so content never clips */}
        <div style={{
          width: page.width * s,
          position: 'relative',
          flexShrink: 0,
          background: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)',
        }}>
          {/* Scaled template content — with orphan adjustments applied */}
          <div style={{
            width: page.width,
            transformOrigin: 'top left',
            transform: `scale(${s})`,
          }}>
            <TemplateComp resume={resume || {}} ds={ds} ss={ss} sectionAdjustments={sectionAdjustments} />
            {hasFooter && (
              <div style={{ borderTop: '1px solid #e0e0e0', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt', color: '#888', background: '#fff' }}>
                <span>{[fs.name && pi.name, fs.email && pi.email].filter(Boolean).join(' · ')}</span>
                {fs.pageNumbers && <span>Page {numPages}</span>}
              </div>
            )}
          </div>

          {/* Page break indicators — positions match PDF @page margin layout */}
          {pageBreaks.map((breakY, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: breakY * s,
              left: 0,
              right: 0,
              height: 0,
              borderTop: '2px dashed #94a3b8',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <span style={{
                position: 'absolute',
                right: 6,
                top: 3,
                fontSize: 9,
                color: '#64748b',
                background: '#CBD5E1',
                borderRadius: 3,
                padding: '1px 5px',
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.4,
              }}>page {i + 2}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TemplateThumbnail for gallery ─────────────────────────────────────────────

const THUMBNAIL_ACCENTS = {
  'modern':         '#185FA5',
  'atlantic-blue':  '#1F2A44',
  'corporate':      '#0F172A',
  'atlantic-crest': '#1F2A44',
  'mercury-flow':   '#374151',
  'steady-form':    '#1F2A44',
  'executive':      '#0F172A',
};

const THUMBNAIL_RESUME = {
  personal_info: { name: 'Alex Johnson', title: 'Senior Engineer', email: 'alex@example.com', phone: '+1 (555) 000-0000', location: 'New York, NY', link: 'linkedin.com/in/alex' },
  sections: [
    { id: 's1', type: 'summary',        title: 'Summary',         enabled: true, content: { text: 'Experienced professional with a passion for excellence and innovation across complex product environments.' } },
    { id: 's2', type: 'work_experience',title: 'Work Experience',  enabled: true, content: { entries: [{ title: 'Senior Engineer', employer: 'Tech Corp', dates: '2022 – Present', location: 'New York', bullets: ['Led core platform development.', 'Improved performance by 40%.'] }, { title: 'Engineer', employer: 'Startup Co', dates: '2019 – 2022', location: 'Remote', bullets: ['Built key product features.'] }] } },
    { id: 's3', type: 'education',       title: 'Education',       enabled: true, content: { entries: [{ school: 'State University', degree: 'B.S. Computer Science', dates: '2015 – 2019', location: 'Boston, MA' }] } },
    { id: 's4', type: 'skills',          title: 'Skills',          enabled: true, content: { entries: [{ name: 'JavaScript', level: 3 }, { name: 'React', level: 3 }, { name: 'Node.js', level: 2 }, { name: 'Python', level: 2 }] } },
    { id: 's5', type: 'languages',       title: 'Languages',       enabled: true, content: { entries: [{ name: 'English', level: 'Native' }, { name: 'Spanish', level: 'Fluent' }] } },
  ],
};

export function TemplateThumbnail({ templateId, active = false, label, style: styleTag, plan }) {
  const accent = THUMBNAIL_ACCENTS[templateId] || '#185FA5';
  const TemplateComp = TEMPLATE_COMPONENTS[templateId] || TemplateModern;
  const ds = { ...DEFAULT_DESIGN, accentColor: accent, template: templateId, accentTargets: { name: true, headings: true, headingsLine: true, jobTitle: true, headerIcons: true, dotsBarsBubbles: true } };
  const ss = DEFAULT_SPACING;

  return (
    <div className={`relative rounded overflow-hidden border-2 transition-all cursor-pointer ${active ? 'border-primary shadow-md' : 'border-ds-border hover:border-primary/50'}`}>
      {active && (
        <div className="absolute top-1.5 left-1.5 z-10 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Active</div>
      )}
      <div style={{ height: 140, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ width: 794, transformOrigin: 'top left', transform: 'scale(0.168)' }}>
          <TemplateComp resume={THUMBNAIL_RESUME} ds={ds} ss={ss} />
        </div>
      </div>
      <div className="bg-ds-card px-2 py-1.5 border-t border-ds-border">
        <p className="text-xs font-medium text-ds-text truncate">{label}</p>
        <p className="text-[10px] text-ds-textMuted">{styleTag}</p>
      </div>
    </div>
  );
}
