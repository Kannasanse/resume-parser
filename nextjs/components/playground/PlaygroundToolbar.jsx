'use client';

const LANGS = [
  { id: 'web',    label: 'HTML/CSS/JS', color: '#F59E0B' },
  { id: 'python', label: 'Python',      color: '#3B82F6' },
  { id: 'java',   label: 'Java',        color: '#EF4444' },
  { id: 'sql',    label: 'SQL',         color: '#8B5CF6' },
];

export function PlaygroundToolbar({
  language, setLanguage,
  activeTab, setActiveTab,
  onRun, onReset, onFullscreen,
  running, pyodideLoading, javaRunning,
}) {
  return (
    <div style={{
      height: 44, background: '#161B27',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 8, flexShrink: 0,
    }}>
      {/* Language selector */}
      <div style={{ display: 'flex', gap: 2, marginRight: 8 }}>
        {LANGS.map(lang => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: language === lang.id ? `${lang.color}22` : 'transparent',
              color: language === lang.id ? lang.color : 'rgba(255,255,255,0.45)',
              outline: language === lang.id ? `1px solid ${lang.color}44` : 'none',
              transition: 'all 140ms',
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Sub-tabs for HTML/CSS/JS */}
      {language === 'web' && (
        <div style={{
          display: 'flex', gap: 2,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 7, padding: 2,
        }}>
          {['HTML', 'CSS', 'JS'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '2px 10px', borderRadius: 5, border: 'none',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: activeTab === tab ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.45)',
            }}>
              {tab}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {pyodideLoading && (
        <span style={{ fontSize: 11, color: '#FBBF24' }}>⟳ Loading Python...</span>
      )}
      {javaRunning && (
        <span style={{ fontSize: 11, color: '#FCA5A5' }}>⟳ Compiling Java...</span>
      )}

      <button onClick={onRun} disabled={running} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 14px', borderRadius: 7, border: 'none',
        background: running ? 'rgba(29,158,117,0.40)' : '#1D9E75',
        color: 'white', fontSize: 12, fontWeight: 700, cursor: running ? 'default' : 'pointer',
      }}>
        {running ? '⟳' : '▶'} {running ? 'Running...' : 'Run'}
      </button>

      <button onClick={onReset} style={{
        padding: '5px 10px', borderRadius: 7,
        background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.60)', fontSize: 12, cursor: 'pointer',
      }}>
        Reset
      </button>

      <button onClick={onFullscreen} title="Full screen" style={{
        padding: '5px 8px', borderRadius: 7,
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.45)', fontSize: 14, cursor: 'pointer',
      }}>
        ⇱
      </button>
    </div>
  );
}
