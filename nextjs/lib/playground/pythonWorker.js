/* eslint-disable no-restricted-globals */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js');

let pyodide = null;

async function init() {
  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.0/full/',
  });
  await pyodide.loadPackage(['numpy', 'pandas']);
  self.postMessage({ type: 'ready' });
}

self.onmessage = async (e) => {
  if (e.data.type === 'run') {
    if (!pyodide) await init();

    const stdout = [];
    const stderr = [];

    pyodide.setStdout({ batched: (text) => stdout.push(text) });
    pyodide.setStderr({ batched: (text) => stderr.push(text) });

    try {
      await pyodide.runPythonAsync(e.data.code);
      self.postMessage({ type: 'done', stdout, stderr, error: null });
    } catch (err) {
      self.postMessage({ type: 'done', stdout, stderr, error: err.message });
    }
  }
};

// Kick off init immediately so first run is faster
init();
