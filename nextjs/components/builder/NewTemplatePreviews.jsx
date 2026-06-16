'use client';
import { useState } from 'react';

// ─── Spotlight thumbnail ──────────────────────────────────────────────────────

function SpotlightThumb() {
  const accent = '#185FA5';
  const chipStyle = { display: 'inline-block', padding: '2px 7px', borderRadius: 6, background: accent + '14', color: accent, fontSize: 6.5, fontWeight: 500, margin: '2px 2px 0 0' };
  const heading = (label) => (
    <div style={{ marginTop: 8, marginBottom: 3 }}>
      <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>{label}</div>
      <div style={{ height: 2, width: 18, borderRadius: 1, background: accent, marginTop: 2 }} />
    </div>
  );
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8 }}>
      <div style={{ background: accent, padding: '14px 13px 10px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: '#fff' }}>Alex Johnson</div>
        <div style={{ fontSize: 9.5, fontWeight: 500, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>Senior React Developer</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginTop: 6 }}>
          {['✉ alex@email.com', '☏ +1 555 234 5678', '⌖ San Francisco, CA'].map((c, i) => (
            <span key={i} style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.88)' }}>{c}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 10, padding: '8px 13px' }}>
        <div>
          {heading('Summary')}
          <div style={{ fontSize: 6.5, color: '#374151', lineHeight: 1.5 }}>Full-stack developer with 6+ years building scalable React apps across fintech and e-commerce.</div>
          {heading('Work Experience')}
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 7.5, fontWeight: 700 }}>Senior React Developer</div>
            <div style={{ fontSize: 7, fontStyle: 'italic', color: '#6B7280' }}>Razorpay</div>
            <div style={{ fontSize: 6.5, color: '#9097A3', marginBottom: 1 }}>Jan 2021 – Present</div>
            <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Built component library used by 40+ engineers</div>
            <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Reduced page load by 34% via code splitting</div>
          </div>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 700 }}>Frontend Engineer</div>
            <div style={{ fontSize: 7, fontStyle: 'italic', color: '#6B7280' }}>Freshworks</div>
            <div style={{ fontSize: 6.5, color: '#9097A3' }}>Jun 2019 – Dec 2020</div>
            <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Developed 15 customer-facing features</div>
          </div>
          {heading('Education')}
          <div style={{ fontSize: 7.5, fontWeight: 700 }}>B.S. Computer Science</div>
          <div style={{ fontSize: 7, color: '#6B7280' }}>Stanford University</div>
        </div>
        <div>
          {heading('Skills')}
          <div>{['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Redux', 'Tailwind'].map(s => <span key={s} style={chipStyle}>{s}</span>)}</div>
          {heading('Languages')}
          {[['English', 'Native'], ['Hindi', 'Fluent'], ['Spanish', 'Intermediate']].map(([lang, level]) => (
            <div key={lang} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#374151', marginBottom: 2 }}>
              <span>{lang}</span><span style={{ color: '#9097A3' }}>{level}</span>
            </div>
          ))}
          {heading('Interests')}
          {['Open Source', 'Running', 'Design'].map(s => <span key={s} style={chipStyle}>{s}</span>)}
        </div>
      </div>
    </div>
  );
}

// ─── Index thumbnail ──────────────────────────────────────────────────────────

function IndexThumb() {
  const accent = '#185FA5';
  const NumHeading = ({ n, label }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 8, alignItems: 'baseline', marginTop: 10, marginBottom: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-0.02em' }}>{String(n).padStart(2, '0')}</div>
      <div>
        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#16181D' }}>{label}</div>
        <div style={{ height: 1, background: '#D7DBE2', marginTop: 3 }} />
      </div>
    </div>
  );
  const Body = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 8 }}><div /><div style={{ minWidth: 0 }}>{children}</div></div>
  );
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '14px 13px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.95, color: '#16181D' }}>Alex Johnson</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 500, color: accent }}>Senior React Developer</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 7, color: '#9097A3' }}>
          <span>alex@email.com</span><span>+1 555 234 5678</span><span>San Francisco</span>
        </div>
      </div>
      <div style={{ height: 2, background: '#16181D', marginTop: 7 }} />
      <NumHeading n={1} label="Summary" />
      <Body><div style={{ fontSize: 7, color: '#374151', lineHeight: 1.6 }}>Full-stack developer with 6+ years building scalable React applications across fintech and e-commerce.</div></Body>
      <NumHeading n={2} label="Work Experience" />
      <Body>
        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 7, color: '#374151' }}><div>Jan 2021 – Now</div><div style={{ color: '#9097A3' }}>Remote</div></div>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: '#16181D' }}>Senior React Developer</div>
            <div style={{ fontSize: 7, color: '#6B7280' }}>Razorpay</div>
            <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Built component library used by 40+ engineers</div>
          </div>
        </div>
      </Body>
      <NumHeading n={3} label="Skills" />
      <Body>
        <div style={{ fontSize: 7.5, lineHeight: 1.7, color: '#374151' }}>
          {['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Redux'].map((s, i, arr) => (
            <span key={s}>
              <span style={{ whiteSpace: 'nowrap' }}>{s}</span>
              {i < arr.length - 1 && <span style={{ color: accent, margin: '0 4px', fontWeight: 700 }}>/</span>}
            </span>
          ))}
        </div>
      </Body>
      <NumHeading n={4} label="Education" />
      <Body>
        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 8 }}>
          <div style={{ fontSize: 7, color: '#374151' }}>2015 – 2019</div>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: '#16181D' }}>B.S. Computer Science</div>
            <div style={{ fontSize: 7, color: '#6B7280' }}>Stanford University</div>
          </div>
        </div>
      </Body>
    </div>
  );
}

// ─── Panels thumbnail ─────────────────────────────────────────────────────────

function PanelsThumb() {
  const accent = '#185FA5';
  const Pill = ({ children }) => (
    <div style={{ display: 'inline-block', whiteSpace: 'nowrap', padding: '2px 8px', borderRadius: 999, background: accent + '14', color: accent, fontSize: 6.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{children}</div>
  );
  const SkillChip = ({ label }) => (
    <span style={{ padding: '2px 7px', borderRadius: 6, background: '#F2F4F8', border: '1px solid #E6E9EF', fontSize: 6.5, fontWeight: 500, color: '#374151', margin: '2px 2px 0 0', display: 'inline-block' }}>{label}</span>
  );
  const SideCard = ({ children }) => (
    <div style={{ background: '#F7F8FB', border: '1px solid #ECEEF3', borderRadius: 9, padding: '8px 9px', marginBottom: 7 }}>{children}</div>
  );
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: 12 }}>
      <div style={{ background: accent + '0F', border: `1px solid ${accent}22`, borderRadius: 10, padding: '10px 11px' }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: '#1E222B' }}>Alex Johnson</div>
        <div style={{ fontSize: 9, fontWeight: 500, color: accent, marginTop: 2 }}>Senior React Developer</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
          {['✉ alex@email.com', '☏ +1 555 234 5678', '⌖ San Francisco'].map((c, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: '#fff', border: '1px solid #E6E9EF', fontSize: 7, color: '#374151' }}>{c}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 10, marginTop: 10 }}>
        <div>
          <Pill>Summary</Pill>
          <div style={{ fontSize: 6.5, color: '#374151', lineHeight: 1.5, marginBottom: 7 }}>Full-stack developer with 6+ years building scalable React applications across fintech.</div>
          <Pill>Work Experience</Pill>
          <div style={{ marginBottom: 5 }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: '#1E222B' }}>Senior React Developer</div>
            <div style={{ fontSize: 7, fontStyle: 'italic', color: '#6B7280' }}>Razorpay</div>
            <div style={{ fontSize: 6.5, color: '#9097A3' }}>Jan 2021 – Present · Remote</div>
            <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Built component library used by 40+ engineers</div>
            <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Reduced page load by 34% via code splitting</div>
          </div>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: '#1E222B' }}>Frontend Engineer</div>
            <div style={{ fontSize: 7, fontStyle: 'italic', color: '#6B7280' }}>Freshworks</div>
            <div style={{ fontSize: 6.5, color: '#9097A3' }}>Jun 2019 – Dec 2020</div>
            <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Developed 15 customer-facing features</div>
          </div>
        </div>
        <div>
          <SideCard><Pill>Skills</Pill><div style={{ marginTop: 2 }}>{['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Redux'].map(s => <SkillChip key={s} label={s} />)}</div></SideCard>
          <SideCard>
            <Pill>Languages</Pill>
            {[['English', 'Native'], ['Hindi', 'Fluent']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#374151', lineHeight: 2 }}><span>{l}</span><span style={{ color: '#9097A3' }}>{v}</span></div>
            ))}
          </SideCard>
          <SideCard>
            <Pill>Education</Pill>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#374151', marginTop: 2 }}>B.S. Computer Science</div>
            <div style={{ fontSize: 6.5, color: '#6B7280' }}>Stanford University · 2019</div>
          </SideCard>
        </div>
      </div>
    </div>
  );
}

// ─── Vertex thumbnail ─────────────────────────────────────────────────────────

function VertexThumb() {
  const accent = '#185FA5';
  const RailHead = ({ children }) => (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.95)' }}>{children}</div>
      <div style={{ height: 2, width: 14, background: 'rgba(255,255,255,0.5)', marginTop: 2 }} />
    </div>
  );
  const Ring = ({ pct, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <div style={{ position: 'relative', width: 26, height: 26, borderRadius: '50%', background: `conic-gradient(#fff ${pct}%, rgba(255,255,255,0.22) 0)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <div style={{ width: '70%', height: '70%', borderRadius: '50%', background: accent, display: 'grid', placeItems: 'center', fontSize: 5.5, fontWeight: 800, color: '#fff' }}>{pct}%</div>
      </div>
      <div style={{ fontSize: 7, color: '#fff' }}>{label}</div>
    </div>
  );
  const MainHead = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 11, marginBottom: 4 }}>
      <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, whiteSpace: 'nowrap' }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: '#E2E5EB' }} />
    </div>
  );
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'grid', gridTemplateColumns: '1fr 34%', height: '100%' }}>
      <div style={{ padding: '14px 13px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1, color: '#1A1D24' }}>Alex Johnson</div>
        <div style={{ fontSize: 9, fontWeight: 500, color: accent, marginTop: 4 }}>Senior React Developer</div>
        <MainHead>Summary</MainHead>
        <div style={{ fontSize: 6.5, color: '#374151', lineHeight: 1.5 }}>Full-stack developer with 6+ years building scalable React apps across fintech and e-commerce.</div>
        <MainHead>Work Experience</MainHead>
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: '#1A1D24' }}>Senior React Developer</div>
          <div style={{ fontSize: 7, fontStyle: 'italic', color: '#6B7280' }}>Razorpay</div>
          <div style={{ fontSize: 6.5, color: '#9097A3' }}>Jan 2021 – Present · Remote</div>
          <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Built component library used by 40+ engineers</div>
          <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Reduced page load by 34% via code splitting</div>
        </div>
        <div>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: '#1A1D24' }}>Frontend Engineer</div>
          <div style={{ fontSize: 7, fontStyle: 'italic', color: '#6B7280' }}>Freshworks</div>
          <div style={{ fontSize: 6.5, color: '#9097A3' }}>Jun 2019 – Dec 2020</div>
          <div style={{ fontSize: 6.5, color: '#374151', paddingLeft: 8 }}>• Developed 15 customer-facing features</div>
        </div>
        <MainHead>Education</MainHead>
        <div style={{ fontSize: 7.5, fontWeight: 700, color: '#1A1D24' }}>B.S. Computer Science</div>
        <div style={{ fontSize: 7, color: '#6B7280' }}>Stanford University</div>
        <div style={{ fontSize: 6.5, color: '#9097A3' }}>2015 – 2019</div>
      </div>
      <div style={{ background: accent, padding: '14px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}>AJ</div>
        </div>
        <RailHead>Contact</RailHead>
        {['✉ alex@email.com', '☏ +1 555 234 5678', '⌖ San Francisco'].map((c, i) => (
          <div key={i} style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.88)', marginBottom: 3, lineHeight: 1.4 }}>{c}</div>
        ))}
        <RailHead>Skills</RailHead>
        <Ring pct={100} label="React" />
        <Ring pct={87} label="TypeScript" />
        <Ring pct={67} label="GraphQL" />
        <Ring pct={53} label="AWS" />
      </div>
    </div>
  );
}

// ─── Template list ────────────────────────────────────────────────────────────

const NEW_TEMPLATES = [
  { id: 'spotlight', name: 'Spotlight', tone: 'Bold color header · two-column',    Thumb: SpotlightThumb },
  { id: 'index',     name: 'Index',     tone: 'Swiss big-type · numbered sections', Thumb: IndexThumb     },
  { id: 'panels',    name: 'Panels',    tone: 'Cards · chips · dashboard',          Thumb: PanelsThumb    },
  { id: 'vertex',    name: 'Vertex',    tone: 'Accent rail · skill rings',          Thumb: VertexThumb    },
];

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NewTemplatePreviews({ selectedId, onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
      {NEW_TEMPLATES.map(({ id, name, tone, Thumb }) => (
        <div
          key={id}
          onMouseEnter={() => setHovered(id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onSelect?.(id)}
          style={{
            background: '#fff',
            border: selectedId === id ? '2px solid #185FA5' : hovered === id ? '1.5px solid #185FA5' : '1.5px solid #E2E5EB',
            borderRadius: 16,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: selectedId === id ? '0 0 0 3px #185FA522' : 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ width: '100%', aspectRatio: '210 / 297', maxHeight: 260, overflow: 'hidden', background: '#fff', position: 'relative' }}>
            <Thumb />
          </div>
          <div style={{ padding: '10px 14px', background: '#fff', borderTop: '1px solid #ECEEF3' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1D24' }}>{name}</div>
            <div style={{ fontSize: 12, color: '#9097A3', marginTop: 1 }}>{tone}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
