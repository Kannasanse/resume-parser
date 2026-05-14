'use client';
import { useState, useRef } from 'react';

const DIMENSION_ICONS = {
  'Section Completeness': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  'Keyword & Skills Match': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  'Content Quality': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  'Formatting & Parseability': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
    </svg>
  ),
  'Measurable Impact': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
};

function scoreColor(score) {
  if (score >= 75) return '#1D9E75';
  if (score >= 50) return '#F59E0B';
  if (score >= 25) return '#F97316';
  return '#D93025';
}

function scoreBg(score) {
  if (score >= 75) return '#F0FDF4';
  if (score >= 50) return '#FFFBEB';
  if (score >= 25) return '#FFF7ED';
  return '#FEF2F2';
}

function ScoreRing({ score, size = 96 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.24, fontWeight: 700, fill: color, transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

function MiniBar({ score }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 26, textAlign: 'right' }}>{score}%</span>
    </div>
  );
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   bg: '#FEE2E2', color: '#D93025' },
  medium: { label: 'Medium', bg: '#FEF3C7', color: '#D97706' },
  low:    { label: 'Low',    bg: '#DBEAFE', color: '#2563EB' },
};

const ROLE_OPTIONS = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'Machine Learning Engineer', 'DevOps Engineer',
  'Cloud Engineer', 'Product Manager', 'Project Manager', 'UX Designer', 'UI Designer',
  'Marketing Manager', 'Sales Manager', 'Business Analyst', 'Cybersecurity Analyst',
  'QA Engineer', 'Mobile Developer', 'Embedded Systems Engineer', 'General',
];

export default function ATSPanel({ resumeId, onClose, atsState, atsData, atsError, onAnalyze, isStale }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [jdText, setJdText] = useState('');
  const [jdExpanded, setJdExpanded] = useState(false);
  const [jdValidationError, setJdValidationError] = useState('');
  const [roleOverride, setRoleOverride] = useState('');
  const jdRef = useRef(null);

  const state = atsState;
  const data = atsData;
  const bandColor = data ? scoreColor(data.score) : '#6B7280';

  function handleAnalyzeClick() {
    // Validate JD if provided
    if (jdText.trim()) {
      const wordCount = jdText.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 50) {
        setJdValidationError('Your job description seems too short for accurate scoring. Please add more detail.');
        return;
      }
    }
    setJdValidationError('');
    onAnalyze(jdText.trim() || null);
  }

  function handleJdChange(e) {
    setJdText(e.target.value);
    if (jdValidationError) setJdValidationError('');
  }

  function handleClearJd() {
    setJdText('');
    setJdValidationError('');
    // Switching back to default mode should auto-trigger rescore if already has data
    if (data) onAnalyze(null);
  }

  const activeMode = data?.mode || (jdText.trim() ? 'targeted' : 'default');
  const detectedRole = roleOverride || data?.detectedRole || '';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 200,
      width: 440, background: '#fff',
      boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>ATS Score</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>AI-powered resume analysis</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* JD Input section */}
      <div style={{ borderBottom: '1px solid #E5E7EB', padding: '12px 20px', flexShrink: 0, background: '#FAFAFA' }}>
        <button
          onClick={() => setJdExpanded(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5', flex: 1, textAlign: 'left' }}>
            {jdText.trim() ? 'Targeted mode: JD provided' : 'Add job description for targeted scoring (optional)'}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: jdExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {jdExpanded && (
          <div style={{ marginTop: 10 }}>
            <textarea
              ref={jdRef}
              value={jdText}
              onChange={handleJdChange}
              placeholder="Paste the job description here to get a targeted ATS score matched against the role's specific requirements…"
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical', fontSize: 12, lineHeight: 1.6,
                padding: '8px 10px', border: `1px solid ${jdValidationError ? '#D93025' : '#D1D5DB'}`, borderRadius: 6,
                fontFamily: 'inherit', color: '#374151', outline: 'none', background: '#fff',
              }}
            />
            {jdValidationError && (
              <div style={{ fontSize: 11, color: '#D93025', marginTop: 4 }}>{jdValidationError}</div>
            )}
            {jdText.trim() && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>
                  {jdText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button onClick={handleClearJd} style={{ fontSize: 11, color: '#D93025', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
                  Clear JD (revert to default mode)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Stale score banner */}
        {isStale && state === 'done' && data && (
          <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{ fontSize: 12, color: '#92400E', flex: 1 }}>Score is outdated — your resume has changed.</span>
            <button onClick={handleAnalyzeClick} style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: 'none', border: '1px solid #FCD34D', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
        )}

        {/* Idle state */}
        {state === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center', gap: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Check your ATS score</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                We'll score your resume across 5 dimensions — section completeness, keyword match, content quality, formatting, and measurable impact. Optionally paste a job description above for a targeted score.
              </div>
            </div>
            <button
              onClick={handleAnalyzeClick}
              style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Analyze Resume
            </button>
          </div>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: '#6B7280' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>Analyzing your resume…</div>
            <div style={{ fontSize: 12 }}>This takes about 10–15 seconds</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#D93025', background: '#FEE2E2', padding: '10px 16px', borderRadius: 8 }}>{atsError}</div>
            <button onClick={handleAnalyzeClick} style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {state === 'done' && data && (
          <div>
            {/* Score hero */}
            <div style={{ padding: '20px 20px 14px', background: 'linear-gradient(135deg, #F0F4FF 0%, #FAF5FF 100%)', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <ScoreRing score={data.score} size={84} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Overall ATS Score</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: bandColor, lineHeight: 1 }}>{data.band}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6, lineHeight: 1.5 }}>{data.summary}</div>
                </div>
              </div>

              {/* Mode badge + role info */}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Active mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: data.mode === 'targeted' ? '#EEF2FF' : '#F0FDF4',
                    color: data.mode === 'targeted' ? '#4F46E5' : '#059669',
                    border: `1px solid ${data.mode === 'targeted' ? '#C7D2FE' : '#A7F3D0'}`,
                  }}>
                    {data.mode === 'targeted' ? '◎ Targeted Mode' : '◉ Default Mode'}
                  </span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    Scoring against: <strong style={{ color: '#374151' }}>{data.scoringAgainst}</strong>
                  </span>
                </div>

                {/* Detected role (default mode) */}
                {data.mode === 'default' && detectedRole && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                      Detected role: <strong style={{ color: '#374151' }}>{detectedRole}</strong>
                    </span>
                    <button
                      onClick={() => setJdExpanded(p => !p)}
                      style={{ fontSize: 10, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', textDecoration: 'underline' }}
                    >
                      Override
                    </button>
                  </div>
                )}

                {/* Manual role override dropdown */}
                {data.mode === 'default' && jdExpanded && (
                  <select
                    value={roleOverride}
                    onChange={e => { setRoleOverride(e.target.value); handleAnalyzeClick(); }}
                    style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff', color: '#374151', cursor: 'pointer' }}
                  >
                    <option value="">Auto-detect role</option>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
              {['overview', 'improvements', 'keywords'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '10px 4px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: activeTab === tab ? '2px solid #4F46E5' : '2px solid transparent',
                    color: activeTab === tab ? '#4F46E5' : '#6B7280',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'improvements' ? 'Improvements' : 'Keywords'}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  Scoring Dimensions
                </div>
                {(data.dimensions || []).map((dim, i) => (
                  <div key={i} style={{ background: scoreBg(dim.score), borderRadius: 10, padding: '11px 13px', border: `1px solid ${scoreColor(dim.score)}22` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <span style={{ color: scoreColor(dim.score) }}>{DIMENSION_ICONS[dim.name] || DIMENSION_ICONS['Section Completeness']}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', flex: 1 }}>{dim.name}</span>
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>{dim.weight}% weight</span>
                    </div>
                    <MiniBar score={dim.score} />
                    {dim.gap && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 5, lineHeight: 1.5 }}>{dim.gap}</div>}
                  </div>
                ))}

                {/* Strengths */}
                {(data.strengths || []).length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Strengths</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {data.strengths.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#F0FDF4', borderRadius: 7, padding: '7px 10px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Improvements tab */}
            {activeTab === 'improvements' && (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Ordered by impact — highest score gain first.</div>
                {(data.improvements || []).map((item, i) => {
                  const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.low;
                  return (
                    <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '11px 13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {item.section && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                            {item.section}
                          </span>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{item.detail}</div>
                      {item.fix && (
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 5, background: '#F0FDF4', padding: '4px 8px', borderRadius: 5, lineHeight: 1.5 }}>
                          Fix: {item.fix}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Keywords tab */}
            {activeTab === 'keywords' && (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.mode === 'targeted' && (
                  <div style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', padding: '6px 10px', borderRadius: 6 }}>
                    Keywords matched against your pasted job description.
                  </div>
                )}
                {(data.keywords?.found || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      ✓ Matched Keywords
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {data.keywords.found.map((kw, i) => (
                        <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: '#F0FDF4', color: '#065F46', border: '1px solid #BBF7D0' }}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(data.keywords?.missing || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      + Missing Keywords
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {data.keywords.missing.map((kw, i) => (
                        <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Re-analyze */}
            <div style={{ padding: '12px 20px 24px', borderTop: '1px solid #E5E7EB', marginTop: 4 }}>
              <button
                onClick={handleAnalyzeClick}
                style={{
                  width: '100%', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
                  color: '#fff',
                  boxShadow: '0 0 16px rgba(139,92,246,0.45), 0 2px 8px rgba(99,102,241,0.3)',
                }}
              >
                ↻ Re-analyze Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
