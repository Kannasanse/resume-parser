'use client';
import { useState, useEffect, useRef } from 'react';
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

// ── Icons ──────────────────────────────────────────────────────────────────────
const FEAT_ICON_PATHS = {
  preview:  ['M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z', 'M8 21h8', 'M12 17v4'],
  ai:       ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  ats:      ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  export:   ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  templates:['M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z', 'M4 14a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z', 'M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5z'],
  speed:    ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  default:  ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z'],
};

const MenuIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const CheckIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);

const LinkedInIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>);
const XIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const GithubIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>);

// ── Scroll-reveal ──────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 400ms ease ${delay}ms, transform 400ms ease ${delay}ms` }}>
      {children}
    </div>
  );
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
const ALL_NAV_LINKS = [
  { label: 'Features',     id: 'features',    sectionKey: 'features' },
  { label: 'How it works', id: 'how-it-works', sectionKey: 'steps'   },
  { label: 'Pricing',      id: 'pricing',      sectionKey: 'pricing'  },
];

function Navbar({ heroCta, activeSection, visibleSectionKeys }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawer] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 64);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = ALL_NAV_LINKS.filter(l => visibleSectionKeys.includes(l.sectionKey));
  const ctaLabel = heroCta || 'Get started free';

  const NavLink = ({ label, id, mobile = false }) => (
    <button onClick={() => { scrollTo(id); setDrawer(false); }}
      style={{ fontSize: mobile ? 16 : 14, fontWeight: 500, color: activeSection === id ? C.primary : C.charcoal, background: activeSection === id ? C.light : 'transparent', borderRadius: 8, padding: mobile ? '10px 16px' : '6px 12px', border: 'none', cursor: 'pointer', transition: 'color 200ms, background 200ms', display: 'block', width: mobile ? '100%' : 'auto', textAlign: mobile ? 'left' : 'center' }}
      onMouseEnter={e => { if (activeSection !== id) { e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.light; }}}
      onMouseLeave={e => { if (activeSection !== id) { e.currentTarget.style.color = C.charcoal; e.currentTarget.style.background = 'transparent'; }}}
    >{label}</button>
  );

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, boxShadow: scrolled ? '0 2px 8px rgba(12,68,124,0.10)' : 'none', transition: 'box-shadow 150ms', height: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="px-4 sm:px-8">
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Proflect" width={120} height={32} style={{ height: 32, width: 'auto', objectFit: 'contain' }} priority />
          </Link>
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => <NavLink key={l.id} {...l} />)}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '7px 18px', background: 'transparent', textDecoration: 'none', transition: 'background 200ms' }} onMouseEnter={e => e.currentTarget.style.background = C.light} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Log in</Link>
            <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: C.primary, borderRadius: 8, padding: '7px 18px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(12,68,124,0.20)', transition: 'background 200ms' }} onMouseEnter={e => e.currentTarget.style.background = C.dark} onMouseLeave={e => e.currentTarget.style.background = C.primary}>{ctaLabel}</Link>
          </div>
          <button className="sm:hidden" onClick={() => setDrawer(true)} aria-label="Open menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.charcoal, padding: 4 }}><MenuIcon /></button>
        </div>
      </nav>
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDrawer(false)} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Image src="/logo.png" alt="Proflect" width={100} height={28} style={{ height: 28, width: 'auto' }} />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.charcoal }}><CloseIcon /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(l => <NavLink key={l.id} {...l} mobile />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <Link href="/login" style={{ textAlign: 'center', fontSize: 14, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '10px 0', textDecoration: 'none' }}>Log in</Link>
              <Link href="/signup" style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff', background: C.primary, borderRadius: 8, padding: '10px 0', textDecoration: 'none' }}>{ctaLabel}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Hero visual (static decorative) ───────────────────────────────────────────
function HeroVisual() {
  const Bar = ({ w, h = 12, mt = 8 }) => (<div style={{ height: h, width: w, background: C.border, borderRadius: 4, marginTop: mt }} />);
  const Label = ({ text }) => (<div style={{ fontSize: 9, fontWeight: 600, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 16, marginBottom: 4 }}>{text}</div>);
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(12,68,124,0.16)', border: `1px solid ${C.border}`, background: C.surface }}>
      <div style={{ background: C.primary, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Proflect</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.primary, background: C.light, borderRadius: 99, padding: '2px 10px' }}>Live Preview</span>
      </div>
      <div style={{ background: C.bg, padding: 20, minHeight: 340, position: 'relative' }}>
        <Bar w="62%" h={20} mt={0} /><Bar w="40%" h={14} mt={8} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Bar w="28%" h={10} mt={0} /><Bar w="22%" h={10} mt={0} /><Bar w="20%" h={10} mt={0} /></div>
        <div style={{ height: 1, background: C.border, marginTop: 14 }} />
        <Label text="Summary" /><Bar w="95%" h={10} mt={4} /><Bar w="88%" h={10} mt={5} /><Bar w="72%" h={10} mt={5} />
        <Label text="Experience" />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><Bar w="45%" h={13} mt={4} /><Bar w="22%" h={10} mt={4} /></div>
        <Bar w="90%" h={9} mt={6} /><Bar w="82%" h={9} mt={4} /><Bar w="75%" h={9} mt={4} />
        <Label text="Skills" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {['React', 'Node.js', 'Python', 'SQL', 'AWS'].map(s => (<span key={s} style={{ fontSize: 10, fontWeight: 500, color: C.primary, background: C.light, borderRadius: 4, padding: '3px 8px' }}>{s}</span>))}
        </div>
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 52, height: 52, borderRadius: '50%', background: '#fff', border: `2px solid ${C.teal}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(29,158,117,0.20)' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.teal, lineHeight: 1 }}>87%</span>
          <span style={{ fontSize: 8, color: C.teal, fontWeight: 500 }}>ATS</span>
        </div>
      </div>
    </div>
  );
}

// ── Section components (accept data props) ─────────────────────────────────────

function Hero({ data }) {
  const d = data || {};
  return (
    <section style={{ background: C.surface, padding: '96px 0 80px' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ display: 'flex', alignItems: 'center', gap: 64 }} className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div style={{ flex: '0 0 55%' }} className="w-full lg:w-auto text-center lg:text-left">
            <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{d.badge_text}</div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: C.charcoal, lineHeight: 1.1, marginBottom: 24 }}>{d.heading}</h1>
            <p style={{ fontSize: 18, color: C.secondary, lineHeight: 1.7, maxWidth: 520, marginBottom: 32 }} className="mx-auto lg:mx-0">{d.subheading}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} className="justify-center lg:justify-start flex-col sm:flex-row">
              <Link href={d.primary_cta_href || '/signup'} style={{ display: 'inline-block', fontSize: 16, fontWeight: 600, color: '#fff', background: C.primary, borderRadius: 8, padding: '13px 32px', boxShadow: '0 4px 16px rgba(12,68,124,0.20)', textDecoration: 'none', transition: 'background 200ms, transform 200ms' }} onMouseEnter={e => { e.currentTarget.style.background = C.dark; e.currentTarget.style.transform = 'scale(1.01)'; }} onMouseLeave={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}>{d.primary_cta_label || ''}</Link>
              <button onClick={() => scrollTo('how-it-works')} style={{ fontSize: 16, fontWeight: 600, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '13px 32px', background: 'transparent', cursor: 'pointer', transition: 'background 200ms' }} onMouseEnter={e => e.currentTarget.style.background = C.light} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{d.secondary_cta_label}</button>
            </div>
            {d.trust_items?.length > 0 && (
              <p style={{ fontSize: 13, color: C.secondary, marginTop: 18 }}>
                {d.trust_items.map((t, i) => <span key={i}>{i > 0 && ' · '}✓ {t}</span>)}
              </p>
            )}
          </div>
          <div style={{ flex: '0 0 45%' }} className="w-full lg:w-auto hidden sm:block"><HeroVisual /></div>
        </div>
      </div>
    </section>
  );
}

function SocialProof({ data }) {
  const items = data?.items || [];
  return (
    <section style={{ background: C.light, padding: '32px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="flex-col sm:flex-row gap-6 sm:gap-0">
          {items.map((s, i) => (
            <div key={s.id || i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 1, height: 40, background: C.border, margin: '0 48px' }} className="hidden sm:block" />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.primary, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 14, color: C.secondary, marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features({ data }) {
  const d = data || {};
  const items = d.items || [];
  const [hovered, setHovered] = useState(null);
  return (
    <section id="features" style={{ background: C.surface, padding: '96px 0' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          {d.overline && <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{d.overline}</div>}
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>{d.title}</h2>
          {d.subtitle && <p style={{ fontSize: 16, color: C.secondary, marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>{d.subtitle}</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {items.map((f, i) => {
            const paths = FEAT_ICON_PATHS[f.icon] || FEAT_ICON_PATHS.default;
            return (
              <Reveal key={f.id || i} delay={i * 60}>
                <div onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ background: C.surface, border: `1px solid ${hovered === i ? C.primary : C.border}`, borderRadius: 12, padding: 24, height: '100%', boxSizing: 'border-box', boxShadow: hovered === i ? '0 4px 16px rgba(12,68,124,0.12)' : 'none', transition: 'border-color 200ms, box-shadow 200ms' }}>
                  <div style={{ width: 48, height: 48, background: C.light, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{paths.map((p, j) => <path key={j} d={p} />)}</svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, marginTop: 16 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: C.secondary, marginTop: 8, lineHeight: 1.6 }}>{f.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ data }) {
  const d = data || {};
  const items = d.items || [];
  return (
    <section id="how-it-works" style={{ background: C.bg, padding: '96px 0' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          {d.overline && <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{d.overline}</div>}
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>{d.title}</h2>
        </div>
        <div className="hidden md:block" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 24, left: '12.5%', right: '12.5%', borderTop: `2px dashed ${C.border}`, zIndex: 0 }} />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`, gap: 24 }}>
            {items.map((s, i) => (
              <Reveal key={s.id || i} delay={i * 80}>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.primary, color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>{i + 1}</div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, marginTop: 16 }}>{s.title}</h4>
                  <p style={{ fontSize: 14, color: C.secondary, marginTop: 8, maxWidth: 220, margin: '8px auto 0', lineHeight: 1.6 }}>{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {items.map((s, i) => (
            <div key={s.id || i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: C.primary, color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
              <div><h4 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal }}>{s.title}</h4><p style={{ fontSize: 14, color: C.secondary, marginTop: 6, lineHeight: 1.6 }}>{s.description}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ data }) {
  const d = data || {};
  const items = d.items || [];
  const [hovered, setHovered] = useState(null);
  return (
    <section id="pricing" style={{ background: C.surface, padding: '96px 0' }} className="py-16 sm:py-24">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          {d.overline && <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{d.overline}</div>}
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>{d.title}</h2>
          {d.subtext && <p style={{ fontSize: 16, color: C.secondary, marginTop: 12 }}>{d.subtext}</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, alignItems: 'stretch', paddingTop: 16 }}>
          {items.map((plan, i) => (
            <Reveal key={plan.id || i} delay={i * 80}>
              <div onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{ position: 'relative', background: C.surface, border: plan.is_highlighted ? `2px solid ${C.primary}` : `1px solid ${C.border}`, borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', boxShadow: plan.is_highlighted ? '0 8px 32px rgba(12,68,124,0.16)' : hovered === i ? '0 4px 16px rgba(12,68,124,0.10)' : 'none', transition: 'box-shadow 200ms', transform: plan.is_highlighted ? 'scale(1.03)' : 'none' }}>
                {plan.is_highlighted && plan.highlight_label && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: C.primary, color: '#fff', borderRadius: 9999, padding: '4px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{plan.highlight_label}</div>
                )}
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 600, color: C.charcoal }}>{plan.plan_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 16 }}>
                    <span style={{ fontSize: 40, fontWeight: 700, color: C.charcoal }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: C.secondary }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.secondary, marginTop: 8 }}>{plan.description}</p>
                  <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(plan.features || []).map((f, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckIcon /><span style={{ fontSize: 14, color: C.charcoal }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                  <Link href={plan.cta_href || '/signup'} style={{ display: 'block', width: '100%', textAlign: 'center', boxSizing: 'border-box', fontSize: 14, fontWeight: 600, borderRadius: 8, padding: '11px 0', textDecoration: 'none', ...(plan.cta_variant === 'contained' ? { background: C.primary, color: '#fff', border: 'none' } : { background: 'transparent', color: C.primary, border: `1px solid ${C.primary}` }), transition: 'background 200ms' }} onMouseEnter={e => { e.currentTarget.style.background = plan.cta_variant === 'contained' ? C.dark : C.light; }} onMouseLeave={e => { e.currentTarget.style.background = plan.cta_variant === 'contained' ? C.primary : 'transparent'; }}>{plan.cta_label}</Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner({ data }) {
  const d = data || {};
  return (
    <section style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`, padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -120, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', textAlign: 'center', position: 'relative', zIndex: 1 }} className="px-4 sm:px-8">
        <Reveal>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>{d.heading}</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginTop: 16 }}>{d.subtext}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <Link href={d.primary_cta_href || '/signup'} style={{ fontSize: 16, fontWeight: 600, color: C.primary, background: '#fff', borderRadius: 8, padding: '13px 32px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'background 200ms, transform 200ms' }} onMouseEnter={e => { e.currentTarget.style.background = C.light; e.currentTarget.style.transform = 'scale(1.01)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}>{d.primary_cta_label}</Link>
            <button onClick={() => scrollTo('pricing')} style={{ fontSize: 16, fontWeight: 600, color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: '13px 16px', transition: 'opacity 200ms' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{d.secondary_cta_label}</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer({ data }) {
  const d = data || {};
  const cols = d.columns || [];
  const lnk = { fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', lineHeight: 2.0, display: 'block', transition: 'color 150ms' };
  return (
    <footer style={{ background: C.charcoal, padding: '64px 0 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }} className="px-4 sm:px-8">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 40, paddingBottom: 40 }}>
          <div>
            <Image src="/logo.png" alt="Proflect" width={100} height={28} style={{ height: 28, width: 'auto', filter: 'brightness(0) invert(1)' }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 12, maxWidth: 220, lineHeight: 1.6 }}>{d.tagline}</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              {[{ ic: <LinkedInIcon />, label: 'LinkedIn' }, { ic: <XIcon />, label: 'Twitter' }, { ic: <GithubIcon />, label: 'GitHub' }].map(({ ic, label }) => (
                <a key={label} href="#" aria-label={label} style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 150ms' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{ic}</a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.id}>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{col.heading}</p>
              {(col.links || []).map(link => (
                <a key={link.id} href={link.href || '#'} style={lnk} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>{link.label}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px 0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{d.copyright}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Made with ♥ for job seekers</p>
        </div>
      </div>
    </footer>
  );
}

// ── New section renderers ──────────────────────────────────────────────────────

function Testimonials({ data }) {
  const d = data || {};
  const items = d.items || [];
  return (
    <section style={{ background: C.bg, padding: '96px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        {(d.overline || d.title || d.subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            {d.overline && <div style={{ fontSize: 11, fontWeight: 500, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{d.overline}</div>}
            {d.title && <h2 style={{ fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>{d.title}</h2>}
            {d.subtitle && <p style={{ fontSize: 16, color: C.secondary, marginTop: 12, maxWidth: 560, margin: '12px auto 0' }}>{d.subtitle}</p>}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {items.map((item, i) => (
            <Reveal key={item.id || i} delay={i * 60}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, height: '100%', boxSizing: 'border-box' }}>
                <p style={{ fontSize: 15, color: C.charcoal, lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 20px' }}>"{item.quote}"</p>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal }}>{item.author}</div>
                  {(item.role || item.company) && (
                    <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>
                      {item.role}{item.role && item.company ? ' · ' : ''}{item.company}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomText({ data }) {
  const d = data || {};
  return (
    <section style={{ background: C.surface, padding: '64px 0' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>
        <div dangerouslySetInnerHTML={{ __html: d?.content || '' }} />
      </div>
    </section>
  );
}

function CustomHtml({ data }) {
  const d = data || {};
  if (!d?.html) return null;
  return (
    <section style={{ background: C.surface, padding: '64px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div dangerouslySetInnerHTML={{ __html: d.html }} />
      </div>
    </section>
  );
}

// ── Preview banner (admin preview mode) ───────────────────────────────────────
function PreviewBanner() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, background: '#F59E0B', color: '#fff', textAlign: 'center', padding: '10px', fontSize: 13, fontWeight: 600 }}>
      You are viewing a preview — not live.{' '}
      <a href="/admin/homepage" style={{ color: '#fff', textDecoration: 'underline' }}>Back to editor</a>
    </div>
  );
}

// ── Section renderer ───────────────────────────────────────────────────────────
const renderSection = (section) => {
  const c = section.content || {};
  const data = {
    ...c,
    overline: section.overline ?? c.overline,
    title:    section.title    ?? c.title,
    subtitle: section.subtitle ?? c.subtitle,
  };
  switch (section.section_type) {
    case 'hero':         return <Hero         key={section.section_key} data={data} />;
    case 'stats':        return <SocialProof  key={section.section_key} data={data} />;
    case 'features':     return <Features     key={section.section_key} data={data} />;
    case 'steps':        return <HowItWorks   key={section.section_key} data={data} />;
    case 'pricing':      return <Pricing      key={section.section_key} data={data} />;
    case 'cta':          return <CTABanner    key={section.section_key} data={data} />;
    case 'footer':       return <Footer       key={section.section_key} data={data} />;
    case 'testimonials': return <Testimonials key={section.section_key} data={data} />;
    case 'custom_text':  return <CustomText   key={section.section_key} data={data} />;
    case 'custom_html':  return <CustomHtml   key={section.section_key} data={data} />;
    default:             return null;
  }
};

// ── Main export ────────────────────────────────────────────────────────────────
export default function HomepageContent({ sections = [], isPreview = false }) {
  const [activeSection, setActiveSection] = useState('');
  const visibleKeys = sections.map(s => s.section_key);

  // Find hero content for navbar CTA button label
  const heroSection = sections.find(s => s.section_type === 'hero');
  const heroCta = heroSection?.content?.primary_cta_label || 'Get started free';

  useEffect(() => {
    const ids = ['features', 'how-it-works', 'pricing'];
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  // Separate footer (always last)
  const footerSection = sections.find(s => s.section_type === 'footer');
  const mainSections = sections.filter(s => s.section_type !== 'footer');

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden', paddingTop: isPreview ? 44 : 0 }}>
      {isPreview && <PreviewBanner />}
      <Navbar heroCta={heroCta} activeSection={activeSection} visibleSectionKeys={visibleKeys} />
      <main>
        {mainSections.map(s => renderSection(s))}
      </main>
      {footerSection && renderSection(footerSection)}
    </div>
  );
}
