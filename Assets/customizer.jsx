// Proflect — Resume Customizer (live preview)
// All design_settings + spacing_settings + display_settings drive the preview inline.

const { useState, useEffect, useRef, useMemo } = React;

// ---------- Defaults (the spec's documented fallbacks) ----------
const DEFAULT_DESIGN = {
  accentColor: '#185FA5',
  accentTargets: {
    name: true, jobTitle: true, headings: true, headingsLine: true,
    headerIcons: true, dotsBarsBubbles: true, dates: false, entrySubtitle: false, linkIcons: true,
  },
  colorMode: 'accent',
  fontFamily: 'Inter',
  headerAlignment: 'left',
  detailsArrangement: 2,
  detailsSeparator: 'icon',
  headerIconStyle: 1,
};
const DEFAULT_SPACING = { fontSize: 11, lineHeight: 1.15, leftRightMargin: 15, topBottomMargin: 15, entrySpacing: 2 };
const DEFAULT_DISPLAY = {
  skills: { layout: 'rows', columns: 2, rowSpacing: 'spacious', startWithBullets: false, subinfoStyle: 'dash', levelStyle: 'dots', bubbleSubinfo: 'inline' },
  education: { order: 'school-degree' },
  experience: { order: 'title-employer' },
};
const DEFAULT_SECTION_ORDER = ['summary', 'skills', 'experience', 'education'];
const SECTION_LABELS = { summary: 'Summary', skills: 'Skills', experience: 'Work Experience', education: 'Education' };

// Extra section types — pickable from the Add Content modal
const SECTION_TYPES = {
  languages:    { label: 'Languages',     icon: 'globe',      heading: 'Languages',     desc: 'Add your languages and proficiency level to show your communication range.',
                  fields: [ {k:'name', l:'Language', ph:'English'}, {k:'level', l:'Proficiency', kind:'select', opts:['Beginner','Intermediate','Advanced','Fluent','Native']} ],
                  empty: () => ({ name: '', level: 'Fluent' }), titleKey: 'name', subKey: 'level', layout: 'twocol' },
  certificates: { label: 'Certificates',  icon: 'award',      heading: 'Certificates',  desc: 'Add your industry certificates or licences. Include issuer and date earned.',
                  fields: [ {k:'name', l:'Name'}, {k:'issuer', l:'Issuer'}, {k:'date', l:'Date'} ],
                  empty: () => ({ name: '', issuer: '', date: '' }), titleKey: 'name', subKey: 'issuer', layout: 'entry' },
  interests:    { label: 'Interests',     icon: 'heart',      heading: 'Interests',     desc: 'Add relevant personal interests that support your career story and cultural fit.',
                  fields: [ {k:'name', l:'Interest'} ],
                  empty: () => ({ name: '' }), titleKey: 'name', layout: 'chips' },
  projects:     { label: 'Projects',      icon: 'folder',     heading: 'Projects',      desc: 'Add key projects you participated in and highlight your challenges, role, and impact.',
                  fields: [ {k:'title', l:'Title'}, {k:'role', l:'Role'}, {k:'dates', l:'Dates'}, {k:'link', l:'Link'}, {k:'description', l:'Description', kind:'textarea'} ],
                  empty: () => ({ title: '', role: '', dates: '', link: '', description: '' }), titleKey: 'title', subKey: 'role', layout: 'entry' },
  courses:      { label: 'Courses',       icon: 'book',       heading: 'Courses',       desc: 'Add online or in-person courses and trainings you joined and completed.',
                  fields: [ {k:'name', l:'Course'}, {k:'provider', l:'Provider'}, {k:'date', l:'Date'} ],
                  empty: () => ({ name: '', provider: '', date: '' }), titleKey: 'name', subKey: 'provider', layout: 'entry' },
  awards:       { label: 'Awards',        icon: 'trophy',     heading: 'Awards',        desc: 'Add your awards and recognitions from industry, competitions, or academia.',
                  fields: [ {k:'title', l:'Title'}, {k:'issuer', l:'Issuer'}, {k:'date', l:'Date'} ],
                  empty: () => ({ title: '', issuer: '', date: '' }), titleKey: 'title', subKey: 'issuer', layout: 'entry' },
  organisations:{ label: 'Organisations', icon: 'users',      heading: 'Organisations', desc: 'Add your memberships or volunteering with organisations including your role.',
                  fields: [ {k:'name', l:'Organisation'}, {k:'role', l:'Role'}, {k:'dates', l:'Dates'} ],
                  empty: () => ({ name: '', role: '', dates: '' }), titleKey: 'name', subKey: 'role', layout: 'entry' },
  publications: { label: 'Publications',  icon: 'fileText',   heading: 'Publications',  desc: 'Add publications, articles, or books you wrote or contributed to.',
                  fields: [ {k:'title', l:'Title'}, {k:'publisher', l:'Publisher'}, {k:'date', l:'Date'}, {k:'link', l:'Link'} ],
                  empty: () => ({ title: '', publisher: '', date: '', link: '' }), titleKey: 'title', subKey: 'publisher', layout: 'entry' },
  references:   { label: 'References',    icon: 'userBadge',  heading: 'References',    desc: 'Add your references from managers or coworkers, including their contact details.',
                  fields: [ {k:'name', l:'Name'}, {k:'role', l:'Role'}, {k:'company', l:'Company'}, {k:'email', l:'Email'}, {k:'phone', l:'Phone'} ],
                  empty: () => ({ name: '', role: '', company: '', email: '', phone: '' }), titleKey: 'name', subKey: 'role', layout: 'entry' },
  declaration:  { label: 'Declaration',   icon: 'pen',        heading: 'Declaration',   desc: 'Add your declaration by creating or uploading your personal signature.',
                  layout: 'single', single: { text: 'I hereby declare that the information provided above is true to the best of my knowledge.', signature: '', date: '' } },
  custom:       { label: 'Custom',        icon: 'puzzle',     heading: 'Custom Section',desc: 'Add a custom section for anything else, or combine sections cleanly.',
                  multiple: true, layout: 'custom', single: { heading: 'Custom Section', body: '' } },
};

// Initial extras data — empty
const INITIAL_EXTRAS = {};

const COLORS = ['#185FA5','#0C447C','#1D9E75','#B45309','#D93025','#6D28D9','#0F766E','#2C2C2A'];
const FONTS = [
  { name: 'Inter', sample: 'Modern · sans-serif' },
  { name: 'Source Sans 3', sample: 'Clean · sans-serif' },
  { name: 'IBM Plex Sans', sample: 'Technical · sans-serif' },
  { name: 'Georgia', sample: 'Classic · serif' },
  { name: 'Merriweather', sample: 'Editorial · serif' },
  { name: 'Playfair Display', sample: 'Display · serif' },
  { name: 'JetBrains Mono', sample: 'Mono · code' },
];

// ---------- Sample resume data ----------
const INITIAL_RESUME = {
  name: 'Alex Park',
  title: 'Senior Frontend Engineer',
  email: 'alex.park@email.com',
  phone: '+1 (415) 555-0142',
  location: 'Oakland, CA',
  link: 'linkedin.com/in/alexpark',
  summary: 'Senior frontend engineer with 7+ years building accessible, performant React applications. Led the design-system rebuild at Linear Labs, mentoring three ICs and shipping a unified token system across web and mobile.',
  skills: [
    { name: 'React', level: 3 }, { name: 'TypeScript', level: 3 }, { name: 'Next.js', level: 3 },
    { name: 'Node.js', level: 2 }, { name: 'GraphQL', level: 2 }, { name: 'TailwindCSS', level: 3 },
    { name: 'Jest', level: 2 }, { name: 'Playwright', level: 2 }, { name: 'Design systems', level: 3 },
    { name: 'Performance', level: 2 },
  ],
  experience: [
    { title: 'Senior Frontend Engineer', employer: 'Linear Labs', dates: '2023 — Present', location: 'Remote', bullets: [
      'Owned the design-system rebuild adopted across 12 product surfaces.',
      'Cut homepage TTI by 38% via streaming + route-level code splitting.',
      'Mentored 3 engineers; led FE hiring committee for senior IC roles.',
    ]},
    { title: 'Frontend Engineer', employer: 'Nimbus AI', dates: '2020 — 2023', location: 'San Francisco, CA', bullets: [
      'Built billing and onboarding flows used by 30k+ teams.',
      'Led React 18 migration and Suspense-based data fetching rollout.',
    ]},
    { title: 'Software Engineer', employer: 'Beacon Co', dates: '2018 — 2020', location: 'Boston, MA', bullets: [
      'Shipped first React app at the company.',
      'Introduced TypeScript and Storybook to the org.',
    ]},
  ],
  education: [
    { school: 'UC Berkeley', degree: 'B.S. Computer Science', dates: '2014 — 2018', location: 'Berkeley, CA' },
  ],
};

// ---------- Atoms ----------
const Icon = ({ name, size = 14, color = 'currentColor', strokeWidth = 2 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></>,
    pin: <><path d="M12 22s8-7.6 8-13a8 8 0 0 0-16 0c0 5.4 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    chevronD: <><polyline points="6 9 12 15 18 9"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus: <><line x1="5" y1="12" x2="19" y2="12"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    grip: <><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    type: <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z"/></>,
    award: <><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/></>,
    heart: <><path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.79 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 18h4v4h-4z"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>,
    userBadge: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
    pen: <><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></>,
    puzzle: <><path d="M20 14.5a2.5 2.5 0 0 0 0-5h-1V6a2 2 0 0 0-2-2h-3.5a2.5 2.5 0 0 0-5 0H5a2 2 0 0 0-2 2v3.5a2.5 2.5 0 0 1 0 5V20a2 2 0 0 0 2 2h3.5a2.5 2.5 0 0 1 5 0H17a2 2 0 0 0 2-2v-3.5z"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    sliders: <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
    droplet: <><path d="M12 2 5.5 11A6.5 6.5 0 1 0 18.5 11L12 2z"/></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
};

// Header icon style variants — different shapes per "headerIconStyle"
const HdrIcon = ({ kind, style, color, size = 11 }) => {
  // Wrap an inner glyph with a style frame (none / circle / square / square-fill / round-fill / outline-thick / minimal)
  const inner = <Icon name={kind} size={size} color={style === 4 || style === 5 ? '#fff' : color} strokeWidth={style === 6 ? 2.5 : 2} />;
  const base = { width: size + 8, height: size + 8, display: 'inline-grid', placeItems: 'center', flexShrink: 0 };
  if (style === 1) return <span style={base}>{inner}</span>;
  if (style === 2) return <span style={{ ...base, border: `1px solid ${color}`, borderRadius: '50%' }}>{inner}</span>;
  if (style === 3) return <span style={{ ...base, border: `1px solid ${color}`, borderRadius: 4 }}>{inner}</span>;
  if (style === 4) return <span style={{ ...base, background: color, borderRadius: '50%' }}>{inner}</span>;
  if (style === 5) return <span style={{ ...base, background: color, borderRadius: 4 }}>{inner}</span>;
  if (style === 6) return <span style={base}>{inner}</span>;
  if (style === 7) return <span style={{ ...base, borderBottom: `1px solid ${color}`, borderRadius: 0 }}>{inner}</span>;
  return <span style={base}>{inner}</span>;
};

const Slider = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div>
    <div className="label-row"><span className="label" style={{ marginBottom: 0 }}>{label}</span><span className="val">{value}{unit}</span></div>
    <input className="slider" type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
  </div>
);

const Seg = ({ options, value, onChange }) => (
  <div className="seg">
    {options.map(o => (
      <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

const Check = ({ checked, onChange, children }) => (
  <label className="check" onClick={() => onChange(!checked)}>
    <span className={'cbox' + (checked ? ' checked' : '')}>{checked && <Icon name="check" size={11} color="#fff" />}</span>
    <span>{children}</span>
  </label>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className="section-head" onClick={() => setOpen(o => !o)}>
        <span className="section-title">{title}</span>
        <Icon name="chevronD" size={14} color="#9CA3AF" style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
};

// Reorderable section — drag handle on the header, fires onReorder when dropped
function DraggableSection({ id, title, children, defaultOpen = true, onReorder, dragState, setDragState }) {
  const [open, setOpen] = useState(defaultOpen);
  const isDragging = dragState.from === id;
  const hover = dragState.over === id && dragState.from && dragState.from !== id ? dragState.position : null;
  return (
    <div
      className={'section dsection' + (isDragging ? ' dragging' : '') + (hover === 'above' ? ' drop-above' : '') + (hover === 'below' ? ' drop-below' : '')}
      draggable
      onDragStart={(e) => { setDragState({ from: id, over: null, position: null }); e.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={(e) => {
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        const pos = e.clientY < r.top + r.height / 2 ? 'above' : 'below';
        setDragState(s => (s.over === id && s.position === pos ? s : { ...s, over: id, position: pos }));
      }}
      onDragLeave={() => setDragState(s => (s.over === id ? { ...s, over: null, position: null } : s))}
      onDrop={(e) => { e.preventDefault(); if (dragState.from && dragState.from !== id) onReorder(dragState.from, id, dragState.position); setDragState({ from: null, over: null, position: null }); }}
      onDragEnd={() => setDragState({ from: null, over: null, position: null })}
    >
      <div className="section-head" onClick={() => setOpen(o => !o)}>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span className="grip"><Icon name="grip" size={14} /></span>
          <span className="section-title">{title}</span>
        </span>
        <Icon name="chevronD" size={14} color="#9CA3AF" style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

// ---------- Customizer Panel ----------
function CustomizerPanel({ design, setDesign, spacing, setSpacing, display, setDisplay }) {
  const [tab, setTab] = useState('design');
  const setDesignField = (k, v) => setDesign(d => ({ ...d, [k]: v }));
  const toggleTarget = (k) => setDesign(d => ({ ...d, accentTargets: { ...d.accentTargets, [k]: !d.accentTargets[k] } }));

  return (
    <>
      <div className="ptabs">
        {[
          { id: 'design', label: 'Design' },
          { id: 'spacing', label: 'Spacing' },
          { id: 'sections', label: 'Sections' },
        ].map(t => (
          <div key={t.id} className={'ptab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
      </div>

      {tab === 'design' && (
        <>
          <Section title="Accent Color">
            <div className="swatches">
              {COLORS.map(c => (
                <button key={c} className={'swatch' + (design.accentColor === c ? ' active' : '')} style={{ background: c }} onClick={() => setDesignField('accentColor', c)} />
              ))}
              <label className="swatch" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', cursor: 'pointer' }}>
                <input type="color" value={design.accentColor} onChange={e => setDesignField('accentColor', e.target.value)} style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </label>
            </div>
          </Section>

          <Section title="Apply accent color to">
            {[
              ['name', 'Name'], ['jobTitle', 'Job title'], ['headings', 'Headings'], ['headingsLine', 'Headings line'],
              ['headerIcons', 'Header icons'], ['dotsBarsBubbles', 'Dots / Bars / Bubbles'],
              ['dates', 'Dates'], ['entrySubtitle', 'Entry subtitle'], ['linkIcons', 'Link icons'],
            ].map(([k, label]) => (
              <Check key={k} checked={design.accentTargets[k]} onChange={() => toggleTarget(k)}>{label}</Check>
            ))}
          </Section>

          <Section title="Font Family">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FONTS.map(f => (
                <div key={f.name} className={'font-row' + (design.fontFamily === f.name ? ' active' : '')} onClick={() => setDesignField('fontFamily', f.name)} style={{ fontFamily: `'${f.name}', sans-serif` }}>
                  <div>
                    <div className="font-name">{f.name}</div>
                    <div className="font-sample">{f.sample}</div>
                  </div>
                  {design.fontFamily === f.name && <Icon name="check" size={14} color="#185FA5" />}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Header Alignment">
            <Seg
              value={design.headerAlignment}
              onChange={v => setDesignField('headerAlignment', v)}
              options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }]}
            />
          </Section>

          <Section title="Details Arrangement">
            <div className="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[1, 2, 3].map(n => (
                <button key={n} className={'tile' + (design.detailsArrangement === n ? ' active' : '')} style={{ aspectRatio: '1.4' }} onClick={() => setDesignField('detailsArrangement', n)}>
                  <ArrangementGlyph n={n} />
                </button>
              ))}
            </div>
            <div className="panel-sub" style={{ fontSize: 11 }}>
              {design.detailsArrangement === 1 && 'Single inline row'}
              {design.detailsArrangement === 2 && 'Wrap across two lines'}
              {design.detailsArrangement === 3 && 'Stacked, one per line'}
            </div>
          </Section>

          <Section title="Details Separator">
            <Seg
              value={design.detailsSeparator}
              onChange={v => setDesignField('detailsSeparator', v)}
              options={[
                { value: 'icon', label: 'Icon' },
                { value: 'bullet', label: 'Bullet' },
                { value: 'bar', label: 'Bar' },
              ]}
            />
          </Section>

          <Section title="Icon Style">
            <div className="tiles" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <button key={n} className={'tile' + (design.headerIconStyle === n ? ' active' : '')} style={{ aspectRatio: '1' }} onClick={() => setDesignField('headerIconStyle', n)}>
                  <HdrIcon kind="mail" style={n} color={design.accentTargets.headerIcons ? design.accentColor : '#2C2C2A'} size={11} />
                </button>
              ))}
            </div>
          </Section>
        </>
      )}

      {tab === 'spacing' && (
        <>
          <Section title="Text">
            <Slider label="Font size" value={spacing.fontSize} min={8} max={14} step={0.5} unit="pt" onChange={v => setSpacing(s => ({ ...s, fontSize: v }))} />
            <Slider label="Line height" value={spacing.lineHeight} min={1} max={1.8} step={0.05} onChange={v => setSpacing(s => ({ ...s, lineHeight: v }))} />
          </Section>
          <Section title="Page Margins">
            <Slider label="Left & right margin" value={spacing.leftRightMargin} min={5} max={30} unit="mm" onChange={v => setSpacing(s => ({ ...s, leftRightMargin: v }))} />
            <Slider label="Top & bottom margin" value={spacing.topBottomMargin} min={5} max={30} unit="mm" onChange={v => setSpacing(s => ({ ...s, topBottomMargin: v }))} />
          </Section>
          <Section title="Entries">
            <Slider label="Space between entries" value={spacing.entrySpacing} min={0} max={6} step={0.5} onChange={v => setSpacing(s => ({ ...s, entrySpacing: v }))} />
          </Section>
        </>
      )}

      {tab === 'sections' && (
        <>
          <Section title="Skills">
            <div>
              <label className="label">Layout</label>
              <div className="tiles" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {['grid', 'rows', 'compact', 'bubble', 'level'].map(l => (
                  <button key={l} className={'tile' + (display.skills.layout === l ? ' active' : '')} style={{ aspectRatio: '1', textTransform: 'capitalize' }} onClick={() => setDisplay(d => ({ ...d, skills: { ...d.skills, layout: l } }))}>
                    <SkillsLayoutGlyph layout={l} />
                  </button>
                ))}
              </div>
              <div className="panel-sub" style={{ marginTop: 6, textTransform: 'capitalize', fontSize: 11 }}>{display.skills.layout}</div>
            </div>

            {display.skills.layout === 'grid' && (
              <div>
                <label className="label">Columns</label>
                <Seg
                  value={display.skills.columns}
                  onChange={v => setDisplay(d => ({ ...d, skills: { ...d.skills, columns: v } }))}
                  options={[2, 3, 4].map(n => ({ value: n, label: `${n} cols` }))}
                />
              </div>
            )}
            {display.skills.layout === 'rows' && (
              <>
                <div>
                  <label className="label">Row spacing</label>
                  <Seg
                    value={display.skills.rowSpacing}
                    onChange={v => setDisplay(d => ({ ...d, skills: { ...d.skills, rowSpacing: v } }))}
                    options={[{ value: 'compact', label: 'Compact' }, { value: 'spacious', label: 'Spacious' }]}
                  />
                </div>
                <Check checked={display.skills.startWithBullets} onChange={v => setDisplay(d => ({ ...d, skills: { ...d.skills, startWithBullets: v } }))}>Start with bullets</Check>
                <div>
                  <label className="label">Subinfo style</label>
                  <Seg
                    value={display.skills.subinfoStyle}
                    onChange={v => setDisplay(d => ({ ...d, skills: { ...d.skills, subinfoStyle: v } }))}
                    options={[{ value: 'dash', label: '— Dash' }, { value: 'paren', label: '( Paren )' }, { value: 'colon', label: ': Colon' }]}
                  />
                </div>
              </>
            )}
            {display.skills.layout === 'level' && (
              <div>
                <label className="label">Level indicator</label>
                <Seg
                  value={display.skills.levelStyle}
                  onChange={v => setDisplay(d => ({ ...d, skills: { ...d.skills, levelStyle: v } }))}
                  options={[{ value: 'dots', label: 'Dots' }, { value: 'bars', label: 'Bars' }, { value: 'text', label: 'Text' }]}
                />
              </div>
            )}
          </Section>

          <Section title="Education">
            <label className="label">Display order</label>
            <Seg
              value={display.education.order}
              onChange={v => setDisplay(d => ({ ...d, education: { ...d.education, order: v } }))}
              options={[{ value: 'school-degree', label: 'School → Degree' }, { value: 'degree-school', label: 'Degree → School' }]}
            />
          </Section>

          <Section title="Work Experience">
            <label className="label">Display order</label>
            <Seg
              value={display.experience.order}
              onChange={v => setDisplay(d => ({ ...d, experience: { ...d.experience, order: v } }))}
              options={[{ value: 'title-employer', label: 'Title → Employer' }, { value: 'employer-title', label: 'Employer → Title' }]}
            />
          </Section>
        </>
      )}
    </>
  );
}

// ---------- Add Content modal ----------
function AddSectionModal({ open, onClose, onPick, sectionOrder }) {
  if (!open) return null;
  const order = ['education', 'experience', 'skills', 'languages', 'certificates', 'interests', 'projects', 'courses', 'awards', 'organisations', 'publications', 'references', 'declaration', 'custom'];
  const labelOverride = { experience: 'WORK EXPERIENCE', skills: 'SKILLS & TOOLS', education: 'EDUCATION' };
  const builtin = { experience: 'briefcase', skills: 'type', education: 'type' };
  const builtinDesc = {
    experience: 'Add your professional roles and employer history including internships.',
    skills: 'Add your hard and soft skills that help you stand out from the crowd today.',
    education: 'Add your degrees and schools. Include your focus, honors, or exchange terms.',
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Add content</div>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-grid">
          {order.map(id => {
            const def = SECTION_TYPES[id];
            const isCore = !def;
            const isCustom = id === 'custom';
            const inUse = !isCustom && !def?.multiple && sectionOrder.some(s => s === id || s.startsWith(id + '_'));
            const label = isCore ? labelOverride[id] : def.label.toUpperCase();
            const icon = isCore ? builtin[id] : def.icon;
            const desc = isCore ? builtinDesc[id] : def.desc;
            return (
              <button key={id} className={'stype' + (isCustom ? ' custom' : '') + (inUse ? ' disabled' : '')} onClick={() => !inUse && onPick(id)} disabled={inUse}>
                <div className="stype-head">
                  <Icon name={icon} size={16} />
                  <span>{label}</span>
                  {inUse && <span className="stype-badge">Added</span>}
                </div>
                <div className="stype-desc">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Content Panel (edits the resume data live) ----------
function ContentPanel({ data, setData, extras, setExtras, sectionOrder, setSectionOrder }) {
  const [dragState, setDragState] = useState({ from: null, over: null, position: null });
  const [picker, setPicker] = useState(false);
  const update = (path, value) => {
    setData(d => {
      const next = JSON.parse(JSON.stringify(d));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };
  const setList = (key, fn) => setData(d => ({ ...d, [key]: fn(d[key]) }));
  const reorder = (fromId, toId, position) => {
    setSectionOrder(order => {
      const arr = order.filter(x => x !== fromId);
      const idx = arr.indexOf(toId);
      arr.splice(position === 'above' ? idx : idx + 1, 0, fromId);
      return arr;
    });
  };
  const handlePickType = (type) => {
    setPicker(false);
    if (type === 'experience' || type === 'skills' || type === 'education') {
      if (!sectionOrder.includes(type)) setSectionOrder(o => [...o, type]);
      return;
    }
    const def = SECTION_TYPES[type];
    let id = type;
    if (def.multiple) {
      let i = 1;
      while (sectionOrder.includes(`${type}_${i}`)) i++;
      id = `${type}_${i}`;
    }
    const initial = def.layout === 'single' || def.layout === 'custom' ? { ...def.single } : [def.empty()];
    setExtras(x => ({ ...x, [id]: initial }));
    setSectionOrder(o => [...o, id]);
  };
  const removeSection = (id) => {
    setSectionOrder(o => o.filter(s => s !== id));
    if (!['summary', 'skills', 'experience', 'education'].includes(id)) setExtras(x => { const n = { ...x }; delete n[id]; return n; });
  };

  const renderSection = (id) => {
    const common = { id, onReorder: reorder, dragState, setDragState };
    if (id === 'summary') return (
      <DraggableSection key={id} {...common} title="Summary" onRemove={() => removeSection(id)}>
        <textarea className="textarea" rows={5} value={data.summary} onChange={e => update('summary', e.target.value)} />
      </DraggableSection>
    );
    if (id === 'skills') return (
      <DraggableSection key={id} {...common} title="Skills" onRemove={() => removeSection(id)}>
        {data.skills.map((s, i) => (
          <div key={i} className="bullet-row">
            <input className="input" value={s.name} onChange={e => setList('skills', list => list.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <div className="level-pick">
              {[1, 2, 3].map(lv => (
                <button key={lv} className={s.level === lv ? 'active' : ''} title={['', 'Beginner', 'Intermediate', 'Advanced'][lv]} onClick={() => setList('skills', list => list.map((x, j) => j === i ? { ...x, level: lv } : x))}>
                  <span style={{ width: 4 + lv * 2, height: 4 + lv * 2, borderRadius: '50%', background: '#185FA5' }} />
                </button>
              ))}
            </div>
            <button className="icon-btn danger" onClick={() => setList('skills', list => list.filter((_, j) => j !== i))}><Icon name="trash" size={13} /></button>
          </div>
        ))}
        <button className="add-btn" onClick={() => setList('skills', list => [...list, { name: 'New skill', level: 2 }])}>
          <Icon name="plus" size={12} color="#185FA5" /> Add skill
        </button>
      </DraggableSection>
    );
    if (id === 'experience') return (
      <DraggableSection key={id} {...common} title="Work Experience" onRemove={() => removeSection(id)}>
        {data.experience.map((e, i) => <ExperienceCard key={i} entry={e} onChange={fn => setList('experience', list => list.map((x, j) => j === i ? fn(x) : x))} onDelete={() => setList('experience', list => list.filter((_, j) => j !== i))} />)}
        <button className="add-btn" onClick={() => setList('experience', list => [...list, { title: 'New role', employer: 'Company', dates: 'YYYY — Present', location: '', bullets: ['Describe an accomplishment'] }])}>
          <Icon name="plus" size={12} color="#185FA5" /> Add experience
        </button>
      </DraggableSection>
    );
    if (id === 'education') return (
      <DraggableSection key={id} {...common} title="Education" onRemove={() => removeSection(id)}>
        {data.education.map((e, i) => <EducationCard key={i} entry={e} onChange={fn => setList('education', list => list.map((x, j) => j === i ? fn(x) : x))} onDelete={() => setList('education', list => list.filter((_, j) => j !== i))} />)}
        <button className="add-btn" onClick={() => setList('education', list => [...list, { school: 'New school', degree: 'Degree', dates: '', location: '' }])}>
          <Icon name="plus" size={12} color="#185FA5" /> Add education
        </button>
      </DraggableSection>
    );
    // Extra dynamic section
    const baseType = id.split('_')[0];
    const def = SECTION_TYPES[baseType];
    if (!def) return null;
    const value = extras[id];
    const setValue = (v) => setExtras(x => ({ ...x, [id]: typeof v === 'function' ? v(x[id]) : v }));
    return (
      <DraggableSection key={id} {...common} title={def.layout === 'custom' ? (value?.heading || def.heading) : def.heading} onRemove={() => removeSection(id)}>
        <ExtraSectionEditor def={def} value={value} setValue={setValue} />
      </DraggableSection>
    );
  };

  return (
    <>
      <Section title="Personal Details">
        <div className="field">
          <label className="label">Full name</label>
          <input className="input" value={data.name} onChange={e => update('name', e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Job title</label>
          <input className="input" value={data.title} onChange={e => update('title', e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field"><label className="label">Email</label><input className="input" value={data.email} onChange={e => update('email', e.target.value)} /></div>
          <div className="field"><label className="label">Phone</label><input className="input" value={data.phone} onChange={e => update('phone', e.target.value)} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label className="label">Location</label><input className="input" value={data.location} onChange={e => update('location', e.target.value)} /></div>
          <div className="field"><label className="label">Link</label><input className="input" value={data.link} onChange={e => update('link', e.target.value)} /></div>
        </div>
      </Section>

      {sectionOrder.map(id => renderSection(id))}

      <div className="add-section-cta">
        <button className="add-btn" onClick={() => setPicker(true)}>
          <Icon name="plus" size={13} color="#fff" /> Add section
        </button>
      </div>

      <AddSectionModal open={picker} onClose={() => setPicker(false)} onPick={handlePickType} sectionOrder={sectionOrder} />
    </>
  );
}

// Editor for extras: list of entries OR single-record (declaration/custom)
function ExtraSectionEditor({ def, value, setValue }) {
  if (def.layout === 'single' || def.layout === 'custom') {
    const v = value || def.single;
    const set = (k, val) => setValue({ ...v, [k]: val });
    if (def.layout === 'custom') {
      return (
        <>
          <div className="field"><label className="label">Section heading</label><input className="input" value={v.heading || ''} onChange={e => set('heading', e.target.value)} /></div>
          <div className="field"><label className="label">Body</label><textarea className="textarea" rows={6} value={v.body || ''} onChange={e => set('body', e.target.value)} /></div>
        </>
      );
    }
    return (
      <>
        <div className="field"><label className="label">Declaration text</label><textarea className="textarea" rows={4} value={v.text || ''} onChange={e => set('text', e.target.value)} /></div>
        <div className="field-row">
          <div className="field"><label className="label">Signature name</label><input className="input" value={v.signature || ''} onChange={e => set('signature', e.target.value)} /></div>
          <div className="field"><label className="label">Date</label><input className="input" value={v.date || ''} onChange={e => set('date', e.target.value)} /></div>
        </div>
      </>
    );
  }
  const items = Array.isArray(value) ? value : [];
  const update = (i, k, val) => setValue(items.map((it, j) => j === i ? { ...it, [k]: val } : it));
  const remove = (i) => setValue(items.filter((_, j) => j !== i));
  const add = () => setValue([...items, def.empty()]);
  return (
    <>
      {items.map((it, i) => (
        <EntryCard key={i} title={it[def.titleKey] || `(Untitled)`} sub={def.subKey ? it[def.subKey] : ''} onDelete={() => remove(i)} defaultOpen={items.length === 1}>
          <div className={def.fields.length > 2 ? 'field-row' : ''} style={def.fields.length > 2 ? { gridTemplateColumns: '1fr 1fr' } : {}}>
            {def.fields.filter(f => f.kind !== 'textarea').map(f => (
              <div key={f.k} className="field">
                <label className="label">{f.l}</label>
                {f.kind === 'select' ? (
                  <select className="input" value={it[f.k] || ''} onChange={e => update(i, f.k, e.target.value)}>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="input" placeholder={f.ph || ''} value={it[f.k] || ''} onChange={e => update(i, f.k, e.target.value)} />
                )}
              </div>
            ))}
          </div>
          {def.fields.filter(f => f.kind === 'textarea').map(f => (
            <div key={f.k} className="field">
              <label className="label">{f.l}</label>
              <textarea className="textarea" rows={3} value={it[f.k] || ''} onChange={e => update(i, f.k, e.target.value)} />
            </div>
          ))}
        </EntryCard>
      ))}
      <button className="add-btn" onClick={add}><Icon name="plus" size={12} color="#185FA5" /> Add {def.label.toLowerCase()}</button>
    </>
  );
}

function EntryCard({ title, sub, onDelete, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="entry-card">
      <div className="entry-head" onClick={() => setOpen(o => !o)}>
        <span className="drag-handle"><Icon name="grip" size={14} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="entry-title">{title}</div>
          {sub && <div className="entry-sub">{sub}</div>}
        </div>
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}><Icon name="chevronD" size={14} style={{ transform: open ? 'none' : 'rotate(-90deg)' }} /></button>
        <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Icon name="trash" size={13} /></button>
      </div>
      {open && <div className="entry-body">{children}</div>}
    </div>
  );
}

function ExperienceCard({ entry, onChange, onDelete }) {
  const set = (k, v) => onChange(e => ({ ...e, [k]: v }));
  return (
    <EntryCard title={entry.title || '(Untitled role)'} sub={[entry.employer, entry.dates].filter(Boolean).join(' · ')} onDelete={onDelete}>
      <div className="field-row">
        <div className="field"><label className="label">Job title</label><input className="input" value={entry.title} onChange={e => set('title', e.target.value)} /></div>
        <div className="field"><label className="label">Employer</label><input className="input" value={entry.employer} onChange={e => set('employer', e.target.value)} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label className="label">Dates</label><input className="input" value={entry.dates} onChange={e => set('dates', e.target.value)} /></div>
        <div className="field"><label className="label">Location</label><input className="input" value={entry.location} onChange={e => set('location', e.target.value)} /></div>
      </div>
      <div className="field">
        <label className="label">Bullets</label>
        {entry.bullets.map((b, i) => (
          <div key={i} className="bullet-row" style={{ marginBottom: 6 }}>
            <input className="input" value={b} onChange={e => onChange(en => ({ ...en, bullets: en.bullets.map((x, j) => j === i ? e.target.value : x) }))} />
            <button className="icon-btn danger" onClick={() => onChange(en => ({ ...en, bullets: en.bullets.filter((_, j) => j !== i) }))}><Icon name="trash" size={13} /></button>
          </div>
        ))}
        <button className="add-btn" onClick={() => onChange(en => ({ ...en, bullets: [...en.bullets, 'New bullet point'] }))}><Icon name="plus" size={12} color="#185FA5" />Add bullet</button>
      </div>
    </EntryCard>
  );
}

function EducationCard({ entry, onChange, onDelete }) {
  const set = (k, v) => onChange(e => ({ ...e, [k]: v }));
  return (
    <EntryCard title={entry.school || '(Untitled)'} sub={[entry.degree, entry.dates].filter(Boolean).join(' · ')} onDelete={onDelete}>
      <div className="field-row">
        <div className="field"><label className="label">School</label><input className="input" value={entry.school} onChange={e => set('school', e.target.value)} /></div>
        <div className="field"><label className="label">Degree</label><input className="input" value={entry.degree} onChange={e => set('degree', e.target.value)} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label className="label">Dates</label><input className="input" value={entry.dates} onChange={e => set('dates', e.target.value)} /></div>
        <div className="field"><label className="label">Location</label><input className="input" value={entry.location} onChange={e => set('location', e.target.value)} /></div>
      </div>
    </EntryCard>
  );
}

// Tiny glyphs for picker tiles
const ArrangementGlyph = ({ n }) => {
  const dot = <span style={{ width: 4, height: 4, background: '#9CA3AF', borderRadius: 2 }} />;
  if (n === 1) return <div style={{ display: 'flex', gap: 3 }}>{dot}{dot}{dot}{dot}</div>;
  if (n === 2) return <div style={{ display: 'grid', gap: 3 }}><div style={{ display: 'flex', gap: 3 }}>{dot}{dot}</div><div style={{ display: 'flex', gap: 3 }}>{dot}{dot}</div></div>;
  return <div style={{ display: 'grid', gap: 3 }}>{dot}{dot}{dot}{dot}</div>;
};

const SkillsLayoutGlyph = ({ layout }) => {
  const stroke = '#9CA3AF';
  if (layout === 'grid') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, width: 22, height: 16 }}>
      <span style={{ background: stroke, borderRadius: 1 }} /><span style={{ background: stroke, borderRadius: 1 }} />
      <span style={{ background: stroke, borderRadius: 1 }} /><span style={{ background: stroke, borderRadius: 1 }} />
    </div>
  );
  if (layout === 'rows') return (
    <div style={{ display: 'grid', gap: 3, width: 22 }}>
      <span style={{ height: 3, background: stroke, borderRadius: 1 }} />
      <span style={{ height: 3, background: stroke, borderRadius: 1, width: '70%' }} />
      <span style={{ height: 3, background: stroke, borderRadius: 1, width: '85%' }} />
    </div>
  );
  if (layout === 'compact') return <div style={{ fontSize: 8, color: stroke }}>A · B · C · D</div>;
  if (layout === 'bubble') return (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: 28 }}>
      {[6, 8, 5, 7].map((w, i) => <span key={i} style={{ width: w, height: 5, background: stroke, borderRadius: 999 }} />)}
    </div>
  );
  if (layout === 'level') return (
    <div style={{ display: 'grid', gap: 2 }}>
      {[3, 2, 3].map((n, i) => (
        <div key={i} style={{ display: 'flex', gap: 1 }}>{[1, 2, 3].map(d => <span key={d} style={{ width: 3, height: 3, background: d <= n ? stroke : '#E5E7EB', borderRadius: '50%' }} />)}</div>
      ))}
    </div>
  );
  return null;
};

// ---------- Resume Preview ----------
// Single template that respects ALL settings via inline styles + conditional JSX.
function ResumePreview({ design, spacing, display, data, extras, sectionOrder, zoom }) {
  // Clamp + sanitize at render
  const safe = (n, lo, hi, dflt) => (typeof n === 'number' && !isNaN(n) ? Math.max(lo, Math.min(hi, n)) : dflt);
  const fontSize = safe(spacing.fontSize, 8, 14, DEFAULT_SPACING.fontSize);
  const lineHeight = safe(spacing.lineHeight, 1, 1.8, DEFAULT_SPACING.lineHeight);
  const padX = safe(spacing.leftRightMargin, 5, 30, DEFAULT_SPACING.leftRightMargin);
  const padY = safe(spacing.topBottomMargin, 5, 30, DEFAULT_SPACING.topBottomMargin);
  const entryGapPx = safe(spacing.entrySpacing, 0, 6, DEFAULT_SPACING.entrySpacing) * fontSize * lineHeight;

  const hexOk = (c) => typeof c === 'string' && /^#([0-9a-f]{3}){1,2}$/i.test(c);
  const accent = hexOk(design.accentColor) ? design.accentColor : DEFAULT_DESIGN.accentColor;
  const t = design.accentTargets;
  const colIf = (on) => on ? accent : undefined;

  // Page wrapper: padding in mm, fontFamily/fontSize/lineHeight at root so children inherit
  const pageStyle = {
    fontFamily: `'${design.fontFamily}', sans-serif`,
    fontSize: `${fontSize}pt`,
    lineHeight,
    paddingLeft: `${padX}mm`,
    paddingRight: `${padX}mm`,
    paddingTop: `${padY}mm`,
    paddingBottom: `${padY}mm`,
    color: '#2C2C2A',
  };

  const Heading = ({ children }) => (
    <div style={{ marginTop: '1.4em', marginBottom: '0.4em' }}>
      <div style={{ fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: colIf(t.headings) || '#2C2C2A' }}>{children}</div>
      <div style={{ height: 1.5, background: colIf(t.headingsLine) || '#D1DCE8', marginTop: 4 }} />
    </div>
  );

  const SepDot = () => <span style={{ color: '#9CA3AF', margin: '0 6px' }}>·</span>;
  const SepBar = () => <span style={{ color: '#9CA3AF', margin: '0 8px' }}>|</span>;

  const detailItem = (kind, text) => {
    const sep = design.detailsSeparator;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        {sep === 'icon' && <HdrIcon kind={kind} style={design.headerIconStyle} color={colIf(t.headerIcons) || '#6B7280'} size={fontSize - 2} />}
        <span>{text}</span>
      </span>
    );
  };

  const details = [
    ['mail', data.email], ['phone', data.phone], ['pin', data.location], ['link', data.link],
  ];

  // Arrangement: 1 = inline single line; 2 = wrap 2-up (default), 3 = stacked one per line
  const detailsBlock = (() => {
    const cols = design.detailsArrangement;
    const wrapStyle = {
      display: cols === 3 ? 'flex' : 'flex',
      flexDirection: cols === 3 ? 'column' : 'row',
      flexWrap: cols === 2 ? 'wrap' : 'nowrap',
      gap: cols === 3 ? 4 : 0,
      justifyContent: design.headerAlignment === 'center' ? 'center' : 'flex-start',
      maxWidth: cols === 2 ? '60%' : undefined,
      fontSize: '0.92em',
      color: '#6B7280',
      marginTop: 8,
    };
    if (cols === 3) {
      return <div style={wrapStyle}>{details.map(([k, v]) => <div key={k}>{detailItem(k, v)}</div>)}</div>;
    }
    if (cols === 2) {
      // grid 2 columns
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 18px', marginTop: 8, fontSize: '0.92em', color: '#6B7280', maxWidth: design.headerAlignment === 'center' ? '70%' : '85%', marginLeft: design.headerAlignment === 'center' ? 'auto' : 0, marginRight: design.headerAlignment === 'center' ? 'auto' : 0 }}>
          {details.map(([k, v]) => <div key={k}>{detailItem(k, v)}</div>)}
        </div>
      );
    }
    // 1 = single inline row with separators
    return (
      <div style={wrapStyle}>
        {details.map(([k, v], i) => (
          <React.Fragment key={k}>
            {i > 0 && design.detailsSeparator === 'bullet' && <SepDot />}
            {i > 0 && design.detailsSeparator === 'bar' && <SepBar />}
            {i > 0 && design.detailsSeparator === 'icon' && <span style={{ width: 10 }} />}
            {detailItem(k, v)}
          </React.Fragment>
        ))}
      </div>
    );
  })();

  // Skills layouts
  const skillsBlock = (() => {
    const layout = display.skills.layout;
    const items = data.skills;
    const dotColor = colIf(t.dotsBarsBubbles) || '#185FA5';

    if (layout === 'grid') {
      const cols = display.skills.columns || 2;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, columnGap: 24, rowGap: 4 }}>
          {items.map(s => <div key={s.name}>{s.name}</div>)}
        </div>
      );
    }
    if (layout === 'rows') {
      const rowGap = display.skills.rowSpacing === 'compact' ? 2 : 6;
      const sub = display.skills.subinfoStyle;
      const groups = [
        ['Frontend', items.slice(0, 5).map(s => s.name)],
        ['Tooling', items.slice(5).map(s => s.name)],
      ];
      const subRender = (label, list) => {
        const txt = list.join(', ');
        if (sub === 'dash') return <><strong style={{ marginRight: 6 }}>{label} —</strong>{txt}</>;
        if (sub === 'paren') return <><strong style={{ marginRight: 6 }}>{label}</strong>({txt})</>;
        return <><strong style={{ marginRight: 6 }}>{label}:</strong>{txt}</>;
      };
      return (
        <div style={{ display: 'grid', rowGap }}>
          {groups.map(([g, list]) => (
            <div key={g} style={{ display: 'flex', gap: 6 }}>
              {display.skills.startWithBullets && <span style={{ color: dotColor }}>•</span>}
              <div>{subRender(g, list)}</div>
            </div>
          ))}
        </div>
      );
    }
    if (layout === 'compact') {
      return <div>{items.map(s => s.name).join(' · ')}</div>;
    }
    if (layout === 'bubble') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map(s => (
            <span key={s.name} style={{ padding: '3px 10px', borderRadius: 999, background: colIf(t.dotsBarsBubbles) ? accent + '1A' : '#F3F4F6', color: colIf(t.dotsBarsBubbles) || '#2C2C2A', fontSize: '0.9em' }}>{s.name}</span>
          ))}
        </div>
      );
    }
    if (layout === 'level') {
      const style = display.skills.levelStyle;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 6 }}>
          {items.map(s => (
            <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{s.name}</span>
              {style === 'dots' && (
                <span style={{ display: 'inline-flex', gap: 3 }}>
                  {[1, 2, 3].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= s.level ? dotColor : '#E5E7EB' }} />)}
                </span>
              )}
              {style === 'bars' && (
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  {[1, 2, 3].map(i => <span key={i} style={{ width: 12, height: 4, borderRadius: 1, background: i <= s.level ? dotColor : '#E5E7EB' }} />)}
                </span>
              )}
              {style === 'text' && <span style={{ color: '#6B7280', fontSize: '0.85em' }}>{['', 'Beginner', 'Intermediate', 'Advanced'][s.level]}</span>}
            </div>
          ))}
        </div>
      );
    }
    return null;
  })();

  // Experience entries (order swap)
  const expBlock = (
    <div>
      {data.experience.map((e, i) => {
        const primary = display.experience.order === 'title-employer' ? e.title : e.employer;
        const secondary = display.experience.order === 'title-employer' ? e.employer : e.title;
        return (
          <div key={i} style={{ marginBottom: i < data.experience.length - 1 ? entryGapPx : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', whiteSpace: 'nowrap' }}>{e.dates}</div>
            </div>
            <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280', marginTop: 1 }}>{secondary} · {e.location}</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {e.bullets.map((b, j) => <li key={j} style={{ marginBottom: 1 }}>{b}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );

  // Education entries (order swap)
  const eduBlock = (
    <div>
      {data.education.map((e, i) => {
        const primary = display.education.order === 'school-degree' ? e.school : e.degree;
        const secondary = display.education.order === 'school-degree' ? e.degree : e.school;
        return (
          <div key={i} style={{ marginBottom: i < data.education.length - 1 ? entryGapPx : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontWeight: 700 }}>{primary}</div>
              <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280' }}>{e.dates}</div>
            </div>
            <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280' }}>{secondary} · {e.location}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="page-wrap" style={{ transform: `scale(${zoom})`, marginBottom: zoom < 1 ? -((1 - zoom) * 1123) : 0 }}>
      <div className="page" style={pageStyle}>
        {/* Header */}
        <div style={{ textAlign: design.headerAlignment }}>
          <div style={{ fontSize: '2.2em', fontWeight: 700, letterSpacing: '-0.02em', color: colIf(t.name) || '#2C2C2A', lineHeight: 1 }}>{data.name}</div>
          <div style={{ fontSize: '1.05em', fontWeight: 500, color: colIf(t.jobTitle) || accent, marginTop: 4 }}>{data.title}</div>
          {detailsBlock}
        </div>

        {(sectionOrder || DEFAULT_SECTION_ORDER).map(id => {
          if (id === 'summary') return <React.Fragment key={id}><Heading>Summary</Heading><div>{data.summary}</div></React.Fragment>;
          if (id === 'skills') return <React.Fragment key={id}><Heading>Skills</Heading>{skillsBlock}</React.Fragment>;
          if (id === 'experience') return <React.Fragment key={id}><Heading>Experience</Heading>{expBlock}</React.Fragment>;
          if (id === 'education') return <React.Fragment key={id}><Heading>Education</Heading>{eduBlock}</React.Fragment>;
          // Extra dynamic sections
          const baseType = id.split('_')[0];
          const def = SECTION_TYPES[baseType];
          if (!def || !extras) return null;
          const value = extras[id];
          if (value === undefined) return null;
          if (def.layout === 'custom') {
            return <React.Fragment key={id}><Heading>{value.heading || def.heading}</Heading><div style={{ whiteSpace: 'pre-wrap' }}>{value.body}</div></React.Fragment>;
          }
          if (def.layout === 'single') {
            return (
              <React.Fragment key={id}>
                <Heading>{def.heading}</Heading>
                <div style={{ whiteSpace: 'pre-wrap' }}>{value.text}</div>
                {(value.signature || value.date) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.9em', color: '#6B7280' }}>
                    <span>{value.signature}</span><span>{value.date}</span>
                  </div>
                )}
              </React.Fragment>
            );
          }
          // List layouts: 'entries' (title-led), 'inline' (chips), 'simple' (bullets)
          const items = Array.isArray(value) ? value : [];
          if (def.layout === 'chips') {
            return (
              <React.Fragment key={id}>
                <Heading>{def.heading}</Heading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {items.map((it, i) => <span key={i} style={{ padding: '3px 10px', borderRadius: 999, background: '#F3F4F6', fontSize: '0.9em' }}>{it[def.titleKey]}{it.level ? ` · ${it.level}` : ''}</span>)}
                </div>
              </React.Fragment>
            );
          }
          if (def.layout === 'twocol') {
            return (
              <React.Fragment key={id}>
                <Heading>{def.heading}</Heading>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {items.map((it, i) => <li key={i} style={{ marginBottom: 2 }}><strong>{it[def.titleKey]}</strong>{it[def.subKey] ? ` — ${it[def.subKey]}` : ''}{it.date ? `, ${it.date}` : ''}</li>)}
                </ul>
              </React.Fragment>
            );
          }
          // entries (default for projects, certificates, courses, awards, organisations, publications, references)
          return (
            <React.Fragment key={id}>
              <Heading>{def.heading}</Heading>
              <div>
                {items.map((it, i) => (
                  <div key={i} style={{ marginBottom: i < items.length - 1 ? entryGapPx : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                      <div style={{ fontWeight: 700 }}>{it[def.titleKey]}</div>
                      {(it.date || it.dates) && <div style={{ fontSize: '0.85em', color: colIf(t.dates) || '#6B7280', whiteSpace: 'nowrap' }}>{it.date || it.dates}</div>}
                    </div>
                    {def.subKey && it[def.subKey] && <div style={{ fontSize: '0.92em', color: colIf(t.entrySubtitle) || '#6B7280', marginTop: 1 }}>{it[def.subKey]}</div>}
                    {it.description && <div style={{ marginTop: 3 }}>{it.description}</div>}
                  </div>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---------- App ----------
function ResumeTemplateHost(props) {
  const renderers = window.TEMPLATE_RENDERERS || {};
  const Tpl = renderers[props.templateId];
  if (Tpl) return <Tpl {...props} />;
  return <ResumePreview {...props} />;
}

function TemplateSwitcher({ templateId, setTemplateId, previewProps }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const TEMPLATES = window.TEMPLATES || {};
  const current = TEMPLATES[templateId] || { name: 'Modern', tone: 'Default', sw1: '#185FA5', sw2: '#F4F8FC' };
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="tmpl-switch" onClick={() => setOpen(o => !o)} title="Switch template">
        <span className="swatch-pair"><span style={{ background: current.sw1 }} /><span style={{ background: current.sw2 }} /></span>
        <span className="tmpl-label">
          <span>Template · {current.name}</span>
        </span>
        <Icon name="chevronD" size={11} color="#6B7280" />
      </button>
      {open && (
        <div className="tmpl-menu">
          <h4>Choose a template</h4>
          <div style={{ fontSize: 11, color: 'var(--c-text-2)', marginBottom: 12 }}>Your content, colors, fonts and spacing carry over to every template.</div>
          <div className="grid">
            {Object.entries(TEMPLATES).map(([id, t]) => (
              <div
                key={id}
                className={'tmpl-card' + (id === templateId ? ' active' : '')}
                onClick={() => { setTemplateId(id); setOpen(false); }}
              >
                <TemplateThumb id={id} previewProps={previewProps} />
                <div className="meta">
                  <span className="name">{t.name}</span>
                  <span className="tone">{t.tone}</span>
                  {id === templateId && <span className="badge-active">Selected</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Renders a real page preview of the template at thumbnail scale.
function TemplateThumb({ id, previewProps }) {
  const frameRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(0.21);

  // After the template renders, measure the *actual* page height and pick a
  // scale that fits both width and height of the thumbnail frame.
  React.useLayoutEffect(() => {
    if (!frameRef.current || !innerRef.current) return;
    const fit = () => {
      const frame = frameRef.current;
      const page = innerRef.current.querySelector('.page');
      if (!frame || !page) return;
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;
      const pw = 794;
      const ph = Math.max(page.scrollHeight, page.offsetHeight, 1123);
      const s = Math.min(fw / pw, fh / ph);
      setScale(s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(frameRef.current);
    if (innerRef.current.querySelector('.page')) ro.observe(innerRef.current.querySelector('.page'));
    return () => ro.disconnect();
  }, [id, previewProps]);

  if (!previewProps) {
    const TEMPLATES = window.TEMPLATES || {};
    const t = TEMPLATES[id] || {};
    return (
      <div className="thumb-frame">
        <div className="thumb-fallback" style={{ background: t.sw2 || '#fff' }}>
          <div style={{ height: '24%', background: t.sw1 || '#185FA5' }} />
        </div>
      </div>
    );
  }
  return (
    <div className="thumb-frame" ref={frameRef}>
      <div className="thumb-scale" ref={innerRef} style={{ transform: `scale(${scale})` }}>
        <ResumeTemplateHost
          {...previewProps}
          templateId={id}
          zoom={1}
        />
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState('content');
  const [templateId, setTemplateId] = useState('modern');
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [spacing, setSpacing] = useState(DEFAULT_SPACING);
  const [display, setDisplay] = useState(DEFAULT_DISPLAY);
  const [resumeData, setResumeData] = useState(INITIAL_RESUME);
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER);
  const [extras, setExtras] = useState(typeof DEFAULT_EXTRAS !== 'undefined' ? DEFAULT_EXTRAS : {});
  const [zoom, setZoom] = useState(0.85);
  const [saved, setSaved] = useState(true);
  const [pulse, setPulse] = useState(false);

  // Live save indicator (mock)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setSaved(false); setPulse(true);
    const t1 = setTimeout(() => setSaved(true), 350);
    const t2 = setTimeout(() => setPulse(false), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [design, spacing, display, resumeData, sectionOrder, extras, templateId]);

  const resetAll = () => {
    setDesign(DEFAULT_DESIGN); setSpacing(DEFAULT_SPACING); setDisplay(DEFAULT_DISPLAY);
  };

  return (
    <div>
      <header className="navbar">
        <a href="#" style={{ color: 'var(--c-text-2)' }}><Icon name="arrowLeft" size={16} /></a>
        <div className="nav-logo">
          <span className="nav-logo-mark">P</span>
          Proflect
        </div>
        <div className="crumb">
          <span>Builder</span><Icon name="chevronD" size={12} color="#9CA3AF" style={{ transform: 'rotate(-90deg)' }} />
          <span style={{ color: 'var(--c-text)', fontWeight: 500 }}>{resumeData.title} — {resumeData.experience[0]?.employer}</span>
        </div>
        <div className="nav-right">
          <span className="save-indicator" style={{ color: saved ? '#1D9E75' : '#B45309' }}>
            <Icon name={saved ? 'check' : 'save'} size={12} />
            {saved ? 'All changes saved' : 'Saving…'}
          </span>
          <TemplateSwitcher
            templateId={templateId}
            setTemplateId={setTemplateId}
            previewProps={{ templateId, design, spacing, display, data: resumeData, extras, sectionOrder }}
          />
          {mode === 'customize' && <button className="btn btn-outlined btn-sm" onClick={resetAll}>Reset design</button>}
          <button className="btn btn-outlined btn-sm">Preview</button>
          <button className="btn btn-primary btn-sm"><Icon name="download" size={12} color="#fff" />Download PDF</button>
        </div>
      </header>

      <div className="editor-shell">
        <aside className="panel">
          <div className="panel-header">
            <div className="mode-toggle">
              <button className={mode === 'content' ? 'active' : ''} onClick={() => setMode('content')}>
                <Icon name="edit" size={13} /> Content
              </button>
              <button className={mode === 'customize' ? 'active' : ''} onClick={() => setMode('customize')}>
                <Icon name="sliders" size={13} /> Customize
              </button>
            </div>
            <div className="mode-hint">
              {mode === 'content' ? 'Edit your resume content. Preview updates live.' : 'Adjust design, spacing & sections. Preview updates live.'}
            </div>
          </div>

          {mode === 'content' ? (
            <ContentPanel data={resumeData} setData={setResumeData} extras={extras} setExtras={setExtras} sectionOrder={sectionOrder} setSectionOrder={setSectionOrder} />
          ) : (
            <CustomizerPanel
              design={design} setDesign={setDesign}
              spacing={spacing} setSpacing={setSpacing}
              display={display} setDisplay={setDisplay}
            />
          )}
        </aside>

        <main className="canvas">
          <div className="canvas-toolbar">
            <div style={{ fontSize: 12, color: 'var(--c-text-2)' }}>
              A4 · {Math.round(zoom * 100)}% · Live preview reflects every change
            </div>
            <div className="zoom-pill">
              <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.05).toFixed(2)))}><Icon name="minus" size={12} /></button>
              <span className="val">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, +(z + 0.05).toFixed(2)))}><Icon name="plus" size={12} /></button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className={'live-pulse' + (pulse ? ' show' : '')}>● Preview updated</div>
            <ResumeTemplateHost templateId={templateId} design={design} spacing={spacing} display={display} data={resumeData} extras={extras} sectionOrder={sectionOrder} zoom={zoom} />
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
