'use client';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { buildLayoutConfig, effectiveContentHeight } from '@/lib/layoutConfig.js';
import { computeFlowAdjustments } from '@/lib/paginationEngine.js';

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

function tmplUtils(ds, ss, ls = {}, blockAdj = {}, visibleBlockIds = null) {
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
  return { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf, fontFamily, titleSizeMult, listStyle, hIconSz, hFilledSz, hFilledIconSz, blockAdj, visibleBlockIds };
}

// ── Extract structured data from DB resume ────────────────────────────────────

function buildRenderData(resume) {
  const pi       = resume?.personal_info || {};
  const sections = (resume?.sections || []).filter(s => s.enabled !== false);
  return { pi, sections };
}

// ── Column layout helpers ─────────────────────────────────────────────────────

// Splits sections into left/right using user's sectionColumns, with type-set fallback.
function splitColumns(sections, sectionColumns, defaultLeftSet) {
  const sc = sectionColumns || {};
  return {
    left:  sections.filter(s => (sc[s.id] ? sc[s.id] === 'left' : defaultLeftSet.has(s.type))),
    right: sections.filter(s => (sc[s.id] ? sc[s.id] === 'right' : !defaultLeftSet.has(s.type))),
  };
}

// Renders mix-mode layout. Full-width sections span both columns. Contiguous
// runs of left/right sections are rendered as two independent column divs so
// each column scrolls independently — no row-height synchronization that would
// leave whitespace when one column is taller than the other.
function renderMixGrid(sections, sc, gridStyle, renderSec) {
  // Split sections into runs: 'full' runs and 'side' runs.
  const runs = [];
  for (const sec of sections) {
    const col = sc[sec.id] || 'full';
    if (col === 'full') {
      runs.push({ type: 'full', sec });
    } else {
      const last = runs[runs.length - 1];
      if (last && last.type === 'side') {
        last.secs.push(sec);
      } else {
        runs.push({ type: 'side', secs: [sec] });
      }
    }
  }

  const output = [];
  for (const run of runs) {
    if (run.type === 'full') {
      const rendered = renderSec(run.sec);
      if (rendered) output.push(rendered);
    } else {
      const left  = run.secs.filter(s => (sc[s.id] || 'full') === 'left');
      const right = run.secs.filter(s => sc[s.id] === 'right');
      output.push(
        <div key={run.secs[0].id + '_run'} style={gridStyle}>
          <div>{left.map(sec => renderSec(sec))}</div>
          <div>{right.map(sec => renderSec(sec))}</div>
        </div>
      );
    }
  }
  return output;
}

// Wraps section list with one/two/mix column layout for single-column templates.
function applyColumnLayout(sections, ls, padX, renderSection) {
  const colLayout = ls?.columnLayout || 'one';
  const sc        = ls?.sectionColumns || {};

  if (colLayout === 'one') return sections.map(renderSection);

  if (colLayout === 'two') {
    const left  = sections.filter(s => (sc[s.id] || 'left') === 'left');
    const right = sections.filter(s => sc[s.id] === 'right');
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `0 ${Math.round(padX * 0.5)}mm`, alignItems: 'start' }}>
        <div>{left.map(renderSection)}</div>
        <div>{right.map(renderSection)}</div>
      </div>
    );
  }

  if (colLayout === 'mix') {
    return renderMixGrid(sections, sc,
      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `0 ${Math.round(padX * 0.5)}mm`, alignItems: 'start' },
      renderSection);
  }

  return sections.map(renderSection);
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
// Parse an HTML string from RichTextEditor into a flat array of block descriptors.
// Each descriptor: { tag: 'li'|'p'|'div', html: string (inner HTML) }
// <li> elements are extracted from their <ul>/<ol> parent.
// Consecutive <p> blocks are kept as individual items so each gets data-bullet-id.
function parseBodyBlocks(html) {
  if (!html) return [];
  // Run in browser only — SSR guard
  if (typeof document === 'undefined') return [{ tag: 'p', html }];

  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const blocks = [];
  tmp.childNodes.forEach((node) => {
    if (node.nodeType !== 1) return; // skip text nodes
    const tag = node.tagName.toLowerCase();
    if (tag === 'ul' || tag === 'ol') {
      node.querySelectorAll('li').forEach((li) => {
        // li may contain a nested <p> — unwrap it for cleaner output
        const inner = li.querySelector('p') ? li.querySelector('p').innerHTML : li.innerHTML;
        blocks.push({ tag: 'li', listTag: tag, html: inner });
      });
    } else {
      // <p>, <div>, or anything else — keep as-is
      blocks.push({ tag, html: node.innerHTML || node.textContent });
    }
  });

  // Filter out empty/whitespace-only blocks
  return blocks.filter(b => b.html.replace(/<[^>]+>/g, '').trim().length > 0 || b.html.includes('<img'));
}

function RichBody({ entry, listStyle, style, entryId, visibleBlockIds, blockAdj }) {
  // ── New: HTML body stored by RichTextEditor ──────────────────────────────────
  if (entry.body) {
    const blocks = parseBodyBlocks(entry.body);

    // If parsing produced no blocks (SSR or empty), fall back to raw HTML
    if (!blocks.length) {
      return (
        <div
          className="resume-rich-body"
          dangerouslySetInnerHTML={{ __html: entry.body }}
          style={{ marginTop: 3, ...style }}
        />
      );
    }

    // Determine bullet-level visibility (same logic as legacy path)
    const hasBulletSplit = visibleBlockIds && entryId &&
      blocks.some((_, j) => visibleBlockIds.includes(`${entryId}-bullet-${j}`));

    function isBlockVisible(j) {
      if (!visibleBlockIds || !entryId) return true;
      if (hasBulletSplit) return visibleBlockIds.includes(`${entryId}-bullet-${j}`);
      return visibleBlockIds.includes(entryId);
    }

    if (blocks.length > 0 && !blocks.some((_, j) => isBlockVisible(j))) return null;

    // Group consecutive <li> blocks that share the same list tag so they render
    // inside a single <ul>/<ol>. Non-li blocks render standalone with data-bullet-id.
    const rendered = [];
    let liBuffer = [];
    let liBufferTag = null;
    let liBufferStart = 0;

    function flushLiBuffer() {
      if (!liBuffer.length) return;
      const ListTag = liBufferTag || 'ul';
      const listStyle_ = ListTag === 'ul' ? 'disc' : 'decimal';
      rendered.push(
        <ListTag
          key={`ul-${liBufferStart}`}
          style={{ margin: '3px 0 0', paddingLeft: 18, listStyleType: listStyle_ }}
        >
          {liBuffer.map(({ j, html }) => {
            const bulletId = entryId ? `${entryId}-bullet-${j}` : undefined;
            const bulletAdj = blockAdj?.[bulletId];
            return (
              <li
                key={j}
                data-bullet-id={bulletId}
                data-block-id={bulletId}
                style={{ marginBottom: 1, display: 'list-item', ...(bulletAdj ? { marginTop: bulletAdj } : {}) }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          })}
        </ListTag>
      );
      liBuffer = [];
      liBufferTag = null;
    }

    blocks.forEach((block, j) => {
      if (!isBlockVisible(j)) return;
      const bulletId = entryId ? `${entryId}-bullet-${j}` : undefined;

      if (block.tag === 'li') {
        if (liBufferTag && liBufferTag !== block.listTag) flushLiBuffer();
        if (!liBuffer.length) liBufferStart = j;
        liBufferTag = block.listTag || 'ul';
        liBuffer.push({ j, html: block.html });
      } else {
        flushLiBuffer();
        const bulletAdj = blockAdj?.[bulletId];
        // Hyphen style for non-li blocks that look like bullets
        if (listStyle === 'hyphen' && block.tag === 'p') {
          rendered.push(
            <div
              key={j}
              data-bullet-id={bulletId}
              data-block-id={bulletId}
              style={{ display: 'flex', gap: 6, marginBottom: 1, ...(bulletAdj ? { marginTop: bulletAdj } : {}) }}
            >
              <span style={{ flexShrink: 0, color: '#6B7280' }}>–</span>
              <span dangerouslySetInnerHTML={{ __html: block.html }} />
            </div>
          );
        } else {
          rendered.push(
            <div
              key={j}
              data-bullet-id={bulletId}
              data-block-id={bulletId}
              style={{ marginBottom: 1, ...(bulletAdj ? { marginTop: bulletAdj } : {}) }}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }
      }
    });
    flushLiBuffer();

    if (!rendered.length) return null;

    return <div style={{ marginTop: 3, ...style }}>{rendered}</div>;
  }

  // ── Legacy: bullets array ────────────────────────────────────────────────────
  const allBullets = (entry.bullets || []).filter(b => b?.trim());
  if (!allBullets.length) return null;

  // Determine filtering mode.
  // If any bullet ID for this entry appears in visibleBlockIds, the pagination
  // engine has split this entry at bullet granularity — use bullet-level filtering.
  // Otherwise fall back to entry-level filtering (show all or hide all bullets).
  const hasBulletSplit = visibleBlockIds && entryId &&
    allBullets.some((_, j) => visibleBlockIds.includes(`${entryId}-bullet-${j}`));

  function isBulletVisible(j) {
    if (!visibleBlockIds || !entryId) return true;
    if (hasBulletSplit) return visibleBlockIds.includes(`${entryId}-bullet-${j}`);
    return visibleBlockIds.includes(entryId);
  }

  if (!allBullets.some((_, j) => isBulletVisible(j))) return null;

  if (listStyle === 'hyphen') {
    return (
      <div style={{ margin: '3px 0 0', ...style }}>
        {allBullets.map((b, j) => {
          if (!isBulletVisible(j)) return null;
          const bulletId = entryId ? `${entryId}-bullet-${j}` : undefined;
          const bulletAdj = blockAdj?.[bulletId];
          return (
            <div key={j} data-bullet-id={bulletId} data-block-id={bulletId} style={{ display: 'flex', gap: 6, marginBottom: 1, ...(bulletAdj ? { marginTop: bulletAdj } : {}) }}>
              <span style={{ flexShrink: 0, color: '#6B7280' }}>–</span>
              <span>{b}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <ul style={{ margin: '3px 0 0', paddingLeft: 18, listStyleType: 'disc', ...style }}>
      {allBullets.map((b, j) => {
        if (!isBulletVisible(j)) return null;
        const bulletId = entryId ? `${entryId}-bullet-${j}` : undefined;
        const bulletAdj = blockAdj?.[bulletId];
        return <li key={j} data-bullet-id={bulletId} data-block-id={bulletId} style={{ marginBottom: 1, display: 'list-item', ...(bulletAdj ? { marginTop: bulletAdj } : {}) }}>{b}</li>;
      })}
    </ul>
  );
}

// Keep BulletList for backwards compat with any remaining callers
function BulletList({ bullets, listStyle }) {
  return <RichBody entry={{ bullets }} listStyle={listStyle} />;
}

function ExperienceBody({ secs, util, variant }) {
  const { entryGapPx, t, colIf, listStyle, blockAdj, visibleBlockIds } = util;
  const allEntries = secs.flatMap(sec => {
    const order = sec.display_settings?.workOrder || sec.display_settings?.order || 'title-first';
    return (sec.content?.entries || []).map((e, idx) => ({ ...e, _order: order, _secId: sec.id, _idx: idx }));
  });
  if (!allEntries.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {allEntries.map((e, i) => {
        const gap        = i < allEntries.length - 1 ? entryGapPx : 0;
        const titleFirst = e._order !== 'employer-first';
        const primary    = titleFirst ? (e.title || '') : (e.employer || '');
        const secondary  = titleFirst ? (e.employer || '') : (e.title || '');
        const entryId    = `${e._secId}-${e._idx}`;
        // Show entry if the entry heading is visible OR any of its bullets are visible.
        const entryVisible = !visibleBlockIds || visibleBlockIds.includes(entryId) ||
          (e.bullets || []).some((_, j) => visibleBlockIds.includes(`${entryId}-bullet-${j}`)) ||
          visibleBlockIds.some(id => id.startsWith(`${entryId}-bullet-`));
        if (!entryVisible) return null;
        const showHeading = !visibleBlockIds || visibleBlockIds.includes(entryId);
        const adjTop     = blockAdj?.[entryId];
        if (variant === 'date-column') {
          return (
            <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
              {showHeading && <div style={{ fontSize: '0.88em', color: colIf(t.dates) || '#374151' }}>
                <div>{e.dates}</div>
                <div style={{ color: '#6B7280' }}>{e.location}</div>
              </div>}
              <div style={showHeading ? {} : { gridColumn: '1 / -1' }}>
                {showHeading && (
                  <div data-entry-heading data-block-id={entryId}>
                    <div style={{ fontWeight: 700 }}>{primary}</div>
                    <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
                  </div>
                )}
                <RichBody entry={e} listStyle={listStyle} entryId={entryId} visibleBlockIds={visibleBlockIds} blockAdj={blockAdj} />
              </div>
            </div>
          );
        }
        if (variant === 'stacked') {
          return (
            <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
              {showHeading && (
                <div data-entry-heading data-block-id={entryId}>
                  <div style={{ fontWeight: 700 }}>{primary}</div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
                  <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', marginBottom: 3 }}>{e.dates}{e.location ? ` | ${e.location}` : ''}</div>
                </div>
              )}
              <RichBody entry={e} listStyle={listStyle} entryId={entryId} visibleBlockIds={visibleBlockIds} blockAdj={blockAdj} />
            </div>
          );
        }
        if (variant === 'inline-title-role') {
          return (
            <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
              {showHeading && <div style={{ fontSize: '0.88em', color: colIf(t.dates) || '#374151' }}>
                <div>{e.dates}</div>
                <div style={{ color: '#6B7280' }}>{e.location}</div>
              </div>}
              <div style={showHeading ? {} : { gridColumn: '1 / -1' }}>
                {showHeading && (
                  <div data-entry-heading data-block-id={entryId}>
                    <div><strong>{primary},</strong> <em style={{ color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</em></div>
                  </div>
                )}
                <RichBody entry={e} listStyle={listStyle} entryId={entryId} visibleBlockIds={visibleBlockIds} blockAdj={blockAdj} />
              </div>
            </div>
          );
        }
        // default
        return (
          <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ marginBottom: gap, ...(adjTop ? { marginTop: adjTop } : {}) }}>
            {showHeading && (
              <div data-entry-heading data-block-id={entryId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{primary}</div>
                  <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', whiteSpace: 'nowrap' }}>{e.dates}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
                  {e.location && <div style={{ fontSize: '0.85em', color: '#6B7280' }}>{e.location}</div>}
                </div>
              </div>
            )}
            <RichBody entry={e} listStyle={listStyle} entryId={entryId} visibleBlockIds={visibleBlockIds} blockAdj={blockAdj} />
          </div>
        );
      })}
    </div>
  );
}

function EducationBody({ secs, util, variant }) {
  const { entryGapPx, t, colIf, blockAdj, visibleBlockIds } = util;
  const allEntries = secs.flatMap(sec => {
    const order = sec.display_settings?.eduOrder || sec.display_settings?.order || 'school-first';
    return (sec.content?.entries || []).map((e, idx) => ({ ...e, _order: order, _secId: sec.id, _idx: idx }));
  });
  if (!allEntries.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {allEntries.map((e, i) => {
        const gap        = i < allEntries.length - 1 ? entryGapPx : 0;
        const schoolFirst = e._order !== 'degree-first';
        const primary    = schoolFirst ? (e.school || '') : (e.degree || '');
        const secondary  = schoolFirst ? (e.degree || '') : (e.school || '');
        const entryId    = `${e._secId}-${e._idx}`;
        if (visibleBlockIds && !visibleBlockIds.includes(entryId)) return null;
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

function LanguagesBody({ sec, util, defaultLayout }) {
  const { t, colIf, accent } = util;
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;
  const layout = sec.display_settings?.layout || defaultLayout || 'rows';

  if (layout === 'rings') {
    const ringColor = colIf(t.dotsBarsBubbles) || accent;
    const pctMap = { Beginner: 20, Intermediate: 45, Advanced: 70, Fluent: 88, Native: 100 };
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
        {entries.map((l, i) => {
          const pct = pctMap[l.level] ?? (typeof l.level === 'number' ? Math.round(l.level / 3 * 100) : 70);
          const r = 12; const circ = 2 * Math.PI * r;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
                <circle cx="14" cy="14" r={r} fill="none" stroke={ringColor + '33'} strokeWidth="2.5" />
                <circle cx="14" cy="14" r={r} fill="none" stroke={ringColor} strokeWidth="2.5"
                  strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
                  strokeLinecap="round" transform="rotate(-90 14 14)" />
              </svg>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.88em' }}>{l.name}</div>
                {l.level && <div style={{ fontSize: '0.75em', color: '#6B7280' }}>{l.level}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 3 }}>
        {entries.map((l, i) => (
          <div key={i}>
            <span style={{ fontWeight: 500 }}>{l.name}</span>
            {l.level && <span style={{ fontSize: '0.85em', color: '#6B7280', marginLeft: 6 }}>{l.level}</span>}
          </div>
        ))}
      </div>
    );
  }

  // default: 'rows' — name + 5-dot level indicator
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
  const { entryGapPx, t, colIf, listStyle, blockAdj, visibleBlockIds } = util;
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {entries.map((p, i) => {
        const entryId = `${sec.id}-${i}`;
        const entryVisible = !visibleBlockIds || visibleBlockIds.includes(entryId) ||
          (p.bullets || []).some((_, j) => visibleBlockIds.includes(`${entryId}-bullet-${j}`)) ||
          visibleBlockIds.some(id => id.startsWith(`${entryId}-bullet-`));
        if (!entryVisible) return null;
        const showHeading = !visibleBlockIds || visibleBlockIds.includes(entryId);
        const adjTop  = blockAdj?.[entryId];
        return (
          <div key={i} className="resume-entry-block" data-entry-id={entryId} style={{ marginBottom: i < entries.length - 1 ? entryGapPx * 0.75 : 0, ...(adjTop ? { marginTop: adjTop } : {}) }}>
            {showHeading && (
              <div data-entry-heading data-block-id={entryId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  {p.dates && <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{p.dates}</div>}
                </div>
                {p.role && <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{p.role}</div>}
                {p.link && <div style={{ fontSize: '0.85em', color: '#6B7280' }}>{p.link}</div>}
              </div>
            )}
            <RichBody entry={p} listStyle={listStyle} entryId={entryId} visibleBlockIds={visibleBlockIds} blockAdj={blockAdj} />
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
  if (type === 'work_experience') return <ExperienceBody secs={[sec]} util={util} variant={opts.expVariant || sec.display_settings?.entryLayout} />;
  if (type === 'education')      return <EducationBody secs={[sec]} util={util} variant={opts.eduVariant || sec.display_settings?.entryLayout} />;
  if (type === 'skills')         return <SkillsBody sec={sec} util={util} variantCols={opts.skillsCols} />;
  if (type === 'languages')      return <LanguagesBody sec={sec} util={util} defaultLayout={opts.langDefaultLayout} />;
  if (type === 'certifications') return <CertsBody sec={sec} util={util} variant={opts.certVariant || sec.display_settings?.certLayout} />;
  if (type === 'projects')       return <ProjectsBody sec={sec} util={util} />;
  if (type === 'hobbies') {
    const text = sec.content?.text;
    if (!text) return null;
    const style = sec.display_settings?.style || opts.hobbiesDefaultStyle || 'text';
    if (style === 'chips') {
      const items = text.split(/[,;·•|]+/).map(s => s.trim()).filter(Boolean);
      if (!items.length) return <div style={{ fontSize: '0.95em' }}>{text}</div>;
      const { t, colIf, accent } = util;
      const chipColor = colIf(t.dotsBarsBubbles) || accent;
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map((item, i) => (
            <span key={i} style={{ padding: '2px 10px', borderRadius: 999, background: chipColor + '22', color: chipColor, fontSize: '0.88em' }}>{item}</span>
          ))}
        </div>
      );
    }
    return <div style={{ fontSize: '0.95em' }}>{text}</div>;
  }
  if (type === 'references') {
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

// ── Section visibility helpers (discrete per-page rendering) ─────────────────

// Section types where individual entries have data-entry-id attributes.
const ENTRY_TRACKED_TYPES = new Set(['work_experience', 'education', 'projects']);

/**
 * Returns true if any content from this section belongs on the current page.
 * vids = null means "show all" (measurement pass or print mode).
 */
function isSectionVisible(sec, vids) {
  if (!vids) return true;
  if (vids.includes(sec.id)) return true;
  if (ENTRY_TRACKED_TYPES.has(sec.type)) {
    return (sec.content?.entries || []).some((_, idx) => {
      const eid = `${sec.id}-${idx}`;
      if (vids.includes(eid)) return true;
      // Check if any bullet of this entry is on this page.
      return vids.some(id => id.startsWith(`${eid}-bullet-`));
    });
  }
  return false;
}

/**
 * Returns true if the section heading should be rendered on this page.
 * Headings are omitted on continuation pages (only entries, no label).
 */
function showSectionHeading(sec, vids) {
  return !vids || vids.includes(sec.id);
}

// ── Contact detail item (for Modern header) ───────────────────────────────────

// opts.textColor overrides the default grey for text and icon fallback (use for dark-bg templates)
// opts.iconColor overrides the icon color entirely (ignores accentTargets)
function buildDetailsBlock(pi, ds, util, opts = {}) {
  const { textColor = '#6B7280', iconColor: iconColorOpt = null } = opts;
  const { fontSize, t, colIf } = util;
  const details = [
    { kind: 'mail',  val: pi.email },
    { kind: 'phone', val: pi.phone },
    { kind: 'pin',   val: pi.location },
    { kind: 'link',  val: pi.link },
  ].filter(d => d.val);
  if (!details.length) return null;

  const sep     = ds.detailsSeparator || 'icon';
  const arr     = ds.detailsArrangement || 2;
  const align   = ds.headerAlignment === 'center' ? 'center' : 'flex-start';
  const iconClr = iconColorOpt !== null ? iconColorOpt : (colIf(t.headerIcons) || textColor);

  const item = ({ kind, val }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      {sep === 'icon' && <HdrIcon kind={kind} style={ds.headerIconStyle || 1} color={iconClr} size={fontSize - 2} />}
      <span style={{ color: textColor }}>{val}</span>
    </span>
  );

  if (arr === 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 7, fontSize: '0.92em', color: textColor, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        {details.map(d => <div key={d.kind}>{item(d)}</div>)}
      </div>
    );
  }
  if (arr === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 7, fontSize: '0.92em', color: textColor, maxWidth: ds.headerAlignment === 'center' ? '70%' : '85%', marginLeft: ds.headerAlignment === 'center' ? 'auto' : 0, marginRight: ds.headerAlignment === 'center' ? 'auto' : 0 }}>
        {details.map(d => <div key={d.kind}>{item(d)}</div>)}
      </div>
    );
  }
  // arr === 1: inline row with separator
  const sepEl = sep === 'bullet' ? <span style={{ color: '#9CA3AF', margin: '0 5px' }}>·</span>
    : sep === 'bar' ? <span style={{ color: '#9CA3AF', margin: '0 7px' }}>|</span>
    : <span style={{ width: 8 }} />;
  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', marginTop: 7, fontSize: '0.92em', color: textColor, justifyContent: align }}>
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

function TemplateModern({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
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
      {showHeader && (
        <div style={{ textAlign: ds.headerAlignment }}>
          <div style={{ fontSize: '2.2em', fontWeight: 700, letterSpacing: '-0.02em', color: colIf(t.name) || '#2C2C2A', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '1.05em', fontWeight: 500, color: colIf(t.jobTitle) || accent, marginTop: 4 }}>{pi.title}</div>}
          {buildDetailsBlock(pi, ds, util)}
        </div>
      )}
      {applyColumnLayout(sections, resume.layout_settings, padX, sec => {
        if (!isSectionVisible(sec, visibleBlockIds)) return null;
        const body = renderSectionBody(sec, util);
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        const headingVisible = showSectionHeading(sec, visibleBlockIds);
        return (
          <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
            {headingVisible && <Heading iconName={SEC_ICONS[sec.type]}>{sec.title}</Heading>}
            {body}
          </div>
        );
      })}
    </div>
  );
}

// ── Template 2: Atlantic Blue (dark sidebar) ──────────────────────────────────

const ATLANTIC_SIDEBAR_TYPES = new Set(['summary', 'languages', 'hobbies', 'references']);

function TemplateAtlanticBlue({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const sideColor = '#1F2A44';
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const sc      = resume.layout_settings?.sectionColumns || {};
  const sideIds = sections.filter(s => sc[s.id] ? sc[s.id] === 'left' : ATLANTIC_SIDEBAR_TYPES.has(s.type));
  const bodyIds = sections.filter(s => sc[s.id] ? sc[s.id] === 'right' : !ATLANTIC_SIDEBAR_TYPES.has(s.type));

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A', display: 'grid', gridTemplateColumns: '32% 1fr', minHeight: '100%', alignItems: 'stretch' };

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
      <HdrIcon kind={icon} style={ds.headerIconStyle || 1} color="#D1DCE8" size={fontSize - 2} /><span>{txt}</span>
    </div>
  ) : null;

  return (
    <div style={pageStyle}>
      {/* Sidebar — minHeight:100% fills the full page height even when content is short */}
      <div style={{ background: sideColor, color: '#fff', padding: '24px 20px', minHeight: '100%', boxSizing: 'border-box' }}>
        {showHeader && (
          <>
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
          </>
        )}
        <div style={{ color: '#E8EEF7' }}>
          {sideIds.map(sec => {
            if (!isSectionVisible(sec, visibleBlockIds)) return null;
            const body = renderSectionBody(sec, util, { certVariant: sec.display_settings?.certLayout || 'compact-list', langDefaultLayout: 'compact' });
            if (!body) return null;
            const adj = sectionAdjustments?.[sec.id];
            const headingVisible = showSectionHeading(sec, visibleBlockIds);
            return (
              <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
                {headingVisible && <SideHead iconName={SEC_ICONS[sec.type]}>{sec.title}</SideHead>}
                {body}
              </div>
            );
          })}
        </div>
      </div>
      {/* Main body */}
      <div style={{ padding: '24px 22px' }}>
        {bodyIds.map(sec => {
          if (!isSectionVisible(sec, visibleBlockIds)) return null;
          const body = renderSectionBody(sec, util, {
            expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'stacked') : undefined,
          });
          if (!body) return null;
          const adj = sectionAdjustments?.[sec.id];
          const headingVisible = showSectionHeading(sec, visibleBlockIds);
          return (
            <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
              {headingVisible && <PillHead iconName={SEC_ICONS[sec.type]}>{sec.title}</PillHead>}
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template 3: Corporate (centered, classic) ─────────────────────────────────

function TemplateCorporate({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
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

  return (
    <div style={pageStyle}>
      {showHeader && (
        <div style={{ textAlign: ds.headerAlignment || 'center' }}>
          <div style={{ fontSize: '2em', fontWeight: 700, color: colIf(t.name) || '#1F2937', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '1.05em', fontStyle: 'italic', color: colIf(t.jobTitle) || '#374151', marginTop: 4 }}>{pi.title}</div>}
          {buildDetailsBlock(pi, ds, util, { textColor: '#374151' })}
        </div>
      )}
      {applyColumnLayout(sections, resume.layout_settings, padX, sec => {
        if (!isSectionVisible(sec, visibleBlockIds)) return null;
        const body = renderSectionBody(sec, util);
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        const headingVisible = showSectionHeading(sec, visibleBlockIds);
        return (
          <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
            {headingVisible && <Heading iconName={SEC_ICONS[sec.type]}>{sec.title}</Heading>}
            {body}
          </div>
        );
      })}
    </div>
  );
}

// ── Template 4: Atlantic Crest (dark banner + two-column) ─────────────────────

const CREST_LEFT_TYPES = new Set(['summary', 'skills', 'languages', 'certifications', 'hobbies']);

function TemplateAtlanticCrest({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const bannerColor = '#1F2A44';
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const colLayout = resume.layout_settings?.columnLayout;
  const sc        = resume.layout_settings?.sectionColumns || {};

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
      <HdrIcon kind={icon} style={ds.headerIconStyle || 1} color="#D1DCE8" size={fontSize - 2} />{txt}
    </span>
  ) : null;

  return (
    <div style={pageStyle}>
      {/* Dark banner — first page only; thin anchor bar on continuation pages */}
      {showHeader ? (
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
      ) : (
        <div style={{ height: 8, background: bannerColor, width: '100%' }} />
      )}
      {/* Body — one / mix / two-column */}
      <div style={{ padding: `${padY * 0.6}mm ${padX}mm` }}>
        {(() => {
          const renderSec = sec => {
            if (!isSectionVisible(sec, visibleBlockIds)) return null;
            const defaultExp = CREST_LEFT_TYPES.has(sec.type) ? undefined : 'stacked';
            const body = renderSectionBody(sec, util, {
              expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || defaultExp) : undefined,
            });
            if (!body) return null;
            const adj = sectionAdjustments?.[sec.id];
            const headingVisible = showSectionHeading(sec, visibleBlockIds);
            return (
              <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
                {headingVisible && <PillHead iconName={SEC_ICONS[sec.type]}>{sec.title}</PillHead>}
                {body}
              </div>
            );
          };
          if (colLayout === 'one') return sections.map(renderSec);
          if (colLayout === 'mix') return renderMixGrid(sections, sc,
            { display: 'grid', gridTemplateColumns: '38% 1fr', gap: 18, alignItems: 'start' }, renderSec);
          const left  = sections.filter(s => sc[s.id] ? sc[s.id] === 'left' : CREST_LEFT_TYPES.has(s.type));
          const right = sections.filter(s => sc[s.id] ? sc[s.id] === 'right' : !CREST_LEFT_TYPES.has(s.type));
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '38% 1fr', gap: 18, alignItems: 'start' }}>
              <div>{left.map(renderSec)}</div>
              <div>{right.map(renderSec)}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Template 5: Mercury Flow (gray banner + date column) ──────────────────────

function TemplateMercuryFlow({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
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
  return (
    <div style={pageStyle}>
      {/* Gray banner */}
      {showHeader && (
        <div style={{ background: '#E5E7EB', padding: `${padY * 0.7}mm ${padX}mm`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <PhotoPlaceholder size={70} shape="circle" name={pi.name} src={pi.photo || null} />
          <div style={{ flex: 1, textAlign: ds.headerAlignment }}>
            <div style={{ fontSize: '1.5em', fontWeight: 700, color: colIf(t.name) || '#1F2937', lineHeight: 1.05 }}>{pi.name || 'Your Name'}</div>
            {pi.title && <div style={{ fontSize: '0.95em', color: colIf(t.jobTitle) || '#374151', marginTop: 2 }}>{pi.title}</div>}
            {buildDetailsBlock(pi, ds, util, { textColor: '#374151' })}
          </div>
        </div>
      )}
      <div style={{ padding: `${padY * 0.5}mm ${padX}mm` }}>
        {applyColumnLayout(sections, resume.layout_settings, padX, sec => {
          if (!isSectionVisible(sec, visibleBlockIds)) return null;
          const body = renderSectionBody(sec, util, {
            expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'date-column') : undefined,
            eduVariant: sec.type === 'education' ? (sec.display_settings?.entryLayout || 'date-column') : undefined,
          });
          if (!body) return null;
          const adj = sectionAdjustments?.[sec.id];
          const headingVisible = showSectionHeading(sec, visibleBlockIds);
          return (
            <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
              {headingVisible && <BarHead iconName={SEC_ICONS[sec.type]}>{sec.title}</BarHead>}
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template 6: Steady Form (photo right + gray bar headings) ─────────────────

function TemplateSteadyForm({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
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
  return (
    <div style={pageStyle}>
      {/* Name+contacts left, photo right */}
      {showHeader && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: 6 }}>
          <div style={{ textAlign: ds.headerAlignment }}>
            <div style={{ fontSize: '1.6em' }}>
              <span style={{ fontWeight: 700, color: colIf(t.name) || '#1F2937' }}>{pi.name || 'Your Name'}</span>
              {pi.title && <span style={{ fontStyle: 'italic', fontWeight: 400, color: colIf(t.jobTitle) || '#374151', marginLeft: 10 }}>{pi.title}</span>}
            </div>
            {buildDetailsBlock(pi, ds, util, { textColor: '#374151' })}
          </div>
          <PhotoPlaceholder size={78} shape="circle" name={pi.name} src={pi.photo || null} />
        </div>
      )}
      {applyColumnLayout(sections, resume.layout_settings, padX, sec => {
        if (!isSectionVisible(sec, visibleBlockIds)) return null;
        const body = renderSectionBody(sec, util, {
          expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'inline-title-role') : undefined,
          eduVariant: sec.type === 'education' ? (sec.display_settings?.entryLayout || 'date-column') : undefined,
        });
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        const headingVisible = showSectionHeading(sec, visibleBlockIds);
        return (
          <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
            {headingVisible && <BarHead iconName={SEC_ICONS[sec.type]}>{sec.title}</BarHead>}
            {body}
          </div>
        );
      })}
    </div>
  );
}

// ── Template 7: Executive (editorial serif, date-column) ──────────────────────

function TemplateExecutive({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
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
  return (
    <div style={pageStyle}>
      {showHeader && (
        <div style={{ textAlign: ds.headerAlignment }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', justifyContent: ds.headerAlignment === 'center' ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: '1.8em', fontWeight: 700, color: colIf(t.name) || '#1F2937' }}>{pi.name || 'Your Name'}</span>
            {pi.title && <span style={{ fontSize: '1.05em', fontStyle: 'italic', color: colIf(t.jobTitle) || '#374151' }}>{pi.title}</span>}
          </div>
          {buildDetailsBlock(pi, ds, util, { textColor: '#374151' })}
        </div>
      )}
      {applyColumnLayout(sections, resume.layout_settings, padX, sec => {
        if (!isSectionVisible(sec, visibleBlockIds)) return null;
        const body = renderSectionBody(sec, util, {
          expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'date-column') : undefined,
          eduVariant: sec.type === 'education' ? (sec.display_settings?.entryLayout || 'date-column') : undefined,
        });
        if (!body) return null;
        const adj = sectionAdjustments?.[sec.id];
        const headingVisible = showSectionHeading(sec, visibleBlockIds);
        return (
          <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
            {headingVisible && <Heading iconName={SEC_ICONS[sec.type]}>{sec.title}</Heading>}
            {body}
          </div>
        );
      })}
    </div>
  );
}

// ── Template 8: Azure Wave (soft waves · two-column · small-caps headings) ────

const WAVE_LEFT_TYPES = new Set(['skills', 'languages', 'hobbies', 'references']);

function TemplateAzureWave({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const wave     = '#D9ECFB';
  const waveDeep = '#BBDDF6';

  const colLayout = resume.layout_settings?.columnLayout;
  const sc        = resume.layout_settings?.sectionColumns || {};

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A', position: 'relative', minHeight: '100%', overflow: 'hidden' };

  const SmallCapsHead = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || '#9CA3AF';
    return (
      <div style={{ marginTop: '1.2em', marginBottom: '0.45em', display: 'flex', alignItems: 'center', gap: 5 }}>
        {headingIcon !== 'none' && iconName && (
          headingIcon === 'filled'
            ? <span style={{ background: hColor, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
            : <Icon name={iconName} size={hIconSz} color={hColor} />
        )}
        <span style={{ fontSize: `${0.74 * titleSizeMult}em`, textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, color: hColor }}>{children}</span>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      {/* Wave decorations — first page only */}
      {showHeader && (
        <>
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '26%', pointerEvents: 'none' }}>
            <path d="M 0 0 L 200 0 L 200 55 C 165 75, 130 35, 95 55 S 30 80, 0 60 Z" fill={waveDeep} opacity="0.55" />
            <path d="M 0 0 L 200 0 L 200 30 C 165 55, 130 15, 95 35 S 30 60, 0 40 Z" fill={wave} />
          </svg>
          <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20%', pointerEvents: 'none' }}>
            <path d="M 0 100 L 200 100 L 200 50 C 170 30, 130 70, 95 50 S 30 25, 0 45 Z" fill={waveDeep} opacity="0.55" />
            <path d="M 0 100 L 200 100 L 200 70 C 170 55, 130 90, 95 70 S 30 50, 0 65 Z" fill={wave} />
          </svg>
        </>
      )}

      <div style={{ position: 'relative', padding: `${showHeader ? padY : padY * 0.5}mm ${padX}mm ${padY}mm` }}>
        {showHeader && (
          <div style={{ marginBottom: '1em', textAlign: ds.headerAlignment }}>
            <div style={{ fontSize: '2em', fontWeight: 700, letterSpacing: '-0.01em', color: colIf(t.name) || '#2C2C2A', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
            {pi.title && <div style={{ fontSize: '0.95em', color: colIf(t.jobTitle) || accent, marginTop: 4, fontWeight: 500 }}>{pi.title}</div>}
            {buildDetailsBlock(pi, ds, util, { iconColor: colIf(t.headerIcons) || accent })}
          </div>
        )}
        {(() => {
          const renderSec = sec => {
            if (!isSectionVisible(sec, visibleBlockIds)) return null;
            const body = renderSectionBody(sec, util, {
              expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'stacked') : undefined,
            });
            if (!body) return null;
            const adj = sectionAdjustments?.[sec.id];
            const headingVisible = showSectionHeading(sec, visibleBlockIds);
            return (
              <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
                {headingVisible && <SmallCapsHead iconName={SEC_ICONS[sec.type]}>{sec.title}</SmallCapsHead>}
                {body}
              </div>
            );
          };
          if (colLayout === 'one') return <>{sections.map(renderSec)}</>;
          if (colLayout === 'mix') return renderMixGrid(sections, sc,
            { display: 'grid', gridTemplateColumns: '38% 1fr', gap: 22, alignItems: 'start' }, renderSec);
          const left  = sections.filter(s => sc[s.id] ? sc[s.id] === 'left' : WAVE_LEFT_TYPES.has(s.type));
          const right = sections.filter(s => sc[s.id] ? sc[s.id] === 'right' : !WAVE_LEFT_TYPES.has(s.type));
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '38% 1fr', gap: 22, alignItems: 'start' }}>
              <div>{left.map(renderSec)}</div>
              <div>{right.map(renderSec)}</div>
            </div>
          );
        })()}
        {/* Footer */}
        <div style={{ position: 'absolute', left: padX + 'mm', right: padX + 'mm', bottom: padY * 0.45 + 'mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9CA3AF', fontSize: '0.78em' }}>
          <span>{pi.link || ''}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Powered by <span style={{ fontWeight: 700, color: accent }}>Proflect</span></span>
        </div>
      </div>
    </div>
  );
}

// ── Template 9: Noir Flash (dark · yellow · vertical name · triangle) ─────────

const NOIR_LEFT_TYPES = new Set(['summary', 'skills', 'languages', 'hobbies', 'references']);

function NoirSkillsLolly({ sec, accentColor }) {
  const entries = (sec?.content?.entries || []);
  if (!entries.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {entries.map((s, i) => (
        <div key={i}>
          <div style={{ fontSize: '0.92em', marginBottom: 2 }}>{s.name}</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${Math.round(((s.level || 2) / 3) * 100)}%`, background: accentColor, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoirLanguagesGrid({ sec }) {
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18, rowGap: 3 }}>
      {entries.map((l, i) => (
        <div key={i}>
          <div style={{ fontSize: '0.92em' }}>{l.name}</div>
          {l.level && <div style={{ fontSize: '0.85em', color: '#9CA3AF' }}>{l.level}</div>}
        </div>
      ))}
    </div>
  );
}

function TemplateNoirFlash({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const isDefault = !ds.accentColor || ds.accentColor === '#185FA5';
  const yellow = isDefault ? '#F5C842' : accent;

  const colLayout = resume.layout_settings?.columnLayout;
  const sc        = resume.layout_settings?.sectionColumns || {};

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#E8EFF7', background: '#141414', position: 'relative', minHeight: '100%', overflow: 'hidden' };

  const NoirHead = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || yellow;
    return (
      <div style={{ marginTop: '1.2em', marginBottom: '0.5em', display: 'flex', alignItems: 'center', gap: 6 }}>
        {headingIcon !== 'none' && iconName && (
          headingIcon === 'filled'
            ? <span style={{ background: hColor, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#141414" /></span>
            : <Icon name={iconName} size={hIconSz} color={hColor} />
        )}
        <span style={{ fontSize: `${1 * titleSizeMult}em`, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: hColor }}>{children}</span>
      </div>
    );
  };

  const contact = (icon, txt) => txt ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9em', color: '#E8EFF7' }}>
      <HdrIcon kind={icon} style={ds.headerIconStyle || 1} color={yellow} size={fontSize - 2} />{txt}
    </div>
  ) : null;

  const nameWords = (pi.name || 'Your Name').split(/\s+/);

  return (
    <div style={pageStyle}>
      {/* Top-right yellow diagonal — first page only */}
      {showHeader && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '34%', pointerEvents: 'none' }}>
          <polygon points="100,0 100,100 0,0" fill={yellow} />
        </svg>
      )}
      {/* Bottom-right yellow band — always shown as footer anchor */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, right: 0, width: '55%', height: '8%', pointerEvents: 'none' }}>
        <polygon points="0,100 100,100 100,0 8,0" fill={yellow} />
      </svg>

      <div style={{ position: 'relative', paddingTop: `${showHeader ? padY : padY * 0.5}mm`, paddingBottom: `${padY}mm`, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, zIndex: 1 }}>
        {showHeader && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: '1em' }}>
            <div>
              <div style={{ fontSize: '2.6em', fontWeight: 900, letterSpacing: '0.01em', lineHeight: 0.95, textTransform: 'uppercase', color: '#fff' }}>
                {nameWords.map((w, i) => <div key={i}>{w}</div>)}
              </div>
              {pi.title && <div style={{ fontSize: '0.9em', color: yellow, marginTop: 6 }}>{pi.title}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <PhotoPlaceholder size={80} shape="circle" name={pi.name} src={pi.photo || null} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                {contact('pin', pi.location)}
                {contact('phone', pi.phone)}
                {contact('mail', pi.email)}
                {contact('link', pi.link)}
              </div>
            </div>
          </div>
        )}
        {(() => {
          const renderSec = sec => {
            if (!isSectionVisible(sec, visibleBlockIds)) return null;
            const headingVisible = showSectionHeading(sec, visibleBlockIds);
            const adj = sectionAdjustments?.[sec.id];
            const body = renderSectionBody(sec, util, {
              expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'stacked') : undefined,
              langDefaultLayout: 'compact',
              hobbiesDefaultStyle: 'chips',
            });
            if (!body) return null;
            return (
              <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
                {headingVisible && <NoirHead iconName={SEC_ICONS[sec.type]}>{sec.title}</NoirHead>}
                {body}
              </div>
            );
          };
          if (colLayout === 'one') return <>{sections.map(renderSec)}</>;
          if (colLayout === 'mix') return renderMixGrid(sections, sc,
            { display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24, alignItems: 'start' }, renderSec);
          const left  = sections.filter(s => sc[s.id] ? sc[s.id] === 'left' : NOIR_LEFT_TYPES.has(s.type));
          const right = sections.filter(s => sc[s.id] ? sc[s.id] === 'right' : !NOIR_LEFT_TYPES.has(s.type));
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24, alignItems: 'start' }}>
              <div>{left.map(renderSec)}</div>
              <div>{right.map(renderSec)}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Template 10: Verdant Crest (green polygons · photo · lollipop bars) ───────

const VERDANT_RIGHT_TYPES = new Set(['skills', 'languages', 'hobbies', 'certifications', 'references', 'custom']);

function SkillsLolly({ sec, accentColor, softColor }) {
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {entries.map((s, i) => {
        const pct = Math.min(100, Math.max(10, Math.round(((s.level || 2) / 3) * 100)));
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: '0.92em' }}>{s.name}</div>
            <div style={{ position: 'relative', height: 2, background: softColor || '#E5E7EB' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: pct + '%', background: accentColor }} />
              <div style={{ position: 'absolute', left: `calc(${pct}% - 4px)`, top: -3, width: 8, height: 8, background: accentColor, borderRadius: '50%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LanguageRings({ sec, accentColor, softColor }) {
  const entries = sec?.content?.entries || [];
  if (!entries.length) return null;
  const map = { Beginner: 30, Intermediate: 55, Advanced: 75, Fluent: 90, Native: 100 };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
      {entries.map((l, i) => {
        const pct = map[l.level] ?? (typeof l.level === 'number' ? Math.round(l.level / 3 * 100) : 70);
        const r = 12; const circ = 2 * Math.PI * r;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r={r} fill="none" stroke={softColor || '#E5E7EB'} strokeWidth="2.5" />
              <circle cx="14" cy="14" r={r} fill="none" stroke={accentColor} strokeWidth="2.5"
                strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
                strokeLinecap="round" transform="rotate(-90 14 14)" />
            </svg>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.88em' }}>{l.name}</div>
              {l.level && <div style={{ fontSize: '0.75em', color: '#6B7280' }}>{l.level}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HashChips({ sec, accentColor }) {
  const text  = sec?.content?.text || '';
  const items = text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '0.92em' }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: accentColor, fontWeight: 700 }}>#</span>{it}
        </span>
      ))}
    </div>
  );
}

function TemplateVerdantCrest({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const isDefault  = !ds.accentColor || ds.accentColor === '#185FA5';
  const green      = isDefault ? '#7BC79A' : accent;
  const greenDeep  = isDefault ? '#5BAE82' : accent;
  const greenSoft  = isDefault ? '#D6EFE0' : accent + '33';

  const colLayout = resume.layout_settings?.columnLayout;
  const sc        = resume.layout_settings?.sectionColumns || {};

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#1F2937', minHeight: '100%', position: 'relative', overflow: 'hidden' };

  const GreenHead = ({ children, iconName }) => {
    const hColor = colIf(t.headings) || '#1F2937';
    return (
      <div style={{ marginTop: '1.1em', marginBottom: '0.45em', display: 'flex', alignItems: 'center', gap: 6 }}>
        {headingIcon !== 'none' && iconName && (
          headingIcon === 'filled'
            ? <span style={{ background: hColor, borderRadius: '50%', width: hFilledSz, height: hFilledSz, display: 'inline-grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconName} size={hFilledIconSz} color="#fff" /></span>
            : <Icon name={iconName} size={hIconSz} color={hColor} />
        )}
        <span style={{ fontSize: `${1.05 * titleSizeMult}em`, fontWeight: 700, color: hColor }}>{children}</span>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      {/* Header: polygon SVG — first page only; left accent stripe on continuation pages */}
      {showHeader ? (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
            <rect width="600" height="200" fill={greenSoft} />
            <polygon points="0,0 140,0 70,90"             fill={green}     opacity="0.55" />
            <polygon points="140,0 280,0 200,70 110,90"   fill={greenDeep} opacity="0.32" />
            <polygon points="280,0 420,0 350,80 220,100"  fill={green}     opacity="0.45" />
            <polygon points="420,0 600,0 600,90 500,100 410,70" fill={greenDeep} opacity="0.28" />
            <polygon points="0,200 80,160 180,180 130,200" fill={green}    opacity="0.4" />
            <polygon points="180,180 320,140 380,200 130,200" fill={greenDeep} opacity="0.25" />
            <polygon points="320,140 460,160 540,200 380,200" fill={green} opacity="0.45" />
            <polygon points="70,90 200,70 280,180 130,180"  fill="#fff"     opacity="0.18" />
          </svg>
          <div style={{ position: 'relative', padding: `${padY * 0.7}mm ${padX}mm`, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
            <PhotoPlaceholder size={84} shape="circle" name={pi.name} src={pi.photo || null} />
            <div>
              <div style={{ fontSize: '2.2em', fontWeight: 800, letterSpacing: '-0.01em', color: colIf(t.name) || '#1F2937', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
              {pi.title && <div style={{ fontSize: '0.95em', color: '#374151', marginTop: 4 }}>{pi.title}</div>}
              {buildDetailsBlock(pi, ds, util, { textColor: '#374151', iconColor: colIf(t.headerIcons) || greenDeep })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ height: 4, background: greenDeep, width: '100%' }} />
      )}
      {/* Body — one / mix / two-column */}
      {(() => {
        const renderSec = sec => {
          if (!isSectionVisible(sec, visibleBlockIds)) return null;
          const headingVisible = showSectionHeading(sec, visibleBlockIds);
          const adj = sectionAdjustments?.[sec.id];
          const body = renderSectionBody(sec, util, {
            expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'stacked') : undefined,
            langDefaultLayout: 'rings',
            hobbiesDefaultStyle: 'chips',
          });
          if (!body) return null;
          return (
            <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
              {headingVisible && <GreenHead iconName={SEC_ICONS[sec.type]}>{sec.title}</GreenHead>}
              {body}
            </div>
          );
        };
        if (colLayout === 'one') return (
          <div style={{ padding: `${padY * 0.4}mm ${padX}mm ${padY}mm` }}>{sections.map(renderSec)}</div>
        );
        if (colLayout === 'mix') return (
          <div style={{ padding: `${padY * 0.4}mm ${padX}mm ${padY}mm` }}>
            {renderMixGrid(sections, sc, { display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 26, alignItems: 'start' }, renderSec)}
          </div>
        );
        const left  = sections.filter(s => sc[s.id] ? sc[s.id] === 'left' : !VERDANT_RIGHT_TYPES.has(s.type));
        const right = sections.filter(s => sc[s.id] ? sc[s.id] === 'right' : VERDANT_RIGHT_TYPES.has(s.type));
        return (
          <div style={{ padding: `${padY * 0.4}mm ${padX}mm ${padY}mm`, display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 26, alignItems: 'start' }}>
            <div>{left.map(renderSec)}</div>
            <div>{right.map(renderSec)}</div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Template 11: Confetti (coral bubbles · pill headers · two-column) ─────────

const CONFETTI_LEFT_TYPES = new Set(['summary', 'work_experience', 'education', 'projects']);

function TemplateConfetti({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz, hFilledSz, hFilledIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const headingIcon = resume.layout_settings?.headingIcon || 'none';

  const isDefault  = !ds.accentColor || ds.accentColor === '#185FA5';
  const coral      = isDefault ? '#EBA9A4' : accent;
  const coralDeep  = isDefault ? '#C66A66' : accent;
  const beige      = '#D8C8B5';
  const blue       = '#B6CFE0';

  const colLayout = resume.layout_settings?.columnLayout;
  const sc        = resume.layout_settings?.sectionColumns || {};

  const pageStyle = { fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#1F2937', minHeight: '100%', position: 'relative', overflow: 'hidden' };

  const PillHead = ({ children, iconName }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: colIf(t.headings) || coral, color: '#fff', padding: '4px 14px', borderRadius: 999, fontSize: `${0.95 * titleSizeMult}em`, fontWeight: 700, marginTop: '1em', marginBottom: '0.45em' }}>
      {headingIcon !== 'none' && iconName && <Icon name={iconName} size={hIconSz} color="#fff" />}
      {children}
    </div>
  );

  return (
    <div style={pageStyle}>
      {/* Confetti circles — first page only */}
      {showHeader && (
        <svg viewBox="0 0 600 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <circle cx="520" cy="50"  r="55" fill={coral}     opacity="0.55" />
          <circle cx="565" cy="120" r="22" fill={coral}     opacity="0.35" />
          <circle cx="460" cy="80"  r="14" fill={beige}     opacity="0.7"  />
          <circle cx="500" cy="160" r="32" fill={beige}     opacity="0.55" />
          <circle cx="430" cy="30"  r="10" fill={blue}      opacity="0.6"  />
          <circle cx="580" cy="22"  r="18" fill={blue}      opacity="0.55" />
          <circle cx="590" cy="420" r="34" fill={coral}     opacity="0.35" />
          <circle cx="575" cy="500" r="14" fill={beige}     opacity="0.8"  />
          <circle cx="40"  cy="760" r="48" fill={coral}     opacity="0.45" />
          <circle cx="98"  cy="730" r="18" fill={beige}     opacity="0.6"  />
          <circle cx="20"  cy="700" r="10" fill={blue}      opacity="0.65" />
          <circle cx="120" cy="780" r="22" fill={blue}      opacity="0.45" />
          <circle cx="180" cy="760" r="14" fill={coral}     opacity="0.6"  />
          <circle cx="10"  cy="320" r="14" fill={beige}     opacity="0.6"  />
          <circle cx="20"  cy="500" r="10" fill={coral}     opacity="0.5"  />
        </svg>
      )}

      <div style={{ position: 'relative', padding: `${padY}mm ${padX}mm` }}>
        {showHeader && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: '0.6em' }}>
            <div style={{ textAlign: ds.headerAlignment }}>
              <div style={{ fontSize: '2.1em', fontWeight: 800, letterSpacing: '-0.01em', color: colIf(t.name) || '#1F2937', lineHeight: 1 }}>{pi.name || 'Your Name'}</div>
              {buildDetailsBlock(pi, ds, util)}
            </div>
            <PhotoPlaceholder size={86} shape="circle" name={pi.name} src={pi.photo || null} />
          </div>
        )}
        {(() => {
          const renderSec = sec => {
            if (!isSectionVisible(sec, visibleBlockIds)) return null;
            const headingVisible = showSectionHeading(sec, visibleBlockIds);
            const adj = sectionAdjustments?.[sec.id];
            const body = renderSectionBody(sec, util, {
              expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'stacked') : undefined,
              hobbiesDefaultStyle: 'chips',
            });
            if (!body) return null;
            return (
              <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
                {headingVisible && <PillHead iconName={SEC_ICONS[sec.type]}>{sec.title}</PillHead>}
                <div style={{ marginTop: 4 }}>{body}</div>
              </div>
            );
          };
          if (colLayout === 'one') return <>{sections.map(renderSec)}</>;
          if (colLayout === 'mix') return renderMixGrid(sections, sc,
            { display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22, alignItems: 'start' }, renderSec);
          const left  = sections.filter(s => sc[s.id] ? sc[s.id] === 'left' : CONFETTI_LEFT_TYPES.has(s.type));
          const right = sections.filter(s => sc[s.id] ? sc[s.id] === 'right' : !CONFETTI_LEFT_TYPES.has(s.type));
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22, alignItems: 'start' }}>
              <div>{left.map(renderSec)}</div>
              <div>{right.map(renderSec)}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Template registry ─────────────────────────────────────────────────────────

// ── Side-section split used by Spotlight, Panels, Vertex ─────────────────────

const NEW_TMPL_SIDE_TYPES = new Set(['skills', 'languages', 'hobbies', 'certifications', 'references']);

function splitNewTmplCols(sections, sc) {
  const sectionColumns = sc || {};
  return {
    side: sections.filter(s => sectionColumns[s.id] ? sectionColumns[s.id] === 'right' : NEW_TMPL_SIDE_TYPES.has(s.type)),
    main: sections.filter(s => sectionColumns[s.id] ? sectionColumns[s.id] !== 'right' : !NEW_TMPL_SIDE_TYPES.has(s.type)),
  };
}

// ── Template: Spotlight ───────────────────────────────────────────────────────

function TemplateSpotlight({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const colLayout = resume.layout_settings?.columnLayout;
  const sc = resume.layout_settings?.sectionColumns || {};
  const { main, side } = splitNewTmplCols(sections, sc);

  const hdrPad = `${Math.max(padY * 0.85, 13)}mm`;

  const SpotHead = ({ children }) => (
    <div style={{ marginTop: '1.3em', marginBottom: '0.55em' }}>
      <div style={{ fontSize: `${0.82 * titleSizeMult}em`, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: colIf(t.headings) || accent }}>
        {children}
      </div>
      <div style={{ height: 3, width: 32, borderRadius: 2, background: colIf(t.headingsLine) || accent, marginTop: 5 }} />
    </div>
  );

  const contactItems = [
    { kind: 'mail', val: pi.email }, { kind: 'phone', val: pi.phone },
    { kind: 'pin', val: pi.location }, { kind: 'link', val: pi.link },
  ].filter(d => d.val);

  const SIDE_OPTS = {
    expVariant: 'stacked',
    eduVariant: 'compact',
    hobbiesDefaultStyle: 'chips',
    langDefaultLayout: 'compact',
    certVariant: 'compact-list',
  };
  const MAIN_OPTS = (sec) => ({
    expVariant: sec.display_settings?.entryLayout || 'stacked',
    eduVariant: sec.display_settings?.entryLayout || 'compact',
    hobbiesDefaultStyle: 'chips',
    langDefaultLayout: 'compact',
    certVariant: sec.display_settings?.certLayout,
  });

  const renderSideBody = (sec) => renderSectionBody(sec, util, {
    ...SIDE_OPTS,
    certVariant: sec.display_settings?.certLayout || 'compact-list',
  });

  const renderSecBlock = (sec, bodyFn) => {
    if (!isSectionVisible(sec, visibleBlockIds)) return null;
    const body = bodyFn(sec);
    if (!body) return null;
    const adj = sectionAdjustments?.[sec.id];
    const headingVisible = showSectionHeading(sec, visibleBlockIds);
    return (
      <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
        {headingVisible && <SpotHead>{sec.title}</SpotHead>}
        {body}
      </div>
    );
  };

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A' }}>
      {showHeader && (
        <div style={{ background: accent, padding: `${hdrPad} ${padX}mm` }}>
          <div style={{ fontSize: '3em', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.98, color: '#fff' }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '1.15em', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{pi.title}</div>}
          {contactItems.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px', marginTop: 14 }}>
              {contactItems.map(({ kind, val }) => (
                <span key={kind} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.92)', fontSize: '0.92em' }}>
                  <Icon name={kind} size={hIconSz} color="rgba(255,255,255,0.92)" />
                  {val}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {colLayout === 'one' ? (
        <div style={{ padding: `${padY * 0.6}mm ${padX}mm ${padY}mm` }}>
          {[...main, ...side].map(sec => renderSecBlock(sec, s => renderSectionBody(s, util, MAIN_OPTS(s))))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 26, padding: `${padY * 0.6}mm ${padX}mm ${padY}mm` }}>
          <div>
            {main.map(sec => renderSecBlock(sec, s => renderSectionBody(s, util, MAIN_OPTS(s))))}
          </div>
          <div>
            {side.map(sec => renderSecBlock(sec, renderSideBody))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template: Index ───────────────────────────────────────────────────────────

function TemplateIndex({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult } = util;
  const { pi, sections } = buildRenderData(resume);

  const contactItems = [
    { kind: 'mail', val: pi.email }, { kind: 'phone', val: pi.phone },
    { kind: 'pin', val: pi.location }, { kind: 'link', val: pi.link },
  ].filter(d => d.val);

  const numColW = `${Math.round(52 * titleSizeMult)}px`;

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A', paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm` }}>
      {showHeader && (
        <div>
          <div style={{ fontSize: '3.6em', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.95, color: colIf(t.name) || '#16181D' }}>{pi.name || 'Your Name'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {pi.title && <div style={{ fontSize: '1.15em', fontWeight: 500, color: colIf(t.jobTitle) || accent }}>{pi.title}</div>}
            {contactItems.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: '0.9em', color: '#6B7280', justifyContent: 'flex-end' }}>
                {contactItems.map(({ val }) => <span key={val}>{val}</span>)}
              </div>
            )}
          </div>
          <div style={{ height: 2, background: colIf(t.headingsLine) || '#16181D', marginTop: 14 }} />
        </div>
      )}
      {sections.map((sec, idx) => {
        if (!isSectionVisible(sec, visibleBlockIds)) return null;
        const adj = sectionAdjustments?.[sec.id];
        const headingVisible = showSectionHeading(sec, visibleBlockIds);
        const n = idx + 1;

        const body = renderSectionBody(sec, util, {
          expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'date-column') : undefined,
          eduVariant: sec.type === 'education' ? (sec.display_settings?.entryLayout || 'date-column') : undefined,
          hobbiesDefaultStyle: 'chips',
          langDefaultLayout: 'compact',
          certVariant: sec.display_settings?.certLayout,
        });

        if (!body) return null;

        return (
          <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
            {headingVisible && (
              <div style={{ display: 'grid', gridTemplateColumns: `${numColW} 1fr`, gap: 14, alignItems: 'baseline', marginTop: '1.6em', marginBottom: '0.7em' }}>
                <div style={{ fontSize: `${1.6 * titleSizeMult}em`, fontWeight: 800, color: colIf(t.headings) || accent, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {String(n).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontSize: `${0.84 * titleSizeMult}em`, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: colIf(t.headings) || '#16181D' }}>{sec.title}</div>
                  <div style={{ height: 1, background: colIf(t.headingsLine) || '#D7DBE2', marginTop: 6 }} />
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: `${numColW} 1fr`, gap: 14 }}>
              <div />
              <div>{body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Template: Panels ──────────────────────────────────────────────────────────

function TemplatePanels({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const colLayout = resume.layout_settings?.columnLayout;
  const sc = resume.layout_settings?.sectionColumns || {};
  const { main, side } = splitNewTmplCols(sections, sc);

  const contactItems = [
    { kind: 'mail', val: pi.email }, { kind: 'phone', val: pi.phone },
    { kind: 'pin', val: pi.location }, { kind: 'link', val: pi.link },
  ].filter(d => d.val);

  const PillLabel = ({ children }) => (
    <div style={{ display: 'inline-block', whiteSpace: 'nowrap', padding: '4px 13px', borderRadius: 999, background: accent + '14', color: colIf(t.headings) || accent, fontSize: `${0.74 * titleSizeMult}em`, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.55em' }}>
      {children}
    </div>
  );

  const renderMainBody = (sec) => renderSectionBody(sec, util, {
    expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'stacked') : undefined,
    eduVariant: sec.type === 'education' ? (sec.display_settings?.entryLayout || 'compact') : undefined,
    hobbiesDefaultStyle: 'chips',
    langDefaultLayout: 'compact',
    certVariant: sec.display_settings?.certLayout,
  });

  const renderSideBody = (sec) => renderSectionBody(sec, util, {
    expVariant: sec.display_settings?.entryLayout || 'stacked',
    eduVariant: sec.display_settings?.entryLayout || 'compact',
    hobbiesDefaultStyle: 'chips',
    langDefaultLayout: 'compact',
    certVariant: sec.display_settings?.certLayout || 'compact-list',
  });

  const renderSecBlock = (sec, bodyFn, wrapCard = false) => {
    if (!isSectionVisible(sec, visibleBlockIds)) return null;
    const body = bodyFn(sec);
    if (!body) return null;
    const adj = sectionAdjustments?.[sec.id];
    const headingVisible = showSectionHeading(sec, visibleBlockIds);
    const inner = (
      <>
        {headingVisible && <PillLabel>{sec.title}</PillLabel>}
        {body}
      </>
    );
    if (wrapCard) {
      return (
        <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id}
          style={{ background: '#F7F8FB', border: '1px solid #ECEEF3', borderRadius: 16, padding: '16px 17px', marginBottom: 14, ...(adj ? { marginTop: adj } : {}) }}>
          {inner}
        </div>
      );
    }
    return (
      <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={{ marginBottom: 16, ...(adj ? { marginTop: adj } : {}) }}>
        {inner}
      </div>
    );
  };

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A', padding: `${padY}mm ${padX}mm` }}>
      {showHeader && (
        <div style={{ background: accent + '0F', border: `1px solid ${accent}22`, borderRadius: 18, padding: `${padY * 0.7}mm ${padX}mm`, marginBottom: 2 }}>
          <div style={{ fontSize: '2.4em', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: colIf(t.name) || '#1E222B' }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '1.1em', fontWeight: 500, color: colIf(t.jobTitle) || accent, marginTop: 4 }}>{pi.title}</div>}
          {contactItems.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {contactItems.map(({ kind, val }) => (
                <span key={kind} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, background: '#fff', border: '1px solid #E6E9EF', fontSize: '0.86em' }}>
                  <Icon name={kind} size={hIconSz} color={colIf(t.headerIcons) || accent} />
                  {val}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {colLayout === 'one' ? (
        <div style={{ marginTop: 18 }}>
          {[...main, ...side].map(sec => renderSecBlock(sec, NEW_TMPL_SIDE_TYPES.has(sec.type) ? renderSideBody : renderMainBody, false))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18, marginTop: 18 }}>
          <div>{main.map(sec => renderSecBlock(sec, renderMainBody, false))}</div>
          <div>{side.map(sec => renderSecBlock(sec, renderSideBody, true))}</div>
        </div>
      )}
    </div>
  );
}

// ── Template: Vertex ──────────────────────────────────────────────────────────

function VertexBar({ pct }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.22)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: '#fff' }} />
    </div>
  );
}

const LANG_LEVEL_PCT = { Beginner: 30, Intermediate: 55, Advanced: 75, Fluent: 90, Native: 100 };

function TemplateVertex({ resume, ds, ss, sectionAdjustments, visibleBlockIds = null, showHeader = true }) {
  const util = tmplUtils(ds, ss, resume.layout_settings || {}, sectionAdjustments, visibleBlockIds);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf, fontFamily, titleSizeMult, hIconSz } = util;
  const { pi, sections } = buildRenderData(resume);
  const colLayout = resume.layout_settings?.columnLayout;
  const sc = resume.layout_settings?.sectionColumns || {};
  const { main, side } = splitNewTmplCols(sections, sc);

  const contactItems = [
    { kind: 'mail', val: pi.email }, { kind: 'phone', val: pi.phone },
    { kind: 'pin', val: pi.location }, { kind: 'link', val: pi.link },
  ].filter(d => d.val);

  const MainHead = ({ children }) => (
    <div style={{ marginTop: '1.3em', marginBottom: '0.5em' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: `${0.86 * titleSizeMult}em`, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: colIf(t.headings) || accent, whiteSpace: 'nowrap' }}>{children}</span>
        <span style={{ flex: 1, height: 1, background: colIf(t.headingsLine) || '#E2E5EB' }} />
      </div>
    </div>
  );

  const RailHead = ({ children }) => (
    <div style={{ marginTop: '1.2em', marginBottom: '0.5em' }}>
      <div style={{ fontSize: `${0.78 * titleSizeMult}em`, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.95)' }}>{children}</div>
      <div style={{ height: 2, width: Math.round(22 * titleSizeMult), background: 'rgba(255,255,255,0.6)', marginTop: 5 }} />
    </div>
  );

  const RAIL_OPTS = {
    hobbiesDefaultStyle: 'chips',
    langDefaultLayout: 'compact',
    certVariant: 'compact-list',
  };

  const renderRailSideBody = (sec) => {
    // Skills: use rings if user hasn't overridden the layout; else delegate to standard renderer
    if (sec.type === 'skills') {
      const layout = sec.display_settings?.layout;
      if (!layout || layout === 'rows') {
        const entries = sec.content?.entries || [];
        return entries.map((s, i) => {
          const pct = Math.min(100, Math.max(10, Math.round((s.level || 2) / 3 * 100)));
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              <span style={{ fontSize: '0.9em', color: '#fff', display: 'block', marginBottom: 3 }}>{s.name}</span>
              <VertexBar pct={pct} />
            </div>
          );
        });
      }
    }
    // Languages: rings if no layout override
    if (sec.type === 'languages') {
      const layout = sec.display_settings?.layout;
      if (!layout) {
        const entries = sec.content?.entries || [];
        return entries.map((l, i) => {
          const pct = LANG_LEVEL_PCT[l.level] || 55;
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: '0.9em', color: '#fff' }}>{l.name}</span>
                <span style={{ fontSize: '0.72em', color: 'rgba(255,255,255,0.65)' }}>{l.level || ''}</span>
              </div>
              <VertexBar pct={pct} />
            </div>
          );
        });
      }
    }
    // All other sections (or skills/languages with custom layout): white wrapper
    return (
      <div style={{ color: 'rgba(255,255,255,0.92)' }}>
        {renderSectionBody(sec, util, {
          ...RAIL_OPTS,
          certVariant: sec.display_settings?.certLayout || 'compact-list',
        })}
      </div>
    );
  };

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A', display: colLayout === 'one' ? 'block' : 'grid', gridTemplateColumns: '1fr 33%', minHeight: '100%' }}>
      {/* Main column */}
      <div style={{ padding: `${padY}mm ${padX}mm` }}>
        {showHeader && (
          <>
            <div style={{ fontSize: '2.6em', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1, color: colIf(t.name) || '#1A1D24' }}>{pi.name || 'Your Name'}</div>
            {pi.title && <div style={{ fontSize: '1.12em', fontWeight: 500, color: colIf(t.jobTitle) || accent, marginTop: 5 }}>{pi.title}</div>}
          </>
        )}
        {main.map(sec => {
          if (!isSectionVisible(sec, visibleBlockIds)) return null;
          const body = renderSectionBody(sec, util, {
            expVariant: sec.type === 'work_experience' ? (sec.display_settings?.entryLayout || 'stacked') : undefined,
            eduVariant: sec.type === 'education' ? (sec.display_settings?.entryLayout || 'compact') : undefined,
            hobbiesDefaultStyle: 'chips',
            langDefaultLayout: 'compact',
            certVariant: sec.display_settings?.certLayout,
          });
          if (!body) return null;
          const adj = sectionAdjustments?.[sec.id];
          const headingVisible = showSectionHeading(sec, visibleBlockIds);
          return (
            <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
              {headingVisible && <MainHead>{sec.title}</MainHead>}
              {body}
            </div>
          );
        })}
      </div>
      {/* Accent rail */}
      <div style={{ background: accent, color: '#fff', padding: `${padY}mm ${Math.round(padX * 0.85)}mm`, display: colLayout === 'one' ? 'none' : undefined }}>
        {showHeader && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <PhotoPlaceholder size={104} shape="circle" name={pi.name || ''} src={pi.photo || null} />
            </div>
            <RailHead>Contact</RailHead>
            {contactItems.map(({ kind, val }) => (
              <div key={kind} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: '0.84em', color: 'rgba(255,255,255,0.92)', wordBreak: 'break-word' }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}><Icon name={kind} size={hIconSz} color="rgba(255,255,255,0.92)" /></span>
                {val}
              </div>
            ))}
          </>
        )}
        {side.map(sec => {
          if (!isSectionVisible(sec, visibleBlockIds)) return null;
          const body = renderRailSideBody(sec);
          if (!body) return null;
          const adj = sectionAdjustments?.[sec.id];
          const headingVisible = showSectionHeading(sec, visibleBlockIds);
          return (
            <div key={sec.id} className="resume-section-block" data-type={sec.type} data-section-id={sec.id} style={adj ? { marginTop: adj } : undefined}>
              {headingVisible && <RailHead>{sec.title}</RailHead>}
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_COMPONENTS = {
  'modern':         TemplateModern,
  'atlantic-blue':  TemplateAtlanticBlue,
  'corporate':      TemplateCorporate,
  'atlantic-crest': TemplateAtlanticCrest,
  'mercury-flow':   TemplateMercuryFlow,
  'steady-form':    TemplateSteadyForm,
  'executive':      TemplateExecutive,
  'azure-wave':     TemplateAzureWave,
  'noir-flash':     TemplateNoirFlash,
  'verdant-crest':  TemplateVerdantCrest,
  'confetti':       TemplateConfetti,
  'spotlight':      TemplateSpotlight,
  'index':          TemplateIndex,
  'panels':         TemplatePanels,
  'vertex':         TemplateVertex,
};

// ── ResumePreview default export ──────────────────────────────────────────────

/**
 * Build sequential page-card boundaries from the adjusted total content height.
 * Returns an array of Y positions (in content px) where each page starts.
 * Index 0 is always 0 (first page starts at the top).
 */
function buildPageStarts(totalHeight, config) {
  const pageH   = config.page.height;
  const effH    = effectiveContentHeight(config);
  const starts  = [0];
  let y = pageH; // page 1 full height; subsequent pages use effectiveContentHeight
  while (y < totalHeight) { starts.push(y); y += effH; }
  return starts;
}

export default function ResumePreview({ resume, designSettings = {}, scale = null, className = '', printMode = false }) {
  const containerRef = useRef(null);
  const contentRef   = useRef(null);
  const fontsReady   = useRef(false);
  const rafHandle    = useRef(null);

  const [computedScale,      setComputedScale]      = useState(scale || 0.6);
  const [contentHeight,      setContentHeight]      = useState(0);
  // sectionAdjustments: print-mode margin pushes (adj map from pagination engine)
  const [sectionAdjustments, setSectionAdjustments] = useState({});
  // pageSlices: discrete per-page block ID arrays for preview mode.
  // null = pre-first-measurement (show all content on a single card).
  const [pageSlices,         setPageSlices]         = useState(null);

  const ds = { ...DEFAULT_DESIGN, ...(designSettings || {}) };
  const ss = { ...DEFAULT_SPACING, ...(resume?.spacing_settings || {}) };

  // Build the canonical layout config from current design/spacing settings.
  const config = buildLayoutConfig(ss, ds);
  const page   = config.page;

  // ── Scale (viewport → fixed-width) ──────────────────────────────────────────

  const updateScale = useCallback(() => {
    if (scale !== null || !containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 16;
    setComputedScale(Math.min(containerW / page.width, 1));
  }, [scale, page.width]);

  // ── Content height measurement ───────────────────────────────────────────────
  // Only fires when the content itself changes (not on window resize).
  // Guarded by fontsReady so we never measure with fallback font glyphs.

  const measureContent = useCallback(() => {
    if (!contentRef.current || !fontsReady.current) return;
    // scrollHeight returns the true unscaled layout height regardless of any
    // CSS transform applied to ancestors.  getBoundingClientRect().height
    // returns the visual (scaled) height which underestimates the content
    // height when the preview panel is narrow and s < 1.
    const h = contentRef.current.scrollHeight;
    setContentHeight(Math.round(h));
  }, []);

  // ── Core pagination runner ────────────────────────────────────────────────────
  // Always reads from contentRef (stable ref — never a stale closure capture).
  // Uses double-rAF so measurement runs after browser layout/paint is complete,
  // ensuring getBoundingClientRect returns post-edit heights not pre-edit ones.

  const runPagination = useCallback(() => {
    cancelAnimationFrame(rafHandle.current);
    rafHandle.current = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const contentEl = contentRef.current;
        if (!contentEl || !fontsReady.current) return;
        // Fresh adj object — never reuse previous run (Fix 3)
        const { adj: newAdj, pageSlices: newSlices } = computeFlowAdjustments(contentEl, config);
        // Always replace entirely — never merge (Fix 3)
        setSectionAdjustments(prev =>
          JSON.stringify(newAdj) === JSON.stringify(prev) ? prev : newAdj,
        );
        setPageSlices(prev =>
          JSON.stringify(newSlices) === JSON.stringify(prev) ? prev : newSlices,
        );
      });
    });
  // config is rebuilt every render from ss/ds; only stable page dimensions as deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, page.height, page.marginTop, page.marginBottom]);

  // Debounced version for keystroke-level triggers (text edits that produce
  // rapid onChange events). Uses a plain closure timer rather than lodash so
  // there is no external dependency.
  const debouncedPaginate = useMemo(() => {
    let timer = null;
    function debounced() {
      clearTimeout(timer);
      timer = setTimeout(() => runPagination(), config.debounceMs);
    }
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runPagination, config.debounceMs]);

  // Cancel pending timers/rAFs on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      debouncedPaginate.cancel();
      cancelAnimationFrame(rafHandle.current);
    };
  }, [debouncedPaginate]);

  // Wait for all fonts to be ready before first measurement (§17).
  // Re-run pagination after fonts load since glyph sizes change layout heights.
  useEffect(() => {
    document.fonts.ready.then(() => {
      fontsReady.current = true;
      measureContent();
      runPagination();
    });
  }, [measureContent, runPagination]);

  // ── ResizeObservers — §19.3: scale and content changes are handled separately.
  //
  //   containerRef observer → scale only (window/panel resize).
  //   contentRef   observer → measurement only (content edit changes height).
  //
  // This prevents window resize from triggering re-pagination, which is the
  // root cause of the resize-driven reflow bug described in §19.
  useEffect(() => {
    updateScale();
    measureContent();

    const scaleObs   = new ResizeObserver(() => updateScale());
    const measureObs = new ResizeObserver(() => measureContent());

    if (containerRef.current) scaleObs.observe(containerRef.current);
    if (contentRef.current)   measureObs.observe(contentRef.current);

    return () => { scaleObs.disconnect(); measureObs.disconnect(); };
  }, [updateScale, measureContent]);

  // Re-run pagination whenever the measured content height changes.
  // Covers structural edits: add/remove bullet, new entry, section reorder,
  // template/font-size switch — anything that changes total scrollHeight.
  useEffect(() => {
    if (!contentHeight) return;
    runPagination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentHeight, page.id, page.height, page.marginTop, page.marginBottom]);

  // Re-run pagination whenever section content changes text that may NOT change
  // total scrollHeight (e.g. rewording a bullet to the same line count, changing
  // a job title). Serialise only sections to avoid expensive full-resume stringify.
  const sectionsKey = useMemo(
    () => JSON.stringify(resume?.sections),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resume?.sections],
  );

  useEffect(() => {
    if (!contentHeight) return;
    debouncedPaginate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey]);

  const s = scale !== null ? scale : computedScale;

  const templateId   = resume?.template_id || ds.template || 'modern';
  const TemplateComp = TEMPLATE_COMPONENTS[templateId] || TemplateModern;

  const pi       = resume?.personal_info || {};
  const fs       = resume?.footer_settings;
  const hasFooter = fs && (fs.pageNumbers || (fs.email && pi.email) || (fs.name && pi.name));

  // ── Print mode — no scaling chrome, adjustments applied ─────────────────────

  if (printMode) {
    return (
      <div style={{ width: page.width, background: '#fff', position: 'relative' }}>
        <style>{`
          @media print {
            .resume-entry-block { page-break-inside: avoid; }
          }
        `}</style>
        {/* Hidden measurement div — absolute so it doesn't shift page flow */}
        <div style={{ position: 'absolute', top: -9999, left: -9999, width: page.width, height: 'auto', maxHeight: 'none', overflow: 'visible', visibility: 'hidden', pointerEvents: 'none', transform: 'none', zoom: 'normal', contain: 'none' }}>
          <div ref={contentRef} style={{ position: 'relative', transform: 'none', height: 'auto', overflow: 'visible' }}>
            <TemplateComp resume={resume || {}} ds={ds} ss={ss} />
          </div>
        </div>
        {/* Visible render with pagination adjustments applied */}
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

  // ── Preview mode — flow-based page cards ─────────────────────────────────────
  //
  // Each card renders only its assigned blocks via visibleBlockIds (flow approach).
  // No windowed offsets — no marginTop pushes — no overlap zone bugs.
  // showHeader=false hides the name/contact header on continuation pages.
  //
  // numPages: uses pageSlices.length once the engine runs; falls back to a
  // height-based estimate during the pre-measurement window.

  const numPages = pageSlices
    ? pageSlices.length
    : (contentHeight ? Math.ceil(contentHeight / page.height) : 1);

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`} style={{ background: '#CBD5E1', position: 'relative' }}>
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Hidden measurement container — renders all content at fixed width.
            transform:none + zoom:normal prevent scale inheritance from corrupting
            getBoundingClientRect values used by computeFlowAdjustments. */}
        <div style={{ position: 'absolute', top: -9999, left: -9999, width: page.width, height: 'auto', maxHeight: 'none', overflow: 'visible', visibility: 'hidden', pointerEvents: 'none', transform: 'none', zoom: 'normal', contain: 'none' }}>
          <div ref={contentRef} style={{ position: 'relative', transform: 'none', height: 'auto', overflow: 'visible' }}>
            <TemplateComp resume={resume || {}} ds={ds} ss={ss} />
          </div>
        </div>

        {/* One card per page — flow-based rendering.
            Each card renders only its assigned blocks via visibleBlockIds.
            No windowed offset — each page is a fresh template render with
            overflow:hidden providing the clip. showHeader hides the name/
            contact header on continuation pages. */}
        {Array.from({ length: numPages }, (_, i) => (
          <div key={i} style={{
            width:      page.width * s,
            height:     page.height * s,
            overflow:   'hidden',
            position:   'relative',
            flexShrink: 0,
            background: '#fff',
            boxShadow:  '0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              position:        'absolute',
              top:             0,
              left:            0,
              width:           page.width,
              height:          page.height,
              transform:       `scale(${s})`,
              transformOrigin: 'top left',
            }}>
              <TemplateComp
                resume={resume || {}} ds={ds} ss={ss}
                sectionAdjustments={{}}
                visibleBlockIds={pageSlices ? pageSlices[i] : null}
                showHeader={i === 0}
              />
              {hasFooter && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid #e0e0e0', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8pt', color: '#888', background: '#fff' }}>
                  <span>{[fs.name && pi.name, fs.email && pi.email].filter(Boolean).join(' · ')}</span>
                  {fs.pageNumbers && <span>Page {i + 1} of {numPages}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
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
  'spotlight':      '#185FA5',
  'index':          '#185FA5',
  'panels':         '#185FA5',
  'vertex':         '#185FA5',
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
        {styleTag && <p className="text-[10px] text-ds-textMuted">{styleTag}</p>}
      </div>
    </div>
  );
}
