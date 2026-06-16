// templates-extra.jsx — 4 additional resume templates
// All respect the same props contract as the originals: design / spacing /
// display / data / extras / sectionOrder / zoom / templateId.
// Helpers (tmplUtils, renderBody, PageWrap, PhotoPlaceholder, SEC_ICONS,
// SECTION_LABELS, SECTION_TYPES, Icon) are defined in templates.jsx and
// customizer.jsx and assumed to be in scope.

// ============================================================
// TEMPLATE 8 — AZURE WAVE
// Soft wavy blue decorations · two-column body · small-caps headings.
// ============================================================
function TemplateAzureWave(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf } = util;
  const { data, sectionOrder, design, extras } = props;

  // Default accent override: if user hasn't picked a custom color this looks
  // best with a soft sky blue.
  const wave = '#D9ECFB';
  const waveDeep = '#BBDDF6';

  const LEFT_COL = ['skills', 'languages', 'interests', 'awards', 'declaration', 'references'];
  const leftIds = sectionOrder.filter(id => LEFT_COL.includes(id.split('_')[0]));
  const rightIds = sectionOrder.filter(id => !LEFT_COL.includes(id.split('_')[0]));

  const pageStyle = {
    fontFamily: `'${design.fontFamily}', sans-serif`,
    fontSize: `${fontSize}pt`,
    lineHeight,
    color: '#2C2C2A',
    position: 'relative',
    minHeight: '100%',
    overflow: 'hidden',
  };

  const Heading = ({ children }) => (
    <div style={{ marginTop: '1.2em', marginBottom: '0.45em' }}>
      <div style={{
        fontSize: '0.74em',
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        fontWeight: 700,
        color: '#9CA3AF',
      }}>{children}</div>
    </div>
  );

  const contactRow = (kind, txt) => txt ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: '0.92em' }}>
      <Icon name={kind} size={fontSize - 2} color={colIf(t.headerIcons) || accent} />{txt}
    </span>
  ) : null;

  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        {/* Decorative waves — top + bottom, full width with soft curves */}
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '26%', pointerEvents: 'none' }}>
          {/* Back wave — deeper, more saturated */}
          <path d="M 0 0 L 200 0 L 200 55 C 165 75, 130 35, 95 55 S 30 80, 0 60 Z" fill={waveDeep} opacity="0.55" />
          {/* Front wave — soft top layer, drops lower at the right */}
          <path d="M 0 0 L 200 0 L 200 30 C 165 55, 130 15, 95 35 S 30 60, 0 40 Z" fill={wave} />
        </svg>
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20%', pointerEvents: 'none' }}>
          <path d="M 0 100 L 200 100 L 200 50 C 170 30, 130 70, 95 50 S 30 25, 0 45 Z" fill={waveDeep} opacity="0.55" />
          <path d="M 0 100 L 200 100 L 200 70 C 170 55, 130 90, 95 70 S 30 50, 0 65 Z" fill={wave} />
        </svg>

        <div style={{ position: 'relative', padding: `${padY}mm ${padX}mm` }}>
          {/* Header */}
          <div style={{ marginBottom: '1em' }}>
            <div style={{ fontSize: '2em', fontWeight: 700, letterSpacing: '-0.01em', color: colIf(t.name) || '#2C2C2A', lineHeight: 1 }}>{data.name}</div>
            <div style={{ fontSize: '0.95em', color: colIf(t.jobTitle) || accent, marginTop: 4, fontWeight: 500 }}>The role you are applying for</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 10 }}>
              {contactRow('phone', data.phone)}
              {contactRow('mail', data.email)}
              {contactRow('link', data.link)}
              {contactRow('pin', data.location)}
            </div>
          </div>

          {/* Body — two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '38% 1fr', gap: 22 }}>
            <div>
              {leftIds.map(id => (
                <React.Fragment key={id}>
                  <Heading>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
                  {renderBody(id, props, util, { skillsCols: 1 })}
                </React.Fragment>
              ))}
            </div>
            <div>
              {rightIds.map(id => {
                const base = id.split('_')[0];
                return (
                  <React.Fragment key={id}>
                    <Heading>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
                    {renderBody(id, props, util, base === 'experience' ? { expVariant: 'stacked' } : base === 'education' ? { eduVariant: 'compact' } : {})}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Footer line */}
          <div style={{ position: 'absolute', left: padX + 'mm', right: padX + 'mm', bottom: padY * 0.45 + 'mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9CA3AF', fontSize: '0.78em' }}>
            <span>{data.link || ''}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Powered by <span style={{ fontWeight: 700, color: accent }}>Proflect</span></span>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 9 — NOIR FLASH
// Dark background · yellow accent · display name · corner triangle.
// ============================================================
function TemplateNoirFlash(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf } = util;
  const { data, sectionOrder, design } = props;

  // Override accent default to bright yellow if user hasn't customized.
  const isDefaultAccent = !design.accentColor || design.accentColor === '#185FA5';
  const yellow = isDefaultAccent ? '#F5C842' : accent;
  const yellowCol = (on) => on ? yellow : undefined;

  const LEFT_COL = ['summary', 'experience', 'projects', 'awards'];
  const leftIds = sectionOrder.filter(id => LEFT_COL.includes(id.split('_')[0]));
  const rightIds = sectionOrder.filter(id => !LEFT_COL.includes(id.split('_')[0]));

  const pageStyle = {
    fontFamily: `'${design.fontFamily}', sans-serif`,
    fontSize: `${fontSize}pt`,
    lineHeight,
    color: '#E8EFF7',
    background: '#141414',
    position: 'relative',
    minHeight: '100%',
    overflow: 'hidden',
  };

  const Heading = ({ children, iconName }) => (
    <div style={{ marginTop: '1.2em', marginBottom: '0.5em', display: 'flex', alignItems: 'center', gap: 8 }}>
      {iconName && <Icon name={iconName} size={fontSize + 1} color={yellow} />}
      <span style={{
        fontSize: '1em',
        fontWeight: 800,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: yellow,
        fontFamily: `'${design.fontFamily}', sans-serif`,
      }}>{children}</span>
    </div>
  );

  const contactRow = (icon, txt) => txt ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9em', color: '#E8EFF7' }}>
      <Icon name={icon} size={fontSize - 2} color={yellow} />{txt}
    </div>
  ) : null;

  // Override body item colors via local style so muted greys read on dark.
  const darkStyle = (
    <style>{`
      .noir ul li { color: #E8EFF7; }
      .noir .muted, .noir [data-muted] { color: #9CA3AF; }
    `}</style>
  );

  return (
    <PageWrap zoom={props.zoom}>
      <div className="noir" style={pageStyle}>
        {darkStyle}
        {/* Top-right yellow diagonal */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '34%', pointerEvents: 'none' }}>
          <polygon points="100,0 100,100 0,0" fill={yellow} />
        </svg>
        {/* Bottom-right yellow band */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, right: 0, width: '55%', height: '8%', pointerEvents: 'none' }}>
          <polygon points="0,100 100,100 100,0 8,0" fill={yellow} />
        </svg>

        <div style={{ position: 'relative', padding: `${padY}mm ${padX}mm`, zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: '1em' }}>
            <div>
              <div style={{
                fontSize: '2.6em',
                fontWeight: 900,
                letterSpacing: '0.01em',
                lineHeight: 0.95,
                textTransform: 'uppercase',
                color: '#fff',
                fontFamily: `'${design.fontFamily}', sans-serif`,
              }}>{data.name.split(/\s+/).map((w, i) => <div key={i}>{w}</div>)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
              <PhotoPlaceholder size={84} shape="circle" name={data.name} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {contactRow('pin', data.location)}
                {contactRow('phone', data.phone)}
                {contactRow('mail', data.email)}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24, marginTop: 16 }}>
            <div>
              {leftIds.map(id => (
                <React.Fragment key={id}>
                  <Heading iconName={SEC_ICONS[id.split('_')[0]] || 'badge'}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
                  {renderBody(id, props, util, { expVariant: 'stacked' })}
                </React.Fragment>
              ))}
            </div>
            <div>
              {rightIds.map(id => {
                const base = id.split('_')[0];
                return (
                  <React.Fragment key={id}>
                    <Heading iconName={SEC_ICONS[base] || 'badge'}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
                    {/* Force yellow level bars on dark */}
                    <div style={{ '--noir-bar': yellow }}>
                      <NoirBody id={id} props={props} util={util} yellow={yellow} />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// Custom body for right-column on Noir — renders skills as labeled bars and
// languages with text level, both keyed to yellow.
function NoirBody({ id, props, util, yellow }) {
  const { data, display, extras } = props;
  const base = id.split('_')[0];
  if (id === 'skills') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {data.skills.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '0.92em', marginBottom: 2 }}>{s.name}</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${Math.round(s.level * 33.3)}%`, background: yellow, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (base === 'languages' && Array.isArray(extras?.[id])) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18, rowGap: 3 }}>
        {extras[id].map((it, i) => (
          <div key={i}>
            <div style={{ fontSize: '0.92em' }}>{it.name}</div>
            <div style={{ fontSize: '0.85em', color: yellow, fontWeight: 600 }}>{it.level}</div>
          </div>
        ))}
      </div>
    );
  }
  return renderBody(id, props, util, base === 'education' ? { eduVariant: 'compact' } : {});
}

// ============================================================
// TEMPLATE 10 — VERDANT CREST
// Green low-poly header band · circular photo · two-column body.
// ============================================================
function TemplateVerdantCrest(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf } = util;
  const { data, sectionOrder, design, extras } = props;

  const isDefaultAccent = !design.accentColor || design.accentColor === '#185FA5';
  const green = isDefaultAccent ? '#7BC79A' : accent;
  const greenSoft = isDefaultAccent ? '#D6EFE0' : (green + '33');
  const greenDeep = isDefaultAccent ? '#5BAE82' : accent;

  const LEFT_COL = ['experience', 'education', 'projects', 'organisations', 'publications'];
  const leftIds = sectionOrder.filter(id => LEFT_COL.includes(id.split('_')[0]));
  const rightIds = sectionOrder.filter(id => !LEFT_COL.includes(id.split('_')[0]));

  const pageStyle = {
    fontFamily: `'${design.fontFamily}', sans-serif`,
    fontSize: `${fontSize}pt`,
    lineHeight,
    color: '#1F2937',
    minHeight: '100%',
    position: 'relative',
    overflow: 'hidden',
  };

  const Heading = ({ children, iconName }) => (
    <div style={{ marginTop: '1.1em', marginBottom: '0.45em', display: 'flex', alignItems: 'center', gap: 6, color: greenDeep }}>
      {iconName && <Icon name={iconName} size={fontSize + 2} color={greenDeep} />}
      <span style={{ fontSize: '1.05em', fontWeight: 700, color: '#1F2937' }}>{children}</span>
    </div>
  );

  // SVG header polygon pattern (faceted) — drawn into the header block, not page-absolute
  const Polygons = () => (
    <svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <rect width="600" height="200" fill={greenSoft} />
      <polygon points="0,0 140,0 70,90" fill={green} opacity="0.55" />
      <polygon points="140,0 280,0 200,70 110,90" fill={greenDeep} opacity="0.32" />
      <polygon points="280,0 420,0 350,80 220,100" fill={green} opacity="0.45" />
      <polygon points="420,0 600,0 600,90 500,100 410,70" fill={greenDeep} opacity="0.28" />
      <polygon points="0,200 80,160 180,180 130,200" fill={green} opacity="0.4" />
      <polygon points="180,180 320,140 380,200 130,200" fill={greenDeep} opacity="0.25" />
      <polygon points="320,140 460,160 540,200 380,200" fill={green} opacity="0.45" />
      <polygon points="460,160 600,140 600,200 540,200" fill={greenDeep} opacity="0.3" />
      <polygon points="70,90 200,70 280,180 130,180" fill="#fff" opacity="0.18" />
    </svg>
  );

  // Language badges — circular percentage chips
  const LanguageGrid = ({ items }) => {
    const map = { Beginner: 30, Intermediate: 55, Advanced: 75, Fluent: 90, Native: 100 };
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
        {items.map((it, i) => {
          const pct = map[it.level] || 70;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', width: fontSize * 2.6, height: fontSize * 2.6, borderRadius: '50%', background: `conic-gradient(${greenDeep} ${pct}%, ${greenSoft} 0)`, display: 'grid', placeItems: 'center' }}>
                <div style={{ width: '74%', height: '74%', borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.7em', fontWeight: 700, color: greenDeep }}>{pct}<span style={{ fontSize: '0.7em', marginTop: -1 }}>%</span></div>
              </div>
              <div style={{ fontSize: '0.92em' }}>{it.name}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Skills "lollipop" bars
  const SkillsLolly = ({ items }) => {
    const max = 3;
    const subhead = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78em', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        <span style={{ width: 12, height: 1, background: greenDeep }} />Software
      </div>
    );
    return (
      <>
        {subhead}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((s, i) => {
            const pct = Math.min(100, Math.max(10, Math.round(s.level / max * 100)));
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: '0.92em' }}>{s.name}</div>
                <div style={{ position: 'relative', height: 2, background: greenSoft }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: pct + '%', background: greenDeep }} />
                  <div style={{ position: 'absolute', left: `calc(${pct}% - 4px)`, top: -3, width: 8, height: 8, background: greenDeep, borderRadius: '50%' }} />
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // Hashtag chips for "Strengths" — falls back from interests-list
  const HashChips = ({ items }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '0.92em' }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: greenDeep, fontWeight: 700 }}>#</span>{it.name}
        </span>
      ))}
    </div>
  );

  const rightRender = (id) => {
    const base = id.split('_')[0];
    if (base === 'skills') return <SkillsLolly items={data.skills} />;
    if (base === 'languages' && Array.isArray(extras?.[id])) return <LanguageGrid items={extras[id]} />;
    if (base === 'interests' && Array.isArray(extras?.[id])) return <HashChips items={extras[id]} />;
    return renderBody(id, props, util);
  };

  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        {/* Header — polygons confined here */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <Polygons />
          <div style={{ position: 'relative', padding: `${padY * 0.7}mm ${padX}mm`, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
            <PhotoPlaceholder size={84} shape="circle" name={data.name} />
            <div>
              <div style={{ fontSize: '2.2em', fontWeight: 800, letterSpacing: '-0.01em', color: colIf(t.name) || '#1F2937', lineHeight: 1 }}>{data.name}</div>
              <div style={{ fontSize: '0.95em', color: '#374151', marginTop: 6, maxWidth: 540 }}>{data.summary}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: `${padY * 0.4}mm ${padX}mm ${padY}mm`, display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 26 }}>
          <div>
            {leftIds.map(id => (
              <React.Fragment key={id}>
                <Heading iconName={SEC_ICONS[id.split('_')[0]] || 'badge'}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
                {renderBody(id, props, util, id.split('_')[0] === 'experience' ? { expVariant: 'stacked' } : id.split('_')[0] === 'education' ? { eduVariant: 'compact' } : {})}
              </React.Fragment>
            ))}
          </div>
          <div>
            {rightIds.filter(id => id !== 'summary').map(id => (
              <React.Fragment key={id}>
                <Heading iconName={SEC_ICONS[id.split('_')[0]] || 'badge'}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</Heading>
                {rightRender(id)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// ============================================================
// TEMPLATE 11 — CONFETTI
// Playful coral/blue bubbles · pill section headings · two-column body.
// ============================================================
function TemplateConfetti(props) {
  const util = tmplUtils(props);
  const { fontSize, lineHeight, padX, padY, entryGapPx, accent, t, colIf } = util;
  const { data, sectionOrder, design, extras } = props;

  const isDefaultAccent = !design.accentColor || design.accentColor === '#185FA5';
  const coral = isDefaultAccent ? '#EBA9A4' : accent;
  const coralDeep = isDefaultAccent ? '#C66A66' : accent;
  const beige = '#D8C8B5';
  const blue = '#B6CFE0';

  const LEFT_COL = ['summary', 'experience', 'education', 'projects', 'organisations'];
  const leftIds = sectionOrder.filter(id => LEFT_COL.includes(id.split('_')[0]));
  const rightIds = sectionOrder.filter(id => !LEFT_COL.includes(id.split('_')[0]));

  const pageStyle = {
    fontFamily: `'${design.fontFamily}', sans-serif`,
    fontSize: `${fontSize}pt`,
    lineHeight,
    color: '#1F2937',
    minHeight: '100%',
    position: 'relative',
    overflow: 'hidden',
  };

  // Pill heading
  const PillHead = ({ children, iconName }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: coral, color: '#fff',
      padding: '4px 14px', borderRadius: 999,
      fontSize: '0.95em', fontWeight: 700,
      marginTop: '1em', marginBottom: '0.45em',
    }}>
      {iconName && <Icon name={iconName} size={fontSize} color="#fff" />}
      <span>{children}</span>
    </div>
  );

  // Confetti circles
  const Confetti = () => (
    <svg viewBox="0 0 600 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {/* top cluster */}
      <circle cx="520" cy="50" r="55" fill={coral} opacity="0.55" />
      <circle cx="565" cy="120" r="22" fill={coral} opacity="0.35" />
      <circle cx="460" cy="80" r="14" fill={beige} opacity="0.7" />
      <circle cx="500" cy="160" r="32" fill={beige} opacity="0.55" />
      <circle cx="430" cy="30" r="10" fill={blue} opacity="0.6" />
      <circle cx="580" cy="22" r="18" fill={blue} opacity="0.55" />
      {/* mid-right */}
      <circle cx="590" cy="420" r="34" fill={coral} opacity="0.35" />
      <circle cx="575" cy="500" r="14" fill={beige} opacity="0.8" />
      {/* bottom cluster */}
      <circle cx="40" cy="760" r="48" fill={coral} opacity="0.45" />
      <circle cx="98" cy="730" r="18" fill={beige} opacity="0.6" />
      <circle cx="20" cy="700" r="10" fill={blue} opacity="0.65" />
      <circle cx="120" cy="780" r="22" fill={blue} opacity="0.45" />
      <circle cx="180" cy="760" r="14" fill={coral} opacity="0.6" />
      {/* sparse mid */}
      <circle cx="10" cy="320" r="14" fill={beige} opacity="0.6" />
      <circle cx="20" cy="500" r="10" fill={coral} opacity="0.5" />
    </svg>
  );

  // Skills lollipop in coral
  const SkillsLolly = ({ items }) => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78em', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        <span style={{ width: 12, height: 1, background: coralDeep }} />Languages
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((s, i) => {
          const pct = Math.min(100, Math.max(10, Math.round(s.level / 3 * 100)));
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: '0.92em' }}>{s.name}</div>
              <div style={{ position: 'relative', height: 2, background: coral + '55' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: pct + '%', background: coralDeep }} />
                <div style={{ position: 'absolute', left: `calc(${pct}% - 4px)`, top: -3, width: 8, height: 8, background: coralDeep, borderRadius: '50%' }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const HashChips = ({ items }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '0.92em' }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: coralDeep, fontWeight: 700 }}>#</span>{it.name}
        </span>
      ))}
    </div>
  );

  const rightRender = (id) => {
    const base = id.split('_')[0];
    if (base === 'skills') return <SkillsLolly items={data.skills} />;
    if (base === 'interests' && Array.isArray(extras?.[id])) return <HashChips items={extras[id]} />;
    return renderBody(id, props, util);
  };

  // Contact list with bold label + value
  const contactLine = (label, val) => val ? (
    <div style={{ fontSize: '0.92em' }}><strong>{label}:</strong>&nbsp;{val}</div>
  ) : null;

  return (
    <PageWrap zoom={props.zoom}>
      <div style={pageStyle}>
        <Confetti />
        <div style={{ position: 'relative', padding: `${padY}mm ${padX}mm` }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: '0.6em' }}>
            <div>
              <div style={{ fontSize: '2.1em', fontWeight: 800, letterSpacing: '-0.01em', color: colIf(t.name) || '#1F2937', lineHeight: 1 }}>{data.name}</div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {contactLine('Address', data.location)}
                {contactLine('Phone', data.phone)}
                {contactLine('Email', data.email)}
                {contactLine('Web', data.link)}
              </div>
            </div>
            <PhotoPlaceholder size={86} shape="circle" name={data.name} />
          </div>

          {/* Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22 }}>
            <div>
              {leftIds.map(id => {
                const base = id.split('_')[0];
                return (
                  <div key={id}>
                    <PillHead iconName={SEC_ICONS[base] || 'badge'}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</PillHead>
                    {renderBody(id, props, util, base === 'experience' ? { expVariant: 'stacked' } : base === 'education' ? { eduVariant: 'compact' } : {})}
                  </div>
                );
              })}
            </div>
            <div>
              {rightIds.map(id => (
                <div key={id}>
                  <PillHead iconName={SEC_ICONS[id.split('_')[0]] || 'badge'}>{sectionLabel(id, SECTION_LABELS, SECTION_TYPES)}</PillHead>
                  {rightRender(id)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// ---------- Register ----------
Object.assign(window.TEMPLATES || {}, {
  'azure-wave':    { name: 'Azure Wave',    tone: 'Soft waves · two-column',      accent: '#5BAEEB', sw1: '#D9ECFB', sw2: '#FFFFFF' },
  'noir-flash':    { name: 'Noir Flash',    tone: 'Dark · yellow accent',         accent: '#F5C842', sw1: '#141414', sw2: '#F5C842' },
  'verdant-crest': { name: 'Verdant Crest', tone: 'Green polygons · photo',       accent: '#5BAE82', sw1: '#D6EFE0', sw2: '#FFFFFF' },
  'confetti':      { name: 'Confetti',      tone: 'Coral bubbles · pill headers', accent: '#C66A66', sw1: '#EBA9A4', sw2: '#FFFFFF' },
});

Object.assign(window.TEMPLATE_RENDERERS || {}, {
  'azure-wave':    TemplateAzureWave,
  'noir-flash':    TemplateNoirFlash,
  'verdant-crest': TemplateVerdantCrest,
  'confetti':      TemplateConfetti,
});
