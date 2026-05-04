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

function ClassicProfessional({ resume, design }) {
  const { font, theme, spacing, margins } = design;
  const m = margins.value;
  const sg = spacing.sectionGap;
  const ig = spacing.itemGap;
  const lh = spacing.lineHeight;
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false);

  const base = {
    fontFamily: font.family,
    color: theme.text,
    fontSize: '10pt',
    lineHeight: lh,
  };

  return (
    <div style={{ ...base, padding: `${m}px`, background: '#fff', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${theme.primary}`, paddingBottom: sg / 2, marginBottom: sg }}>
        <div style={{ fontSize: '22pt', fontWeight: 700, color: theme.primary, letterSpacing: '-0.3px' }}>
          {pi.name || 'Your Name'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 4, fontSize: '9pt', color: theme.subtext }}>
          {pi.email && <span>{pi.email}</span>}
          {pi.phone && <span>· {pi.phone}</span>}
          {pi.location && <span>· {pi.location}</span>}
          {pi.linkedin && <span>· {pi.linkedin}</span>}
          {pi.github && <span>· {pi.github}</span>}
          {pi.website && <span>· {pi.website}</span>}
        </div>
        {pi.summary && (
          <p style={{ marginTop: 8, fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>
            {pi.summary}
          </p>
        )}
      </div>

      {sections.map(sec => (
        <SectionBlock key={sec.id} sec={sec} theme={theme} sg={sg} ig={ig} lh={lh} style="classic" />
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

function SectionBlock({ sec, theme, sg, ig, lh, style }) {
  const headerStyle = {
    classic: {
      fontSize: '11pt', fontWeight: 700, color: theme.primary,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      borderBottom: `1px solid ${theme.border || '#ddd'}`,
      paddingBottom: 3, marginBottom: ig,
    },
    modern: {
      fontSize: '8pt', fontWeight: 700, color: theme.primary,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: ig,
    },
    minimal: {
      fontSize: '10pt', fontWeight: 600, color: '#111',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: ig,
    },
    ats: {
      fontSize: '11pt', fontWeight: 700, textTransform: 'uppercase',
      borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: ig,
    },
  }[style] || {};

  return (
    <div style={{ marginBottom: sg }}>
      <div style={headerStyle}>{sec.title}</div>
      <SectionContent sec={sec} theme={theme} ig={ig} lh={lh} style={style} />
    </div>
  );
}

function SectionContent({ sec, theme, ig, lh, style }) {
  const c = sec.content || {};

  if (sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') {
    return <p style={{ fontSize: '9.5pt', color: theme.subtext, lineHeight: lh }}>{c.text || ''}</p>;
  }

  if (sec.type === 'skills') {
    const entries = c.entries || [];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {entries.map((e, i) => (
          <span key={i} style={{ fontSize: '9pt', background: style === 'ats' ? 'transparent' : `${theme.primary}18`, color: style === 'ats' ? theme.text : theme.primary, padding: '2px 8px', borderRadius: 3, border: style === 'ats' ? '1px solid #ccc' : 'none' }}>
            {e.skill}{e.proficiency && style !== 'ats' ? ` (${e.proficiency})` : ''}
          </span>
        ))}
      </div>
    );
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
        {entries.map((e, i) => <EntryItem key={i} entry={e} type={sec.type} theme={theme} lh={lh} style={style} />)}
      </div>
    );
  }

  return null;
}

function EntryItem({ entry: e, type, theme, lh, style }) {
  if (type === 'work_experience') {
    return (
      <div style={{ borderLeft: style === 'classic' || style === 'modern' ? `2px solid ${theme.accent || theme.primary}30` : 'none', paddingLeft: style === 'classic' || style === 'modern' ? 10 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '10pt' }}>{e.title}</div>
            <div style={{ fontSize: '9pt', color: theme.subtext }}>{e.company}{e.location ? ` · ${e.location}` : ''}</div>
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
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '10pt' }}>{e.institution}</div>
            <div style={{ fontSize: '9pt', color: theme.subtext }}>
              {[e.degree, e.field].filter(Boolean).join(', ')}
              {e.grade ? ` · ${e.grade}` : ''}
            </div>
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

// ── Template registry ─────────────────────────────────────────────────────────

const TEMPLATE_COMPONENTS = {
  'classic-professional': ClassicProfessional,
  'modern-slate': ModernSlate,
  'minimal-white': MinimalWhite,
  'ats-clean': ATSClean,
};

// ── ResumePreview component ───────────────────────────────────────────────────

export default function ResumePreview({ resume, designSettings = {}, scale = null, className = '' }) {
  const containerRef = useRef(null);
  const [computedScale, setComputedScale] = useState(scale || 0.6);
  const design = resolveDesign(designSettings);
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
          }}
        >
          <TemplateComp resume={resume || {}} design={design} />
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
      {plan !== 'free' && (
        <div className="absolute top-1.5 right-1.5 z-10 bg-amber-400 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          {plan}
        </div>
      )}
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
