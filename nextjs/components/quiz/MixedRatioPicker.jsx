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
    <div style={{
      marginTop: 14,
      background: 'rgba(124,58,237,0.08)',
      border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Set your mix
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Must total 100%</span>
      </div>

      {/* Ratio bar */}
      <div style={{ height: 8, borderRadius: 9999, overflow: 'hidden', display: 'flex', marginBottom: 18 }}>
        {ROWS.map(r => (
          <div key={r.key} style={{ width: `${mix[r.key]}%`, background: r.color, transition: 'width 200ms' }} />
        ))}
      </div>

      {/* Sliders */}
      {ROWS.map(r => (
        <div key={r.key} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{r.label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.color, minWidth: 36, textAlign: 'right' }}>
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
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Quick presets:</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => onChange(p.v)} style={{
              padding: '4px 10px', borderRadius: 7,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.60)', fontSize: 11, cursor: 'pointer',
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
