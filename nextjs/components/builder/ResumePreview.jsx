'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { FONTS, SPACING_OPTIONS, MARGIN_OPTIONS, PAGE_SIZES, TEMPLATES } from './templates.js';

// ── Design defaults ────────────────────────────────────────────────────────────

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
};

const DEFAULT_SPACING = {
  fontSize: 11, lineHeight: 1.15,
  leftRightMargin: 15, topBottomMargin: 15, entrySpacing: 2,
};

// ── Font map ───────────────────────────────────────────────────────────────────

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

// ── Header icon variants (7 styles from prototype) ─────────────────────────────

function HdrIcon({ kind, style, color, size = 11 }) {
  const paths = {
    mail:  <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></>,
    pin:   <><path d="M12 22s8-7.6 8-13a8 8 0 0 0-16 0c0 5.4 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></>,
    link:  <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></>,
  };
  const iconColor = style === 4 || style === 5 ? '#fff' : color;
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

// ── Map our DB sections to structured data ─────────────────────────────────────

function buildRenderData(resume) {
  const pi = resume?.personal_info || {};
  const sections = (resume?.sections || []).filter(s => s.enabled !== false);

  const findSec = (type) => sections.find(s => s.type === type);
  const filterSec = (type) => sections.filter(s => s.type === type);

  return {
    pi,
    sections,
    summary: findSec('summary'),
    experiences: filterSec('work_experience'),
    educations: filterSec('education'),
    skillsSec: findSec('skills'),
    langSec: findSec('languages'),
    certSec: findSec('certifications'),
    projectsSec: findSec('projects'),
    hobbiesSec: findSec('hobbies'),
    refSec: findSec('references'),
    customSecs: sections.filter(s => s.type === 'custom'),
    sectionOrder: sections.map(s => s.id),
  };
}

// ── Single flexible resume template ───────────────────────────────────────────

function FlexibleResume({ resume, designSettings, spacingSettings }) {
  const ds = { ...DEFAULT_DESIGN, ...(designSettings || {}) };
  const ss = { ...DEFAULT_SPACING, ...(spacingSettings || {}) };

  // Resolve values
  const accent = ds.accentColor || '#185FA5';
  const t = ds.accentTargets || {};
  const colIf = (on) => on ? accent : undefined;

  const fontId = ds.font || 'source-sans';
  const fontFamily = FONT_FAMILIES[fontId] || FONT_FAMILIES['source-sans'];

  const fontSize = Math.max(8, Math.min(14, ss.fontSize || 11));
  const lineHeight = Math.max(1, Math.min(1.8, ss.lineHeight || 1.15));
  const padX = ss.leftRightMargin || ss.marginLeft || 15;
  const padY = ss.topBottomMargin || ss.marginTop || 15;
  const entryGapPx = (ss.entrySpacing || 2) * fontSize * lineHeight;

  const { pi, sections } = buildRenderData(resume);

  const pageStyle = {
    fontFamily,
    fontSize: `${fontSize}pt`,
    lineHeight,
    paddingLeft: `${padX}mm`,
    paddingRight: `${padX}mm`,
    paddingTop: `${padY}mm`,
    paddingBottom: `${padY}mm`,
    color: '#2C2C2A',
    background: '#fff',
    minHeight: '100%',
  };

  // ── Section heading ──────────────────────────────────────────────────────────
  const Heading = ({ children }) => (
    <div style={{ marginTop: '1.4em', marginBottom: '0.4em' }}>
      <div style={{
        fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
        color: colIf(t.headings) || '#2C2C2A',
      }}>
        {children}
      </div>
      <div style={{ height: 1.5, background: colIf(t.headingsLine) || '#D1DCE8', marginTop: 4 }} />
    </div>
  );

  // ── Contact detail item ──────────────────────────────────────────────────────
  const detailItem = (kind, text) => {
    if (!text) return null;
    const sep = ds.detailsSeparator || 'icon';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        {sep === 'icon' && (
          <HdrIcon
            kind={kind}
            style={ds.headerIconStyle || 1}
            color={colIf(t.headerIcons) || '#6B7280'}
            size={fontSize - 2}
          />
        )}
        <span>{text}</span>
      </span>
    );
  };

  const details = [
    { kind: 'mail', val: pi.email },
    { kind: 'phone', val: pi.phone },
    { kind: 'pin', val: pi.location },
    { kind: 'link', val: pi.link },
  ].filter(d => d.val);

  // ── Details block (arrangement 1/2/3) ────────────────────────────────────────
  const detailsBlock = (() => {
    if (!details.length) return null;
    const arr = ds.detailsArrangement || 2;
    const sep = ds.detailsSeparator || 'icon';
    const align = ds.headerAlignment === 'center' ? 'center' : 'flex-start';

    if (arr === 3) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 7, fontSize: '0.92em', color: '#6B7280', alignItems: align === 'center' ? 'center' : 'flex-start' }}>
          {details.map(d => <div key={d.kind}>{detailItem(d.kind, d.val)}</div>)}
        </div>
      );
    }
    if (arr === 2) {
      return (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 7,
          fontSize: '0.92em', color: '#6B7280',
          maxWidth: ds.headerAlignment === 'center' ? '70%' : '85%',
          marginLeft: ds.headerAlignment === 'center' ? 'auto' : 0,
          marginRight: ds.headerAlignment === 'center' ? 'auto' : 0,
        }}>
          {details.map(d => <div key={d.kind}>{detailItem(d.kind, d.val)}</div>)}
        </div>
      );
    }
    // arr === 1: single inline row with separators
    const sepEl = sep === 'bullet' ? <span style={{ color: '#9CA3AF', margin: '0 5px' }}>·</span>
      : sep === 'bar' ? <span style={{ color: '#9CA3AF', margin: '0 7px' }}>|</span>
      : <span style={{ width: 8 }} />;
    return (
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 0, marginTop: 7, fontSize: '0.92em', color: '#6B7280', justifyContent: align }}>
        {details.map((d, i) => (
          <span key={d.kind} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {i > 0 && sepEl}
            {detailItem(d.kind, d.val)}
          </span>
        ))}
      </div>
    );
  })();

  // ── Skills rendering ─────────────────────────────────────────────────────────
  const renderSkills = (sec) => {
    if (!sec) return null;
    const entries = sec.content?.entries || [];
    if (!entries.length) return null;
    const ds_sec = sec.display_settings || {};
    const layout = ds_sec.layout || ds_sec.skillsStyle || 'rows';
    const dotColor = colIf(t.dotsBarsBubbles) || accent;

    if (layout === 'grid') {
      const cols = ds_sec.columns || 2;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: 24, rowGap: 3 }}>
          {entries.map((s, i) => <div key={i}>{s.name}</div>)}
        </div>
      );
    }
    if (layout === 'compact') {
      return <div>{entries.map(s => s.name).filter(Boolean).join(' · ')}</div>;
    }
    if (layout === 'bubble') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {entries.map((s, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: 999,
              background: colIf(t.dotsBarsBubbles) ? accent + '1A' : '#F3F4F6',
              color: colIf(t.dotsBarsBubbles) || '#2C2C2A', fontSize: '0.9em',
            }}>{s.name}</span>
          ))}
        </div>
      );
    }
    if (layout === 'level') {
      const lvlStyle = ds_sec.levelStyle || 'dots';
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 5 }}>
          {entries.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{s.name}</span>
              {lvlStyle === 'dots' && (
                <span style={{ display: 'inline-flex', gap: 3 }}>
                  {[1, 2, 3].map(lv => (
                    <span key={lv} style={{ width: 6, height: 6, borderRadius: '50%', background: lv <= (s.level || 2) ? dotColor : '#E5E7EB' }} />
                  ))}
                </span>
              )}
              {lvlStyle === 'bar' && (
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  {[1, 2, 3].map(lv => (
                    <span key={lv} style={{ width: 12, height: 4, borderRadius: 1, background: lv <= (s.level || 2) ? dotColor : '#E5E7EB' }} />
                  ))}
                </span>
              )}
              {lvlStyle === 'text' && (
                <span style={{ color: '#6B7280', fontSize: '0.85em' }}>
                  {['', 'Beginner', 'Intermediate', 'Advanced'][s.level] || ''}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }
    // rows (default)
    const rowGap = ds_sec.rowSpacing === 'compact' ? 2 : 6;
    const subStyle = ds_sec.subinfoStyle || 'dash';
    // Group by name for now — single flat list shown with bullet prefix option
    return (
      <div style={{ display: 'grid', rowGap }}>
        {entries.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 5 }}>
            {ds_sec.startWithBullets && <span style={{ color: dotColor }}>•</span>}
            <span>{s.name}</span>
            {s.level && (
              <span style={{ color: '#6B7280', fontSize: '0.9em' }}>
                {subStyle === 'dash' ? `— ${['', 'Beginner', 'Intermediate', 'Advanced'][s.level] || ''}` :
                 subStyle === 'bracket' ? `(${['', 'Beginner', 'Intermediate', 'Advanced'][s.level] || ''})` :
                 `: ${['', 'Beginner', 'Intermediate', 'Advanced'][s.level] || ''}`}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── Experience rendering ─────────────────────────────────────────────────────
  const renderExperience = (secs) => {
    const allEntries = secs.flatMap(sec => {
      const order = sec.display_settings?.workOrder || 'title-first';
      return (sec.content?.entries || []).map(e => ({ ...e, _order: order }));
    });
    if (!allEntries.length) return null;
    return (
      <div>
        {allEntries.map((e, i) => {
          const primary = e._order === 'employer-first' ? e.employer : e.title;
          const secondary = e._order === 'employer-first' ? e.title : e.employer;
          return (
            <div key={i} style={{ marginBottom: i < allEntries.length - 1 ? entryGapPx : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontWeight: 700 }}>{primary}</div>
                <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', whiteSpace: 'nowrap' }}>{e.dates}</div>
              </div>
              {secondary && (
                <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280', marginTop: 1 }}>
                  {[secondary, e.location].filter(Boolean).join(' · ')}
                </div>
              )}
              {e.bullets?.filter(b => b?.trim()).length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {e.bullets.filter(b => b?.trim()).map((b, j) => (
                    <li key={j} style={{ marginBottom: 1 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Education rendering ──────────────────────────────────────────────────────
  const renderEducation = (secs) => {
    const allEntries = secs.flatMap(sec => {
      const order = sec.display_settings?.eduOrder || 'school-first';
      return (sec.content?.entries || []).map(e => ({ ...e, _order: order }));
    });
    if (!allEntries.length) return null;
    return (
      <div>
        {allEntries.map((e, i) => {
          const primary = e._order === 'degree-first' ? e.degree : e.school;
          const secondary = e._order === 'degree-first' ? e.school : e.degree;
          return (
            <div key={i} style={{ marginBottom: i < allEntries.length - 1 ? entryGapPx : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontWeight: 700 }}>{primary}</div>
                <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{e.dates}</div>
              </div>
              {secondary && (
                <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280', marginTop: 1 }}>
                  {[secondary, e.location].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Languages ────────────────────────────────────────────────────────────────
  const renderLanguages = (sec) => {
    const entries = sec?.content?.entries || [];
    if (!entries.length) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px' }}>
        {entries.map((l, i) => (
          <span key={i}>{l.name}{l.level ? ` — ${l.level}` : ''}</span>
        ))}
      </div>
    );
  };

  // ── Certifications ───────────────────────────────────────────────────────────
  const renderCerts = (sec) => {
    const entries = sec?.content?.entries || [];
    if (!entries.length) return null;
    return (
      <div>
        {entries.map((c, i) => (
          <div key={i} style={{ marginBottom: i < entries.length - 1 ? entryGapPx : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              {c.date && <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{c.date}</div>}
            </div>
            {c.issuer && <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{c.issuer}</div>}
          </div>
        ))}
      </div>
    );
  };

  // ── Projects ─────────────────────────────────────────────────────────────────
  const renderProjects = (sec) => {
    const entries = sec?.content?.entries || [];
    if (!entries.length) return null;
    return (
      <div>
        {entries.map((p, i) => (
          <div key={i} style={{ marginBottom: i < entries.length - 1 ? entryGapPx : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              {p.dates && <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{p.dates}</div>}
            </div>
            {p.role && <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{p.role}</div>}
            {p.description && <div style={{ marginTop: 3, fontSize: '0.95em' }}>{p.description}</div>}
          </div>
        ))}
      </div>
    );
  };

  // ── Render a section by type ─────────────────────────────────────────────────
  const renderSection = (sec) => {
    const { skillsSec, langSec, certSec, projectsSec, hobbiesSec, refSec, experiences, educations } = buildRenderData(resume);

    if (sec.type === 'summary') {
      const text = sec.content?.text;
      if (!text?.trim()) return null;
      return (
        <div key={sec.id}>
          <Heading>{sec.title}</Heading>
          <div style={{ fontSize: '0.95em', lineHeight }}>{text}</div>
        </div>
      );
    }
    if (sec.type === 'work_experience') {
      const block = renderExperience([sec]);
      if (!block) return null;
      return <div key={sec.id}><Heading>{sec.title}</Heading>{block}</div>;
    }
    if (sec.type === 'education') {
      const block = renderEducation([sec]);
      if (!block) return null;
      return <div key={sec.id}><Heading>{sec.title}</Heading>{block}</div>;
    }
    if (sec.type === 'skills') {
      const block = renderSkills(sec);
      if (!block) return null;
      return <div key={sec.id}><Heading>{sec.title}</Heading>{block}</div>;
    }
    if (sec.type === 'languages') {
      const block = renderLanguages(sec);
      if (!block) return null;
      return <div key={sec.id}><Heading>{sec.title}</Heading>{block}</div>;
    }
    if (sec.type === 'certifications') {
      const block = renderCerts(sec);
      if (!block) return null;
      return <div key={sec.id}><Heading>{sec.title}</Heading>{block}</div>;
    }
    if (sec.type === 'projects') {
      const block = renderProjects(sec);
      if (!block) return null;
      return <div key={sec.id}><Heading>{sec.title}</Heading>{block}</div>;
    }
    if (sec.type === 'hobbies' || sec.type === 'references') {
      const text = sec.content?.text;
      if (!text?.trim()) return null;
      return (
        <div key={sec.id}>
          <Heading>{sec.title}</Heading>
          <div style={{ fontSize: '0.95em' }}>{text}</div>
        </div>
      );
    }
    // Custom / unknown
    if (sec.content?.text) {
      return (
        <div key={sec.id}>
          <Heading>{sec.title}</Heading>
          <div style={{ fontSize: '0.95em', whiteSpace: 'pre-wrap' }}>{sec.content.text}</div>
        </div>
      );
    }
    if (Array.isArray(sec.content?.entries) && sec.content.entries.length) {
      return (
        <div key={sec.id}>
          <Heading>{sec.title}</Heading>
          <div>
            {sec.content.entries.map((e, i) => (
              <div key={i} style={{ marginBottom: 3 }}>
                {Object.values(e).filter(v => typeof v === 'string' && v).join(' · ')}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <div style={{ textAlign: ds.headerAlignment || 'left' }}>
        <div style={{
          fontSize: '2.2em', fontWeight: 700, letterSpacing: '-0.02em',
          color: colIf(t.name) || '#2C2C2A', lineHeight: 1,
        }}>
          {pi.name || 'Your Name'}
        </div>
        {pi.title && (
          <div style={{ fontSize: '1.05em', fontWeight: 500, color: colIf(t.jobTitle) || accent, marginTop: 4 }}>
            {pi.title}
          </div>
        )}
        {detailsBlock}
      </div>

      {/* ── Sections in order ── */}
      {sections.map(sec => renderSection(sec))}
    </div>
  );
}

// ── ResumePreview component ────────────────────────────────────────────────────

export default function ResumePreview({ resume, designSettings = {}, scale = null, className = '' }) {
  const containerRef = useRef(null);
  const [computedScale, setComputedScale] = useState(scale || 0.6);

  const pageId = (designSettings?.pageSize) || 'a4';
  const page = pageId === 'letter'
    ? { width: 816, height: 1056 }
    : { width: 794, height: 1123 };

  const updateScale = useCallback(() => {
    if (scale !== null || !containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 16;
    setComputedScale(Math.min(containerW / page.width, 1));
  }, [scale, page.width]);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  const s = scale !== null ? scale : computedScale;
  const spacingSettings = resume?.spacing_settings || {};

  // Footer
  const fs = resume?.footer_settings;
  const pi = resume?.personal_info || {};
  const hasFooter = fs && (fs.pageNumbers || (fs.email && pi.email) || (fs.name && pi.name));

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`} style={{ background: '#e5e7eb' }}>
      <div style={{ padding: 8 }}>
        <div
          style={{
            width: page.width,
            minHeight: page.height,
            transformOrigin: 'top left',
            transform: `scale(${s})`,
            boxShadow: '0 1px 8px rgba(0,0,0,0.18)',
            background: '#fff',
            marginBottom: `${(s - 1) * page.height}px`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1 }}>
            <FlexibleResume
              resume={resume || {}}
              designSettings={designSettings}
              spacingSettings={spacingSettings}
            />
          </div>
          {hasFooter && (
            <div style={{
              borderTop: '1px solid #e0e0e0', padding: '6px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '8pt', color: '#888', background: '#fff',
            }}>
              <span>{[fs.name && pi.name, fs.email && pi.email].filter(Boolean).join(' · ')}</span>
              {fs.pageNumbers && <span>Page 1</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TemplateThumbnail for gallery ─────────────────────────────────────────────

export function TemplateThumbnail({ templateId, active = false, label, style: styleTag, plan }) {
  const sampleResume = {
    personal_info: { name: 'Alex Johnson', title: 'Senior Engineer', email: 'alex@example.com', phone: '+1 (555) 000-0000', location: 'New York, NY' },
    sections: [
      { id: 's1', type: 'summary', title: 'Summary', enabled: true, content: { text: 'Experienced professional with a passion for excellence.' } },
      { id: 's2', type: 'work_experience', title: 'Work Experience', enabled: true, content: { entries: [{ title: 'Senior Engineer', employer: 'Tech Corp', dates: '2022 – Present', location: 'New York', bullets: ['Led core platform development', 'Improved performance by 40%'] }] } },
      { id: 's3', type: 'education', title: 'Education', enabled: true, content: { entries: [{ school: 'State University', degree: 'B.S. Computer Science', dates: '2015 – 2019' }] } },
      { id: 's4', type: 'skills', title: 'Skills', enabled: true, content: { entries: [{ name: 'JavaScript', level: 3 }, { name: 'React', level: 3 }, { name: 'Node.js', level: 2 }] } },
    ],
  };

  // Give each template a distinct accent so thumbnails look different
  const accentMap = {
    'corporate':     '#1a1a1a',
    'silver-banner': '#2d4a6e',
    'teal-sidebar':  '#1F6B6F',
    'timeline':      '#2A8DC1',
    'photo-sidebar': '#1F8A8E',
  };
  const accent = accentMap[templateId] || '#185FA5';

  return (
    <div className={`relative rounded overflow-hidden border-2 transition-all cursor-pointer ${active ? 'border-primary shadow-md' : 'border-ds-border hover:border-primary/50'}`}>
      {active && (
        <div className="absolute top-1.5 left-1.5 z-10 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
          Active
        </div>
      )}
      <div style={{ height: 140, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ width: 794, transformOrigin: 'top left', transform: 'scale(0.168)' }}>
          <FlexibleResume
            resume={sampleResume}
            designSettings={{ accentColor: accent, accentTargets: { name: true, headings: true, headingsLine: true, jobTitle: true }, detailsArrangement: 2 }}
            spacingSettings={{}}
          />
        </div>
      </div>
      <div className="bg-ds-card px-2 py-1.5 border-t border-ds-border">
        <p className="text-xs font-medium text-ds-text truncate">{label}</p>
        <p className="text-[10px] text-ds-textMuted">{styleTag}</p>
      </div>
    </div>
  );
}
