'use client';

const ROWS = [
  { key: 'mcq',          label: 'MCQ',          color: '#185FA5' },
  { key: 'true_false',   label: 'True / False', color: '#1D9E75' },
  { key: 'short_answer', label: 'Short Answer', color: '#F59E0B' },
];

const PRESETS = [
  { label: 'Mostly MCQ',       v: { mcq: 70, true_false: 15, short_answer: 15 } },
  { label: 'Mostly Short Ans', v: { mcq: 20, true_false: 10, short_answer: 70 } },
  { label: 'Equal thirds',     v: { mcq: 34, true_false: 33, short_answer: 33 } },
  { label: 'No short answer',  v: { mcq: 70, true_false: 30, short_answer: 0  } },
];

export function MixedRatioPicker({ mix, onChange }) {
  function adjust(key, val) {
    const v      = Math.max(0, Math.min(100, parseInt(val)));
    const others = Object.keys(mix).filter(k => k !== key);
    const total  = others.reduce((s, k) => s + mix[k], 0);
    const delta  = mix[key] - v;
    const updated = { ...mix, [key]: v };
    if (total > 0) {
      others.forEach(k => {
        updated[k] = Math.max(0, Math.round(mix[k] + (mix[k] / total) * delta));
      });
      const sum = Object.values(updated).reduce((s, n) => s + n, 0);
      if (sum !== 100) updated[others[others.length - 1]] += 100 - sum;
    }
    onChange(updated);
  }

  return (
    <div className="mt-3.5 bg-violet-50 dark:bg-[rgba(124,58,237,0.08)] border border-violet-200 dark:border-[rgba(124,58,237,0.25)] rounded-xl p-4">
      <div className="flex justify-between mb-3.5">
        <span className="text-[11px] font-bold text-violet-600 dark:text-[#A78BFA] tracking-[0.08em] uppercase">
          Set your mix
        </span>
        <span className="text-[11px] text-ds-textMuted">Must total 100%</span>
      </div>

      {/* Ratio bar */}
      <div className="h-2 rounded-full overflow-hidden flex mb-4">
        {ROWS.map(r => (
          <div key={r.key} style={{ width: `${mix[r.key]}%`, background: r.color, transition: 'width 200ms' }} />
        ))}
      </div>

      {/* Sliders */}
      {ROWS.map(r => (
        <div key={r.key} className="mb-3.5">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
              <span className="text-[12px] text-ds-text">{r.label}</span>
            </div>
            <span className="text-[13px] font-bold min-w-[36px] text-right" style={{ color: r.color }}>
              {mix[r.key]}%
            </span>
          </div>
          <input
            type="range" min={0} max={100} step={5} value={mix[r.key]}
            onChange={e => adjust(r.key, e.target.value)}
            style={{ width: '100%', accentColor: r.color, cursor: 'pointer' }}
          />
        </div>
      ))}

      {/* Presets */}
      <div className="border-t border-ds-border pt-3">
        <div className="text-[10px] text-ds-textMuted mb-1.5">Quick presets:</div>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => onChange(p.v)}
              className="px-2.5 py-1 rounded-lg border border-ds-border text-[11px] text-ds-textMuted hover:bg-ds-bg transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
