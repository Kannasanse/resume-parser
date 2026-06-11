'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HomeNavbar from '@/components/nav/HomeNavbar';

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const ArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="#D1FAE5" stroke="#1D9E75" strokeWidth="1.5"/>
    <polyline points="9 12 11 14 15 10" stroke="#1D9E75" strokeWidth="2"/>
  </svg>
);
const LinkedInIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>);
const XIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const GithubIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>);
const MenuIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);


// ── Section 2: Hero ───────────────────────────────────────────────────────────
const FEATURE_PILLS = [
  { emoji: '✍️', label: 'Resume Builder', href: '#resume-builder' },
  { emoji: '🎯', label: 'ATS Scoring', href: '#interview-prep' },
  { emoji: '🗺', label: 'Career Map', href: '#career-map' },
  { emoji: '📚', label: 'Study Plans', href: '#study-plans' },
  { emoji: '🎤', label: 'Interview Prep', href: '#interview-prep' },
  { emoji: '📓', label: 'Block Editor Notes', href: '/notes' },
  { emoji: '🔧', label: '34 PDF & Doc Tools', href: '/utilities' },
  { emoji: '✦', label: 'Skill Courses', href: '/my-courses' },
  { emoji: '💼', label: 'Job Recommendations', href: '/jobs' },
];

function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 15% 50%, rgba(24,95,165,0.30) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 20%, rgba(29,158,117,0.20) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 90%, rgba(12,68,124,0.25) 0%, transparent 55%),
          linear-gradient(160deg, #0F1A2E 0%, #0A1020 60%, #0F2A1A 100%)
        `,
      }}
    >
      {/* Floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-float absolute" style={{ width: 500, height: 500, borderRadius: '50%', background: 'rgba(24,95,165,0.12)', filter: 'blur(80px)', top: '-10%', left: '-5%', animationDuration: '7s' }} />
        <div className="animate-float absolute" style={{ width: 350, height: 350, borderRadius: '50%', background: 'rgba(29,158,117,0.10)', filter: 'blur(60px)', bottom: '5%', right: '-5%', animationDuration: '9s', animationDirection: 'reverse' }} />
        <div className="animate-float absolute" style={{ width: 200, height: 200, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', filter: 'blur(40px)', top: '10%', right: '10%', animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6" style={{ paddingTop: 160, paddingBottom: 120 }}>
        {/* Overline badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.90)', letterSpacing: '0.04em', animationDelay: '0ms' }}>
          <span className="animate-pulse-glow" style={{ color: '#1D9E75' }}>✦</span>
          Career intelligence platform
        </div>

        {/* H1 */}
        <h1
          className="animate-fade-in-up font-black text-white"
          style={{
            fontSize: 'clamp(48px,7vw,80px)', lineHeight: 1.0, letterSpacing: '-0.04em',
            animationDelay: '100ms',
          }}
        >
          Your career,<br />
          finally working<br />
          <span style={{
            background: 'linear-gradient(135deg, #185FA5, #1D9E75)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>for you.</span>
        </h1>

        {/* Subheading */}
        <p
          className="animate-fade-in-up mt-5"
          style={{ fontSize: 18, lineHeight: 1.75, color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '20px auto 0', animationDelay: '200ms' }}
        >
          The all-in-one career platform. Build a resume, create a portfolio,
          map your career path, prep for interviews, take Notion-style notes,
          and process documents — all in one place.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-in-up flex items-center justify-center gap-3 flex-wrap mt-10" style={{ animationDelay: '300ms' }}>
          <Link
            href="/signup"
            className="font-bold text-[15px] rounded-xl transition-all"
            style={{
              background: 'white', color: '#185FA5', padding: '14px 28px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E6F1FB'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.30)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'; }}
          >
            Start for free — no card needed
          </Link>
          <a
            href="#how-it-works"
            className="font-semibold text-[15px] rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.20)',
              color: 'rgba(255,255,255,0.85)', padding: '14px 28px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            See how it works ↓
          </a>
        </div>

        {/* Trust line */}
        <p className="mt-5 text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
          ✓ Free forever plan
          <span className="mx-3" style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
          ✓ ATS-friendly exports
          <span className="mx-3" style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
          ✓ AI-powered throughout
        </p>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mt-8">
          {FEATURE_PILLS.map(p => (
            <a
              key={p.label}
              href={p.href}
              className="text-[13px] font-medium rounded-full transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)', padding: '6px 14px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span className="mr-1.5">{p.emoji}</span>{p.label}
            </a>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ color: 'rgba(255,255,255,0.35)', animation: 'bounce 2s ease-in-out infinite' }}
      >
        <ChevronDown />
      </div>

      <style>{`@keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }`}</style>
    </section>
  );
}

// ── Section 3: Logo Strip ─────────────────────────────────────────────────────
const LOGO_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Stripe', 'Shopify', 'Atlassian', 'Salesforce', 'Meta', 'Apple', 'Netflix', 'Spotify', 'Airbnb'];

function LogoStrip() {
  return (
    <section style={{ background: 'white', borderTop: '1px solid #F0F4F8', borderBottom: '1px solid #F0F4F8', padding: '32px 0', overflow: 'hidden' }}>
      <p className="text-center text-[11px] font-semibold tracking-widest uppercase mb-6" style={{ color: '#9CA3AF' }}>
        Trusted by professionals from
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, white, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, white, transparent)' }} />
        <div style={{ display: 'flex', animation: 'marqueeScroll 28s linear infinite', width: 'max-content' }}>
          {[...LOGO_COMPANIES, ...LOGO_COMPANIES].map((name, i) => (
            <div key={i} style={{ padding: '0 40px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#C4CDD6', whiteSpace: 'nowrap' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ── Section 4: Feature Showcase ───────────────────────────────────────────────
const FEATURES = [
  {
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z',
    title: 'Resume Builder', body: '24 ATS-optimised templates with a live preview. Export to PDF and Word. Smart page-break engine keeps your resume perfectly formatted.',
    stat: '24 templates', link: 'Build your resume →', accent: '#185FA5', href: '/builder',
  },
  {
    icon: 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10m6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v14',
    title: 'ATS Score & Analysis', body: 'Instant ATS scoring with or without a job description. Know exactly which skills are missing and what to fix before you apply.',
    stat: '20+ checks', link: 'Check your score →', accent: '#1D9E75', href: '/upload',
  },
  {
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14zm-4 6v-7.5l4-2.222',
    title: 'Interview Prep', body: 'Scenario-based questions for medium and hard difficulty. Shared question library gets smarter with every quiz taken.',
    stat: '3 assessment modes', link: 'Start a test →', accent: '#F59E0B', href: '/self-test',
  },
  {
    icon: 'M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-1.447-.894L15 9m0 11V9m0 0L9 7',
    title: 'AI Career Map', body: 'Upload your resume. Answer an adaptive questionnaire. Get a visual career path graph with web-sourced or AI-generated content and auto-fetched YouTube tutorials.',
    stat: '3 path types', link: 'Map your career →', accent: '#1D9E75', href: '/career-map',
  },
  {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    title: 'Personalised Study Plans', body: 'Create courses from any skill set. Phase-based learning with web-sourced or AI-generated content. YouTube tutorials auto-fetched per section.',
    stat: 'Skill-based & role-based', link: 'Start learning →', accent: '#185FA5', href: '/my-courses',
  },
];

function FeatureShowcase() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="features" className="relative py-28" style={{
      background: 'linear-gradient(180deg, white 0%, #F4F8FC 100%)',
    }}>
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(12,68,124,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gradient-primary">The Full Platform</p>
          <h2 className="font-extrabold text-[#2C2C2A]" style={{ fontSize: 'clamp(32px,4vw,48px)', letterSpacing: '-0.03em' }}>
            Everything your career needs —<br />in one place
          </h2>
          <p className="mt-4 text-base text-[#6B7280] leading-relaxed">
            Proflect combines six powerful tools that work together. Build your resume, showcase your work, understand your career path, and close your skill gaps — all from one platform.
          </p>
        </div>

        <div ref={ref} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${isVisible ? 'stagger-children' : 'opacity-0'}`}>
          {FEATURES.map(f => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature: f }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative overflow-hidden rounded-[20px] bg-white p-7 transition-all"
      style={{
        border: hovered ? `1px solid ${f.accent}60` : '1px solid #D1DCE8',
        boxShadow: hovered
          ? '0 8px 32px rgba(12,68,124,0.10), 0 2px 8px rgba(12,68,124,0.06)'
          : '0 1px 3px rgba(12,68,124,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 280ms cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[20px]"
        style={{ background: `linear-gradient(90deg, ${f.accent}, transparent)`, opacity: hovered ? 1 : 0.6, transition: 'opacity 280ms' }} />

      {/* Top row: icon + stat */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}28` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f.accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d={f.icon} />
          </svg>
        </div>
        <span className="text-[11px] font-semibold rounded-full px-2.5 py-1"
          style={{ background: 'rgba(12,68,124,0.05)', border: '1px solid rgba(12,68,124,0.10)', color: '#6B7280' }}>
          {f.stat}
        </span>
      </div>

      <h3 className="text-[17px] font-bold text-[#2C2C2A]" style={{ letterSpacing: '-0.02em' }}>{f.title}</h3>
      <p className="text-[14px] text-[#6B7280] leading-relaxed mt-2">{f.body}</p>

      <Link
        href={f.href}
        className="inline-flex items-center gap-1 text-[13px] font-semibold mt-4 transition-all group"
        style={{ color: f.accent }}
      >
        {f.link}
        <span className="transition-transform group-hover:translate-x-1"><ArrowRight size={14} /></span>
      </Link>
    </div>
  );
}

// ── Section 5: Deep Dive — Resume Builder ─────────────────────────────────────
const RESUME_FEATURES = [
  '20 professionally designed templates',
  'Real-time live preview as you type',
  'Smart page breaks — no more cut-off bullets',
  'Export to PDF and Word (.docx)',
  'ATS Score with one click',
  'Import from an existing resume',
  'Public share link for your resume',
];

function DeepDiveResume() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="resume-builder" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gradient-primary">Resume Builder</p>
            <h2 className="font-extrabold text-[#2C2C2A] leading-tight" style={{ fontSize: 'clamp(28px,3.5vw,40px)', letterSpacing: '-0.03em' }}>
              A resume that actually<br />gets you interviews
            </h2>
            <p className="mt-4 text-base text-[#6B7280] leading-relaxed">
              Not just a pretty template. Proflect&apos;s resume builder is built around ATS compliance — every template passes machine screening before it ever reaches a recruiter.
            </p>
            <ul className="mt-6 space-y-3">
              {RESUME_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5"><CheckCircle /></span>
                  <span className="text-[15px] font-medium text-[#2C2C2A]">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/builder" className="btn-primary mt-8 inline-flex items-center gap-2">
              Build your resume <ArrowRight size={16} />
            </Link>
          </div>

          {/* Visual mockup */}
          <div className="relative">
            <div
              className="rounded-[20px] overflow-hidden"
              style={{
                boxShadow: '0 24px 64px rgba(12,68,124,0.16), 0 8px 24px rgba(12,68,124,0.08)',
                border: '1px solid rgba(209,220,232,0.5)',
                transform: 'perspective(1200px) rotateY(-6deg) rotateX(2deg)',
                transition: 'transform 500ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'perspective(1200px) rotateY(-2deg) rotateX(0deg)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'perspective(1200px) rotateY(-6deg) rotateX(2deg)'}
            >
              {/* Simplified builder UI mockup */}
              <div className="flex h-72 bg-white">
                {/* Editor panel */}
                <div className="w-2/5 border-r border-gray-100 p-4 bg-[#F9FAFB]">
                  <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
                  <div className="space-y-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-7 rounded bg-white border border-gray-100 px-2 flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-100" />
                        <div className="h-1.5 w-16 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Preview panel */}
                <div className="flex-1 p-4 bg-white">
                  <div className="h-2 w-24 bg-[#185FA5] rounded mb-1.5" />
                  <div className="h-1.5 w-32 bg-gray-200 rounded mb-4" />
                  <div className="space-y-1.5">
                    {[18, 28, 22, 30, 20, 26, 16].map((w, i) => (
                      <div key={i} className="h-1.5 rounded bg-gray-100" style={{ width: `${w * 3}px`, maxWidth: '100%' }} />
                    ))}
                  </div>
                  <div className="mt-4 h-px bg-gray-100" />
                  <div className="mt-3 space-y-1.5">
                    {[22, 30, 20, 28].map((w, i) => (
                      <div key={i} className="h-1.5 rounded bg-gray-100" style={{ width: `${w * 3}px`, maxWidth: '100%' }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Toolbar */}
              <div className="h-8 bg-[#0C447C] flex items-center px-3 gap-2">
                {['bg-red-400','bg-yellow-400','bg-green-400'].map((c,i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
                <div className="flex-1 h-3 bg-white/10 rounded mx-2" />
                <div className="w-12 h-3 bg-white/20 rounded" />
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="animate-float absolute -bottom-4 -right-4 flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-white text-[13px] font-bold"
              style={{ background: '#1D9E75', boxShadow: '0 8px 24px rgba(29,158,117,0.30)', animationDuration: '4s' }}
            >
              <CheckCircle />
              ATS-Friendly ✓
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 6: Deep Dive — Career Map ─────────────────────────────────────────
const CAREER_MAP_FEATURES = [
  'AI analyses your resume in seconds',
  'Adaptive questionnaire — 5 to 10 questions, personalised to you',
  'Questions change based on your answers — no two users see the same flow',
  'Visual career graph — vertical, horizontal and diagonal paths',
  'Skill gap analysis per target role with readiness score',
  'Phase-based study plans — Beginner → Intermediate → Advanced',
  'Embedded YouTube tutorials per topic',
  'AI-generated written content per section, on demand',
  'Track progress section by section with an overall completion bar',
];

function DeepDiveCareerMap() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="career-map" className="py-36 relative overflow-hidden" style={{
      background: `
        radial-gradient(ellipse at 0% 50%, rgba(24,95,165,0.12) 0%, transparent 60%),
        radial-gradient(ellipse at 100% 50%, rgba(29,158,117,0.08) 0%, transparent 60%),
        #0F1A2E
      `,
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Career graph visual */}
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[20px] p-6 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.40)' }}>
              {/* Dot grid bg */}
              <div className="absolute inset-0 pointer-events-none rounded-[20px]" style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />
              {/* Graph nodes */}
              <div className="relative flex flex-col items-center gap-4 py-4">
                {/* Current node */}
                <div className="px-5 py-3 rounded-xl text-sm font-bold text-white text-center relative"
                  style={{ background: 'linear-gradient(135deg, #185FA5, #0C447C)', boxShadow: '0 0 20px rgba(24,95,165,0.50)', minWidth: 180 }}>
                  <div className="absolute inset-0 rounded-xl animate-pulse-glow" style={{ border: '2px solid rgba(24,95,165,0.6)' }} />
                  📍 Frontend Developer
                </div>

                {/* Three path branches */}
                <div className="flex items-center gap-6 w-full justify-center">
                  {[
                    { label: '↑ Sr. Frontend', color: '#185FA5', type: 'Vertical' },
                    { label: '→ Full Stack', color: '#1D9E75', type: 'Horizontal' },
                    { label: '↗ Engineering Lead', color: '#F59E0B', type: 'Diagonal' },
                  ].map(n => (
                    <div key={n.type} className="flex flex-col items-center gap-1.5">
                      <div className="w-px h-6" style={{ background: `${n.color}60` }} />
                      <div className="px-3 py-2 rounded-lg text-xs font-semibold text-white text-center"
                        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${n.color}40`, minWidth: 100 }}>
                        {n.label}
                        <div className="text-[10px] mt-0.5" style={{ color: n.color }}>{n.type}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target role */}
                <div className="px-5 py-3 rounded-xl text-sm font-semibold text-white text-center"
                  style={{ border: '2px solid #185FA5', background: 'rgba(24,95,165,0.10)', minWidth: 180, backdropFilter: 'blur(8px)' }}>
                  🎯 Target Role
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="animate-float absolute -top-4 -right-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', animationDuration: '5s' }}>
              3 career paths mapped
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(29,158,117,0.90)' }}>Career Map &amp; Study Plan</p>
            <h2 className="font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(28px,3.5vw,40px)', letterSpacing: '-0.03em' }}>
              Know exactly where you&apos;re going —<br />and how to get there
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Answer a few adaptive questions and Proflect maps your personalised career graph — showing vertical, horizontal, and diagonal paths from where you are to where you want to be. Each section offers a choice: web-sourced content from trusted educational sites, or AI-generated explanations tailored to your level. YouTube tutorials are auto-fetched per section so you always have a video resource alongside the text.
            </p>
            <ul className="mt-6 space-y-3">
              {CAREER_MAP_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>{f}</span>
                </li>
              ))}
            </ul>
            {/* Create from skills callout */}
            <div className="mt-6" style={{
              background: 'rgba(24,95,165,0.04)',
              border: '1px solid rgba(24,95,165,0.15)',
              borderLeft: '4px solid #185FA5',
              borderRadius: '0 16px 16px 0',
              padding: '20px 24px',
            }}>
              <p className="text-[13px] font-bold" style={{ color: '#185FA5', marginBottom: 6 }}>✦  Don&apos;t need a full career map?</p>
              <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Create a study plan directly from any skill — React, Docker, System Design, anything. Get a full course in seconds.
              </p>
              <Link href="/my-courses" className="inline-block mt-2.5 text-[14px] font-semibold" style={{ color: '#185FA5' }}>
                Create a skill course →
              </Link>
            </div>
            <Link href="/career-map" className="mt-8 inline-flex items-center gap-2 px-6 py-3 font-bold text-[15px] rounded-xl transition-all text-white"
              style={{ background: 'linear-gradient(135deg, #185FA5, #1D9E75)', boxShadow: '0 4px 20px rgba(24,95,165,0.35)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(24,95,165,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(24,95,165,0.35)'; }}>
              Map your career <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 7B: Utilities Spotlight ──────────────────────────────────────────
const UTILITY_CHIPS = [
  { icon: 'M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3M12 2v20', label: 'Merge PDF' },
  { icon: 'M4 14 10 14 10 20M20 10 14 10 14 4M10 14 3 21M21 3 14 10', label: 'Compress PDF' },
  { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM9 15l2 2 4-4', label: 'PDF → Word' },
  { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM8 13h8M8 17h8M10 9h4', label: 'Word → PDF' },
  { icon: 'M16 3h5v5M8 21H3v-5M3 21l7-7M21 3l-7 7M12 2v6M12 22v-6', label: 'Split PDF' },
  { icon: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z', label: 'Sign PDF' },
  { icon: 'M3 11h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 11V7a5 5 0 0 1 10 0v4', label: 'Protect PDF' },
  { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM8 13h8M8 17h8M10 9h2', label: 'Excel → PDF' },
  { icon: 'M4 14 10 14 10 20M20 10 14 10 14 4M10 14 3 21M21 3 14 10', label: 'Compress Image' },
  { icon: 'M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2', label: 'Crop Image' },
];

function UtilitiesSpotlight() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section className="py-24 relative" style={{ background: '#F4F8FC' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div ref={ref} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gradient-primary">Built-In Tools</p>
          <h2 className="font-extrabold text-[#2C2C2A]" style={{ fontSize: 'clamp(28px,3.5vw,40px)', letterSpacing: '-0.03em' }}>
            34 PDF and document tools.<br />Free, always.
          </h2>
          <p className="mt-4 text-base text-[#6B7280] leading-relaxed max-w-xl mx-auto">
            No more switching tabs to ilovepdf or smallpdf. Everything you need to work with PDFs, Word files, and images is already here — and processes privately in your browser.
          </p>

          <div className="mt-10 space-y-3">
            <div className="flex flex-wrap justify-center gap-2">
              {UTILITY_CHIPS.slice(0, 5).map(c => (
                <Link
                  key={c.label}
                  href="/utilities"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-[10px] px-3.5 py-2 transition-all bg-white"
                  style={{ border: '1px solid #D1DCE8', color: '#374151' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#185FA5'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(12,68,124,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1DCE8'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d={c.icon} />
                  </svg>
                  {c.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {UTILITY_CHIPS.slice(5).map(c => (
                <Link
                  key={c.label}
                  href="/utilities"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-[10px] px-3.5 py-2 transition-all bg-white"
                  style={{ border: '1px solid #D1DCE8', color: '#374151' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#185FA5'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(12,68,124,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1DCE8'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d={c.icon} />
                  </svg>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/utilities" className="inline-block mt-8 text-[15px] font-semibold" style={{ color: '#185FA5' }}>
            View all 34 tools →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Section 7C: Job Recommendations Spotlight ────────────────────────────────
const MOCK_JOBS = [
  { company: 'Razorpay', title: 'Senior React Developer', location: 'Chennai', type: 'Full-time', source: 'LinkedIn', ago: '2 days ago', color: '#0C447C' },
  { company: 'Freshworks', title: 'Frontend Engineer', location: 'Chennai', type: 'Full-time', source: 'Indeed', ago: '1 day ago', color: '#1D9E75' },
  { company: 'Wipro', title: 'Full Stack Developer', location: 'Bangalore', type: 'Remote', source: 'Naukri', ago: '3 hours ago', color: '#7C3AED' },
];

function JobsSpotlight() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section className="py-24 relative bg-white">
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 text-center">
        <div ref={ref} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gradient-primary">Jobs For You</p>
          <h2 className="font-extrabold text-[#2C2C2A]" style={{ fontSize: 'clamp(28px,3.5vw,40px)', letterSpacing: '-0.03em' }}>
            See who&apos;s hiring for your skills — right now.
          </h2>
          <p className="mt-4 text-base text-[#6B7280] leading-relaxed max-w-xl mx-auto">
            Proflect shows you live job listings matched to your profile. Based on your job title and location, updated every few hours. One less tab to keep open.
          </p>

          {/* Job cards row */}
          <div className="mt-10 relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MOCK_JOBS.map((job, i) => (
                <div
                  key={i}
                  className="text-left rounded-[16px] p-5 bg-white transition-all"
                  style={{
                    border: '1px solid #D1DCE8',
                    boxShadow: '0 1px 4px rgba(12,68,124,0.06)',
                    opacity: i === 2 ? 0.55 : 1,
                  }}
                >
                  {/* Company logo placeholder */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                      style={{ background: job.color }}>
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-semibold text-[#6B7280]">{job.company}</span>
                  </div>
                  <p className="text-[15px] font-bold text-[#2C2C2A] leading-tight mb-2">{job.title}</p>
                  <p className="text-[12px] text-[#9CA3AF] mb-3">
                    📍 {job.location} · {job.type} · via {job.source}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mb-4">Posted {job.ago}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: '#185FA5' }}>
                      Apply →
                    </span>
                    <span className="text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{ border: '1px solid #D1DCE8', color: '#6B7280' }}>
                      Save
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Fade mask on right for desktop */}
            <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-24 pointer-events-none rounded-r-[16px]"
              style={{ background: 'linear-gradient(to right, transparent, white)' }} />
          </div>

          <Link href="/jobs" className="inline-block mt-8 text-[15px] font-semibold" style={{ color: '#185FA5' }}>
            See jobs matching your profile →
          </Link>
          <p className="text-[12px] text-[#9CA3AF] mt-1.5">
            Jobs matched to your saved job title and location. Powered by real-time job listings.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Section 8: How It Works ───────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20a6 6 0 0 1 12 0v1H3v-1z',
    title: 'Build your professional profile',
    body: 'Create an ATS-optimised resume using 24 templates and get instant ATS scoring against any job description.',
  },
  {
    num: '02',
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    title: 'Map and plan your career',
    body: 'Generate a visual career map from your resume, or create a course from any skill. Get web-sourced or AI-generated content with YouTube tutorials per section.',
  },
  {
    num: '03',
    icon: 'M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
    title: 'Prepare and stay sharp',
    body: 'Practice with scenario-based interview quizzes. Take Notion-style notes with a full block editor. Use 34 built-in tools to handle any document task. Everything in one place.',
  },
];

function HowItWorks() {
  const { ref, isVisible } = useScrollReveal();
  const lineRef = useRef(null);
  const [lineVisible, setLineVisible] = useState(false);

  useEffect(() => {
    const el = lineRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setLineVisible(true); }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-28 relative" style={{ background: 'linear-gradient(180deg, #F4F8FC 0%, white 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gradient-primary">Getting Started</p>
          <h2 className="font-extrabold text-[#2C2C2A]" style={{ fontSize: 'clamp(28px,3.5vw,44px)', letterSpacing: '-0.03em' }}>
            From zero to hired —<br />in three steps
          </h2>
          <p className="mt-3 text-base text-[#6B7280]">No learning curve. No setup. Start building in seconds.</p>
        </div>

        <div className="relative">
          {/* Animated connector line (desktop) */}
          <div ref={lineRef} className="hidden lg:block absolute h-0.5" style={{ top: 36, left: 'calc(16.66% + 36px)', right: 'calc(16.66% + 36px)' }}>
            <div className="h-full rounded-full transition-all" style={{
              background: 'linear-gradient(90deg, #185FA5, #1D9E75)',
              width: lineVisible ? '100%' : '0%',
              transition: 'width 800ms cubic-bezier(0.16,1,0.3,1) 200ms',
            }} />
          </div>

          <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isVisible ? 'stagger-children' : 'opacity-0'}`}>
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: 'rgba(24,95,165,0.30)', letterSpacing: '0.08em' }}>{s.num}</p>
                <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-glow-primary"
                  style={{ background: 'linear-gradient(135deg, #185FA5, #0C447C)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#2C2C2A]" style={{ letterSpacing: '-0.02em' }}>{s.title}</h3>
                <p className="text-[15px] text-[#6B7280] leading-relaxed mt-2">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 9: ATS Score + Interview Prep ─────────────────────────────────────
const DUAL_CARDS = [
  {
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4z',
    title: 'ATS Resume Checker',
    body: 'Paste your resume and get an instant ATS score. No job description required. Proflect runs 20+ checks on formatting, keywords, and structure — then tells you exactly what to fix.',
    stats: ['20+ automated checks', 'Works without a JD', 'Section-by-section feedback'],
    cta: 'Check your ATS score →',
    href: '/upload',
  },
  {
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    title: 'Interview Prep',
    body: 'Three assessment modes: by skill, by job description, or by your own content. Medium and hard difficulty uses real-world scenario questions. A shared question library gets smarter with every quiz — your questions help future users too.',
    stats: ['3 assessment modes', 'Scenario-based questions', 'Shared question library'],
    cta: 'Start practising →',
    href: '/self-test',
  },
];

function ATSAndInterviewPrep() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section id="interview-prep" className="py-28 relative" style={{ background: '#0F1A2E' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(29,158,117,0.90)' }}>ATS Score · Interview Prep</p>
          <h2 className="font-extrabold text-white" style={{ fontSize: 'clamp(28px,3.5vw,44px)', letterSpacing: '-0.03em' }}>
            Know your score before<br />the recruiter does
          </h2>
          <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>Two tools that give you a real edge — before you hit send.</p>
        </div>

        <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isVisible ? 'stagger-children' : 'opacity-0'}`}>
          {DUAL_CARDS.map((card, i) => (
            <DualCard key={i} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DualCard({ card }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-3xl p-9 transition-all"
      style={{
        background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        border: hovered ? '1px solid rgba(24,95,165,0.40)' : '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 250ms cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-13 h-13 rounded-[14px] flex items-center justify-center mb-5"
        style={{ background: 'rgba(24,95,165,0.15)', border: '1px solid rgba(24,95,165,0.25)', width: 52, height: 52 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d={card.icon} />
        </svg>
      </div>
      <h3 className="text-[22px] font-bold text-white mt-5" style={{ letterSpacing: '-0.02em' }}>{card.title}</h3>
      <p className="text-[15px] leading-relaxed mt-2.5" style={{ color: 'rgba(255,255,255,0.60)' }}>{card.body}</p>
      <ul className="mt-5 space-y-2">
        {card.stats.map(s => (
          <li key={s} className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#1D9E75' }} />
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>{s}</span>
          </li>
        ))}
      </ul>
      <Link href={card.href}
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold mt-6 group transition-all"
        style={{ color: '#E6F1FB' }}>
        {card.cta}
        <span className="transition-transform group-hover:translate-x-1"><ArrowRight size={14} /></span>
      </Link>
    </div>
  );
}

// ── Section 10: Final CTA ─────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative py-36 overflow-hidden text-center" style={{
      background: 'linear-gradient(160deg, #0F1A2E 0%, #0A2818 50%, #0F1A2E 100%)',
    }}>
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-float absolute" style={{ width: 400, height: 400, borderRadius: '50%', background: 'rgba(24,95,165,0.20)', filter: 'blur(100px)', top: '-10%', left: '-5%', animationDuration: '8s' }} />
        <div className="animate-float absolute" style={{ width: 300, height: 300, borderRadius: '50%', background: 'rgba(29,158,117,0.15)', filter: 'blur(80px)', bottom: '-5%', right: '0%', animationDuration: '10s', animationDirection: 'reverse' }} />
      </div>

      {/* Decorative lines */}
      <div className="absolute h-px left-0 right-0 pointer-events-none" style={{ top: '20%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
      <div className="absolute h-px left-0 right-0 pointer-events-none" style={{ bottom: '20%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="font-black text-white" style={{ fontSize: 'clamp(40px,6vw,64px)', letterSpacing: '-0.04em' }}>
          Your next role
          <br />
          <span style={{ background: 'linear-gradient(135deg, white, rgba(255,255,255,0.50))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            starts here.
          </span>
        </h2>
        <p className="text-[18px] mt-4 max-w-[500px] mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Join thousands of professionals using Proflect to build better resumes, plan smarter careers, and get hired faster.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap mt-10">
          <Link href="/signup"
            className="font-bold text-[15px] rounded-xl transition-all"
            style={{ background: 'white', color: '#185FA5', padding: '14px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E6F1FB'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            Create your free account →
          </Link>
          <Link href="/career-map"
            className="font-semibold text-[15px] rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.20)', color: 'rgba(255,255,255,0.85)', padding: '14px 28px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            Explore the Career Map
          </Link>
        </div>
        <p className="text-[13px] mt-5" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Free forever
          <span className="mx-3" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          No card needed
          <span className="mx-3" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          5 min setup
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap mt-8">
          {[
            'Resume Builder', 'ATS Scoring', 'Career Map', 'Study Plans',
            'Interview Prep', 'Notes', '34 Tools', 'Skill Courses', 'Jobs',
          ].map(label => (
            <span
              key={label}
              className="text-[12px] font-medium rounded-full px-3 py-1"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.50)' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 11: Footer ────────────────────────────────────────────────────────
const FOOTER_LINKS = {
  Product: [
    { label: 'Resume Builder', href: '/builder' },
    { label: 'ATS Score', href: '/upload' },
    { label: 'Interview Prep', href: '/self-test' },
    { label: 'Career Map', href: '/career-map' },
    { label: 'Study Plans', href: '/my-courses' },
    { label: 'Notes', href: '/notes' },
    { label: 'Utilities', href: '/utilities' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

function HomeFooter() {
  return (
    <footer style={{ background: '#0D1117' }}>
      {/* Top separator */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="Proflect" height={40} width={118} style={{ height: '40px', width: '118px', minHeight: '40px', minWidth: '118px', maxHeight: '40px', objectFit: 'contain', display: 'block', flexShrink: 0, marginBottom: '12px' }} />
            <p className="text-sm max-w-[200px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Build the career you deserve.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[
                { icon: <LinkedInIcon />, href: '#' },
                { icon: <XIcon />, href: '#' },
                { icon: <GithubIcon />, href: '#' },
              ].map((s, i) => (
                <a key={i} href={s.href}
                  className="transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>{heading}</p>
              <ul className="space-y-0">
                {links.map(l => (
                  <li key={l.label} style={{ lineHeight: 2.2 }}>
                    <Link href={l.href}
                      className="text-sm transition-colors"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'white'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            © {new Date().getFullYear()} Proflect. All rights reserved.
          </p>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Made with <span style={{ color: '#D93025' }}>♥</span> for job seekers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HomepageContent({ sections, isPreview, userRole }) {
  return (
    <div className="overflow-x-hidden">
      <HomeNavbar />
      <HeroSection />
      <FeatureShowcase />
      <DeepDiveResume />
      <DeepDiveCareerMap />
      <UtilitiesSpotlight />
      <HowItWorks />
      <FinalCTA />
      <HomeFooter />

      {/* Reduced motion */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-"], .animate-float, .animate-fade-in-up, .animate-fade-in-scale, .animate-pulse-glow {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
