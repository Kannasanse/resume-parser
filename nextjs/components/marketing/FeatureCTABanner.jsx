'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function FeatureCTABanner({ featureName, appHref }) {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;
  const ctaLabel = isLoggedIn ? `Open ${featureName} →` : 'Get started free — it\'s free';
  const ctaHref  = isLoggedIn ? appHref : '/signup';

  return (
    <section style={{ padding: '0 24px 100px' }}>
      <div style={{
        maxWidth: 760, margin: '0 auto',
        background: 'linear-gradient(135deg, rgba(24,95,165,0.30), rgba(29,158,117,0.20))',
        border: '1px solid rgba(24,95,165,0.25)',
        borderRadius: 24, padding: '60px 40px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0 }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '8px 0 0' }}>
          Join thousands of professionals using Proflect.
        </p>
        <Link
          href={ctaHref}
          style={{
            display: 'inline-flex', alignItems: 'center', marginTop: 24,
            background: 'linear-gradient(135deg, #185FA5, #1D9E75)',
            color: 'white', borderRadius: 12, padding: '12px 28px',
            fontSize: 16, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(24,95,165,0.30)',
          }}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
