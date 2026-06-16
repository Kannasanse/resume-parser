export default function FeatureBenefits({ benefits }) {
  return (
    <section style={{ padding: '0 24px 80px' }}>
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        style={{ maxWidth: 900, margin: '0 auto' }}
      >
        {benefits.map((b, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(24,95,165,0.20)', border: '1px solid rgba(24,95,165,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {b.icon}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '12px 0 0' }}>
              {b.title}
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '6px 0 0', lineHeight: 1.6 }}>
              {b.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
