export default function FeatureSocialProof() {
  return (
    <section style={{ padding: '0 24px 80px' }}>
      <div style={{
        maxWidth: 760, margin: '0 auto', textAlign: 'center',
        padding: '48px 40px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        position: 'relative',
      }}>
        {/* Quote mark */}
        <span style={{
          position: 'absolute', top: 24, left: 36,
          fontSize: 64, lineHeight: 1, color: 'rgba(24,95,165,0.25)',
          fontFamily: 'Georgia, serif', userSelect: 'none',
        }}>&ldquo;</span>

        <p style={{
          fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.75)',
          lineHeight: 1.6, margin: 0, fontStyle: 'italic',
          position: 'relative',
        }}>
          Proflect helped me structure my job search and land a role I actually wanted — in under 6 weeks.
        </p>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #185FA5, #1D9E75)',
            display: 'grid', placeItems: 'center',
            fontSize: 14, fontWeight: 700, color: 'white',
          }}>
            A
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>Alex Johnson</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0 }}>Software Engineer, joined Google</p>
          </div>
        </div>
      </div>
    </section>
  );
}
