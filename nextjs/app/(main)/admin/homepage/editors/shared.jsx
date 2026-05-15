'use client';

const C = { primary: '#185FA5', border: '#D1DCE8', secondary: '#6B7280', charcoal: '#2C2C2A' };

export function Field({ label, value, onChange, multiline = false, rows = 1, placeholder = '' }) {
  const base = { width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: 14, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 8, outline: 'none', background: '#fff', fontFamily: 'inherit', transition: 'border-color 150ms', resize: multiline ? 'vertical' : 'none' };
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.secondary, marginBottom: 5 }}>{label}</label>
      {multiline
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border} />
      }
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.secondary, marginBottom: 5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', fontSize: 14, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 8, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e => e.target.style.borderColor = C.border}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div onClick={() => onChange(!checked)} style={{ position: 'relative', width: 36, height: 20, borderRadius: 99, background: checked ? C.primary : C.border, transition: 'background 200ms', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
      </div>
      <span style={{ fontSize: 14, color: C.charcoal }}>{label}</span>
    </label>
  );
}

export function GroupLabel({ children }) {
  return (
    <div style={{ marginTop: 4 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{children}</p>
      <div style={{ height: 1, background: C.border, marginTop: 6 }} />
    </div>
  );
}
