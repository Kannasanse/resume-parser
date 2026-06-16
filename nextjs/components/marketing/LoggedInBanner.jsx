'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoggedInBanner({ featureName, appHref }) {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  return (
    <div style={{
      background: 'rgba(24,95,165,0.12)',
      borderBottom: '1px solid rgba(24,95,165,0.20)',
      padding: '9px 24px',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      position: 'relative',
      zIndex: 40,
    }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
        You&apos;re logged in.{' '}
        <Link href={appHref} style={{ color: '#5B9FD4', fontWeight: 600 }}>
          → Open {featureName}
        </Link>
      </span>
    </div>
  );
}
