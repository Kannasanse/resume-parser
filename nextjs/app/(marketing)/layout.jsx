import HomeNavbar from '@/components/nav/HomeNavbar';

export default function MarketingLayout({ children }) {
  return (
    <div style={{ background: 'linear-gradient(160deg, #0A1628 0%, #0D2137 100%)', minHeight: '100vh' }}>
      <HomeNavbar />
      <main style={{ paddingTop: 64 }}>{children}</main>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 24px', textAlign: 'center', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="Proflect" style={{ height: 32, width: 96, objectFit: 'contain', opacity: 0.5 }} />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Contact', href: 'mailto:hello@proflect.app' },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)', textDecoration: 'none' }}>
                {l.label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.20)', margin: 0 }}>
            © 2026 Proflect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
