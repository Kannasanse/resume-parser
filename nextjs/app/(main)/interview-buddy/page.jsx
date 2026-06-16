'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_LEVELS = [
  { value: 'entry',  label: 'Entry-level' },
  { value: 'mid',    label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead',   label: 'Lead / Staff' },
  { value: 'exec',   label: 'Executive' },
];

const DEPTHS = [
  { value: 'quick',    label: 'Quick prep',  sub: '5–7 questions' },
  { value: 'standard', label: 'Standard',    sub: '10–15 questions' },
  { value: 'deep',     label: 'Deep dive',   sub: '20–25 questions' },
];

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
}

export default function InterviewBuddyPage() {
  const router = useRouter();
  const [jd, setJd]             = useState('');
  const [roleLevel, setLevel]   = useState('mid');
  const [depth, setDepth]       = useState('standard');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [kits, setKits]         = useState(null);

  useEffect(() => {
    fetch('/api/v1/interview-buddy')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setKits(d.kits || []))
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    if (jd.trim().length < 100) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/interview-buddy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, roleLevel, depth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      router.push(`/interview-buddy/${data.kit.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const canGenerate = jd.trim().length >= 100 && !loading;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(29,158,117,0.15)',
            display: 'grid', placeItems: 'center', color: '#1D9E75',
          }}>
            <MicIcon />
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, margin: 0,
            color: 'var(--color-text, #E8EFF7)',
            letterSpacing: '-0.02em',
          }}>
            Interview Buddy
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(232,239,247,0.55)', lineHeight: 1.5 }}>
          Paste a job description and get a tailored question kit with coaching on what interviewers are really looking for.
        </p>
      </div>

      {/* JD input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(232,239,247,0.60)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Job Description
        </label>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the full job description here — include the role, responsibilities, and requirements..."
          rows={9}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12, padding: '14px 16px',
            fontSize: 14, color: '#E8EFF7', lineHeight: 1.6,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(29,158,117,0.50)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
        />
        <div style={{ textAlign: 'right', marginTop: 4, fontSize: 11, color: jd.length < 100 ? 'rgba(232,239,247,0.30)' : '#1D9E75' }}>
          {jd.length < 100 ? `${100 - jd.length} more characters needed` : `${jd.length} characters`}
        </div>
      </div>

      {/* Options row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Role level */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(232,239,247,0.60)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Role level
          </label>
          <select
            value={roleLevel}
            onChange={e => setLevel(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 14, color: '#E8EFF7', outline: 'none', cursor: 'pointer',
            }}
          >
            {ROLE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {/* Depth */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(232,239,247,0.60)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Depth
          </label>
          <select
            value={depth}
            onChange={e => setDepth(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 14, color: '#E8EFF7', outline: 'none', cursor: 'pointer',
            }}
          >
            {DEPTHS.map(d => <option key={d.value} value={d.value}>{d.label} — {d.sub}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          background: 'rgba(217,48,37,0.10)',
          border: '1px solid rgba(217,48,37,0.25)',
          borderRadius: 10, fontSize: 13, color: '#F87171',
        }}>
          {error}
          {error.toLowerCase().includes('insufficient') && (
            <a href="/credits" style={{ display: 'block', marginTop: 6, color: '#F87171', fontWeight: 700, textDecoration: 'underline' }}>Get more credits →</a>
          )}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        style={{
          width: '100%', padding: '14px 0',
          background: canGenerate ? '#1D9E75' : 'rgba(29,158,117,0.25)',
          border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 700, color: canGenerate ? '#fff' : 'rgba(255,255,255,0.35)',
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          transition: 'background 200ms',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {loading ? 'Generating your kit…' : (
          <>
            Generate interview kit
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>2 credits</span>
          </>
        )}
      </button>
      <p style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'rgba(232,239,247,0.30)' }}>
        Kits are generated in ~15 seconds using AI analysis of the JD.
      </p>

      {/* Previous kits */}
      {kits !== null && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(232,239,247,0.50)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Your previous kits
          </h2>
          {kits.length === 0 ? (
            <p style={{ fontSize: 14, color: 'rgba(232,239,247,0.30)' }}>No kits yet — generate your first one above.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {kits.map(kit => (
                <a
                  key={kit.id}
                  href={`/interview-buddy/${kit.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, textDecoration: 'none',
                    transition: 'border-color 200ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#E8EFF7', marginBottom: 3 }}>
                      {kit.title}{kit.company ? ` · ${kit.company}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(232,239,247,0.40)' }}>
                      {kit.question_count} questions · {new Date(kit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
