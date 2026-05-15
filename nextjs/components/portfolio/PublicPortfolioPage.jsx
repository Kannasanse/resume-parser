'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Helpers ───────────────────────────────────────────────────────────────

function sectionId(sectionType) {
  return sectionType.replace(/_/g, '-');
}

function visibleSections(sections) {
  return [...sections]
    .filter((s) => s.is_visible !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

// ─── Inline SVG Icons (~16px) ──────────────────────────────────────────────

function IconLinkedIn({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.333 2H2.667A.667.667 0 0 0 2 2.667v10.666c0 .368.299.667.667.667h10.666A.667.667 0 0 0 14 13.333V2.667A.667.667 0 0 0 13.333 2ZM5.667 11.667H4V6.667h1.667v5Zm-.834-5.834a.833.833 0 1 1 0-1.666.833.833 0 0 1 0 1.666Zm6.834 5.834H10V9.333c0-.666-.333-1-1-1s-.833.334-.833 1v2.334H6.5v-5h1.667v.666c.25-.4.75-.75 1.5-.75C10.74 6.583 11.667 7.25 11.667 8.9v2.767Z" />
    </svg>
  );
}

function IconGitHub({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 1a7 7 0 0 0-2.213 13.641c.35.064.479-.152.479-.337l-.01-1.322c-1.947.423-2.357-.938-2.357-.938-.318-.808-.777-1.023-.777-1.023-.635-.434.048-.425.048-.425.703.05 1.073.721 1.073.721.624 1.07 1.638.76 2.038.582.063-.452.244-.761.444-.935-1.555-.177-3.19-.778-3.19-3.46 0-.764.273-1.389.721-1.879-.072-.178-.313-.89.069-1.854 0 0 .588-.189 1.927.719A6.71 6.71 0 0 1 8 5.08c.596.003 1.196.08 1.756.237 1.337-.908 1.924-.719 1.924-.719.383.964.142 1.676.07 1.854.449.49.72 1.115.72 1.879 0 2.689-1.638 3.281-3.198 3.454.251.217.475.644.475 1.299l-.009 1.924c0 .187.127.405.483.337A7.001 7.001 0 0 0 8 1Z" />
    </svg>
  );
}

function IconTwitterX({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.217 2h2.117L9.768 7.291 15.2 14h-4.263l-3.337-4.364L4.217 14H2.1l4.95-5.659L1.6 2h4.37l3.016 3.987L12.217 2Zm-.743 10.8h1.174L4.581 3.2H3.317L11.474 12.8Z" />
    </svg>
  );
}

function IconGlobe({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2c-1.5 2-2 3.5-2 6s.5 4 2 6M8 2c1.5 2 2 3.5 2 6s-.5 4-2 6M2 8h12" />
    </svg>
  );
}

function IconMapPin({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <path d="M7 1.5A3.5 3.5 0 0 1 10.5 5c0 2.5-3.5 7.5-3.5 7.5S3.5 7.5 3.5 5A3.5 3.5 0 0 1 7 1.5Z" />
      <circle cx="7" cy="5" r="1.2" />
    </svg>
  );
}

// ─── Social Links Row ──────────────────────────────────────────────────────

function SocialLinks({ links = {}, white = false }) {
  const color = white ? 'text-white/70 hover:text-white' : 'text-[#6B7280] hover:text-[#185FA5]';
  const items = [
    links.linkedin && { href: links.linkedin, icon: <IconLinkedIn size={18} />, label: 'LinkedIn' },
    links.github && { href: links.github, icon: <IconGitHub size={18} />, label: 'GitHub' },
    links.twitter && { href: links.twitter, icon: <IconTwitterX size={18} />, label: 'Twitter' },
    links.website && { href: links.website, icon: <IconGlobe size={18} />, label: 'Website' },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className="flex items-center gap-3">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className={`transition-colors ${color}`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

// ─── About Section ─────────────────────────────────────────────────────────

function AboutSection({ section }) {
  const c = section.content || {};
  const name = c.name || '';
  const headline = c.headline || '';
  const bio = c.bio || '';
  const location = c.location || '';
  const availability = c.availability;
  const photoUrl = c.photo_url || null;
  const links = c.links || {};

  const availabilityColors = {
    open: 'bg-green-100 text-green-700',
    employed: 'bg-yellow-100 text-yellow-700',
    not_open: 'bg-gray-100 text-gray-600',
  };
  const availabilityLabels = {
    open: 'Open to opportunities',
    employed: 'Currently employed',
    not_open: 'Not available',
  };

  return (
    <section
      id={sectionId(section.section_type)}
      className="portfolio-section py-20 px-4"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start gap-8">
        {/* Photo */}
        {photoUrl && (
          <div className="flex-shrink-0">
            <img
              src={photoUrl}
              alt={name ? `${name}'s profile photo` : 'Profile photo'}
              className="w-[120px] h-[120px] rounded-full object-cover border-2 border-[#D1DCE8] shadow-sm"
            />
          </div>
        )}
        {/* Text */}
        <div className="flex-1 min-w-0">
          {name && (
            <h1 className="text-4xl font-bold text-[#2C2C2A] leading-tight mb-2">{name}</h1>
          )}
          {headline && (
            <p className="text-lg text-[#185FA5] font-medium mb-3">{headline}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {location && (
              <span className="flex items-center gap-1 text-sm text-[#6B7280]">
                <IconMapPin />
                {location}
              </span>
            )}
            {availability && availabilityLabels[availability] && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${availabilityColors[availability] || 'bg-gray-100 text-gray-600'}`}
              >
                {availabilityLabels[availability]}
              </span>
            )}
          </div>
          {bio && (
            <p className="text-base text-[#2C2C2A] leading-relaxed mb-5 max-w-2xl">{bio}</p>
          )}
          <SocialLinks links={links} />
        </div>
      </div>
    </section>
  );
}

// ─── Placeholder Section ───────────────────────────────────────────────────

const SECTION_LABELS = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards',
  publications: 'Publications',
  languages: 'Languages',
  volunteer: 'Volunteer',
  references: 'References',
  custom: 'Custom Section',
};

function PlaceholderSection({ section }) {
  const label = SECTION_LABELS[section.section_type] || section.section_type;
  return (
    <section
      id={sectionId(section.section_type)}
      className="portfolio-section py-16 px-4 max-w-4xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-[#2C2C2A] mb-6">{label}</h2>
      <div className="border border-dashed border-[#D1DCE8] rounded-xl p-8 text-center text-[#6B7280] text-sm bg-[#F9FAFB]">
        <span className="font-medium text-[#2C2C2A]">{label}</span>
        {' '}— content coming soon
      </div>
    </section>
  );
}

// ─── Sticky Nav ────────────────────────────────────────────────────────────

function StickyNav({ ownerName, sections }) {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const ordered = visibleSections(sections);

  // Show after 200px scroll
  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver for active section
  useEffect(() => {
    if (!ordered.length) return;
    const observers = [];
    const map = new Map();

    ordered.forEach((s) => {
      const el = document.getElementById(sectionId(s.section_type));
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          map.set(s.section_type, entry.isIntersecting);
          const first = ordered.find((sec) => map.get(sec.section_type));
          if (first) setActiveId(sectionId(first.section_type));
        },
        { rootMargin: '-20% 0px -60% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [ordered]);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const NAV_LABELS = {
    about: 'About',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    awards: 'Awards',
    publications: 'Publications',
    languages: 'Languages',
    volunteer: 'Volunteer',
    references: 'References',
    custom: 'More',
  };

  return (
    <nav
      className="sticky top-0 z-[100] transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #D1DCE8',
        height: 56,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-label="Portfolio navigation"
    >
      <div className="max-w-5xl mx-auto h-full px-4 flex items-center gap-6">
        {/* Owner name — left */}
        <span className="text-sm font-semibold text-[#2C2C2A] shrink-0 hidden sm:block">
          {ownerName}
        </span>

        {/* Nav links — center, scrollable */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {ordered.map((s) => {
            const id = sectionId(s.section_type);
            const isActive = activeId === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#185FA5]/10 text-[#185FA5]'
                    : 'text-[#6B7280] hover:text-[#2C2C2A] hover:bg-gray-100'
                }`}
              >
                {NAV_LABELS[s.section_type] || s.section_type}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function PortfolioFooter({ portfolio, sections }) {
  const about = sections.find((s) => s.section_type === 'about');
  const c = about?.content || {};
  const ownerName = c.name || portfolio.name || '';
  const headline = c.headline || '';
  const links = c.links || {};
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-16 py-10 px-4 text-center"
      style={{ background: '#2C2C2A', color: 'rgba(255,255,255,0.7)' }}
    >
      {ownerName && (
        <p className="text-base font-semibold text-white mb-1">{ownerName}</p>
      )}
      {headline && (
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {headline}
        </p>
      )}

      <div className="flex justify-center mb-6">
        <SocialLinks links={links} white />
      </div>

      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
        &copy; {year} {ownerName}. All rights reserved.
      </p>

      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors"
        style={{
          borderColor: 'rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Built with{' '}
        <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Proflect
        </span>
      </Link>
    </footer>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────

export default function PublicPortfolioPage({ portfolio, sections, projects }) {
  const ordered = visibleSections(sections);
  const about = ordered.find((s) => s.section_type === 'about');

  const aboutContent = about?.content || {};
  const ownerName = aboutContent.name || portfolio.name || '';

  return (
    <div className="min-h-screen bg-white text-[#2C2C2A]">
      <StickyNav ownerName={ownerName} sections={sections} />

      <main>
        {ordered.map((section) => {
          if (section.section_type === 'about') {
            return <AboutSection key={section.id} section={section} />;
          }
          return <PlaceholderSection key={section.id} section={section} />;
        })}

        {/* Divider if no sections */}
        {!ordered.length && (
          <div className="max-w-4xl mx-auto py-24 px-4 text-center text-[#6B7280]">
            <p className="text-lg">This portfolio has no visible sections yet.</p>
          </div>
        )}
      </main>

      <PortfolioFooter portfolio={portfolio} sections={sections} />
    </div>
  );
}
