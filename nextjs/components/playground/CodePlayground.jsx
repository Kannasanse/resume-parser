'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { PlaygroundToolbar } from './PlaygroundToolbar';
import { ConsolePanel } from './ConsolePanel';
import { SQLResultTable } from './SQLResultTable';
import { buildHTML } from '@/lib/playground/htmlBuilder';
import { runSQL } from '@/lib/playground/sqlRunner';

// Monaco must be client-only (no SSR)
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const DEFAULT_CODE = {
  html: `<h1>Hello, Proflect!</h1>
<p>Edit the code and see the result on the right.</p>
<button onclick="greet()">Click me</button>`,

  css: `body { font-family: system-ui; padding: 20px; background: #f9f9f9; }
h1   { color: #185FA5; }
button { padding: 8px 16px; background: #185FA5; color: white;
         border: none; border-radius: 8px; cursor: pointer; }`,

  js: `function greet() {
  console.log('Hello from JavaScript!')
  alert('You clicked the button!')
}`,

  python: `# Python runs via Pyodide (WebAssembly)
import math

def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")

print(f"\\nπ ≈ {math.pi:.10f}")`,

  sql: `-- Sample tables: employees, departments
-- Try writing your own queries!

SELECT name, department, salary
FROM employees
ORDER BY salary DESC;`,
};

export function CodePlayground({
  initialLanguage = 'web',
  initialCode     = null,
  embedded        = false,
  onRun           = null,
  challenge       = null,
}) {
  const [language,       setLanguage]       = useState(initialLanguage);
  const [activeTab,      setActiveTab]      = useState('HTML');
  const [htmlCode,       setHtmlCode]       = useState(initialCode?.html   || DEFAULT_CODE.html);
  const [cssCode,        setCssCode]        = useState(initialCode?.css    || DEFAULT_CODE.css);
  const [jsCode,         setJsCode]         = useState(initialCode?.js     || DEFAULT_CODE.js);
  const [pythonCode,     setPythonCode]     = useState(initialCode?.python || DEFAULT_CODE.python);
  const [sqlCode,        setSqlCode]        = useState(initialCode?.sql    || DEFAULT_CODE.sql);
  const [previewHTML,    setPreviewHTML]    = useState('');
  const [consoleEntries, setConsoleEntries] = useState([]);
  const [sqlResults,     setSqlResults]     = useState([]);
  const [running,        setRunning]        = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [fullscreen,     setFullscreen]     = useState(false);
  const workerRef = useRef(null);

  // Listen for console messages from the iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'console') {
        addEntry(e.data.level, e.data.args.join(' '));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Web: live preview
  useEffect(() => {
    if (language !== 'web') return;
    const t = setTimeout(() => {
      setPreviewHTML(buildHTML(htmlCode, cssCode, jsCode));
      setConsoleEntries([]);
    }, 800);
    return () => clearTimeout(t);
  }, [htmlCode, cssCode, jsCode, language]);

  // Initial web preview on mount
  useEffect(() => {
    if (language === 'web') {
      setPreviewHTML(buildHTML(htmlCode, cssCode, jsCode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addEntry(level, text) {
    setConsoleEntries(prev => [...prev, { level, text }]);
  }

  async function runCode() {
    setRunning(true);
    setConsoleEntries([]);
    setSqlResults([]);

    try {
      if (language === 'web') {
        setPreviewHTML(buildHTML(htmlCode, cssCode, jsCode));
      } else if (language === 'python') {
        if (!workerRef.current) {
          setPyodideLoading(true);
          workerRef.current = new Worker(
            new URL('@/lib/playground/pythonWorker.js', import.meta.url)
          );
          workerRef.current.onmessage = (e) => {
            if (e.data.type === 'ready') setPyodideLoading(false);
            if (e.data.type === 'done') {
              setPyodideLoading(false);
              e.data.stdout.forEach(line => addEntry('log',   line));
              e.data.stderr.forEach(line => addEntry('warn',  line));
              if (e.data.error) addEntry('error', e.data.error);
              setRunning(false);
            }
          };
        }
        workerRef.current.postMessage({ type: 'run', code: pythonCode });
        return; // running=false set by worker
      } else if (language === 'sql') {
        const { results, errors } = await runSQL(sqlCode);
        setSqlResults(results);
        errors.forEach(e => addEntry('error', `${e.message}\n  → ${e.statement}`));
      }

      onRun?.(language);
    } catch (err) {
      addEntry('error', err.message);
    } finally {
      if (language !== 'python') setRunning(false);
    }
  }

  function resetCode() {
    if (language === 'web') {
      setHtmlCode(DEFAULT_CODE.html);
      setCssCode(DEFAULT_CODE.css);
      setJsCode(DEFAULT_CODE.js);
    } else if (language === 'python') {
      setPythonCode(DEFAULT_CODE.python);
    } else {
      setSqlCode(DEFAULT_CODE.sql);
    }
    setConsoleEntries([]);
    setSqlResults([]);
  }

  // Derive current editor code/setter
  let currentCode, setCurrentCode;
  if (language === 'python') { currentCode = pythonCode; setCurrentCode = setPythonCode; }
  else if (language === 'sql')    { currentCode = sqlCode;    setCurrentCode = setSqlCode; }
  else if (activeTab === 'CSS')   { currentCode = cssCode;    setCurrentCode = setCssCode; }
  else if (activeTab === 'JS')    { currentCode = jsCode;     setCurrentCode = setJsCode; }
  else                            { currentCode = htmlCode;   setCurrentCode = setHtmlCode; }

  const monacoLanguage =
    language === 'python' ? 'python' :
    language === 'sql'    ? 'sql'    :
    activeTab === 'CSS'   ? 'css'    :
    activeTab === 'JS'    ? 'javascript' : 'html';

  const showPreview  = language === 'web';
  const showSQL      = language === 'sql' && sqlResults.length > 0;
  const consoleFlex  = showPreview ? undefined : '1';
  const consoleH     = showPreview ? 160 : undefined;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: fullscreen ? '100vh' : embedded ? '500px' : '70vh',
      minHeight: 400,
      background: '#0D1117',
      borderRadius: embedded ? 0 : 14,
      overflow: 'hidden',
      border: embedded ? 'none' : '1px solid rgba(255,255,255,0.10)',
      position: fullscreen ? 'fixed' : 'relative',
      inset: fullscreen ? 0 : 'auto',
      zIndex: fullscreen ? 9999 : 'auto',
    }}>

      {/* Challenge banner */}
      {challenge && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(24,95,165,0.10)',
          borderBottom: '1px solid rgba(24,95,165,0.20)',
          fontSize: 13, color: '#E8EFF7', lineHeight: 1.6, flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#5B9FD4',
            letterSpacing: '.08em', marginBottom: 4,
          }}>
            CHALLENGE
          </div>
          {challenge.description}
          {challenge.hint && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 11, color: '#5B9FD4', cursor: 'pointer' }}>
                Show hint
              </summary>
              <div style={{ marginTop: 4, color: '#9CA3AF', fontSize: 12 }}>
                {challenge.hint}
              </div>
            </details>
          )}
        </div>
      )}

      <PlaygroundToolbar
        language={language}    setLanguage={setLanguage}
        activeTab={activeTab}  setActiveTab={setActiveTab}
        onRun={runCode}        onReset={resetCode}
        onFullscreen={() => setFullscreen(f => !f)}
        running={running}      pyodideLoading={pyodideLoading}
      />

      {/* Main split */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* Editor */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <Editor
            height="100%"
            language={monacoLanguage}
            value={currentCode}
            onChange={val => setCurrentCode(val ?? '')}
            theme="vs-dark"
            options={{
              fontSize:             13,
              fontFamily:           '"JetBrains Mono", "Fira Code", monospace',
              lineNumbers:          'on',
              minimap:              { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap:             'on',
              tabSize:              2,
              automaticLayout:      true,
              padding:              { top: 12 },
            }}
          />
        </div>

        {/* Output */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {showPreview && (
            <iframe
              sandbox="allow-scripts"
              srcDoc={previewHTML}
              style={{
                flex: 1, border: 'none', background: 'white',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
              title="Preview"
            />
          )}

          {showSQL && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', background: '#0D1117' }}>
              {sqlResults.map((result, i) => (
                <SQLResultTable key={i} result={result} />
              ))}
            </div>
          )}

          {language === 'python' && !running && consoleEntries.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.25)', fontSize: 12, fontStyle: 'italic',
            }}>
              Press Run ▶ to execute your Python code
            </div>
          )}

          <div style={{
            height: consoleH, flex: consoleFlex,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <ConsolePanel
              entries={consoleEntries}
              onClear={() => setConsoleEntries([])}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
