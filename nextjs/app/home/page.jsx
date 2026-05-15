'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  primary:   '#185FA5',
  dark:      '#0C447C',
  light:     '#E6F1FB',
  teal:      '#1D9E75',
  charcoal:  '#2C2C2A',
  secondary: '#6B7280',
  border:    '#D1DCE8',
  surface:   '#FFFFFF',
  bg:        '#F4F8FC',
};

// ── Inline SVG icons ───────────────────────────────────────────────────────────
const Icon = ({ d, size = 24, strokeWidth = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

// Feature icon paths
const FEAT_ICONS = {
  preview:  ['M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z', 'M8 21h8', 'M12 17v4'],
  ai:       ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  ats:      ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  export:   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  templates:['M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z', 'M4 14a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z', 'M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5z'],
  speed:    ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
};

// Social link icons
const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);

// ── Scroll-reveal hook ─────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ── Reusable reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 400ms ease ${delay}ms, transform 400ms ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Smooth-scroll helper ───────────────────────────────────────────────────────
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Navbar
// ══════════════════════════════════════════════════════════════════════════════
function Navbar({ activeSection }) {
  const [scrolled, setScrolled]   = useState(false);
  const [drawerOpen, setDrawer]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features',     id: 'features'     },
    { label: 'How it works', id: 'how-it-works'  },
    { label: 'Pricing',      id: 'pricing'       },
  ];

  const NavLink = ({ label, id, mobile = false }) => (
    <button
      onClick={() => { scrollTo(id); setDrawer(false); }}
      style={{
        fontSize:      mobile ? 16 : 14,
        fontWeight:    500,
        color:         activeSection === id ? C.primary : C.charcoal,
        background:    activeSection === id ? C.light   : 'transparent',
        borderRadius:  8,
        padding:       mobile ? '10px 16px' : '6px 12px',
        border:        'none',
        cursor:        'pointer',
        transition:    'color 200ms, background 200ms',
        display:       'block',
        width:         mobile ? '100%' : 'auto',
        textAlign:     mobile ? 'left' : 'center',
      }}
      onMouseEnter={e => { if (activeSection !== id) { e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.light; }}}
      onMouseLeave={e => { if (activeSection !== id) { e.currentTarget.style.color = C.charcoal; e.currentTarget.style.background = 'transparent'; }}}
    >
      {label}
    </button>
  );

  return (
    <>
      <nav style={{
        position:     'sticky', top: 0, zIndex: 100,
        background:   C.surface,
        borderBottom: `1px solid ${C.border}`,
        boxShadow:    scrolled ? '0 2px 8px rgba(12,68,124,0.10)' : 'none',
        transition:   'box-shadow 150ms',
        height:       64,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          className="px-4 sm:px-8">
          {/* Logo */}
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Proflect" width={120} height={32} style={{ height: 32, width: 'auto', objectFit: 'contain' }} priority />
          </Link>

          {/* Desktop center nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => <NavLink key={l.id} {...l} />)}
          </div>

          {/* Desktop right buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/login" style={{
              fontSize: 14, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`,
              borderRadius: 8, padding: '7px 18px', background: 'transparent', cursor: 'pointer',
              transition: 'background 200ms',
              textDecoration: 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.light}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >Log in</Link>
            <Link href="/signup" style={{
              fontSize: 14, fontWeight: 600, color: '#fff', background: C.primary,
              borderRadius: 8, padding: '7px 18px', border: 'none', cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(12,68,124,0.20)',
              transition: 'background 200ms',
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.dark}
              onMouseLeave={e => e.currentTarget.style.background = C.primary}
            >Get started free</Link>
          </div>

          {/* Mobile hamburger */}
          <button className="sm:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.charcoal, padding: 4 }}>
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDrawer(false)} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            background: C.surface, borderBottom: `1px solid ${C.border}`,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Image src="/logo.png" alt="Proflect" width={100} height={28} style={{ height: 28, width: 'auto' }} />
              <button onClick={() => setDrawer(false)} aria-label="Close menu"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.charcoal }}>
                <CloseIcon />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(l => <NavLink key={l.id} {...l} mobile />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <Link href="/login" style={{
                textAlign: 'center', fontSize: 14, fontWeight: 500, color: C.primary,
                border: `1px solid ${C.primary}`, borderRadius: 8, padding: '10px 0', textDecoration: 'none',
              }}>Log in</Link>
              <Link href="/signup" style={{
                textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff',
                background: C.primary, borderRadius: 8, padding: '10px 0', textDecoration: 'none',
              }}>Get started free</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Hero
// ══════════════════════════════════════════════════════════════════════════════
function HeroVisual() {
  const Bar = ({ w, h = 12, mt = 8 }) => (
    <div style={{ height: h, width: w, background: C.border, borderRadius: 4, marginTop: mt }} />
  );
  const Label = ({ text }) => (
    <div style={{ fontSize: 9, fontWeight: 600, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 16, marginBottom: 4 }}>
      {text}
    </div>
  );

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(12,68,124,0.16)',
      border: `1px solid ${C.border}`,
      background: C.surface,
    }}>
      {/* Mock top bar */}
      <div style={{ background: C.primary, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>Proflect</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.primary, background: C.light, borderRadius: 99, padding: '2px 10px' }}>Live Preview</span>
      </div>
      {/* Mock resume content */}
      <div style={{ background: C.bg, padding: 20, minHeight: 340, position: 'relative' }}>
        {/* Candidate name */}
        <Bar w="62%" h={20} mt={0} />
        <Bar w="40%" h={14} mt={8} />
        {/* Contact row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Bar w="28%" h={10} mt={0} /><Bar w="22%" h={10} mt={0} /><Bar w="20%" h={10} mt={0} />
        </div>
        {/* Divider */}
        <div style={{ height: 1, background: C.border, marginTop: 14 }} />

        <Label text="Summary" />
        <Bar w="95%" h={10} mt={4} /><Bar w="88%" h={10} mt={5} /><Bar w="72%" h={10} mt={5} />

        <Label text="Experience" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Bar w="45%" h={13} mt={4} />
          <Bar w="22%" h={10} mt={4} />
        </div>
        <Bar w="30%" h={10} mt={5} />
        <Bar w="90%" h={9} mt={6} /><Bar w="82%" h={9} mt={4} /><Bar w="75%" h={9} mt={4} />

        <Label text="Skills" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {['React', 'Node.js', 'Python', 'SQL', 'AWS'].map(s => (
            <span key={s} style={{ fontSize: 10, fontWeight: 500, color: C.primary, background: C.light, borderRadius: 4, padding: '3px 8px' }}>{s}</span>
          ))}
        </div>

        {/* ATS score badge */}
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 52, height: 52, borderRadius: '50%',
          background: '#fff', border: `2px solid ${C.teal}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(29,158,117,0.20)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.teal, lineHeight: 1 }}>87%</span>
          <span style={{ fontSize: 8, color: C.teal, fontWeight: 500 }}>ATS</span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section style={{ background: C.surface, padding: '96px 0 80px' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ display: 'flex', alignItems: 'center', gap: 64 }} className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left text column */}
          <div style={{ flex: '0 0 55%' }} className="w-full lg:w-auto text-center lg:text-left">
            <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              AI-Powered Resume Builder
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
              color: C.charcoal, lineHeight: 1.1, marginBottom: 24,
            }}>
              Build a Resume That<br />Gets You Hired
            </h1>
            <p style={{ fontSize: 18, color: C.secondary, lineHeight: 1.7, maxWidth: 520, marginBottom: 32 }} className="mx-auto lg:mx-0">
              Proflect creates ATS-optimised resumes with a live preview, smart scoring, and one-click export to PDF and Word — so you spend less time formatting and more time applying.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} className="justify-center lg:justify-start flex-col sm:flex-row">
              <Link href="/signup" style={{
                display: 'inline-block', fontSize: 16, fontWeight: 600, color: '#fff',
                background: C.primary, borderRadius: 8, padding: '13px 32px',
                boxShadow: '0 4px 16px rgba(12,68,124,0.20)',
                textDecoration: 'none', transition: 'background 200ms, transform 200ms',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = C.dark; e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}
              >Get started free</Link>
              <button onClick={() => scrollTo('how-it-works')} style={{
                fontSize: 16, fontWeight: 600, color: C.primary,
                border: `1px solid ${C.primary}`, borderRadius: 8, padding: '13px 32px',
                background: 'transparent', cursor: 'pointer', transition: 'background 200ms',
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.light}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >See how it works</button>
            </div>

            {/* Trust line */}
            <p style={{ fontSize: 13, color: C.secondary, marginTop: 18 }}>
              ✓ Free forever plan &nbsp;·&nbsp; ✓ No credit card required &nbsp;·&nbsp; ✓ ATS-friendly exports
            </p>
          </div>

          {/* Right visual */}
          <div style={{ flex: '0 0 45%' }} className="w-full lg:w-auto hidden sm:block">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Social Proof Bar
// ══════════════════════════════════════════════════════════════════════════════
function SocialProof() {
  const stats = [
    { num: '50,000+', label: 'Resumes Created'       },
    { num: '3×',      label: 'Higher Interview Rate' },
    { num: '98%',     label: 'ATS Pass Rate'         },
  ];
  return (
    <section style={{ background: C.light, padding: '32px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="flex-col sm:flex-row gap-6 sm:gap-0">
          {stats.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 1, height: 40, background: C.border, margin: '0 48px' }} className="hidden sm:block" />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.primary, lineHeight: 1.1 }}>{s.num}</div>
                <div style={{ fontSize: 14, color: C.secondary, marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Features
// ══════════════════════════════════════════════════════════════════════════════
const FEATURES = [
  { icon: FEAT_ICONS.preview,   title: 'Live Resume Preview',  desc: 'See exactly how your resume looks as you type. Real-time pagination ensures your layout is always print-perfect.' },
  { icon: FEAT_ICONS.ai,        title: 'AI-Powered Content',   desc: 'Get smart bullet point suggestions, professional summaries, and keyword recommendations tailored to your target role.' },
  { icon: FEAT_ICONS.ats,       title: 'ATS Score & Analysis', desc: 'Instant ATS scoring based on resume best practices. Know exactly what to fix before you apply.' },
  { icon: FEAT_ICONS.export,    title: 'PDF & Word Export',    desc: 'Export your resume as a fully ATS-readable PDF or an editable Word document with one click.' },
  { icon: FEAT_ICONS.templates, title: 'Multiple Templates',   desc: 'Choose from professionally designed templates. Every template is ATS-friendly and recruiter-approved.' },
  { icon: FEAT_ICONS.speed,     title: 'Built for Speed',      desc: 'Go from blank page to a polished, exported resume in under 10 minutes. No design skills required.' },
];

function FeatureCard({ feature, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:    C.surface,
          border:        `1px solid ${hovered ? C.primary : C.border}`,
          borderRadius:  12,
          padding:       24,
          height:        '100%',
          boxSizing:     'border-box',
          boxShadow:     hovered ? '0 4px 16px rgba(12,68,124,0.12)' : 'none',
          transition:    'border-color 200ms, box-shadow 200ms',
        }}
      >
        <div style={{ width: 48, height: 48, background: C.light, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            {feature.icon.map((p, i) => <path key={i} d={p} />)}
          </svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, marginTop: 16 }}>{feature.title}</h3>
        <p style={{ fontSize: 14, color: C.secondary, marginTop: 8, lineHeight: 1.6 }}>{feature.desc}</p>
      </div>
    </Reveal>
  );
}

function Features() {
  return (
    <section id="features" style={{ background: C.surface, padding: '96px 0' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>What Proflect Does</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>Everything you need to land the job</h2>
          <p style={{ fontSize: 16, color: C.secondary, marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>
            From building to exporting, Proflect handles every step of the resume process.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => <FeatureCard key={i} feature={f} delay={i * 60} />)}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — How It Works
// ══════════════════════════════════════════════════════════════════════════════
const STEPS = [
  { n: 1, title: 'Create Your Account',  desc: 'Sign up free in seconds. No credit card, no commitment.' },
  { n: 2, title: 'Fill In Your Details', desc: 'Add your experience, skills, and education using our guided builder.' },
  { n: 3, title: 'Optimise with AI',     desc: 'Get your ATS score, apply smart suggestions, and pick a template.' },
  { n: 4, title: 'Export & Apply',       desc: 'Download your ATS-ready PDF or Word file and start applying.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: C.bg, padding: '96px 0' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>From blank page to job application in minutes</h2>
        </div>

        {/* Desktop: horizontal steps with connecting line */}
        <div className="hidden md:block" style={{ position: 'relative' }}>
          {/* Connecting dashed line */}
          <div style={{
            position: 'absolute', top: 24, left: '12.5%', right: '12.5%',
            borderTop: `2px dashed ${C.border}`, zIndex: 0,
          }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: C.primary,
                    color: '#fff', fontSize: 18, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                  }}>{s.n}</div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, marginTop: 16 }}>{s.title}</h4>
                  <p style={{ fontSize: 14, color: C.secondary, marginTop: 8, maxWidth: 220, margin: '8px auto 0', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: C.primary, color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.n}
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal }}>{s.title}</h4>
                <p style={{ fontSize: 14, color: C.secondary, marginTop: 6, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Pricing
// ══════════════════════════════════════════════════════════════════════════════
const PLANS = [
  {
    name: 'Free', price: '$0', period: 'forever', highlight: false,
    desc: 'Everything you need to get started.',
    cta: 'Get started free', ctaHref: '/signup', ctaStyle: 'outline',
    features: ['1 resume', 'Live preview', 'PDF export (with Proflect watermark)', 'Basic ATS score', '3 templates'],
  },
  {
    name: 'Pro', price: '$9', period: 'per month', highlight: true,
    desc: 'For serious job seekers who want every advantage.',
    cta: 'Get started free', ctaHref: '/signup', ctaStyle: 'solid',
    badge: 'Most Popular',
    features: ['Unlimited resumes', 'Live preview', 'PDF & Word export (no watermark)', 'Full ATS score + suggestions', 'All templates', 'AI content suggestions', 'Priority support'],
  },
  {
    name: 'Team', price: '$29', period: 'per month', highlight: false,
    desc: 'For teams and career coaches managing multiple profiles.',
    cta: 'Contact us', ctaHref: '/signup', ctaStyle: 'outline',
    features: ['Everything in Pro', 'Up to 10 team members', 'Shared template library', 'Admin dashboard', 'Bulk export', 'Dedicated support'],
  },
];

function PricingCard({ plan, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position:       'relative',
          background:     C.surface,
          border:         plan.highlight ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
          borderRadius:   16,
          padding:        32,
          display:        'flex',
          flexDirection:  'column',
          height:         '100%',
          boxSizing:      'border-box',
          boxShadow:      plan.highlight ? '0 8px 32px rgba(12,68,124,0.16)' : hovered ? '0 4px 16px rgba(12,68,124,0.10)' : 'none',
          transition:     'box-shadow 200ms',
          transform:      plan.highlight ? 'scale(1.03)' : 'none',
        }}
      >
        {plan.badge && (
          <div style={{
            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
            background: C.primary, color: '#fff', borderRadius: 9999,
            padding: '4px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{plan.badge}</div>
        )}

        <div>
          <h3 style={{ fontSize: 22, fontWeight: 600, color: C.charcoal }}>{plan.name}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 16 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: C.charcoal }}>{plan.price}</span>
            <span style={{ fontSize: 14, color: C.secondary }}>{plan.period}</span>
          </div>
          <p style={{ fontSize: 14, color: C.secondary, marginTop: 8 }}>{plan.desc}</p>
          <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plan.features.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckIcon />
                <span style={{ fontSize: 14, color: C.charcoal }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <Link href={plan.ctaHref} style={{
            display: 'block', width: '100%', textAlign: 'center', boxSizing: 'border-box',
            fontSize: 14, fontWeight: 600, borderRadius: 8, padding: '11px 0', textDecoration: 'none',
            ...(plan.ctaStyle === 'solid'
              ? { background: C.primary, color: '#fff', border: 'none' }
              : { background: 'transparent', color: C.primary, border: `1px solid ${C.primary}` }),
            transition: 'background 200ms',
          }}
            onMouseEnter={e => {
              if (plan.ctaStyle === 'solid') { e.currentTarget.style.background = C.dark; }
              else { e.currentTarget.style.background = C.light; }
            }}
            onMouseLeave={e => {
              if (plan.ctaStyle === 'solid') { e.currentTarget.style.background = C.primary; }
              else { e.currentTarget.style.background = 'transparent'; }
            }}
          >{plan.cta}</Link>
        </div>
      </div>
    </Reveal>
  );
}

function Pricing() {
  return (
    <section id="pricing" style={{ background: C.surface, padding: '96px 0' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>Start free. Upgrade when you're ready.</h2>
          <p style={{ fontSize: 16, color: C.secondary, marginTop: 12 }}>No hidden fees. Cancel anytime.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, alignItems: 'stretch', paddingTop: 16 }}>
          {PLANS.map((p, i) => <PricingCard key={i} plan={p} delay={i * 80} />)}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — CTA Banner
// ══════════════════════════════════════════════════════════════════════════════
function CTABanner() {
  return (
    <section style={{
      background:    `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`,
      padding:       '80px 0',
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -120, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', textAlign: 'center', position: 'relative', zIndex: 1 }} className="px-4 sm:px-8">
        <Reveal>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>
            Ready to land your next job?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginTop: 16 }}>
            Join 50,000+ professionals who have built better resumes with Proflect.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              fontSize: 16, fontWeight: 600, color: C.primary, background: '#fff',
              borderRadius: 8, padding: '13px 32px', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              transition: 'background 200ms, transform 200ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.light; e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff';   e.currentTarget.style.transform = 'scale(1)'; }}
            >Create my resume — it&apos;s free</Link>
            <button onClick={() => scrollTo('pricing')} style={{
              fontSize: 16, fontWeight: 600, color: '#fff', background: 'transparent',
              border: 'none', cursor: 'pointer', textDecoration: 'underline',
              padding: '13px 16px', transition: 'opacity 200ms',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >See pricing</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — Footer
// ══════════════════════════════════════════════════════════════════════════════
function Footer() {
  const col = { display: 'flex', flexDirection: 'column', gap: 0 };
  const colHead = { fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 };
  const link  = { fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', lineHeight: 2.0, display: 'block', transition: 'color 150ms' };

  const FooterLink = ({ label }) => (
    <a href="#" style={link}
      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
    >{label}</a>
  );

  return (
    <footer style={{ background: C.charcoal, padding: '64px 0 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 40, paddingBottom: 40 }}>
          {/* Brand */}
          <div>
            <Image src="/logo.png" alt="Proflect" width={100} height={28} style={{ height: 28, width: 'auto', filter: 'brightness(0) invert(1)' }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 12, maxWidth: 220, lineHeight: 1.6 }}>
              Build resumes that get you hired.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              {[<LinkedInIcon key="li" />, <XIcon key="x" />, <GithubIcon key="gh" />].map((ic, i) => (
                <a key={i} href="#" aria-label={['LinkedIn', 'Twitter', 'GitHub'][i]}
                  style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >{ic}</a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div style={col}>
            <p style={colHead}>Product</p>
            {['Features', 'Templates', 'Pricing', 'ATS Checker', 'Export Options'].map(l => <FooterLink key={l} label={l} />)}
          </div>

          {/* Company */}
          <div style={col}>
            <p style={colHead}>Company</p>
            {['About', 'Blog', 'Careers', 'Press', 'Contact'].map(l => <FooterLink key={l} label={l} />)}
          </div>

          {/* Legal */}
          <div style={col}>
            <p style={colHead}>Legal</p>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map(l => <FooterLink key={l} label={l} />)}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px 0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>© 2025 Proflect. All rights reserved.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Made with ♥ for job seekers</p>
        </div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [activeSection, setActiveSection] = useState('');

  // Track active section for navbar highlight
  useEffect(() => {
    const sections = ['features', 'how-it-works', 'pricing'];
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>
      <Navbar activeSection={activeSection} />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
