export function PageHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        background: 'linear-gradient(135deg, #185FA5, #5B9FD4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: 0,
        lineHeight: 1.2,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 14, color: '#8BA3C1', marginTop: 4, marginBottom: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
