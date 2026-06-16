'use client';

import { DEEP_DIVE_COMPONENT_MAP } from './FeatureDeepDiveScreenshots';

function SparklesIcon({ size = 20, color }) {
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
      borderRadius: 16,
      aspectRatio: '16/9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.40)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `${accentColor}25`,
        border: `1px solid ${accentColor}40`,
        display: 'grid', placeItems: 'center',
      }}>
        <SparklesIcon size={20} color={accentColor} />
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', fontStyle: 'italic' }}>
        {label}
      </span>
    </div>
  );
}

export default function FeatureDeepDive({ sections, accentColor = '#185FA5', featureSlug }) {
  const screenshotComponents = featureSlug ? DEEP_DIVE_COMPONENT_MAP[featureSlug] : null;

  return (
    <section id="demo" style={{ padding: '0 24px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {sections.map((s, i) => {
          const isReversed = i % 2 === 1;
          const ScreenshotComponent = screenshotComponents?.[i];
          const image = ScreenshotComponent
            ? (
              <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.40)' }}>
                <ScreenshotComponent />
              </div>
            )
            : <ScreenshotPlaceholder label={s.imageLabel || 'Screenshot'} accentColor={accentColor} />;

          const text = (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#5B9FD4', margin: 0 }}>
                {s.eyebrow}
              </p>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '8px 0 0', lineHeight: 1.2 }}>
                {s.heading}
              </h3>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.60)', margin: '12px 0 0', lineHeight: 1.7 }}>
                {s.body}
              </p>
              {s.bullets && (
                <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>✓ {b}</li>
                  ))}
                </ul>
              )}
            </div>
          );

          return (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-16"
              style={{ marginBottom: 100 }}
            >
              {isReversed ? <>{text}{image}</> : <>{image}{text}</>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
