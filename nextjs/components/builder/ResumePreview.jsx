'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { resolveDesign, PAGE_SIZES } from './templates.js';

// ── Shared rendering helpers ──────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '';
  if (d.toLowerCase() === 'present') return 'Present';
  return d;
}

function dateRange(start, end, current) {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

// ── Template: Classic Professional ───────────────────────────────────────────

// ── Layout helpers ────────────────────────────────────────────────────────────

const TITLE_SIZE_MAP = { small: '9pt', medium: '11pt', large: '13pt' };

function renderSectionsWithLayout(sections, layoutSettings, renderSection) {
  const ls = layoutSettings || {};
  const pageBreaks = ls.pageBreaks || [];
  const colLayout = ls.columnLayout || 'one';
  const sectionCols = ls.sectionColumns || {};

  if (colLayout === 'two') {
    const leftSecs = sections.filter(s => (sectionCols[s.id] || 'left') === 'left');
    const rightSecs = sections.filter(s => sectionCols[s.id] === 'right');
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>{leftSecs.map(sec => renderSection(sec))}</div>
        <div>{rightSecs.map(sec => renderSection(sec))}</div>
      </div>
    );
  }

  if (colLayout === 'mix') {
    const rows = [];
    let halfBuf = [];
    sections.forEach((sec) => {
      const isHalf = sectionCols[sec.id] === 'half';
      if (isHalf) {
        halfBuf.push(sec);
        if (halfBuf.length === 2) {
          rows.push({ type: 'two', secs: halfBuf });
          halfBuf = [];
        }
      } else {
        if (halfBuf.length) { rows.push({ type: 'two', secs: halfBuf }); halfBuf = []; }
        rows.push({ type: 'one', secs: [sec] });
      }
    });
    if (halfBuf.length) rows.push({ type: 'two', secs: halfBuf });
    return (
      <>
        {rows.map((row, i) => {
          const afterThis = pageBreaks.includes(sections.indexOf(row.secs[row.secs.length - 1]));
          return (
            <div key={i}>
              {row.type === 'two' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {row.secs.map(sec => renderSection(sec))}
                </div>
              ) : renderSection(row.secs[0])}
              {afterThis && <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0', paddingTop: 2 }}>
                <span style={{ fontSize: '7pt', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Page break</span>
              </div>}
            </div>
          );
        })}
      </>
    );
  }

  // One column — respect page breaks
  return (
    <>
      {sections.map((sec, idx) => (
        <div key={sec.id}>
          {renderSection(sec)}
          {pageBreaks.includes(idx) && (
            <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '7pt', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Page break</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function ClassicProfessional({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const ls = resume.layout_settings || {};

  const base = {
    fontFamily: font.family,
    color: theme.text,
    fontSize: '10pt',
    lineHeight: lh,
  };

  return (
    <div style={{ ...base, padding: `${m}px`, background: '#fff', minHeight: '100%' }}>
      {/* Header */}
      {(() => {
        const ds = resume.design_settings || {};
        const headerAlign = ds.headerAlignment || 'left';
        const separator = ds.detailsSeparator || 'icon';
        const arrangement = ds.detailsArrangement || 1;
        const contactItems = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github, pi.website].filter(Boolean);
        const sepChar = separator === 'bar' ? ' | ' : separator === 'bullet' ? ' • ' : ' · ';
        const nameColor = theme.name || theme.primary;
        const headingLineColor = theme.headingsLine || theme.border || theme.primary;

        let contactBlock;
        if (arrangement === 2 || arrangement === '2') {
          const half = Math.ceil(contactItems.length / 2);
          const row1 = contactItems.slice(0, half);
          const row2 = contactItems.slice(half);
          contactBlock = (
            <div style={{ marginTop: 4, fontSize: '9pt', color: theme.subtext }}>
              <div>{row1.join(sepChar)}</div>
              {row2.length > 0 && <div>{row2.join(sepChar)}</div>}
            </div>
          );
        } else if (arrangement === 3 || arrangement === '3') {
          contactBlock = (
            <div style={{ marginTop: 4, fontSize: '9pt', color: theme.subtext }}>
              {contactItems.map((c, i) => <div key={i}>{c}</div>)}
            </div>
          );
        } else {
          contactBlock = (
            <div style={{ marginTop: 4, fontSize: '9pt', color: theme.subtext }}>
              {contactItems.join(sepChar)}
            </div>
          );
        }

        return (
          <div style={{ borderBottom: `2px solid ${headingLineColor}`, paddingBottom: sg / 2, marginBottom: sg, textAlign: headerAlign }}>
            <div style={{ fontSize: '22pt', fontWeight: 700, color: nameColor, letterSpacing: '-0.3px' }}>
              {pi.name || 'Your Name'}
            </div>
            {contactItems.length > 0 && contactBlock}
            {pi.summary && (
              <p style={{ marginTop: 8, fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>
                {pi.summary}
              </p>
            )}
          </div>
        );
      })()}

      {renderSectionsWithLayout(sections, ls, sec => (
        <SectionBlock key={sec.id} sec={sec} theme={theme} sg={sg} ig={ig} lh={lh} style="classic" layoutSettings={ls} />
      ))}
    </div>
  );
}

// ── Template: Modern Slate (2-column) ─────────────────────────────────────────

function ModernSlate({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const sidebarTypes = ['skills', 'languages', 'certifications'];
  const mainSecs = sections.filter(s => !sidebarTypes.includes(s.type));
  const sideSecs = sections.filter(s => sidebarTypes.includes(s.type));

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', display: 'flex', minHeight: '100%' }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: theme.primary, color: '#fff', padding: `${m}px ${m * 0.7}px`, flexShrink: 0 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18pt', fontWeight: 700, marginBottom: 12 }}>
          {(pi.name || 'Y').charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: '13pt', fontWeight: 700, marginBottom: 4 }}>{pi.name || 'Your Name'}</div>
        <div style={{ fontSize: '8.5pt', opacity: 0.85, marginBottom: sg }}>
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean).map((c, i) => (
            <div key={i} style={{ marginBottom: 3 }}>{c}</div>
          ))}
        </div>
        {sideSecs.map(sec => (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, opacity: 0.7, marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 3 }}>
              {sec.title}
            </div>
            <SidebarSection sec={sec} lh={lh} ig={ig} />
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: `${m}px ${m * 0.8}px` }}>
        {pi.summary && (
          <div style={{ marginBottom: sg, paddingBottom: sg / 2, borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.primary, fontWeight: 700, marginBottom: 6 }}>Profile</div>
            <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>{pi.summary}</p>
          </div>
        )}
        {mainSecs.map(sec => (
          <SectionBlock key={sec.id} sec={sec} theme={theme} sg={sg} ig={ig} lh={lh} style="modern" />
        ))}
      </div>
    </div>
  );
}

// ── Template: Minimal White ───────────────────────────────────────────────────

function MinimalWhite({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', padding: `${m * 1.2}px ${m * 1.4}px`, minHeight: '100%' }}>
      {/* Minimal header */}
      <div style={{ marginBottom: sg * 1.2 }}>
        <div style={{ fontSize: '24pt', fontWeight: 300, letterSpacing: '-0.5px', color: '#111' }}>{pi.name || 'Your Name'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: 6, fontSize: '9pt', color: '#888' }}>
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github, pi.website].filter(Boolean).map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </div>
      {pi.summary && (
        <div style={{ marginBottom: sg, color: theme.subtext, fontSize: '9.5pt', lineHeight: lh, borderLeft: `3px solid ${theme.accent}`, paddingLeft: 12 }}>
          {pi.summary}
        </div>
      )}
      {sections.map(sec => (
        <SectionBlock key={sec.id} sec={sec} theme={theme} sg={sg} ig={ig} lh={lh} style="minimal" />
      ))}
    </div>
  );
}

// ── Template: ATS Clean ───────────────────────────────────────────────────────

function ATSClean({ resume, design }) {
  const { font, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);

  return (
    <div style={{ fontFamily: font.family, color: '#000', fontSize: '11pt', lineHeight: lh, background: '#fff', padding: `${m}px`, minHeight: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: sg }}>
        <div style={{ fontSize: '16pt', fontWeight: 700 }}>{pi.name || 'Your Name'}</div>
        <div style={{ fontSize: '9pt', marginTop: 4, color: '#333' }}>
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean).join(' | ')}
        </div>
      </div>
      {pi.summary && (
        <div style={{ marginBottom: sg }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: 6 }}>Summary</div>
          <p style={{ fontSize: '10pt', lineHeight: lh }}>{pi.summary}</p>
        </div>
      )}
      {sections.map(sec => (
        <SectionBlock key={sec.id} sec={sec} theme={{ primary: '#000', text: '#000', subtext: '#333', border: '#999', accent: '#000' }} sg={sg} ig={ig} lh={lh} style="ats" />
      ))}
    </div>
  );
}

// ── Shared section renderer ───────────────────────────────────────────────────

function HeadingIcon({ iconStyle, color }) {
  if (!iconStyle || iconStyle === 'none') return null;
  const filled = iconStyle === 'filled';
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 5 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function SectionBlock({ sec, theme, sg, ig, lh, style, layoutSettings }) {
  const ls = layoutSettings || {};
  const titleFontSize = TITLE_SIZE_MAP[ls.titleSize || 'medium'] || '11pt';
  const iconStyle = ls.headingIcon || 'none';

  const headerStyle = {
    classic: {
      fontSize: titleFontSize, fontWeight: 700, color: theme.headings || theme.primary,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      borderBottom: `1px solid ${theme.headingsLine || theme.border || '#ddd'}`,
      paddingBottom: 3, marginBottom: ig,
      display: 'flex', alignItems: 'center',
    },
    modern: {
      fontSize: TITLE_SIZE_MAP[ls.titleSize || 'small'] || '8pt', fontWeight: 700, color: theme.headings || theme.primary,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: ig, display: 'flex', alignItems: 'center',
    },
    minimal: {
      fontSize: titleFontSize, fontWeight: 600, color: '#111',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: ig, display: 'flex', alignItems: 'center',
    },
    ats: {
      fontSize: titleFontSize, fontWeight: 700, textTransform: 'uppercase',
      borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: ig,
      display: 'flex', alignItems: 'center',
    },
  }[style] || {};

  return (
    <div style={{ marginBottom: sg }}>
      <div style={headerStyle}>
        <HeadingIcon iconStyle={iconStyle} color={headerStyle.color || theme.primary} />
        {sec.title}
      </div>
      <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style={style} listStyle={ls.listStyle} />
    </div>
  );
}

function SkillsContent({ entries, theme, style, displaySettings, skillsStyle, bullet = '•' }) {
  const ds = displaySettings || {};
  const ss = ds.layout || ds.skillsStyle || skillsStyle || 'rows';

  // Group by category
  const grouped = [];
  const catMap = {};
  entries.forEach(e => {
    const cat = (e.category || '').trim();
    if (cat) {
      if (!catMap[cat]) { catMap[cat] = []; grouped.push({ cat, skills: catMap[cat] }); }
      catMap[cat].push(e);
    } else {
      grouped.push({ cat: '', skills: [e] });
    }
  });

  // Format a category group as text
  const formatGroup = (cat, skills, subinfoStyle) => {
    const skillNames = skills.map(e => e.skill).join(', ');
    if (!cat) return skillNames;
    if (subinfoStyle === 'dash') return `${cat} – ${skillNames}`;
    if (subinfoStyle === 'bracket') return `${cat} (${skillNames})`;
    return `${cat}: ${skillNames}`; // default colon
  };

  const subinfoStyle = ds.subinfoStyle || 'colon';

  if (ss === 'grid') {
    const cols = ds.columns || 3;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '4px 12px' }}>
        {grouped.map((g, i) => (
          <span key={i} style={{ fontSize: '9pt', color: theme.text }}>
            {bullet} {formatGroup(g.cat, g.skills, subinfoStyle)}
          </span>
        ))}
      </div>
    );
  }

  if (ss === 'compact') {
    const parts = grouped.map(g => formatGroup(g.cat, g.skills, subinfoStyle));
    return (
      <div style={{ fontSize: '9pt', color: theme.text, lineHeight: 1.4 }}>
        {parts.join(' · ')}
      </div>
    );
  }

  if (ss === 'bubble') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {grouped.map((g, i) => {
          const text = formatGroup(g.cat, g.skills, subinfoStyle);
          return (
            <span key={i} style={{ fontSize: '9pt', background: style === 'ats' ? 'transparent' : `${(theme.dotsBarsBubbles || theme.primary)}18`, color: style === 'ats' ? theme.text : (theme.dotsBarsBubbles || theme.primary), padding: '4px 10px', borderRadius: 6, border: style === 'ats' ? '1px solid #ccc' : `1px solid ${(theme.dotsBarsBubbles || theme.primary)}40`, flexWrap: 'wrap' }}>
              {text}
            </span>
          );
        })}
      </div>
    );
  }

  if (ss === 'level') {
    const levelStyle = ds.levelStyle || 'dots';
    const PROF_MAP = { Expert: 5, Advanced: 4, Intermediate: 3, Beginner: 1 };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {entries.map((e, i) => {
          const lvl = PROF_MAP[e.proficiency] || (parseInt(e.proficiency) || 0);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '9pt' }}>
              <span style={{ flex: 1, color: theme.text }}>{e.skill}</span>
              {e.proficiency && (
                <>
                  {levelStyle === 'text' && (
                    <span style={{ fontSize: '8pt', color: theme.dotsBarsBubbles || theme.primary }}>{e.proficiency}</span>
                  )}
                  {levelStyle === 'dots' && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(dot => (
                        <div key={dot} style={{ width: 8, height: 8, borderRadius: '50%', background: dot <= lvl ? (theme.dotsBarsBubbles || theme.primary) : `${theme.dotsBarsBubbles || theme.primary}30` }} />
                      ))}
                    </div>
                  )}
                  {levelStyle === 'bar' && (
                    <div style={{ width: 60, height: 6, borderRadius: 3, background: `${theme.dotsBarsBubbles || theme.primary}25`, overflow: 'hidden' }}>
                      <div style={{ width: `${(lvl / 5) * 100}%`, height: '100%', background: theme.dotsBarsBubbles || theme.primary, borderRadius: 3 }} />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Default: rows
  const rowGap = ds.rowSpacing === 'spacious' ? 6 : 2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
      {grouped.map((g, i) => {
        const prefix = ds.startWithBullets ? `${bullet} ` : '';
        const text = formatGroup(g.cat, g.skills, subinfoStyle);
        return (
          <span key={i} style={{ fontSize: '9pt', color: theme.text }}>{prefix}{text}</span>
        );
      })}
    </div>
  );
}

function SectionContent({ sec, theme, ig, lh, style, listStyle }) {
  const c = sec.content || {};
  const ds = sec.display_settings || {};
  const bullet = listStyle === 'hyphen' ? '–' : '•';

  if (sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') {
    return <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>{c.text || ''}</p>;
  }

  if (sec.type === 'skills') {
    const entries = c.entries || [];
    return <SkillsContent entries={entries} theme={theme} style={style} displaySettings={ds} skillsStyle={ds.skillsStyle} bullet={bullet} />;
  }

  if (sec.type === 'languages') {
    const entries = c.entries || [];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {entries.map((e, i) => (
          <span key={i} style={{ fontSize: '9.5pt' }}>
            <strong>{e.language}</strong>{e.level ? ` — ${e.level}` : ''}
          </span>
        ))}
      </div>
    );
  }

  if (sec.type === 'certifications') {
    const entries = c.entries || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: ig / 2 }}>
        {entries.map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '9.5pt' }}>{e.name}</span>
              {e.issuer && <span style={{ fontSize: '9pt', color: theme.subtext }}> · {e.issuer}</span>}
            </div>
            {e.date && <span style={{ fontSize: '8.5pt', color: theme.subtext }}>{e.date}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (sec.type === 'work_experience' || sec.type === 'education' || sec.type === 'projects' || sec.type === 'custom') {
    const entries = c.entries || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: ig }}>
        {entries.map((e, i) => <EntryItem key={i} entry={e} type={sec.type} theme={theme} lh={lh} style={style} displaySettings={ds} />)}
      </div>
    );
  }

  return null;
}

function EntryItem({ entry: e, type, theme, lh, style, displaySettings = {} }) {
  if (type === 'work_experience') {
    const employerFirst = displaySettings.workOrder === 'employer-first';
    const primary = employerFirst ? (e.company || '') : (e.title || '');
    const secondary = employerFirst ? (e.title || '') : (e.company || '');
    return (
      <div style={{ borderLeft: style === 'classic' || style === 'modern' ? `2px solid ${theme.accent || theme.primary}30` : 'none', paddingLeft: style === 'classic' || style === 'modern' ? 10 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {primary && <div style={{ fontWeight: 700, fontSize: '10pt' }}>{primary}</div>}
            {secondary && <div style={{ fontSize: '9pt', color: theme.subtext }}>{secondary}{e.location ? ` · ${e.location}` : ''}</div>}
          </div>
          <div style={{ fontSize: '8.5pt', color: theme.subtext, flexShrink: 0, marginLeft: 8 }}>
            {dateRange(e.start_date, e.end_date, e.current)}
          </div>
        </div>
        {e.description && (
          <div style={{ marginTop: 4, fontSize: '9pt', color: theme.subtext, lineHeight: lh, whiteSpace: 'pre-line' }}>
            {e.description}
          </div>
        )}
      </div>
    );
  }

  if (type === 'education') {
    const degreeFirst = displaySettings.eduOrder === 'degree-first';
    const primary = degreeFirst
      ? [e.degree, e.field].filter(Boolean).join(', ')
      : e.institution;
    const secondary = degreeFirst
      ? e.institution
      : [e.degree, e.field].filter(Boolean).join(', ') + (e.grade ? ` · ${e.grade}` : '');
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {primary && <div style={{ fontWeight: 700, fontSize: '10pt' }}>{primary}</div>}
            {secondary && <div style={{ fontSize: '9pt', color: theme.subtext }}>{secondary}</div>}
          </div>
          <div style={{ fontSize: '8.5pt', color: theme.subtext, flexShrink: 0 }}>
            {dateRange(e.start_date, e.end_date, false)}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'projects') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: '10pt' }}>{e.name}</div>
          {e.url && <span style={{ fontSize: '8.5pt', color: theme.primary }}>{e.url}</span>}
        </div>
        {e.technologies && (
          <div style={{ fontSize: '8.5pt', color: theme.subtext, marginTop: 2 }}>{e.technologies}</div>
        )}
        {e.description && (
          <div style={{ fontSize: '9pt', color: theme.subtext, marginTop: 3, lineHeight: lh, whiteSpace: 'pre-line' }}>
            {e.description}
          </div>
        )}
      </div>
    );
  }

  if (type === 'custom') {
    return (
      <div>
        {e.title && <div style={{ fontWeight: 600, fontSize: '10pt' }}>{e.title}</div>}
        {e.description && (
          <div style={{ fontSize: '9pt', color: theme.subtext, marginTop: 2, lineHeight: lh, whiteSpace: 'pre-line' }}>
            {e.description}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function SidebarSection({ sec, lh, ig }) {
  const c = sec.content || {};
  const entries = c.entries || [];
  const style = { fontSize: '8.5pt', color: 'rgba(255,255,255,0.9)', marginBottom: 3, lineHeight: lh };

  if (sec.type === 'skills') {
    return entries.map((e, i) => <div key={i} style={style}>{e.skill}</div>);
  }
  if (sec.type === 'languages') {
    return entries.map((e, i) => (
      <div key={i} style={style}>{e.language}{e.level ? ` — ${e.level}` : ''}</div>
    ));
  }
  if (sec.type === 'certifications') {
    return entries.map((e, i) => <div key={i} style={{ ...style, marginBottom: ig / 2 }}>{e.name}</div>);
  }
  return null;
}

// ── Template: Heritage (centered serif, hairline rules, right-aligned dates) ──

function Heritage({ resume, design }) {
  const { spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const serif = '"Playfair Display", Georgia, "Times New Roman", serif';

  return (
    <div style={{ fontFamily: `Georgia, "Times New Roman", serif`, color: '#1c1c1c', fontSize: '10.5pt', lineHeight: lh, padding: `${m * 1.3}px ${m * 1.5}px`, background: '#fff', minHeight: '100%' }}>
      <div style={{ textAlign: 'center', paddingBottom: sg * 0.6, marginBottom: sg, borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ fontFamily: serif, fontSize: '26pt', fontWeight: 700, letterSpacing: '0.01em', color: '#111' }}>
          {pi.name || 'Your Name'}
        </div>
        {pi.title && <div style={{ fontStyle: 'italic', fontSize: '12pt', color: '#444', marginTop: 2 }}>{pi.title}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 10, fontSize: '9.5pt', color: '#2a2a2a' }}>
          {[pi.location, pi.email, pi.phone, pi.website, pi.linkedin].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>
      </div>

      {sections.map(sec => {
        const c = sec.content || {};
        const entries = c.entries || [];
        return (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#111', borderBottom: '1px solid #888', paddingBottom: 3, marginBottom: ig }}>
              {sec.title}
            </div>

            {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
              <p style={{ fontSize: '10pt', margin: 0 }}>{c.text || ''}</p>
            )}

            {sec.type === 'work_experience' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{e.title}</span>
                    {e.company && <span style={{ fontStyle: 'italic', color: '#444', fontSize: '10pt' }}> · {e.company}</span>}
                    {e.location && <span style={{ color: '#666', fontSize: '9.5pt' }}> · {e.location}</span>}
                  </div>
                  <span style={{ fontSize: '9.5pt', color: '#555', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {dateRange(e.start_date, e.end_date, e.current)}
                  </span>
                </div>
                {e.description && <div style={{ marginTop: 4, fontSize: '9.5pt', color: '#333', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
              </div>
            ))}

            {sec.type === 'education' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{e.degree}{e.field ? `, ${e.field}` : ''}</span>
                    {e.institution && <span style={{ fontStyle: 'italic', color: '#444' }}> · {e.institution}</span>}
                  </div>
                  <span style={{ fontSize: '9.5pt', color: '#555', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {dateRange(e.start_date, e.end_date, false)}
                  </span>
                </div>
              </div>
            ))}

            {sec.type === 'skills' && (
              <div style={{ columnCount: 2, columnGap: 32 }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '9.5pt', marginBottom: 2 }}>• {e.skill}</div>)}
              </div>
            )}

            {sec.type === 'certifications' && (
              <div style={{ columnCount: 3, columnGap: 24 }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '9.5pt', marginBottom: 3 }}>• {e.name}</div>)}
              </div>
            )}

            {sec.type === 'languages' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 32px' }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
                    <span>{e.language}</span>
                    {e.level && <span style={{ color: '#888' }}>{e.level}</span>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'projects' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ fontWeight: 700 }}>{e.name}</div>
                {e.description && <div style={{ fontSize: '9.5pt', color: '#333', marginTop: 2, whiteSpace: 'pre-line' }}>{e.description}</div>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Template: Beacon (dark navy sidebar + white main) ─────────────────────────

function Beacon({ resume, design }) {
  const { font, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const sideTypes = ['skills', 'languages', 'certifications', 'summary'];
  const mainSecs = sections.filter(s => !sideTypes.includes(s.type));
  const sideSecs = sections.filter(s => sideTypes.includes(s.type));
  const initials = (pi.name || 'Y').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sidebarW = 240;
  const navy = '#1f2a3a';

  return (
    <div style={{ display: 'flex', fontFamily: font.family, fontSize: '10pt', lineHeight: lh, background: '#fff', minHeight: '100%' }}>
      {/* Sidebar */}
      <div style={{ width: sidebarW, flexShrink: 0, background: navy, color: '#e6ebf2', padding: `${m}px ${m * 0.8}px`, fontSize: '9.5pt' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22pt', fontWeight: 700, color: '#fff', margin: '0 auto 14px' }}>
          {initials}
        </div>
        <div style={{ textAlign: 'center', marginBottom: sg }}>
          <div style={{ fontWeight: 700, fontSize: '14pt', color: '#fff', lineHeight: 1.2 }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ color: '#c9d2dd', fontSize: '10pt', marginTop: 6 }}>{pi.title}</div>}
        </div>

        {/* Contact */}
        <div style={{ marginBottom: sg }}>
          {[
            { v: pi.email }, { v: pi.phone }, { v: pi.location }, { v: pi.website }, { v: pi.linkedin },
          ].filter(x => x.v).map((x, i) => (
            <div key={i} style={{ color: '#d6dce5', fontSize: '9pt', marginBottom: 5, wordBreak: 'break-word' }}>{x.v}</div>
          ))}
        </div>

        {/* Sidebar sections */}
        {sideSecs.map(sec => {
          const c = sec.content || {};
          const entries = c.entries || [];
          return (
            <div key={sec.id} style={{ marginBottom: sg }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '5px 8px', fontWeight: 600, fontSize: '9pt', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f1f4f8', marginBottom: 8 }}>
                {sec.title}
              </div>
              {(sec.type === 'summary' || sec.type === 'hobbies') && (
                <p style={{ color: '#d3d9e0', fontSize: '9pt', margin: 0, lineHeight: lh }}>{c.text || ''}</p>
              )}
              {sec.type === 'skills' && entries.map((e, i) => (
                <div key={i} style={{ color: '#d6dce5', fontSize: '9pt', marginBottom: 4, paddingLeft: 10, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: 6, width: 4, height: 4, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  {e.skill}
                </div>
              ))}
              {sec.type === 'languages' && entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#d6dce5', fontSize: '9pt', marginBottom: 4 }}>
                  <span>{e.language}</span>
                  {e.level && <span style={{ color: '#aab4c0' }}>{e.level}</span>}
                </div>
              ))}
              {sec.type === 'certifications' && entries.map((e, i) => (
                <div key={i} style={{ color: '#d6dce5', fontSize: '9pt', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{e.name}</div>
                  {e.issuer && <div style={{ color: '#aab4c0' }}>{e.issuer}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: `${m}px ${m * 0.85}px`, background: '#fff' }}>
        {mainSecs.map(sec => {
          const c = sec.content || {};
          const entries = c.entries || [];
          return (
            <div key={sec.id} style={{ marginBottom: sg }}>
              <div style={{ background: '#eef0f4', borderRadius: 3, padding: '6px 10px', fontWeight: 700, fontSize: '9.5pt', letterSpacing: '0.12em', textTransform: 'uppercase', color: navy, marginBottom: ig }}>
                {sec.title}
              </div>

              {sec.type === 'work_experience' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ fontWeight: 700, color: '#111', fontSize: '10.5pt' }}>{e.company}</div>
                  <div style={{ fontWeight: 500, color: '#1f2937' }}>{e.title}</div>
                  <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: 4 }}>
                    {dateRange(e.start_date, e.end_date, e.current)}{e.location ? ` | ${e.location}` : ''}
                  </div>
                  {e.description && <div style={{ fontSize: '9.5pt', lineHeight: lh, whiteSpace: 'pre-line', color: '#374151' }}>{e.description}</div>}
                </div>
              ))}

              {sec.type === 'education' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ fontWeight: 700, color: '#111' }}>{e.degree}{e.field ? `, ${e.field}` : ''}</div>
                  <div style={{ color: '#374151' }}>{e.institution}</div>
                  <div style={{ fontSize: '9pt', color: '#6b7280' }}>{dateRange(e.start_date, e.end_date, false)}</div>
                </div>
              ))}

              {sec.type === 'projects' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ fontWeight: 700 }}>{e.name}</div>
                  {e.description && <div style={{ fontSize: '9.5pt', color: '#374151', whiteSpace: 'pre-line' }}>{e.description}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template: Banded (gray card header, gray bands, left-rail dates) ──────────

function Banded({ resume, design }) {
  const { font, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const initials = (pi.name || 'Y').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ fontFamily: font.family, color: '#2b2f37', fontSize: '10pt', lineHeight: lh, padding: `${m}px`, background: '#fff', minHeight: '100%' }}>
      {/* Gray card header */}
      <div style={{ background: '#e1e3e6', borderRadius: 6, padding: `18px 22px`, display: 'flex', gap: 18, alignItems: 'center', marginBottom: sg }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#b0b5bc', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20pt', fontWeight: 700, color: '#fff' }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '19pt', color: '#1a1a1a' }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ color: '#6b7280', fontSize: '11pt', marginTop: 2 }}>{pi.title}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 18px', marginTop: 10, fontSize: '9.5pt', color: '#2b2f37' }}>
            {[pi.email, pi.phone, pi.website, pi.location].filter(Boolean).map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
        </div>
      </div>

      {sections.map(sec => {
        const c = sec.content || {};
        const entries = c.entries || [];
        return (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ background: '#e7e8eb', borderRadius: 3, padding: '5px 14px', textAlign: 'center', fontWeight: 600, fontSize: '11pt', color: '#1a1a1a', marginBottom: ig }}>
              {sec.title}
            </div>

            {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
              <p style={{ fontSize: '10pt', padding: '0 8px', margin: 0, lineHeight: lh }}>{c.text || ''}</p>
            )}

            {(sec.type === 'work_experience' || sec.type === 'projects') && entries.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, padding: '0 8px', marginBottom: ig }}>
                <div style={{ fontSize: '9.5pt', color: '#4b5563', lineHeight: 1.4 }}>
                  <div>{dateRange(e.start_date, e.end_date, e.current)}</div>
                  {e.location && <div style={{ color: '#6b7280' }}>{e.location}</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111', fontSize: '10.5pt' }}>{e.company || e.name}</div>
                  <div style={{ color: '#4b5563', marginBottom: 3 }}>{e.title}</div>
                  {e.description && <div style={{ fontSize: '9.5pt', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
                </div>
              </div>
            ))}

            {sec.type === 'education' && entries.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, padding: '0 8px', marginBottom: ig }}>
                <div style={{ fontSize: '9.5pt', color: '#4b5563', lineHeight: 1.4 }}>
                  <div>{dateRange(e.start_date, e.end_date, false)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111', fontSize: '10.5pt' }}>{e.institution}</div>
                  <div style={{ color: '#4b5563' }}>{e.degree}{e.field ? `, ${e.field}` : ''}</div>
                </div>
              </div>
            ))}

            {sec.type === 'skills' && (
              <div style={{ columnCount: 3, columnGap: 28, padding: '0 8px' }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '9.5pt', marginBottom: 4 }}>• {e.skill}</div>)}
              </div>
            )}

            {sec.type === 'certifications' && (
              <div style={{ columnCount: 2, columnGap: 24, padding: '0 8px' }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ fontSize: '9.5pt', marginBottom: 5 }}>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    {e.issuer && <div style={{ color: '#6b7280' }}>{e.issuer}</div>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'languages' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 24px', padding: '0 8px' }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt' }}>
                    <span>{e.language}</span>
                    {e.level && <span style={{ color: '#6b7280', fontSize: '9pt' }}>{e.level}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Template: Foundry (bordered header card + avatar, pill bands, multi-col) ──

function Foundry({ resume, design }) {
  const { font, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const initials = (pi.name || 'Y').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ fontFamily: font.family, color: '#232730', fontSize: '10pt', lineHeight: lh, padding: `${m}px ${m * 1.1}px`, background: '#fff', minHeight: '100%' }}>
      {/* Bordered header card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center', padding: '16px 20px', border: '1px solid #e6e7eb', borderRadius: 8, marginBottom: sg }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '18pt', color: '#131722', display: 'inline' }}>{pi.name || 'Your Name'}</div>
          {pi.title && <span style={{ color: '#555a66', fontStyle: 'italic', fontSize: '10.5pt', marginLeft: 8 }}>{pi.title}</span>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 22px', marginTop: 10, fontSize: '9.5pt', color: '#2a2f3a' }}>
            {[pi.email, pi.phone, pi.website, pi.location, pi.linkedin].filter(Boolean).map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
        </div>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d8dde4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20pt', fontWeight: 700, color: '#fff', border: '2px solid #e6e7eb' }}>
          {initials}
        </div>
      </div>

      {sections.map(sec => {
        const c = sec.content || {};
        const entries = c.entries || [];
        return (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ background: '#e9ebee', borderRadius: 4, padding: '5px 14px', textAlign: 'center', fontWeight: 600, fontSize: '11pt', color: '#1a1a1a', marginBottom: ig }}>
              {sec.title}
            </div>

            {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
              <p style={{ padding: '0 8px', margin: 0, lineHeight: lh }}>{c.text || ''}</p>
            )}

            {(sec.type === 'work_experience' || sec.type === 'projects') && entries.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, padding: '0 8px', marginBottom: ig }}>
                <div>
                  <div style={{ fontSize: '9.5pt', fontWeight: 600, color: '#131722' }}>{dateRange(e.start_date, e.end_date, e.current)}</div>
                  {e.location && <div style={{ fontSize: '9pt', color: '#6b7280' }}>{e.location}</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#131722', fontSize: '10.5pt' }}>
                    {e.company || e.name}{e.title ? <span style={{ fontWeight: 400, color: '#555a66' }}> · {e.title}</span> : null}
                  </div>
                  {e.description && <div style={{ fontSize: '9.5pt', lineHeight: lh, marginTop: 3, whiteSpace: 'pre-line' }}>{e.description}</div>}
                </div>
              </div>
            ))}

            {sec.type === 'education' && entries.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, padding: '0 8px', marginBottom: ig }}>
                <div style={{ fontSize: '9.5pt', fontWeight: 600, color: '#131722' }}>
                  {dateRange(e.start_date, e.end_date, false)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#131722' }}>{e.degree}{e.field ? `, ${e.field}` : ''}</div>
                  <div style={{ color: '#555a66' }}>{e.institution}</div>
                </div>
              </div>
            ))}

            {sec.type === 'skills' && (
              <div style={{ columnCount: 3, columnGap: 28, padding: '0 8px' }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '9.5pt', marginBottom: 4 }}>• {e.skill}</div>)}
              </div>
            )}

            {sec.type === 'certifications' && (
              <div style={{ columnCount: 3, columnGap: 24, padding: '0 8px' }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '9.5pt', marginBottom: 4 }}>• {e.name}</div>)}
              </div>
            )}

            {sec.type === 'languages' && (
              <div style={{ columnCount: 3, columnGap: 28, padding: '0 8px' }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ fontSize: '9.5pt', marginBottom: 4 }}>
                    {e.language}{e.level ? <span style={{ color: '#6b7280' }}> — {e.level}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Template: Creative Edge ───────────────────────────────────────────────────

function CreativeEdge({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const sidebarTypes = ['skills', 'languages', 'certifications'];
  const mainSecs = sections.filter(s => !sidebarTypes.includes(s.type));
  const sideSecs = sections.filter(s => sidebarTypes.includes(s.type));
  const accent = theme.primary;

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', display: 'flex', minHeight: '100%' }}>
      {/* Sidebar */}
      <div style={{ width: 210, background: accent, color: '#fff', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top accent bar */}
        <div style={{ background: 'rgba(0,0,0,0.25)', height: 6 }} />
        <div style={{ padding: `${m}px ${m * 0.75}px`, flex: 1 }}>
          {/* Avatar */}
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22pt', fontWeight: 700, marginBottom: 12 }}>
            {(pi.name || 'Y').charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: '14pt', fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '9pt', opacity: 0.8, marginBottom: sg * 0.8, fontStyle: 'italic' }}>{pi.title}</div>}

          {/* Contact */}
          <div style={{ marginBottom: sg, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: sg * 0.5 }}>
            <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, opacity: 0.65, marginBottom: 6 }}>Contact</div>
            {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github, pi.website].filter(Boolean).map((v, i) => (
              <div key={i} style={{ fontSize: '8.5pt', opacity: 0.9, marginBottom: 4, wordBreak: 'break-all' }}>{v}</div>
            ))}
          </div>

          {/* Sidebar sections */}
          {sideSecs.map(sec => (
            <div key={sec.id} style={{ marginBottom: sg, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: sg * 0.5 }}>
              <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, opacity: 0.65, marginBottom: 6 }}>{sec.title}</div>
              <SidebarSection sec={sec} lh={lh} ig={ig} />
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: `${m}px ${m * 0.9}px` }}>
        {pi.summary && (
          <div style={{ marginBottom: sg }}>
            <div style={{ fontSize: '8.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, marginBottom: 6 }}>Profile</div>
            <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>{pi.summary}</p>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, marginTop: sg * 0.5 }} />
          </div>
        )}
        {mainSecs.map(sec => (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: ig }}>
              <div style={{ width: 4, height: 16, background: accent, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>{sec.title}</div>
            </div>
            <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style="modern" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Template: Executive Navy ──────────────────────────────────────────────────

function ExecutiveNavy({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const navy = theme.primary;

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', minHeight: '100%' }}>
      {/* Dark header band */}
      <div style={{ background: navy, color: '#fff', padding: `${m * 1.1}px ${m * 1.2}px` }}>
        <div style={{ fontSize: '24pt', fontWeight: 700, letterSpacing: '0.02em' }}>{pi.name || 'Your Name'}</div>
        {pi.title && <div style={{ fontSize: '11pt', opacity: 0.75, marginTop: 3, fontStyle: 'italic' }}>{pi.title}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 10, fontSize: '8.5pt', opacity: 0.85 }}>
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean).map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      </div>
      {/* Thin accent bar */}
      <div style={{ height: 4, background: theme.accent || navy }} />

      <div style={{ padding: `${sg}px ${m * 1.2}px` }}>
        {pi.summary && (
          <div style={{ marginBottom: sg, paddingBottom: sg * 0.6, borderBottom: `1px solid ${theme.border || '#e0e0e0'}` }}>
            <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh, fontStyle: 'italic' }}>{pi.summary}</p>
          </div>
        )}
        {sections.map(sec => (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ig }}>
              <div style={{ fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: navy }}>{sec.title}</div>
              <div style={{ flex: 1, height: 1, background: `${navy}30` }} />
            </div>
            <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style="classic" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Template: Tech Stack ──────────────────────────────────────────────────────

function TechStack({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const sidebarTypes = ['skills', 'languages', 'certifications'];
  const mainSecs = sections.filter(s => !sidebarTypes.includes(s.type));
  const sideSecs = sections.filter(s => sidebarTypes.includes(s.type));
  const mono = `'Courier New', 'Consolas', monospace`;
  const blue = theme.primary;

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: blue, color: '#fff', padding: `${m * 0.9}px ${m * 1.1}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '20pt', fontWeight: 700 }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontFamily: mono, fontSize: '9pt', opacity: 0.8, marginTop: 2 }}>{`<${pi.title}>`}</div>}
        </div>
        <div style={{ fontSize: '8.5pt', opacity: 0.85, textAlign: 'right' }}>
          {[pi.email, pi.phone, pi.github].filter(Boolean).map((v, i) => (
            <div key={i}>{v}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <div style={{ width: 190, background: '#f5f7fa', borderRight: `3px solid ${blue}`, padding: `${sg * 0.8}px ${m * 0.7}px`, flexShrink: 0 }}>
          {pi.location && <div style={{ fontSize: '8.5pt', color: theme.subtext, marginBottom: sg * 0.5 }}>{pi.location}</div>}
          {sideSecs.map(sec => (
            <div key={sec.id} style={{ marginBottom: sg }}>
              <div style={{ fontFamily: mono, fontSize: '8pt', fontWeight: 700, color: blue, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, borderBottom: `1px dashed ${blue}40`, paddingBottom: 3 }}>
                {sec.title}
              </div>
              {sec.type === 'skills' && (sec.content?.entries || []).map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: blue, flexShrink: 0 }} />
                  <span style={{ fontSize: '8.5pt' }}>{e.skill}</span>
                </div>
              ))}
              {sec.type !== 'skills' && <SidebarSection sec={sec} lh={lh} ig={ig} />}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: `${sg * 0.8}px ${m * 0.8}px` }}>
          {pi.summary && (
            <div style={{ marginBottom: sg, background: `${blue}08`, border: `1px solid ${blue}20`, borderRadius: 4, padding: '8px 12px' }}>
              <div style={{ fontFamily: mono, fontSize: '8pt', color: blue, marginBottom: 4 }}>// summary</div>
              <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>{pi.summary}</p>
            </div>
          )}
          {mainSecs.map(sec => (
            <div key={sec.id} style={{ marginBottom: sg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: ig }}>
                <span style={{ fontFamily: mono, fontSize: '8pt', color: blue, opacity: 0.6 }}>{'>'}</span>
                <div style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: blue }}>{sec.title}</div>
                <div style={{ flex: 1, height: 1, background: `${blue}25` }} />
              </div>
              <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style="modern" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Template: Soft Gradient ───────────────────────────────────────────────────

function SoftGradient({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const p = theme.primary;
  const a = theme.accent || theme.primary;

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', minHeight: '100%' }}>
      {/* Gradient header */}
      <div style={{ background: `linear-gradient(135deg, ${p} 0%, ${a} 100%)`, color: '#fff', padding: `${m * 1.2}px ${m * 1.3}px`, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 30, bottom: -40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '24pt', fontWeight: 700, letterSpacing: '-0.2px' }}>{pi.name || 'Your Name'}</div>
          {pi.title && <div style={{ fontSize: '10.5pt', opacity: 0.85, marginTop: 2 }}>{pi.title}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, fontSize: '8.5pt', opacity: 0.9 }}>
            {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean).map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: `${sg}px ${m * 1.3}px` }}>
        {pi.summary && (
          <div style={{ marginBottom: sg, borderLeft: `3px solid ${a}`, paddingLeft: 14, background: `${p}06`, padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>
            <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>{pi.summary}</p>
          </div>
        )}
        {sections.map(sec => (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ig }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: `linear-gradient(135deg, ${p}, ${a})`, flexShrink: 0 }} />
              <div style={{ fontSize: '10pt', fontWeight: 700, color: p }}>{sec.title}</div>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${p}40, transparent)` }} />
            </div>
            <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style="modern" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Template: Bold Impact ─────────────────────────────────────────────────────

function BoldImpact({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const primary = theme.primary;

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', minHeight: '100%' }}>
      {/* Full-width bold header */}
      <div style={{ background: primary, padding: `${m * 1.1}px ${m * 1.2}px` }}>
        <div style={{ fontSize: '28pt', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>
          {pi.name || 'YOUR NAME'}
        </div>
        {pi.title && (
          <div style={{ fontSize: '11pt', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            {pi.title}
          </div>
        )}
      </div>
      {/* Contact bar */}
      <div style={{ background: '#1a1a1a', padding: `7px ${m * 1.2}px`, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean).map((v, i) => (
          <span key={i} style={{ fontSize: '8.5pt', color: 'rgba(255,255,255,0.8)' }}>{v}</span>
        ))}
      </div>

      <div style={{ padding: `${sg}px ${m * 1.2}px` }}>
        {pi.summary && (
          <div style={{ marginBottom: sg, padding: '10px 14px', borderLeft: `4px solid ${primary}` }}>
            <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>{pi.summary}</p>
          </div>
        )}
        {sections.map(sec => (
          <div key={sec.id} style={{ marginBottom: sg }}>
            <div style={{ fontSize: '11pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', background: primary, padding: '4px 10px', display: 'inline-block', marginBottom: ig }}>
              {sec.title}
            </div>
            <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style="classic" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Template: Elegant Script ──────────────────────────────────────────────────

function ElegantScript({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const serif = `Georgia, "Times New Roman", serif`;
  const p = theme.primary;

  return (
    <div style={{ fontFamily: font.family, color: theme.text, fontSize: '10pt', lineHeight: lh, background: '#fff', padding: `${m * 1.3}px ${m * 1.5}px`, minHeight: '100%' }}>
      {/* Decorative header */}
      <div style={{ textAlign: 'center', marginBottom: sg }}>
        <div style={{ fontSize: '4pt', letterSpacing: '0.5em', color: p, textTransform: 'uppercase', marginBottom: 8 }}>✦ ✦ ✦</div>
        <div style={{ fontFamily: serif, fontSize: '26pt', fontWeight: 400, color: '#111', letterSpacing: '0.04em' }}>
          {pi.name || 'Your Name'}
        </div>
        {pi.title && (
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '12pt', color: p, marginTop: 4 }}>{pi.title}</div>
        )}
        {/* Ornamental divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '12px auto', maxWidth: 400 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${p})` }} />
          <div style={{ fontSize: '8pt', color: p }}>◆</div>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${p}, transparent)` }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, fontSize: '9pt', color: theme.subtext }}>
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean).map((v, i, arr) => (
            <span key={i}>{v}{i < arr.length - 1 ? '' : ''}</span>
          ))}
        </div>
      </div>

      {pi.summary && (
        <div style={{ marginBottom: sg, textAlign: 'center', maxWidth: 520, margin: `0 auto ${sg}px` }}>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '10pt', color: theme.subtext, lineHeight: lh }}>{pi.summary}</p>
        </div>
      )}

      {sections.map(sec => (
        <div key={sec.id} style={{ marginBottom: sg }}>
          {/* Elegant section heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ig }}>
            <div style={{ flex: 1, height: 1, background: `${p}50` }} />
            <div style={{ fontFamily: serif, fontSize: '11pt', fontStyle: 'italic', color: p, letterSpacing: '0.04em' }}>{sec.title}</div>
            <div style={{ flex: 1, height: 1, background: `${p}50` }} />
          </div>
          <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style="minimal" />
        </div>
      ))}
    </div>
  );
}

// ── Template: Corporate Serif ─────────────────────────────────────────────────
// Centered name in EB Garamond, spaced-caps section headers with full-width hairline rules.

function CorporateSerif({ resume, design }) {
  const { theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const serif = `'EB Garamond', Georgia, serif`;
  const col = theme.primary;

  const SectionHdr = ({ children }) => (
    <div style={{ textAlign: 'center', margin: `${sg * 0.6}px 0 ${ig}px` }}>
      <span style={{ fontFamily: serif, fontSize: '11pt', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: col, paddingBottom: 3, borderBottom: `1px solid ${col}` }}>
        {children}
      </span>
    </div>
  );

  return (
    <div style={{ fontFamily: serif, color: theme.text, fontSize: '11pt', lineHeight: lh, background: '#fff', padding: `${m * 1.2}px ${m * 1.4}px`, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingBottom: sg * 0.5, marginBottom: sg * 0.3, borderBottom: `1px solid ${col}` }}>
        <div style={{ fontSize: '26pt', fontWeight: 700, color: col, letterSpacing: '0.01em', marginBottom: 3 }}>
          {pi.name || 'Your Name'}
        </div>
        {pi.title && <div style={{ fontSize: '13pt', fontStyle: 'italic', color: theme.subtext, marginBottom: 10 }}>{pi.title}</div>}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 18, fontSize: '10.5pt' }}>
          {[pi.location, pi.email, pi.phone, pi.linkedin].filter(Boolean).map((v, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{v}</span>
          ))}
        </div>
      </div>

      {pi.summary && (
        <>
          <SectionHdr>Summary</SectionHdr>
          <p style={{ textAlign: 'center', fontSize: '11pt', lineHeight: lh, padding: '0 8px', marginBottom: sg * 0.4 }}>{pi.summary}</p>
        </>
      )}

      {sections.map(sec => {
        const c = sec.content || {};
        const entries = c.entries || [];
        return (
          <div key={sec.id}>
            <SectionHdr>{sec.title}</SectionHdr>

            {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
              <p style={{ textAlign: 'center', fontSize: '11pt', lineHeight: lh }}>{c.text || ''}</p>
            )}

            {sec.type === 'work_experience' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  <span style={{ fontWeight: 700 }}>{e.company}</span>
                  <span style={{ textAlign: 'right', fontSize: '10.5pt' }}>{dateRange(e.start_date, e.end_date, e.current)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  <span style={{ fontStyle: 'italic', color: theme.subtext, fontSize: '10.5pt' }}>{e.title}</span>
                  <span style={{ textAlign: 'right', fontStyle: 'italic', color: theme.subtext, fontSize: '10.5pt' }}>{e.location}</span>
                </div>
                {e.description && (
                  <div style={{ marginTop: 3, fontSize: '10.5pt', lineHeight: lh, whiteSpace: 'pre-line', paddingLeft: 4 }}>{e.description}</div>
                )}
              </div>
            ))}

            {sec.type === 'education' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  <span style={{ fontWeight: 700 }}>{e.institution}</span>
                  <span style={{ textAlign: 'right', fontSize: '10.5pt' }}>{dateRange(e.start_date, e.end_date, false)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  <span style={{ fontStyle: 'italic', color: theme.subtext, fontSize: '10.5pt' }}>{e.degree}{e.field ? `, ${e.field}` : ''}</span>
                  <span style={{ textAlign: 'right', fontStyle: 'italic', color: theme.subtext, fontSize: '10.5pt' }}>{e.location}</span>
                </div>
              </div>
            ))}

            {sec.type === 'skills' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 24px', marginBottom: ig }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '10.5pt' }}>• {e.skill}</div>)}
              </div>
            )}

            {sec.type === 'certifications' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 24px', marginBottom: ig }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '10.5pt' }}>• {e.name}</div>)}
              </div>
            )}

            {sec.type === 'languages' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 32px', marginBottom: ig }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5pt' }}>
                    <span>{e.language}</span>
                    {e.level && <span style={{ color: theme.subtext }}>{e.level}</span>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'projects' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ fontWeight: 700 }}>{e.name}</div>
                {e.description && <div style={{ fontSize: '10.5pt', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Template: Silver Banner ───────────────────────────────────────────────────
// Left-aligned name with full-width silver/themed banner section headers.

function SilverBanner({ resume, design }) {
  const { theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const serif = `'EB Garamond', Georgia, serif`;
  const bannerBg = `${theme.primary}22`;
  const bannerText = theme.primary;

  const Banner = ({ children }) => (
    <div style={{ background: bannerBg, color: bannerText, textAlign: 'center', padding: '5px 0', fontWeight: 700, fontSize: '11pt', borderRadius: 1, margin: `${sg * 0.5}px 0 ${ig}px`, fontFamily: serif, letterSpacing: '0.02em' }}>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: serif, color: theme.text, fontSize: '11pt', lineHeight: lh, background: '#fff', padding: `${m * 1.1}px ${m * 1.2}px`, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: sg * 0.8 }}>
        <div style={{ fontSize: '22pt', fontWeight: 700, color: theme.primary, letterSpacing: '0.01em' }}>{pi.name || 'Your Name'}</div>
        {pi.title && <div style={{ fontSize: '13pt', color: theme.text, marginBottom: 10 }}>{pi.title}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 4, columnGap: 24, fontSize: '10.5pt' }}>
          {[pi.location, pi.email, pi.phone, pi.linkedin].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>
      </div>

      {pi.summary && (
        <>
          <Banner>Summary</Banner>
          <p style={{ fontSize: '11pt', lineHeight: lh, marginBottom: sg * 0.4 }}>{pi.summary}</p>
        </>
      )}

      {sections.map(sec => {
        const c = sec.content || {};
        const entries = c.entries || [];
        return (
          <div key={sec.id}>
            <Banner>{sec.title}</Banner>

            {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
              <p style={{ fontSize: '11pt', lineHeight: lh }}>{c.text || ''}</p>
            )}

            {sec.type === 'work_experience' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  <span style={{ fontWeight: 700 }}>{e.title}{e.company ? `, ${e.company}` : ''}</span>
                  <span style={{ fontSize: '10pt', color: theme.subtext }}>{dateRange(e.start_date, e.end_date, e.current)}</span>
                </div>
                {e.location && <div style={{ textAlign: 'right', fontSize: '10pt', color: theme.subtext }}>{e.location}</div>}
                {e.description && <div style={{ marginTop: 3, fontSize: '10.5pt', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
              </div>
            ))}

            {sec.type === 'education' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  <span style={{ fontWeight: 700 }}>{e.degree}{e.field ? `, ${e.field}` : ''}{e.institution ? `, ${e.institution}` : ''}</span>
                  <span style={{ fontSize: '10pt', color: theme.subtext }}>{dateRange(e.start_date, e.end_date, false)}</span>
                </div>
                {e.location && <div style={{ textAlign: 'right', fontSize: '10pt', color: theme.subtext }}>{e.location}</div>}
              </div>
            ))}

            {sec.type === 'skills' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: ig }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '10.5pt' }}>• {e.skill}</div>)}
              </div>
            )}

            {sec.type === 'certifications' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: ig }}>
                {entries.map((e, i) => <div key={i} style={{ fontSize: '10.5pt' }}>• {e.name}</div>)}
              </div>
            )}

            {sec.type === 'languages' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 32px', marginBottom: ig }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ fontSize: '10.5pt' }}>• {e.language}{e.level ? ` — ${e.level}` : ''}</div>
                ))}
              </div>
            )}

            {sec.type === 'projects' && entries.map((e, i) => (
              <div key={i} style={{ marginBottom: ig }}>
                <div style={{ fontWeight: 700 }}>{e.name}</div>
                {e.description && <div style={{ fontSize: '10.5pt', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Template: Teal Sidebar ────────────────────────────────────────────────────
// Lora-serif main column left, bold colored right sidebar for skills/certs/languages.

function TealSidebarTemplate({ resume, design }) {
  const { theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const sideTypes = ['skills', 'languages', 'certifications'];
  const mainSecs = sections.filter(s => !sideTypes.includes(s.type));
  const sideSecs = sections.filter(s => sideTypes.includes(s.type));
  const serif = `'Lora', Georgia, serif`;
  const sans = `'Montserrat', system-ui, sans-serif`;
  const sidebarBg = theme.primary;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', fontFamily: serif, fontSize: '10.5pt', lineHeight: lh, color: theme.text, background: '#fff', minHeight: '100%', overflow: 'hidden' }}>
      {/* Main */}
      <div style={{ padding: `${m * 1.1}px ${m * 0.85}px ${m}px ${m * 1.1}px` }}>
        <div style={{ fontFamily: sans, fontSize: '22pt', fontWeight: 800, color: theme.primary, letterSpacing: '0.01em', lineHeight: 1.1, marginBottom: 3 }}>{pi.name || 'Your Name'}</div>
        {pi.title && <div style={{ color: theme.accent || theme.primary, fontSize: '11pt', fontWeight: 600, marginBottom: 8 }}>{pi.title}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '10pt', color: theme.text, marginBottom: sg * 0.5 }}>
          {[pi.phone, pi.email, pi.linkedin, pi.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>

        {pi.summary && (
          <>
            <div style={{ fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '10pt', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: sg * 0.6, marginBottom: 5 }}>Summary</div>
            <p style={{ fontSize: '10.5pt', lineHeight: lh, marginBottom: sg * 0.4 }}>{pi.summary}</p>
          </>
        )}

        {mainSecs.map(sec => {
          const c = sec.content || {};
          const entries = c.entries || [];
          return (
            <div key={sec.id} style={{ marginBottom: sg * 0.5 }}>
              <div style={{ fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '10pt', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: sg * 0.5, marginBottom: 5 }}>
                {sec.title}
              </div>

              {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
                <p style={{ fontSize: '10.5pt', lineHeight: lh }}>{c.text || ''}</p>
              )}

              {sec.type === 'work_experience' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    <span style={{ fontWeight: 700, fontSize: '11pt', color: theme.primary }}>{e.title}</span>
                    <span style={{ fontSize: '10pt', color: theme.subtext }}>{dateRange(e.start_date, e.end_date, e.current)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    <span style={{ color: theme.accent || theme.primary, fontWeight: 600, fontSize: '10.5pt' }}>{e.company}</span>
                    <span style={{ fontSize: '10pt', color: theme.subtext }}>{e.location}</span>
                  </div>
                  {e.description && <div style={{ marginTop: 3, fontSize: '10pt', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
                </div>
              ))}

              {sec.type === 'education' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ fontWeight: 700, color: theme.primary }}>{e.degree}{e.field ? `, ${e.field}` : ''}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', color: theme.subtext }}>
                    <span>{e.institution}</span>
                    <span>{dateRange(e.start_date, e.end_date, false)}</span>
                  </div>
                </div>
              ))}

              {sec.type === 'projects' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ fontWeight: 700 }}>{e.name}</div>
                  {e.description && <div style={{ fontSize: '10pt', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Sidebar */}
      <div style={{ background: sidebarBg, color: '#fff', padding: `${m * 1.1}px ${m * 0.85}px` }}>
        {/* Avatar initials */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: sg * 0.7 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22pt', fontWeight: 700, fontFamily: sans, color: '#fff' }}>
            {(pi.name || 'Y').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>

        {sideSecs.map(sec => {
          const c = sec.content || {};
          const entries = c.entries || [];
          return (
            <div key={sec.id} style={{ marginBottom: sg * 0.6 }}>
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: '9.5pt', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.35)', paddingBottom: 4, marginBottom: 8 }}>
                {sec.title}
              </div>
              {sec.type === 'skills' && (
                <div style={{ color: '#fff', fontSize: '10pt', lineHeight: 1.7 }}>
                  {entries.map((e, i) => <span key={i}>{e.skill}{i < entries.length - 1 ? ' · ' : ''}</span>)}
                </div>
              )}
              {sec.type === 'languages' && entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '10pt', color: 'rgba(255,255,255,0.9)' }}>
                  <strong>{e.language}</strong>
                  {e.level && <span style={{ opacity: 0.7 }}>{e.level}</span>}
                </div>
              ))}
              {sec.type === 'certifications' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: 6, fontSize: '10pt', color: 'rgba(255,255,255,0.9)' }}>
                  <div style={{ fontWeight: 600 }}>{e.name}</div>
                  {e.issuer && <div style={{ opacity: 0.7, fontSize: '9.5pt' }}>{e.issuer}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template: Timeline ────────────────────────────────────────────────────────
// Vertical accent rail with circle dots and a left date-column.

function TimelineTemplate({ resume, design }) {
  const { theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const serif = `'Lora', Georgia, serif`;
  const sans = `'Montserrat', system-ui, sans-serif`;
  const accent = theme.accent || theme.primary;

  return (
    <div style={{ fontFamily: serif, color: theme.text, fontSize: '10.5pt', lineHeight: lh, background: '#fff', padding: `${m * 1.1}px ${m * 1.2}px`, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: sg * 0.7 }}>
        <div style={{ fontFamily: sans, fontSize: '22pt', fontWeight: 800, color: theme.primary, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{pi.name || 'Your Name'}</div>
        {pi.title && <div style={{ color: accent, fontSize: '11pt', fontWeight: 600, marginTop: 2, marginBottom: 6 }}>{pi.title}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '10pt', marginBottom: 4 }}>
          {[pi.phone, pi.email, pi.linkedin, pi.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>
      </div>

      {pi.summary && (
        <>
          <div style={{ fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '11pt', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Summary</div>
          <p style={{ fontSize: '10.5pt', lineHeight: lh, marginBottom: sg * 0.5 }}>{pi.summary}</p>
        </>
      )}

      {sections.map(sec => {
        const c = sec.content || {};
        const entries = c.entries || [];

        return (
          <div key={sec.id} style={{ marginBottom: sg * 0.6 }}>
            <div style={{ fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '11pt', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: sg * 0.5, marginBottom: 8 }}>
              {sec.title}
            </div>

            {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
              <p style={{ fontSize: '10.5pt', lineHeight: lh }}>{c.text || ''}</p>
            )}

            {(sec.type === 'work_experience' || sec.type === 'education' || sec.type === 'projects') && (
              <div>
                {entries.map((e, i) => {
                  const isLast = i === entries.length - 1;
                  const dateStr = sec.type === 'education'
                    ? dateRange(e.start_date, e.end_date, false)
                    : dateRange(e.start_date, e.end_date, e.current);
                  const loc = e.location || '';
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 20px 1fr', columnGap: 10, marginBottom: ig }}>
                      {/* Date */}
                      <div style={{ fontSize: '10pt', textAlign: 'left', lineHeight: 1.4 }}>
                        <div style={{ fontWeight: 700, color: theme.primary, fontSize: '10.5pt' }}>{dateStr}</div>
                        {loc && <div style={{ color: theme.subtext, fontSize: '9.5pt', marginTop: 2 }}>{loc}</div>}
                      </div>
                      {/* Rail */}
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, margin: '4px auto 0' }} />
                        {!isLast && <div style={{ position: 'absolute', top: 14, bottom: -ig, left: '50%', width: 2, background: accent, opacity: 0.3, transform: 'translateX(-1px)' }} />}
                      </div>
                      {/* Content */}
                      <div>
                        {sec.type === 'work_experience' && (
                          <>
                            <div style={{ fontWeight: 700, color: theme.text, fontSize: '11pt' }}>{e.title}</div>
                            <div style={{ color: accent, fontWeight: 700, marginBottom: 3 }}>{e.company}</div>
                          </>
                        )}
                        {sec.type === 'education' && (
                          <>
                            <div style={{ fontWeight: 700, color: theme.text, fontSize: '11pt' }}>{e.degree}{e.field ? `, ${e.field}` : ''}</div>
                            <div style={{ color: accent, fontWeight: 600 }}>{e.institution}</div>
                          </>
                        )}
                        {sec.type === 'projects' && (
                          <div style={{ fontWeight: 700 }}>{e.name}</div>
                        )}
                        {e.description && <div style={{ fontSize: '10pt', lineHeight: lh, whiteSpace: 'pre-line', marginTop: 2 }}>{e.description}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sec.type === 'skills' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: ig * 0.5 }}>
                {entries.map((e, i) => (
                  <span key={i} style={{ display: 'inline-block', padding: '4px 10px', border: `1px solid ${theme.subtext}`, borderRadius: 4, fontSize: '10pt', color: theme.text }}>
                    {e.skill}
                  </span>
                ))}
              </div>
            )}

            {sec.type === 'certifications' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: ig / 2, marginBottom: ig * 0.5 }}>
                {entries.map((e, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    {e.issuer && <div style={{ fontSize: '9.5pt', color: theme.subtext }}>{e.issuer}</div>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'languages' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: ig * 0.5 }}>
                {entries.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: theme.primary }}>{e.language}</span>
                    {e.level && <span style={{ fontSize: '9.5pt', color: theme.subtext }}>{e.level}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Template: Photo Sidebar ───────────────────────────────────────────────────
// Left sidebar with photo placeholder, contacts, skills; right Lora-serif main column.

function PhotoSidebarTemplate({ resume, design }) {
  const { theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);
  const sideTypes = ['skills', 'languages', 'certifications'];
  const mainSecs = sections.filter(s => !sideTypes.includes(s.type));
  const sideSecs = sections.filter(s => sideTypes.includes(s.type));
  const serif = `'Lora', Georgia, serif`;
  const sans = `'Montserrat', system-ui, sans-serif`;
  const accent = theme.accent || theme.primary;
  const pillColor = `${accent}33`;
  const initials = (pi.name || 'Y').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.85fr', fontFamily: serif, fontSize: '10.5pt', lineHeight: lh, color: theme.text, background: '#fff', minHeight: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ padding: `${m * 1.1}px ${m * 0.7}px ${m}px ${m * 0.9}px`, background: '#fff', borderRight: `1px solid #e8eaee` }}>
        {/* Photo placeholder */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: sg * 0.7, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: -8, left: -10, width: 40, height: 40, borderRadius: '50%', background: pillColor, opacity: 0.8 }} />
            <div style={{ position: 'absolute', bottom: -5, right: -4, width: 24, height: 24, borderRadius: '50%', background: pillColor, opacity: 0.8 }} />
            <div style={{ width: 110, height: 110, borderRadius: '50%', background: pillColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22pt', fontWeight: 700, fontFamily: sans, color: accent, position: 'relative' }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Contacts section */}
        <div style={{ marginBottom: sg * 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '10.5pt', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>
            <span style={{ color: accent }}>✉</span> Contacts
          </div>
          {[pi.phone, pi.email, pi.linkedin, pi.location].filter(Boolean).map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 4, fontSize: '10pt' }}>{v}</div>
          ))}
        </div>

        {sideSecs.map(sec => {
          const c = sec.content || {};
          const entries = c.entries || [];
          return (
            <div key={sec.id} style={{ marginBottom: sg * 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '10.5pt', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>
                <span style={{ color: accent }}>✦</span> {sec.title}
              </div>
              {sec.type === 'skills' && (
                <div style={{ fontSize: '10pt', lineHeight: 1.7 }}>
                  {entries.map((e, i) => <span key={i}>{e.skill}{i < entries.length - 1 ? ' · ' : ''}</span>)}
                </div>
              )}
              {sec.type === 'languages' && entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '10pt' }}>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9.5pt' }}>{e.language}</span>
                  {e.level && <span style={{ color: theme.subtext, fontSize: '9.5pt' }}>{e.level}</span>}
                  <span style={{ display: 'inline-flex', gap: 2, marginLeft: 'auto' }}>
                    {[1,2,3,4,5].map(n => <span key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: accent, opacity: 0.3 + (n <= 3 ? 0.7 : 0) }} />)}
                  </span>
                </div>
              ))}
              {sec.type === 'certifications' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: 5, fontSize: '10pt' }}>
                  <div style={{ fontWeight: 600 }}>{e.name}</div>
                  {e.issuer && <div style={{ color: theme.subtext, fontSize: '9.5pt' }}>{e.issuer}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Main */}
      <div style={{ padding: `${m * 1.1}px ${m * 1.1}px ${m}px ${m * 0.85}px` }}>
        <div style={{ fontFamily: sans, fontSize: '22pt', fontWeight: 800, color: theme.primary, letterSpacing: '0.02em', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 8 }}>{pi.name || 'Your Name'}</div>
        {pi.title && (
          <div style={{ background: pillColor, color: theme.primary, fontFamily: sans, fontWeight: 700, fontSize: '10pt', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '8px 14px', borderRadius: 5, marginBottom: sg * 0.6, lineHeight: 1.3 }}>
            {pi.title}
          </div>
        )}

        {pi.summary && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '10.5pt', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
              <span style={{ color: accent }}>▹</span> Summary
            </div>
            <p style={{ fontSize: '10.5pt', lineHeight: lh, marginBottom: sg * 0.5 }}>{pi.summary}</p>
          </>
        )}

        {mainSecs.map(sec => {
          const c = sec.content || {};
          const entries = c.entries || [];
          return (
            <div key={sec.id} style={{ marginBottom: sg * 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: sans, color: theme.primary, fontWeight: 700, fontSize: '11pt', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: sg * 0.5, marginBottom: 8 }}>
                <span style={{ color: accent }}>▹</span> {sec.title}
              </div>

              {(sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') && (
                <p style={{ fontSize: '10.5pt', lineHeight: lh }}>{c.text || ''}</p>
              )}

              {sec.type === 'work_experience' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    <span style={{ fontWeight: 700, color: theme.primary, fontSize: '11pt' }}>{e.company}</span>
                    <span style={{ fontSize: '9.5pt', color: theme.subtext }}>{e.location}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    <span style={{ fontSize: '10.5pt' }}>{e.title}</span>
                    <span style={{ fontSize: '9.5pt', color: theme.subtext }}>{dateRange(e.start_date, e.end_date, e.current)}</span>
                  </div>
                  {e.description && <div style={{ marginTop: 3, fontSize: '10pt', lineHeight: lh, whiteSpace: 'pre-line' }}>{e.description}</div>}
                </div>
              ))}

              {sec.type === 'education' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    <span style={{ fontWeight: 700, color: theme.primary }}>{e.institution}</span>
                    <span style={{ fontSize: '9.5pt', color: theme.subtext }}>{e.location}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    <span style={{ fontSize: '10.5pt' }}>{e.degree}{e.field ? `, ${e.field}` : ''}</span>
                    <span style={{ fontSize: '9.5pt', color: theme.subtext }}>{dateRange(e.start_date, e.end_date, false)}</span>
                  </div>
                </div>
              ))}

              {sec.type === 'projects' && entries.map((e, i) => (
                <div key={i} style={{ marginBottom: ig }}>
                  <div style={{ fontWeight: 700, color: theme.primary }}>{e.name}</div>
                  {e.description && <div style={{ fontSize: '10pt', lineHeight: lh, whiteSpace: 'pre-line', marginTop: 2 }}>{e.description}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template registry ─────────────────────────────────────────────────────────

const TEMPLATE_COMPONENTS = {
  'classic-professional': ClassicProfessional,
  'modern-slate': ModernSlate,
  'minimal-white': MinimalWhite,
  'ats-clean': ATSClean,
  'heritage': Heritage,
  'beacon': Beacon,
  'banded': Banded,
  'foundry': Foundry,
  'creative-edge': CreativeEdge,
  'executive-navy': ExecutiveNavy,
  'tech-stack': TechStack,
  'soft-gradient': SoftGradient,
  'bold-impact': BoldImpact,
  'elegant-script': ElegantScript,
  'corporate-serif': CorporateSerif,
  'silver-banner': SilverBanner,
  'teal-sidebar': TealSidebarTemplate,
  'timeline': TimelineTemplate,
  'photo-sidebar': PhotoSidebarTemplate,
};

// ── ResumePreview component ───────────────────────────────────────────────────

// ── Footer renderer ───────────────────────────────────────────────────────────

function ResumeFooter({ footerSettings, personalInfo, pageNumber }) {
  const fs = footerSettings || {};
  const pi = personalInfo || {};
  const parts = [];
  if (fs.name && pi.name) parts.push(pi.name);
  if (fs.email && pi.email) parts.push(pi.email);
  if (fs.pageNumbers) parts.push(`Page ${pageNumber}`);
  if (!parts.length) return null;

  return (
    <div style={{
      borderTop: '1px solid #e0e0e0',
      marginTop: 'auto',
      padding: '6px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '8pt',
      color: '#888',
      background: '#fff',
    }}>
      <span>{[fs.name && pi.name, fs.email && pi.email].filter(Boolean).join(' · ')}</span>
      {fs.pageNumbers && <span>Page {pageNumber}</span>}
    </div>
  );
}

// ── Color resolution ─────────────────────────────────────────────────────────

function resolveColors(theme, rawDesignSettings) {
  const { colorMode = 'accent', accentColor, accentTargets = {}, multiColors = {}, borderColor } = rawDesignSettings || {};
  const getColor = (target, fallback) => {
    if (colorMode === 'multi') return multiColors[target] || fallback;
    if (accentColor && accentTargets[target]) return accentColor;
    return fallback;
  };
  return {
    name: getColor('name', theme.primary),
    headings: getColor('headings', theme.primary),
    headingsLine: getColor('headingsLine', theme.border || '#ddd'),
    dotsBarsBubbles: getColor('dotsBarsBubbles', theme.primary),
    dates: getColor('dates', theme.subtext),
    entrySubtitle: getColor('entrySubtitle', theme.subtext),
    border: borderColor || theme.border || '#ddd',
    primary: accentColor && colorMode === 'accent' ? accentColor : theme.primary,
  };
}

// ── Spacing settings → design override ───────────────────────────────────────

const MM_TO_PX = 3.7795;

function applySpacingSettings(design, spacingSettings) {
  if (!spacingSettings) return design;
  const ss = spacingSettings;
  return {
    ...design,
    spacing: {
      ...design.spacing,
      lineHeight: ss.lineHeight ?? design.spacing.lineHeight,
    },
    margins: {
      ...design.margins,
      value: Math.round(ss.marginLeft * MM_TO_PX),
      top: Math.round(ss.marginTop * MM_TO_PX),
      bottom: Math.round(ss.marginBottom * MM_TO_PX),
      right: Math.round(ss.marginRight * MM_TO_PX),
      itemGap: ss.entrySpacing ? ss.entrySpacing * 4 : design.spacing.itemGap,
    },
    fontSize: ss.fontSize ? `${ss.fontSize}pt` : null,
  };
}

export default function ResumePreview({ resume, designSettings = {}, scale = null, className = '' }) {
  const containerRef = useRef(null);
  const [computedScale, setComputedScale] = useState(scale || 0.6);
  const baseDesign = resolveDesign(designSettings);
  const spacedDesign = applySpacingSettings(baseDesign, resume?.spacing_settings);
  const colors = resolveColors(spacedDesign.theme, designSettings);
  const design = {
    ...spacedDesign,
    theme: {
      ...spacedDesign.theme,
      primary: colors.primary,
      border: colors.border,
      name: colors.name,
      headings: colors.headings,
      headingsLine: colors.headingsLine,
      dotsBarsBubbles: colors.dotsBarsBubbles,
      dates: colors.dates,
      entrySubtitle: colors.entrySubtitle,
    },
  };
  const page = design.page;
  const TemplateComp = TEMPLATE_COMPONENTS[resume?.template_id] || ClassicProfessional;

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
  const fs = resume?.footer_settings;
  const hasFooter = fs && (fs.pageNumbers || (fs.email && resume?.personal_info?.email) || (fs.name && resume?.personal_info?.name));

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
          <div style={{ flex: 1, fontSize: design.fontSize || undefined }}>
            <TemplateComp resume={resume || {}} design={design} />
          </div>
          {hasFooter && (
            <ResumeFooter
              footerSettings={fs}
              personalInfo={resume?.personal_info}
              pageNumber={1}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Small thumbnail for template gallery
export function TemplateThumbnail({ templateId, active = false, label, style: styleTag, plan }) {
  const TemplateComp = TEMPLATE_COMPONENTS[templateId];
  const sampleResume = {
    template_id: templateId,
    personal_info: { name: 'Alex Johnson', email: 'alex@example.com', phone: '+1 (555) 000-0000', location: 'New York, NY', summary: 'Experienced professional with a passion for excellence.' },
    sections: [
      { id: 's1', type: 'work_experience', title: 'Work Experience', enabled: true, content: { entries: [{ title: 'Senior Engineer', company: 'Tech Corp', start_date: '01/2022', end_date: '', current: true, description: 'Led development of core platform features.' }] } },
      { id: 's2', type: 'education', title: 'Education', enabled: true, content: { entries: [{ institution: 'State University', degree: 'B.S. Computer Science', start_date: '09/2015', end_date: '05/2019' }] } },
      { id: 's3', type: 'skills', title: 'Skills', enabled: true, content: { entries: [{ skill: 'JavaScript' }, { skill: 'React' }, { skill: 'Node.js' }] } },
    ],
  };

  return (
    <div className={`relative rounded overflow-hidden border-2 transition-all cursor-pointer ${active ? 'border-primary shadow-md' : 'border-ds-border hover:border-primary/50'}`}>
      {active && (
        <div className="absolute top-1.5 left-1.5 z-10 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
          Active
        </div>
      )}
      <div style={{ height: 140, overflow: 'hidden', pointerEvents: 'none' }}>
        {TemplateComp ? (
          <div style={{ width: 794, transformOrigin: 'top left', transform: 'scale(0.168)' }}>
            <TemplateComp resume={sampleResume} design={resolveDesign({})} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-ds-bg text-ds-textMuted text-xs">
            {label}
          </div>
        )}
      </div>
      <div className="bg-ds-card px-2 py-1.5 border-t border-ds-border">
        <p className="text-xs font-medium text-ds-text truncate">{label}</p>
        <p className="text-[10px] text-ds-textMuted">{styleTag}</p>
      </div>
    </div>
  );
}
