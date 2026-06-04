'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FEATURE_SCREENSHOT_COMPONENTS } from './FeatureScreenshots';

function SparklesIcon({ size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
        fill={color} opacity="0.85"
      />
      <path
        d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
        fill={color} opacity="0.60"
      />
    </svg>
  );
}

function ScreenshotPlaceholder({ label, accentColor }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${accentColor}18 0%, rgba(10,22,40,0.80) 60%, ${accentColor}08 100%)`,
      border: `1px solid ${accentColor}30`,
      borderRadius: 14, aspectRatio: '16/9',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${accentColor}25`, border: `1px solid ${accentColor}40`,
        display: 'grid', placeItems: 'center',
      }}>
        <SparklesIcon size={22} color={accentColor} />
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
        {label}
      </span>
    </div>
  );
}

export default function FeatureHero({ eyebrow, heading, sub, screenshotLabel, featureName, appHref, accentColor = '#185FA5', featureSlug }) {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;
  const ctaLabel = isLoggedIn ? `Open ${featureName} →` : 'Get started free →';
  const ctaHref  = isLoggedIn ? appHref : '/signup';

  const Screenshot = featureSlug ? FEATURE_SCREENSHOT_COMPONENTS[featureSlug] : null;

  return (
    <section style={{ padding: '130px 24px 80px', textAlign: 'center', position: 'relative' }}>
      {/* Subtle orb */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: `${accentColor}12`, filter: 'blur(80px)',
          top: '-10%', left: '50%', transform: 'translateX(-50%)',
        }} />
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
        {/* Eyebrow pill */}
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          background: `${accentColor}20`, border: `1px solid ${accentColor}30`,
          borderRadius: 9999, padding: '4px 14px', marginBottom: 24,
          fontSize: 13, fontWeight: 600, color: '#5B9FD4', letterSpacing: '0.02em',
        }}>
          {eyebrow}
        </span>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800,
          color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1,
          margin: 0, whiteSpace: 'pre-line',
        }}>
          {heading}
        </h1>

        {/* Sub-heading */}
        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.65)',
          maxWidth: 560, margin: '16px auto 0', lineHeight: 1.6,
        }}>
          {sub}
        </p>

        {/* CTA row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Link href={ctaHref} style={{
            background: 'linear-gradient(135deg, #185FA5, #1D9E75)',
            color: 'white', borderRadius: 12, padding: '12px 28px',
            fontSize: 16, fontWeight: 700, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
            boxShadow: '0 4px 16px rgba(24,95,165,0.30)',
          }}>
            {ctaLabel}
          </Link>
          <a href="#demo" style={{
            border: '1px solid rgba(255,255,255,0.25)', color: 'white',
            borderRadius: 12, padding: '12px 24px', fontSize: 16,
            fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            See it in action
          </a>
        </div>
      </div>

      {/* Screenshot */}
      <div style={{
        maxWidth: 900, margin: '48px auto 0',
        borderRadius: 14,
        boxShadow: '0 40px 80px rgba(0,0,0,0.50), 0 8px 24px rgba(0,0,0,0.30)',
        transform: 'perspective(1200px) rotateX(4deg)',
        transition: 'transform 400ms ease',
      }}>
        {Screenshot
          ? <Screenshot />
          : <ScreenshotPlaceholder label={screenshotLabel} accentColor={accentColor} />
        }
      </div>
    </section>
  );
}
