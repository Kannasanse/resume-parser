// templates.jsx — Resume template registry + 6 distinct layouts
// Every template receives identical props and respects design/spacing/display + sectionOrder + extras.

const TEMPLATES = {
  modern:          { name: 'Modern',         tone: 'Clean accent · minimal',       accent: '#185FA5', sw1: '#185FA5', sw2: '#F4F8FC' },
  'atlantic-blue': { name: 'Atlantic Blue',  tone: 'Dark sidebar · serif',         accent: '#1F2A44', sw1: '#1F2A44', sw2: '#FFFFFF' },
  corporate:       { name: 'Corporate',      tone: 'Centered · classic serif',     accent: '#0F172A', sw1: '#FFFFFF', sw2: '#0F172A' },
  'atlantic-crest':{ name: 'Atlantic Crest', tone: 'Banner top · two-column',      accent: '#1F2A44', sw1: '#1F2A44', sw2: '#F4F8FC' },
  'mercury-flow':  { name: 'Mercury Flow',   tone: 'Gray banner · date column',    accent: '#374151', sw1: '#E5E7EB', sw2: '#FFFFFF' },
  'steady-form':   { name: 'Steady Form',    tone: 'Photo right · gray bars',      accent: '#1F2A44', sw1: '#FFFFFF', sw2: '#EEF1F5' },
  executive:       { name: 'Executive',      tone: 'Editorial · serif titles',     accent: '#0F172A', sw1: '#FFFFFF', sw2: '#0F172A' },
};

function tmplUtils({ design, spacing }) {
  const safe = (n, lo, hi, dflt) => (typeof n === 'number' && !isNaN(n) ? Math.max(lo, Math.min(hi, n)) : dflt);
  const fontSize = safe(spacing.fontSize, 8, 14, 11);
  const lineHeight = safe(spacing.lineHeight, 1, 1.8, 1.15);
  const padX = safe(spacing.leftRightMargin, 5, 30, 15);
  const padY = safe(spacing.topBottomMargin, 5, 30, 15);
  const entryGapPx = safe(spacing.entrySpacing, 0, 6, 2) * fontSize * lineHeight;
  const hexOk = (c) => typeof c === 'string' && /^#([0-9a-f]{3}){1,2}$/i.test(c);
  const accent = hexOk(design.accentColor) ? design.accentColor : '#185FA5';
  const t = design.accentTargets;
  const colIf = (on) => on ? accent : undefined;
  return { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf, fontFamily: design.fontFamily };
}

// Photo placeholder
function PhotoPlaceholder({ size = 72, shape = 'circle', name = '' }) {
  const initials = (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? 6 : 0;
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(135deg, #94A3B8, #64748B)', display: 'inline-grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.34, flexShrink: 0, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
      {initials || '?'}
    </div>
  );
}

// ---------- Shared section bodies ----------
function SkillsBody({ items, cfg, accent, t, colIf, variantCols }) {
  const dotColor = colIf(t.dotsBarsBubbles) || accent;
  const layout = cfg.layout;
  if (layout === 'grid' || (variantCols && layout !== 'bubble' && layout !== 'level' && layout !== 'compact')) {
    const cols = variantCols || cfg.columns || 2;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: 18, rowGap: 3 }}>
        {items.map(s => <div key={s.name}>• {s.name}</div>)}
      </div>
    );
  }
  if (layout === 'bubble') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(s => <span key={s.name} style={{ padding: '3px 10px', borderRadius: 999, background: colIf(t.dotsBarsBubbles) ? accent + '1A' : '#F3F4F6', color: colIf(t.dotsBarsBubbles) || '#2C2C2A', fontSize: '0.9em' }}>{s.name}</span>)}
      </div>
    );
  }
  if (layout === 'level') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18, rowGap: 4 }}>
        {items.map(s => (
          <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{s.name}</span>
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= Math.round(s.level * 1.67) ? dotColor : '#E5E7EB' }} />)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (layout === 'compact') return <div>{items.map(s => s.name).join(' · ')}</div>;
  // rows / default
  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {items.map(s => <li key={s.name} style={{ marginBottom: 2 }}>{s.name}</li>)}
    </ul>
  );
}

function ExperienceBody({ items, cfg, entryGapPx, t, colIf, variant }) {
  return (
    <div>
      {items.map((e, i) => {
        const primary = cfg.order === 'title-employer' ? e.title : e.employer;
        const secondary = cfg.order === 'title-employer' ? e.employer : e.title;
        const gap = i < items.length - 1 ? entryGapPx : 0;
        if (variant === 'date-column') {
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, marginBottom: gap }}>
              <div style={{ fontSize: '0.88em', color: colIf(t.dates) || '#374151' }}>
                <div>{e.dates}</div>
                <div style={{ color: '#6B7280' }}>{e.location}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{secondary || primary}</div>
                <div style={{ fontSize: '0.92em' }}>{primary}</div>
                <ul style={{ margin: '3px 0 0', paddingLeft: 18 }}>
                  {e.bullets.map((b, j) => <li key={j} style={{ marginBottom: 1 }}>{b}</li>)}
                </ul>
              </div>
            </div>
          );
        }
        if (variant === 'stacked') {
          return (
            <div key={i} style={{ marginBottom: gap }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.92em' }}>{secondary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', marginBottom: 3 }}>{e.dates}{e.location ? ` | ${e.location}` : ''}</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {e.bullets.map((b, j) => <li key={j} style={{ marginBottom: 1 }}>{b}</li>)}
              </ul>
            </div>
          );
        }
        if (variant === 'inline-title-role') {
          // Steady Form: "Company, Role"
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, marginBottom: gap }}>
              <div style={{ fontSize: '0.88em', color: colIf(t.dates) || '#374151' }}>
                <div>{e.dates}</div>
                <div style={{ color: '#6B7280' }}>{e.location}</div>
              </div>
              <div>
                <div><strong>{e.employer},</strong> <em style={{ fontStyle: 'italic' }}>{e.title}</em></div>
                <ul style={{ margin: '3px 0 0', paddingLeft: 18 }}>
                  {e.bullets.map((b, j) => <li key={j} style={{ marginBottom: 1 }}>{b}</li>)}
                </ul>
              </div>
            </div>
          );
        }
        // default
        return (
          <div key={i} style={{ marginBottom: gap }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', whiteSpace: 'nowrap' }}>{e.dates}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary}</div>
              {e.location && <div style={{ fontSize: '0.85em', color: '#6B7280' }}>{e.location}</div>}
            </div>
            <ul style={{ margin: '3px 0 0', paddingLeft: 18 }}>
              {e.bullets.map((b, j) => <li key={j} style={{ marginBottom: 1 }}>{b}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function EducationBody({ items, cfg, entryGapPx, t, colIf, variant }) {
  return (
    <div>
      {items.map((e, i) => {
        const primary = cfg.order === 'school-degree' ? e.school : e.degree;
        const secondary = cfg.order === 'school-degree' ? e.degree : e.school;
        const gap = i < items.length - 1 ? entryGapPx : 0;
        if (variant === 'date-column') {
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, marginBottom: gap }}>
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
        if (variant === 'compact') {
          return (
            <div key={i} style={{ marginBottom: gap }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontSize: '0.92em' }}>{secondary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{e.dates}{e.location ? ` | ${e.location}` : ''}</div>
            </div>
          );
        }
        return (
          <div key={i} style={{ marginBottom: gap }}>
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

function ExtraBody({ id, value, def, entryGapPx, t, colIf, variant, accent }) {
  if (!def) return null;
  if (def.layout === 'custom') return <div style={{ whiteSpace: 'pre-wrap' }}>{value.body}</div>;
  if (def.layout === 'single') {
    return (
      <>
        <div style={{ whiteSpace: 'pre-wrap' }}>{value.text}</div>
        {(value.signature || value.date) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.9em', color: '#6B7280' }}>
            <span>{value.signature}</span><span>{value.date}</span>
          </div>
        )}
      </>
    );
  }
  const items = Array.isArray(value) ? value : [];
  if (def.layout === 'chips') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((it, i) => <span key={i} style={{ padding: '3px 10px', borderRadius: 999, background: '#F3F4F6', fontSize: '0.9em' }}>{it[def.titleKey]}</span>)}
      </div>
    );
  }
  if (def.layout === 'twocol') {
    // Languages
    const lvlMap = { Beginner: 1, Intermediate: 2, Advanced: 3, Fluent: 4, Native: 5 };
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 4 }}>
        {items.map((it, i) => {
          const n = lvlMap[it.level] || 3;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{it[def.titleKey]}</span>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {[1,2,3,4,5].map(j => <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: j <= n ? (colIf(t.dotsBarsBubbles) || '#2C2C2A') : '#D1D5DB' }} />)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  // entry default
  if (variant === 'compact-list') {
    return (
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {items.map((it, i) => <li key={i} style={{ marginBottom: 1 }}>{it[def.titleKey]}{it[def.subKey] ? `, ${it[def.subKey]}` : ''}{(it.date || it.dates) ? ` — ${it.date || it.dates}` : ''}</li>)}
      </ul>
    );
  }
  if (variant === 'three-col-bullets') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 14, rowGap: 4 }}>
        {items.map((it, i) => <div key={i}>• {it[def.titleKey]}</div>)}
      </div>
    );
  }
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: i < items.length - 1 ? entryGapPx * 0.75 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontWeight: 700 }}>{it[def.titleKey]}</div>
            {(it.date || it.dates) && <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{it.date || it.dates}</div>}
          </div>
          {def.subKey && it[def.subKey] && <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{it[def.subKey]}</div>}
          {it.description && <div style={{ marginTop: 3 }}>{it.description}</div>}
        </div>
      ))}
    </div>
  );
}

// Section icon mapping (for pill-heading templates)
const SEC_ICONS = {
  summary: 'badge', skills: 'droplet', experience: 'briefcase', education: 'graduation',
  languages: 'globe', certificates: 'award', interests: 'heart', projects: 'folder',
  courses: 'book', awards: 'trophy', organisations: 'users', publications: 'fileText',
  references: 'userBadge', declaration: 'pen',
};
function sectionHeading(id, sections) {
  if (sections[id]) return sections[id].label;
  const base = id.split('_')[0];
  if (base === 'experience' || id === 'experience') return 'Professional Experience';
  if (sections[base]) return sections[base].label;
  return id;
}
function sectionLabel(id, sectionLabels, SEC_TYPES) {
  if (sectionLabels[id]) return sectionLabels[id];
  const base = id.split('_')[0];
  if (SEC_TYPES[base]) return SEC_TYPES[base].heading;
  return id;
}

// Convenience: render any section's BODY by id
function renderBody(id, props, util, opts = {}) {
  const { display, data, extras } = props;
  const { entryGapPx, accent, t, colIf } = util;
  if (id === 'summary') return <div>{data.summary}</div>;
  if (id === 'skills') return <SkillsBody items={data.skills} cfg={display.skills} accent={accent} t={t} colIf={colIf} variantCols={opts.skillsCols} />;
  if (id === 'experience') return <ExperienceBody items={data.experience} cfg={display.experience} entryGapPx={entryGapPx} t={t} colIf={colIf} variant={opts.expVariant} />;
  if (id === 'education') return <EducationBody items={data.education} cfg={display.education} entryGapPx={entryGapPx} t={t} colIf={colIf} variant={opts.eduVariant} />;
  const base = id.split('_')[0];
  const def = SECTION_TYPES[base];
  if (!def || !extras) return null;
  const value = extras[id];
  if (value === undefined) return null;
  const variant = opts.extraVariant || (base === 'certificates' && opts.certThreeCol ? 'three-col-bullets' : undefined);
  return <ExtraBody id={id} value={value} def={def} entryGapPx={entryGapPx} t={t} colIf={colIf} variant={variant} accent={accent} />;
}

// ---------- Page wrapper helper ----------
function PageWrap({ zoom, children, bg = '#fff' }) {
  return (
    <div className="page-wrap" style={{ transform: `scale(${zoom})`, marginBottom: zoom < 1 ? -((1 - zoom) * 1123) : 0 }}>
      <div className="page" style={{ background: bg }}>{children}</div>
    </div>
  );
}

// ============================================================
// TEMPLATE 1 — MODERN (original)
// ============================================================
function TemplateModern(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf, fontFamily } = util;
  const { design, data, sectionOrder } = props;
  const pageStyle = { fontFamily: `'${fontFamily}', sans-serif`, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#2C2C2A' };
  const Heading = ({ children }) => (
    <div style={{ marginTop: '1.4em', marginBottom: '0.4em' }}>
      <div style={{ fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: colIf(t.headings) || '#2C2C2A' }}>{children}</div>
      <div style={{ height: 1.5, background: colIf(t.headingsLine) || '#D1DCE8', marginTop: 4 }} />
    </div>
  );
  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        <div style={{ textAlign: design.headerAlignment }}>
          <div style={{ fontSize: '2.2em', fontWeight: 700, letterSpacing: '-0.02em', color: colIf(t.name) || '#2C2C2A', lineHeight: 1 }}>{data.name}</div>
          <div style={{ fontSize: '1.05em', fontWeight: 500, color: colIf(t.jobTitle) || accent, marginTop: 4 }}>{data.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginTop: 8, fontSize: '0.92em', color: '#6B7280', justifyContent: design.headerAlignment === 'center' ? 'center' : 'flex-start' }}>
            {[data.email, data.phone, data.location, data.link].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
          </div>
        </div>
        {sectionOrder.map(id => (
          <React.Fragment key={id}>
            <Heading>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
            {renderBody(id, props, util)}
          </React.Fragment>
        ))}
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 2 — ATLANTIC BLUE (dark sidebar)
// ============================================================
function TemplateAtlanticBlue(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, accent, t, colIf } = util;
  const { data, sectionOrder, design } = props;
  const SIDEBAR = ['summary', 'languages', 'awards', 'interests', 'declaration', 'references'];
  const sidebarIds = sectionOrder.filter(id => SIDEBAR.includes(id.split('_')[0]));
  const bodyIds = sectionOrder.filter(id => !SIDEBAR.includes(id.split('_')[0]));
  const sideColor = '#1F2A44';
  const pageStyle = { fontFamily: `'${design.fontFamily}', serif`, fontSize: `${fontSize}pt`, lineHeight, color: '#2C2C2A', display: 'grid', gridTemplateColumns: '32% 1fr', minHeight: '100%' };

  const PillHead = ({ children, iconName }) => (
    <div style={{ background: '#E5E7EB', padding: '5px 10px', marginTop: '0.9em', marginBottom: '0.4em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {iconName && <Icon name={iconName} size={11} color={colIf(t.headerIcons) || '#1F2A44'} />}
      <span style={{ fontSize: '0.78em', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colIf(t.headings) || '#1F2A44' }}>{children}</span>
    </div>
  );
  const SideHead = ({ children, iconName }) => (
    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '5px 10px', marginTop: '0.9em', marginBottom: '0.4em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {iconName && <Icon name={iconName} size={11} color="#fff" />}
      <span style={{ fontSize: '0.78em', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>{children}</span>
    </div>
  );
  const contactRow = (icon, txt) => txt ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: '0.85em', color: '#D1DCE8' }}>
      <Icon name={icon} size={11} color="#D1DCE8" /><span>{txt}</span>
    </div>
  ) : null;

  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        {/* Sidebar */}
        <div style={{ background: sideColor, color: '#fff', padding: '24px 20px' }}>
          <div style={{ fontSize: '1.7em', fontWeight: 700, color: colIf(t.name) || '#fff', lineHeight: 1.05 }}>{data.name}</div>
          <div style={{ fontSize: '1em', color: colIf(t.jobTitle) || '#B6C2D6', marginTop: 4 }}>{data.title}</div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-start' }}>
            <PhotoPlaceholder size={86} shape="circle" name={data.name} />
          </div>
          <div style={{ marginTop: 14 }}>
            {contactRow('mail', data.email)}
            {contactRow('phone', data.phone)}
            {contactRow('pin', data.location)}
            {contactRow('link', data.link)}
          </div>
          <div style={{ color: '#E8EEF7' }}>
            {sidebarIds.map(id => (
              <React.Fragment key={id}>
                <SideHead iconName={SEC_ICONS[id.split('_')[0]]}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</SideHead>
                {renderBody(id, props, util, { extraVariant: 'compact-list' })}
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* Main body */}
        <div style={{ padding: '24px 22px' }}>
          {bodyIds.map(id => (
            <React.Fragment key={id}>
              <PillHead iconName={SEC_ICONS[id.split('_')[0]]}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</PillHead>
              {renderBody(id, props, util, { expVariant: 'stacked' })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 3 — CORPORATE (centered, classic)
// ============================================================
function TemplateCorporate(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf } = util;
  const { data, sectionOrder, design } = props;
  const pageStyle = { fontFamily: `'${design.fontFamily}', 'Georgia', serif`, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#1F2937' };
  const Heading = ({ children }) => (
    <div style={{ marginTop: '1em', marginBottom: '0.45em', textAlign: 'center' }}>
      <div style={{ height: 1, background: colIf(t.headingsLine) || '#9CA3AF' }} />
      <div style={{ fontSize: '0.9em', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: colIf(t.headings) || '#1F2937', padding: '3px 0' }}>{children}</div>
      <div style={{ height: 1, background: colIf(t.headingsLine) || '#9CA3AF' }} />
    </div>
  );
  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2em', fontWeight: 700, color: colIf(t.name) || '#1F2937', lineHeight: 1 }}>{data.name}</div>
          <div style={{ fontSize: '1.05em', fontStyle: 'italic', color: colIf(t.jobTitle) || '#374151', marginTop: 4 }}>{data.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 10, fontSize: '0.9em', color: '#374151', justifyContent: 'center' }}>
            {[['pin', data.location], ['mail', data.email], ['phone', data.phone], ['link', data.link]].filter(([,v]) => v).map(([k, v], i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name={k} size={11} color={colIf(t.headerIcons) || '#374151'} />{v}
              </span>
            ))}
          </div>
        </div>
        {sectionOrder.map(id => (
          <React.Fragment key={id}>
            <Heading>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
            {renderBody(id, props, util, { skillsCols: id === 'skills' && props.display.skills.layout === 'rows' ? 3 : undefined, certThreeCol: id.startsWith('certificates') })}
          </React.Fragment>
        ))}
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 4 — ATLANTIC CREST (dark banner top + two-column)
// ============================================================
function TemplateAtlanticCrest(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf } = util;
  const { data, sectionOrder, design } = props;
  const LEFT_COL = ['summary', 'skills', 'languages', 'certificates', 'interests', 'awards', 'declaration', 'references'];
  const leftIds = sectionOrder.filter(id => LEFT_COL.includes(id.split('_')[0]));
  const rightIds = sectionOrder.filter(id => !LEFT_COL.includes(id.split('_')[0]));
  const bannerColor = '#1F2A44';
  const pageStyle = { fontFamily: `'${design.fontFamily}', sans-serif`, fontSize: `${fontSize}pt`, lineHeight, color: '#1F2937', background: '#fff' };

  const PillHead = ({ children, iconName }) => (
    <div style={{ background: '#E5E7EB', padding: '5px 10px', marginTop: '0.9em', marginBottom: '0.4em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {iconName && <Icon name={iconName} size={11} color={colIf(t.headerIcons) || '#1F2A44'} />}
      <span style={{ fontSize: '0.78em', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colIf(t.headings) || '#1F2A44' }}>{children}</span>
    </div>
  );
  const contact = (icon, txt) => txt ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.88em', color: '#D1DCE8' }}>
      <Icon name={icon} size={11} color="#D1DCE8" />{txt}
    </span>
  ) : null;

  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        {/* Banner */}
        <div style={{ background: bannerColor, color: '#fff', padding: `${padY}mm ${padX}mm`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.9em', fontWeight: 700, color: colIf(t.name) || '#fff', lineHeight: 1 }}>{data.name}</div>
            <div style={{ fontSize: '1em', color: colIf(t.jobTitle) || '#B6C2D6', marginTop: 4 }}>{data.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 10, maxWidth: 460 }}>
              {contact('mail', data.email)}
              {contact('phone', data.phone)}
              {contact('link', data.link)}
              {contact('pin', data.location)}
            </div>
          </div>
          <PhotoPlaceholder size={96} shape="circle" name={data.name} />
        </div>
        {/* Two-column body */}
        <div style={{ padding: `${padY * 0.6}mm ${padX}mm`, display: 'grid', gridTemplateColumns: '38% 1fr', gap: 18 }}>
          <div>
            {leftIds.map(id => (
              <React.Fragment key={id}>
                <PillHead iconName={SEC_ICONS[id.split('_')[0]]}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</PillHead>
                {renderBody(id, props, util)}
              </React.Fragment>
            ))}
          </div>
          <div>
            {rightIds.map(id => (
              <React.Fragment key={id}>
                <PillHead iconName={SEC_ICONS[id.split('_')[0]]}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</PillHead>
                {renderBody(id, props, util, { expVariant: 'stacked' })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 5 — MERCURY FLOW (gray banner + date column)
// ============================================================
function TemplateMercuryFlow(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf } = util;
  const { data, sectionOrder, design } = props;
  const pageStyle = { fontFamily: `'${design.fontFamily}', sans-serif`, fontSize: `${fontSize}pt`, lineHeight, color: '#1F2937' };

  const BarHead = ({ children }) => (
    <div style={{ background: '#EEF1F5', padding: '5px 12px', marginTop: '0.9em', marginBottom: '0.45em', textAlign: 'center' }}>
      <span style={{ fontSize: '0.92em', fontWeight: 600, color: colIf(t.headings) || '#1F2937' }}>{children}</span>
    </div>
  );
  const contact = (icon, txt) => txt ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.88em', color: '#374151' }}>
      <Icon name={icon} size={11} color={colIf(t.headerIcons) || '#374151'} />{txt}
    </span>
  ) : null;

  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        {/* Gray banner */}
        <div style={{ background: '#E5E7EB', padding: `${padY * 0.7}mm ${padX}mm`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <PhotoPlaceholder size={70} shape="circle" name={data.name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.5em', fontWeight: 700, color: colIf(t.name) || '#1F2937', lineHeight: 1.05 }}>{data.name}</div>
            <div style={{ fontSize: '0.95em', color: colIf(t.jobTitle) || '#374151', marginTop: 2 }}>{data.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 14px', marginTop: 6 }}>
              {contact('mail', data.email)}
              {contact('phone', data.phone)}
              {contact('link', data.link)}
              {contact('pin', data.location)}
            </div>
          </div>
        </div>
        <div style={{ padding: `${padY * 0.5}mm ${padX}mm` }}>
          {sectionOrder.map(id => {
            const base = id.split('_')[0];
            const useDateCol = base === 'experience' || base === 'education';
            return (
              <React.Fragment key={id}>
                <BarHead>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</BarHead>
                {renderBody(id, props, util, useDateCol ? { expVariant: 'date-column', eduVariant: 'date-column' } : {})}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 6 — STEADY FORM (photo right + gray bar headings + date col)
// ============================================================
function TemplateSteadyForm(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf } = util;
  const { data, sectionOrder, design } = props;
  const pageStyle = { fontFamily: `'${design.fontFamily}', sans-serif`, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#1F2937' };

  const BarHead = ({ children }) => (
    <div style={{ background: '#EEF1F5', padding: '5px 12px', marginTop: '1em', marginBottom: '0.5em', textAlign: 'center' }}>
      <span style={{ fontSize: '0.92em', fontWeight: 600, color: colIf(t.headings) || '#1F2937' }}>{children}</span>
    </div>
  );
  const contact = (icon, txt) => txt ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.88em', color: '#374151' }}>
      <span style={{ width: 16, height: 16, border: '1px solid #9CA3AF', borderRadius: 2, display: 'inline-grid', placeItems: 'center' }}>
        <Icon name={icon} size={9} color={colIf(t.headerIcons) || '#374151'} />
      </span>
      {txt}
    </div>
  ) : null;

  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        {/* Header: name+contacts left, photo right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: '1.6em' }}>
              <span style={{ fontWeight: 700, color: colIf(t.name) || '#1F2937' }}>{data.name}</span>
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: colIf(t.jobTitle) || '#374151', marginLeft: 10 }}>{data.title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginTop: 10 }}>
              {contact('mail', data.email)}
              {contact('phone', data.phone)}
              {contact('link', data.link)}
              {contact('pin', data.location)}
            </div>
          </div>
          <PhotoPlaceholder size={78} shape="circle" name={data.name} />
        </div>
        {sectionOrder.map(id => {
          const base = id.split('_')[0];
          return (
            <React.Fragment key={id}>
              <BarHead>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</BarHead>
              {renderBody(id, props, util, base === 'experience' ? { expVariant: 'inline-title-role' } : base === 'education' ? { eduVariant: 'date-column' } : base === 'skills' && props.display.skills.layout === 'rows' ? { skillsCols: 3 } : base === 'certificates' ? { certThreeCol: true } : {})}
            </React.Fragment>
          );
        })}
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 7 — EXECUTIVE (editorial serif, minimal)
// ============================================================
function TemplateExecutive(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, accent, t, colIf } = util;
  const { data, sectionOrder, design } = props;
  const pageStyle = { fontFamily: `'${design.fontFamily}', 'Playfair Display', serif`, fontSize: `${fontSize}pt`, lineHeight, paddingLeft: `${padX}mm`, paddingRight: `${padX}mm`, paddingTop: `${padY}mm`, paddingBottom: `${padY}mm`, color: '#1F2937' };
  const Heading = ({ children }) => (
    <div style={{ marginTop: '1em', marginBottom: '0.35em' }}>
      <div style={{ fontSize: '0.95em', fontWeight: 600, color: colIf(t.headings) || '#1F2937', letterSpacing: '0.01em' }}>{children}</div>
      <div style={{ height: 0.5, background: colIf(t.headingsLine) || '#9CA3AF', marginTop: 2 }} />
    </div>
  );
  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.8em', fontWeight: 700, color: colIf(t.name) || '#1F2937' }}>{data.name}</span>
          <span style={{ fontSize: '1.05em', fontStyle: 'italic', color: colIf(t.jobTitle) || '#374151' }}>{data.title}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 8, fontSize: '0.9em', color: '#374151' }}>
          {[['pin', data.location], ['mail', data.email], ['phone', data.phone], ['link', data.link]].filter(([,v]) => v).map(([k, v], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name={k} size={11} color={colIf(t.headerIcons) || '#374151'} />{v}
            </span>
          ))}
        </div>
        {sectionOrder.map(id => {
          const base = id.split('_')[0];
          return (
            <React.Fragment key={id}>
              <Heading>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
              {renderBody(id, props, util, base === 'experience' ? { expVariant: 'date-column' } : base === 'education' ? { eduVariant: 'date-column' } : {})}
            </React.Fragment>
          );
        })}
      </div>
    </PageWrap>
  );
}

const TEMPLATE_RENDERERS = {
  modern: TemplateModern,
  'atlantic-blue': TemplateAtlanticBlue,
  corporate: TemplateCorporate,
  'atlantic-crest': TemplateAtlanticCrest,
  'mercury-flow': TemplateMercuryFlow,
  'steady-form': TemplateSteadyForm,
  executive: TemplateExecutive,
};

window.TEMPLATES = TEMPLATES;
window.TEMPLATE_RENDERERS = TEMPLATE_RENDERERS;
