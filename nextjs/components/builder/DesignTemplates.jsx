'use client';
// The 5 design templates: Corporate, SilverBanner, TealSidebar, Timeline, PhotoSidebar

// ── Shared helpers ─────────────────────────────────────────────────────────────

function ContactLine({ items, sep = ' · ', style = {} }) {
  const parts = items.filter(Boolean);
  if (!parts.length) return null;
  return (
    <span style={style}>
      {parts.map((p, i) => (
        <span key={i}>{i > 0 && <span style={{ margin: '0 4px', opacity: 0.5 }}>{sep}</span>}{p}</span>
      ))}
    </span>
  );
}

function BulletList({ bullets, color, lh }) {
  if (!bullets?.length) return null;
  return (
    <ul style={{ margin: '4px 0 0', paddingLeft: 14, lineHeight: lh }}>
      {bullets.filter(b => b?.trim()).map((b, i) => (
        <li key={i} style={{ marginBottom: 2, color }}>{b}</li>
      ))}
    </ul>
  );
}

// ── Corporate ──────────────────────────────────────────────────────────────────
// Centered serif name, EB Garamond, horizontal rules, spaced caps headers

export function Corporate({ data, accent = '#1a1a1a', font, spacing, margins }) {
  const sg = spacing?.sectionGap ?? 20;
  const ig = spacing?.itemGap ?? 12;
  const lh = spacing?.lineHeight ?? 1.5;
  const m = margins?.value ?? 40;
  const d = data || {};
  const b = d.basics || {};
  const contactItems = [b.email, b.phone, b.location, b.linkedin, b.website].filter(Boolean);

  const SectionHeader = ({ title }) => (
    <div style={{ textAlign: 'center', margin: `${sg}px 0 ${ig}px` }}>
      <div style={{ borderTop: `1px solid ${accent}`, marginBottom: 6 }} />
      <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '9pt', letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontWeight: 600 }}>
        {title}
      </span>
      <div style={{ borderTop: `1px solid ${accent}`, marginTop: 6 }} />
    </div>
  );

  const baseFont = font?.family || "'EB Garamond', Georgia, serif";

  return (
    <div style={{ fontFamily: baseFont, color: '#1a1a1a', fontSize: '10.5pt', lineHeight: lh, background: '#fff', padding: `${m}px`, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: sg }}>
        <div style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '26pt', fontWeight: 700, letterSpacing: '0.03em', color: accent, lineHeight: 1.1 }}>
          {b.name || 'Your Name'}
        </div>
        {b.title && (
          <div style={{ fontSize: '11pt', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginTop: 4 }}>
            {b.title}
          </div>
        )}
        {contactItems.length > 0 && (
          <div style={{ marginTop: 8, fontSize: '8.5pt', color: '#555', letterSpacing: '0.04em' }}>
            <ContactLine items={contactItems} sep=" · " />
          </div>
        )}
        <div style={{ borderTop: `2px solid ${accent}`, marginTop: 12 }} />
      </div>

      {/* Summary */}
      {d.summary && (
        <>
          <SectionHeader title="Summary" />
          <p style={{ textAlign: 'center', fontSize: '10pt', color: '#333', lineHeight: lh }}>{d.summary}</p>
        </>
      )}

      {/* Experience */}
      {d.experience?.length > 0 && (
        <>
          <SectionHeader title="Experience" />
          {d.experience.map((exp, i) => (
            <div key={exp.id || i} style={{ marginBottom: ig }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700, fontSize: '10.5pt' }}>{exp.role || exp.company}</div>
                <div style={{ fontSize: '9pt', color: '#555', whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.end}</div>
              </div>
              <div style={{ fontSize: '9.5pt', color: '#555', fontStyle: 'italic' }}>
                {[exp.company, exp.location].filter(Boolean).join(', ')}
              </div>
              <BulletList bullets={exp.bullets} color="#333" lh={lh} />
            </div>
          ))}
        </>
      )}

      {/* Education */}
      {d.education?.length > 0 && (
        <>
          <SectionHeader title="Education" />
          {d.education.map((edu, i) => (
            <div key={edu.id || i} style={{ marginBottom: ig }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700, fontSize: '10.5pt' }}>{edu.school}</div>
                <div style={{ fontSize: '9pt', color: '#555', whiteSpace: 'nowrap', marginLeft: 8 }}>{edu.end}</div>
              </div>
              <div style={{ fontSize: '9.5pt', color: '#555', fontStyle: 'italic' }}>{edu.degree}</div>
            </div>
          ))}
        </>
      )}

      {/* Skills */}
      {d.skills?.length > 0 && (
        <>
          <SectionHeader title="Skills" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px 16px', fontSize: '9.5pt', color: '#333' }}>
            {d.skills.map((s, i) => (
              <div key={s.id || i} style={{ paddingBottom: 2 }}>• {s.name}</div>
            ))}
          </div>
        </>
      )}

      {/* Certifications */}
      {d.certificates?.length > 0 && (
        <>
          <SectionHeader title="Certifications" />
          {d.certificates.map((c, i) => (
            <div key={c.id || i} style={{ fontSize: '9.5pt', marginBottom: 3 }}>• {c.name}</div>
          ))}
        </>
      )}

      {/* Projects */}
      {d.projects?.length > 0 && (
        <>
          <SectionHeader title="Projects" />
          {d.projects.map((p, i) => (
            <div key={p.id || i} style={{ marginBottom: ig }}>
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              {p.role && <div style={{ fontSize: '9pt', fontStyle: 'italic', color: '#555' }}>{p.role}</div>}
              {p.desc && <div style={{ fontSize: '9.5pt', color: '#333', marginTop: 3 }}>{p.desc}</div>}
            </div>
          ))}
        </>
      )}

      {/* Languages */}
      {d.languages?.length > 0 && (
        <>
          <SectionHeader title="Languages" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', fontSize: '9.5pt' }}>
            {d.languages.map((l, i) => (
              <span key={l.id || i}>{l.name}{l.proficiency ? ` — ${l.proficiency}` : ''}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Silver Banner ──────────────────────────────────────────────────────────────
// Left-aligned name, full-width gray banner section headers

export function SilverBanner({ data, accent = '#1a1a1a', font, spacing, margins }) {
  const sg = spacing?.sectionGap ?? 20;
  const ig = spacing?.itemGap ?? 12;
  const lh = spacing?.lineHeight ?? 1.5;
  const m = margins?.value ?? 40;
  const d = data || {};
  const b = d.basics || {};
  const contactItems = [b.email, b.phone, b.location, b.linkedin, b.website].filter(Boolean);
  const baseFont = font?.family || "'Helvetica Neue', Arial, sans-serif";

  const SectionHeader = ({ title }) => (
    <div style={{ background: '#e8e8e8', margin: `${sg}px -${m}px ${ig}px`, padding: '4px 40px', fontSize: '9pt', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>
      {title}
    </div>
  );

  return (
    <div style={{ fontFamily: baseFont, color: '#1a1a1a', fontSize: '10pt', lineHeight: lh, background: '#fff', padding: `${m}px`, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: sg }}>
        <div style={{ fontSize: '22pt', fontWeight: 700, color: accent, letterSpacing: '-0.3px' }}>
          {b.name || 'Your Name'}
        </div>
        {b.title && (
          <div style={{ fontSize: '10pt', color: '#555', marginTop: 2 }}>{b.title}</div>
        )}
        {contactItems.length > 0 && (
          <div style={{ marginTop: 8, fontSize: '8.5pt', color: '#555', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' }}>
            {contactItems.map((c, i) => <div key={i}>{c}</div>)}
          </div>
        )}
      </div>

      {d.summary && (
        <>
          <SectionHeader title="Summary" />
          <p style={{ fontSize: '9.5pt', color: '#333', lineHeight: lh }}>{d.summary}</p>
        </>
      )}

      {d.experience?.length > 0 && (
        <>
          <SectionHeader title="Experience" />
          {d.experience.map((exp, i) => (
            <div key={exp.id || i} style={{ marginBottom: ig }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700 }}>{exp.role}</div>
                <div style={{ fontSize: '9pt', color: '#555' }}>{exp.end}</div>
              </div>
              <div style={{ fontSize: '9pt', color: '#555' }}>{[exp.company, exp.location].filter(Boolean).join(' · ')}</div>
              <BulletList bullets={exp.bullets} color="#333" lh={lh} />
            </div>
          ))}
        </>
      )}

      {d.education?.length > 0 && (
        <>
          <SectionHeader title="Education" />
          {d.education.map((edu, i) => (
            <div key={edu.id || i} style={{ marginBottom: ig }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700 }}>{edu.school}</div>
                <div style={{ fontSize: '9pt', color: '#555' }}>{edu.end}</div>
              </div>
              <div style={{ fontSize: '9pt', color: '#555' }}>{edu.degree}</div>
            </div>
          ))}
        </>
      )}

      {d.skills?.length > 0 && (
        <>
          <SectionHeader title="Skills" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0' }}>
            {d.skills.map((s, i) => (
              <span key={s.id || i} style={{ fontSize: '9.5pt', marginRight: 12 }}>• {s.name}</span>
            ))}
          </div>
        </>
      )}

      {d.certificates?.length > 0 && (
        <>
          <SectionHeader title="Certifications" />
          {d.certificates.map((c, i) => (
            <div key={c.id || i} style={{ fontSize: '9.5pt', marginBottom: 3 }}>• {c.name}</div>
          ))}
        </>
      )}

      {d.projects?.length > 0 && (
        <>
          <SectionHeader title="Projects" />
          {d.projects.map((p, i) => (
            <div key={p.id || i} style={{ marginBottom: ig }}>
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              {p.desc && <div style={{ fontSize: '9.5pt', color: '#333', marginTop: 2 }}>{p.desc}</div>}
            </div>
          ))}
        </>
      )}

      {d.languages?.length > 0 && (
        <>
          <SectionHeader title="Languages" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', fontSize: '9.5pt' }}>
            {d.languages.map((l, i) => (
              <span key={l.id || i}>{l.name}{l.proficiency ? ` — ${l.proficiency}` : ''}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Teal Sidebar ───────────────────────────────────────────────────────────────
// Two-column: main (Lora serif) + colored right sidebar

export function TealSidebar({ data, accent = '#1F6B6F', font, spacing, margins }) {
  const sg = spacing?.sectionGap ?? 20;
  const ig = spacing?.itemGap ?? 12;
  const lh = spacing?.lineHeight ?? 1.5;
  const m = margins?.value ?? 40;
  const d = data || {};
  const b = d.basics || {};
  const contactItems = [b.email, b.phone, b.location, b.linkedin, b.website].filter(Boolean);
  const mainFont = font?.family || "'Lora', Georgia, serif";
  const sideFont = "'Montserrat', 'Helvetica Neue', sans-serif";

  const SideSection = ({ title, children }) => (
    <div style={{ marginBottom: sg }}>
      <div style={{ fontSize: '7.5pt', fontFamily: sideFont, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: '#fff', opacity: 0.8, borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: 4, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );

  const MainSection = ({ title, children }) => (
    <div style={{ marginBottom: sg }}>
      <div style={{ fontSize: '9pt', fontFamily: sideFont, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: accent, borderBottom: `1.5px solid ${accent}`, paddingBottom: 3, marginBottom: ig }}>
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: mainFont, color: '#1a1a1a', fontSize: '10pt', lineHeight: lh, background: '#fff', display: 'flex', minHeight: '100%' }}>
      {/* Main */}
      <div style={{ flex: '1.55', padding: `${m}px ${m * 0.7}px ${m}px ${m}px` }}>
        {/* Header */}
        <div style={{ marginBottom: sg }}>
          <div style={{ fontSize: '24pt', fontWeight: 700, color: accent, lineHeight: 1.1 }}>{b.name || 'Your Name'}</div>
          {b.title && <div style={{ fontSize: '11pt', color: '#555', marginTop: 4, fontFamily: sideFont }}>{b.title}</div>}
        </div>

        {d.summary && (
          <MainSection title="Summary">
            <p style={{ fontSize: '9.5pt', color: '#444', lineHeight: lh }}>{d.summary}</p>
          </MainSection>
        )}

        {d.experience?.length > 0 && (
          <MainSection title="Experience">
            {d.experience.map((exp, i) => (
              <div key={exp.id || i} style={{ marginBottom: ig }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, fontSize: '10.5pt' }}>{exp.role}</div>
                  <div style={{ fontSize: '8.5pt', color: '#666', whiteSpace: 'nowrap', fontFamily: sideFont, marginLeft: 8 }}>{exp.end}</div>
                </div>
                <div style={{ fontSize: '9pt', color: '#666', fontFamily: sideFont }}>{[exp.company, exp.location].filter(Boolean).join(' · ')}</div>
                <BulletList bullets={exp.bullets} color="#333" lh={lh} />
              </div>
            ))}
          </MainSection>
        )}

        {d.education?.length > 0 && (
          <MainSection title="Education">
            {d.education.map((edu, i) => (
              <div key={edu.id || i} style={{ marginBottom: ig }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700 }}>{edu.school}</div>
                  <div style={{ fontSize: '8.5pt', color: '#666', fontFamily: sideFont }}>{edu.end}</div>
                </div>
                <div style={{ fontSize: '9pt', color: '#666', fontFamily: sideFont }}>{edu.degree}</div>
              </div>
            ))}
          </MainSection>
        )}

        {d.projects?.length > 0 && (
          <MainSection title="Projects">
            {d.projects.map((p, i) => (
              <div key={p.id || i} style={{ marginBottom: ig }}>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                {p.desc && <div style={{ fontSize: '9pt', color: '#444', marginTop: 2 }}>{p.desc}</div>}
              </div>
            ))}
          </MainSection>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ flex: '1', background: accent, color: '#fff', padding: `${m}px ${m * 0.7}px`, fontFamily: sideFont }}>
        {/* Photo placeholder */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22pt', fontWeight: 700, marginBottom: 16 }}>
          {(b.name || 'Y').charAt(0).toUpperCase()}
        </div>

        {/* Contact */}
        {contactItems.length > 0 && (
          <SideSection title="Contact">
            {contactItems.map((c, i) => (
              <div key={i} style={{ fontSize: '8.5pt', marginBottom: 4, opacity: 0.9, wordBreak: 'break-all' }}>{c}</div>
            ))}
          </SideSection>
        )}

        {d.skills?.length > 0 && (
          <SideSection title="Skills">
            {d.skills.map((s, i) => (
              <div key={s.id || i} style={{ fontSize: '8.5pt', marginBottom: 4, opacity: 0.9 }}>• {s.name}</div>
            ))}
          </SideSection>
        )}

        {d.languages?.length > 0 && (
          <SideSection title="Languages">
            {d.languages.map((l, i) => (
              <div key={l.id || i} style={{ fontSize: '8.5pt', marginBottom: 4, opacity: 0.9 }}>
                {l.name}{l.proficiency ? <span style={{ opacity: 0.7 }}> — {l.proficiency}</span> : ''}
              </div>
            ))}
          </SideSection>
        )}

        {d.certificates?.length > 0 && (
          <SideSection title="Certifications">
            {d.certificates.map((c, i) => (
              <div key={c.id || i} style={{ fontSize: '8.5pt', marginBottom: 4, opacity: 0.9 }}>• {c.name}</div>
            ))}
          </SideSection>
        )}
      </div>
    </div>
  );
}

// ── Timeline ───────────────────────────────────────────────────────────────────
// Vertical accent bar with dots, date column left, content right

export function Timeline({ data, accent = '#2A8DC1', font, spacing, margins }) {
  const sg = spacing?.sectionGap ?? 20;
  const ig = spacing?.itemGap ?? 12;
  const lh = spacing?.lineHeight ?? 1.5;
  const m = margins?.value ?? 40;
  const d = data || {};
  const b = d.basics || {};
  const contactItems = [b.email, b.phone, b.location, b.linkedin, b.website].filter(Boolean);
  const baseFont = font?.family || "'Helvetica Neue', Arial, sans-serif";

  const SectionHeader = ({ title }) => (
    <div style={{ marginBottom: ig, marginTop: sg }}>
      <div style={{ fontSize: '8.5pt', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: accent }}>
        {title}
      </div>
      <div style={{ height: 1.5, background: accent, marginTop: 4, opacity: 0.3 }} />
    </div>
  );

  const TimelineRow = ({ date, children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 20px 1fr', gap: '0 0', marginBottom: ig }}>
      <div style={{ fontSize: '8pt', color: '#888', paddingTop: 2, textAlign: 'right', paddingRight: 10 }}>{date}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: 3 }} />
        <div style={{ flex: 1, width: 1.5, background: `${accent}30`, marginTop: 2 }} />
      </div>
      <div style={{ paddingLeft: 8 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: baseFont, color: '#1a1a1a', fontSize: '10pt', lineHeight: lh, background: '#fff', padding: `${m}px`, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 16, marginBottom: sg }}>
        <div style={{ fontSize: '22pt', fontWeight: 700, color: accent, lineHeight: 1.1 }}>{b.name || 'Your Name'}</div>
        {b.title && <div style={{ fontSize: '10pt', color: '#555', marginTop: 3 }}>{b.title}</div>}
        {contactItems.length > 0 && (
          <div style={{ marginTop: 6, fontSize: '8.5pt', color: '#666' }}>
            <ContactLine items={contactItems} sep=" · " />
          </div>
        )}
      </div>

      {d.summary && (
        <>
          <SectionHeader title="Summary" />
          <p style={{ fontSize: '9.5pt', color: '#444', lineHeight: lh, marginBottom: sg }}>{d.summary}</p>
        </>
      )}

      {d.experience?.length > 0 && (
        <>
          <SectionHeader title="Experience" />
          {d.experience.map((exp, i) => (
            <TimelineRow key={exp.id || i} date={exp.end}>
              <div style={{ fontWeight: 700, fontSize: '10pt' }}>{exp.role}</div>
              <div style={{ fontSize: '9pt', color: '#666' }}>{[exp.company, exp.location].filter(Boolean).join(' · ')}</div>
              <BulletList bullets={exp.bullets} color="#333" lh={lh} />
            </TimelineRow>
          ))}
        </>
      )}

      {d.education?.length > 0 && (
        <>
          <SectionHeader title="Education" />
          {d.education.map((edu, i) => (
            <TimelineRow key={edu.id || i} date={edu.end}>
              <div style={{ fontWeight: 700 }}>{edu.school}</div>
              <div style={{ fontSize: '9pt', color: '#666' }}>{edu.degree}</div>
            </TimelineRow>
          ))}
        </>
      )}

      {(d.skills?.length > 0 || d.languages?.length > 0 || d.certificates?.length > 0) && (
        <>
          <SectionHeader title="Skills & More" />
          <div style={{ display: 'grid', gridTemplateColumns: '90px 20px 1fr', gap: '0 0' }}>
            <div />
            <div />
            <div style={{ paddingLeft: 8 }}>
              {d.skills?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '8.5pt', fontWeight: 700, color: '#555', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
                    {d.skills.map((s, i) => <span key={i} style={{ fontSize: '9pt' }}>• {s.name}</span>)}
                  </div>
                </div>
              )}
              {d.languages?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '8.5pt', fontWeight: 700, color: '#555', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Languages</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
                    {d.languages.map((l, i) => <span key={i} style={{ fontSize: '9pt' }}>{l.name}{l.proficiency ? ` (${l.proficiency})` : ''}</span>)}
                  </div>
                </div>
              )}
              {d.certificates?.length > 0 && (
                <div>
                  <div style={{ fontSize: '8.5pt', fontWeight: 700, color: '#555', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Certifications</div>
                  {d.certificates.map((c, i) => <div key={i} style={{ fontSize: '9pt' }}>• {c.name}</div>)}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {d.projects?.length > 0 && (
        <>
          <SectionHeader title="Projects" />
          {d.projects.map((p, i) => (
            <TimelineRow key={p.id || i} date={p.dates}>
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              {p.desc && <div style={{ fontSize: '9pt', color: '#333', marginTop: 2 }}>{p.desc}</div>}
            </TimelineRow>
          ))}
        </>
      )}
    </div>
  );
}

// ── Photo Sidebar ──────────────────────────────────────────────────────────────
// Left sidebar with photo blob, contacts, skills; right main column

export function PhotoSidebar({ data, accent = '#1F8A8E', font, spacing, margins }) {
  const sg = spacing?.sectionGap ?? 20;
  const ig = spacing?.itemGap ?? 12;
  const lh = spacing?.lineHeight ?? 1.5;
  const m = margins?.value ?? 40;
  const d = data || {};
  const b = d.basics || {};
  const contactItems = [b.email, b.phone, b.location, b.linkedin, b.website].filter(Boolean);
  const baseFont = font?.family || "'Helvetica Neue', Arial, sans-serif";
  const sideFont = "'Montserrat', 'Helvetica Neue', sans-serif";

  const SideSection = ({ title, children }) => (
    <div style={{ marginBottom: sg }}>
      <div style={{ fontSize: '7pt', fontFamily: sideFont, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: accent, borderBottom: `1.5px solid ${accent}`, paddingBottom: 3, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );

  const MainSection = ({ title, children }) => (
    <div style={{ marginBottom: sg }}>
      <div style={{ fontSize: '8.5pt', fontFamily: sideFont, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: accent, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: baseFont, color: '#1a1a1a', fontSize: '10pt', lineHeight: lh, background: '#fff', display: 'flex', minHeight: '100%' }}>
      {/* Left Sidebar */}
      <div style={{ width: 180, background: '#f4f7f8', padding: `${m}px ${m * 0.65}px`, flexShrink: 0 }}>
        {/* Photo blob */}
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26pt', fontWeight: 700, color: '#fff', marginBottom: 14, marginLeft: 'auto', marginRight: 'auto' }}>
          {(b.name || 'Y').charAt(0).toUpperCase()}
        </div>

        {/* Name in sidebar header */}
        <div style={{ fontFamily: sideFont, fontSize: '11pt', fontWeight: 700, color: accent, textAlign: 'center', marginBottom: 4, wordBreak: 'break-word' }}>
          {b.name || 'Your Name'}
        </div>
        {b.title && <div style={{ fontSize: '8pt', color: '#666', textAlign: 'center', marginBottom: 16 }}>{b.title}</div>}

        {contactItems.length > 0 && (
          <SideSection title="Contact">
            {contactItems.map((c, i) => (
              <div key={i} style={{ fontSize: '8pt', color: '#444', marginBottom: 4, wordBreak: 'break-all' }}>{c}</div>
            ))}
          </SideSection>
        )}

        {d.skills?.length > 0 && (
          <SideSection title="Skills">
            {d.skills.map((s, i) => (
              <div key={s.id || i} style={{ fontSize: '8.5pt', color: '#333', marginBottom: 3 }}>• {s.name}</div>
            ))}
          </SideSection>
        )}

        {d.languages?.length > 0 && (
          <SideSection title="Languages">
            {d.languages.map((l, i) => (
              <div key={l.id || i} style={{ fontSize: '8.5pt', color: '#333', marginBottom: 3 }}>
                {l.name}{l.proficiency ? <span style={{ color: '#666' }}> — {l.proficiency}</span> : ''}
              </div>
            ))}
          </SideSection>
        )}

        {d.certificates?.length > 0 && (
          <SideSection title="Certifications">
            {d.certificates.map((c, i) => (
              <div key={c.id || i} style={{ fontSize: '8pt', color: '#333', marginBottom: 4 }}>• {c.name}</div>
            ))}
          </SideSection>
        )}
      </div>

      {/* Main column */}
      <div style={{ flex: 1, padding: `${m}px ${m}px ${m}px ${m * 0.8}px` }}>
        {/* Header strip */}
        <div style={{ borderBottom: `2.5px solid ${accent}`, paddingBottom: 10, marginBottom: sg }}>
          <div style={{ fontSize: '18pt', fontWeight: 700, color: accent }}>{b.name || 'Your Name'}</div>
          {b.title && <div style={{ fontSize: '10pt', color: '#555', marginTop: 2 }}>{b.title}</div>}
        </div>

        {d.summary && (
          <MainSection title="Profile">
            <p style={{ fontSize: '9.5pt', color: '#444', lineHeight: lh }}>{d.summary}</p>
          </MainSection>
        )}

        {d.experience?.length > 0 && (
          <MainSection title="Experience">
            {d.experience.map((exp, i) => (
              <div key={exp.id || i} style={{ marginBottom: ig }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700 }}>{exp.role}</div>
                  <div style={{ fontSize: '8.5pt', color: '#777' }}>{exp.end}</div>
                </div>
                <div style={{ fontSize: '9pt', color: '#666' }}>{[exp.company, exp.location].filter(Boolean).join(' · ')}</div>
                <BulletList bullets={exp.bullets} color="#333" lh={lh} />
              </div>
            ))}
          </MainSection>
        )}

        {d.education?.length > 0 && (
          <MainSection title="Education">
            {d.education.map((edu, i) => (
              <div key={edu.id || i} style={{ marginBottom: ig }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700 }}>{edu.school}</div>
                  <div style={{ fontSize: '8.5pt', color: '#777' }}>{edu.end}</div>
                </div>
                <div style={{ fontSize: '9pt', color: '#666' }}>{edu.degree}</div>
              </div>
            ))}
          </MainSection>
        )}

        {d.projects?.length > 0 && (
          <MainSection title="Projects">
            {d.projects.map((p, i) => (
              <div key={p.id || i} style={{ marginBottom: ig }}>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                {p.desc && <div style={{ fontSize: '9pt', color: '#333', marginTop: 2 }}>{p.desc}</div>}
              </div>
            ))}
          </MainSection>
        )}
      </div>
    </div>
  );
}

// ── Template switcher ──────────────────────────────────────────────────────────

export const DESIGN_TEMPLATES = {
  'corporate': Corporate,
  'silver-banner': SilverBanner,
  'teal-sidebar': TealSidebar,
  'timeline': Timeline,
  'photo-sidebar': PhotoSidebar,
};

export function renderDesignTemplate(templateId, data, design) {
  const Comp = DESIGN_TEMPLATES[templateId] || Corporate;
  const { font, theme, spacing, margins } = design || {};
  return <Comp data={data} accent={theme?.primary} font={font} spacing={spacing} margins={margins} />;
}
