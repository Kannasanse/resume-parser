const BAND_STYLES = {
  'Strong Match':   { bar: '#177A17', badge: 'bg-ds-successLight text-ds-success', gauge: '#177A17' },
  'Good Match':     { bar: '#0B8BC8', badge: 'bg-secondary-light text-secondary',  gauge: '#0B8BC8' },
  'Moderate Match': { bar: '#A26412', badge: 'bg-ds-warningLight text-ds-warning', gauge: '#A26412' },
  'Weak Match':     { bar: '#A01535', badge: 'bg-ds-dangerLight text-ds-danger',   gauge: '#A01535' },
};

const FACTOR_META = {
  skills:     { label: 'Skills Match',        blurb: 'Keyword + synonym alignment' },
  experience: { label: 'Experience',           blurb: 'Years, domain & recency' },
  education:  { label: 'Education',            blurb: 'Degree level & field' },
  title:      { label: 'Title Similarity',     blurb: 'Role title cosine match' },
  certs:      { label: 'Certifications',       blurb: 'Required cert coverage' },
  projects:   { label: 'Projects / Portfolio', blurb: 'GitHub, depth & impact' },
  quality:    { label: 'Resume Quality',       blurb: 'Completeness & metrics' },
};

const FACTORS = ['skills', 'experience', 'education', 'title', 'certs', 'projects', 'quality'];
function Gauge({ pct, color, size = 64, strokeWidth = 4 }) {
  const r = (size / 2) - strokeWidth;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7ED" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading font-bold text-ds-text"
        style={{ fontSize: size <= 44 ? 11 : 15 }}>
        {pct}
      </span>
    </div>
  );
}

export default function ScoreBreakdown({ score, compact = false }) {
  if (!score) return null;

  const band = score.band || 'Weak Match';
  const styles = BAND_STYLES[band] || BAND_STYLES['Weak Match'];
  const overall = Math.round((score.overall_score ?? 0) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Gauge pct={overall} color={styles.gauge} size={44} strokeWidth={4} />
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-btn ${styles.badge}`}>{band}</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overall header */}
      <div className="flex items-center gap-4">
        <Gauge pct={overall} color={styles.gauge} size={64} strokeWidth={5} />
        <div>
          <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium">Overall Score</p>
          <span className={`inline-block mt-1 text-sm font-semibold px-3 py-0.5 rounded-btn ${styles.badge}`}>{band}</span>
          {score.candidate_years != null && (
            <p className="text-xs text-ds-textMuted mt-1 font-mono">{score.candidate_years.toFixed(1)} yrs detected</p>
          )}
        </div>
      </div>

      {/* Factor rows: [label+blurb 140px] [bar flex] [score 64px] [weight 52px] */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">Score Breakdown</p>
        {FACTORS.map(key => {
          const raw = score[`${key}_score`];
          const pct = raw != null ? Math.round(raw * 100) : null;
          const weight = score.weights_used?.[key];
          const meta = FACTOR_META[key];
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="w-36 flex-shrink-0">
                <p className="text-xs font-semibold text-ds-text leading-tight">{meta.label}</p>
                <p className="text-xs text-ds-textMuted leading-tight mt-0.5">{meta.blurb}</p>
              </div>
              <div className="flex-1 bg-ds-bg rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct ?? 0}%`, backgroundColor: styles.bar }} />
              </div>
              <span className="w-16 text-right text-xs font-mono font-medium text-ds-text">
                {pct != null ? `${pct}/100` : '—'}
              </span>
              <span className="w-12 text-right text-xs text-ds-textMuted font-mono">
                {weight != null ? `×${Math.round(weight * 100)}%` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
