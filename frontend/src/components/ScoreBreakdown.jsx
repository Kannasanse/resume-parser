const BAND_STYLES = {
  'Strong Match':   { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  'Good Match':     { bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700' },
  'Moderate Match': { bar: 'bg-yellow-500',  badge: 'bg-yellow-100 text-yellow-700' },
  'Weak Match':     { bar: 'bg-red-400',     badge: 'bg-red-100 text-red-600' },
};

const FACTOR_LABELS = {
  skills:     'Skills Match',
  experience: 'Experience',
  education:  'Education',
  title:      'Title Similarity',
  certs:      'Certifications',
  projects:   'Projects / Portfolio',
  quality:    'Resume Quality',
};

function ScoreBar({ value, colorClass }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function ScoreBreakdown({ score, compact = false }) {
  if (!score) return null;

  const band = score.band || 'Weak Match';
  const styles = BAND_STYLES[band] || BAND_STYLES['Weak Match'];
  const overall = Math.round((score.overall_score ?? 0) * 100);

  const factors = ['skills', 'experience', 'education', 'title', 'certs', 'projects', 'quality'];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle cx="18" cy="18" r="14" fill="none"
              stroke={overall >= 80 ? '#10b981' : overall >= 65 ? '#3b82f6' : overall >= 50 ? '#eab308' : '#f87171'}
              strokeWidth="4"
              strokeDasharray={`${overall * 0.879} 87.96`}
              strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{overall}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>{band}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Overall */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle cx="18" cy="18" r="14" fill="none"
              stroke={overall >= 80 ? '#10b981' : overall >= 65 ? '#3b82f6' : overall >= 50 ? '#eab308' : '#f87171'}
              strokeWidth="4"
              strokeDasharray={`${overall * 0.879} 87.96`}
              strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">{overall}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Overall Score</p>
          <span className={`inline-block mt-0.5 text-sm font-semibold px-3 py-0.5 rounded-full ${styles.badge}`}>{band}</span>
          {score.candidate_years != null && (
            <p className="text-xs text-gray-400 mt-1">{score.candidate_years.toFixed(1)} yrs experience detected</p>
          )}
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score Breakdown</p>
        {factors.map(key => {
          const raw = score[`${key}_score`];
          const pct = raw != null ? Math.round(raw * 100) : null;
          const weight = score.weights_used?.[key];
          return (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600">{FACTOR_LABELS[key]}</span>
                <span className="text-xs text-gray-400">
                  {pct != null ? `${pct}%` : '—'}
                  {weight != null && <span className="ml-1 text-gray-300">· wt {Math.round(weight * 100)}%</span>}
                </span>
              </div>
              <ScoreBar value={raw ?? 0} colorClass={styles.bar} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
