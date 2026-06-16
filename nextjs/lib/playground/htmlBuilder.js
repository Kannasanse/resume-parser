export function buildHTML(html, css, js) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 16px; }
  </style>
  <style>${css}</style>
</head>
<body>
${html}
<script>
  const _log   = console.log.bind(console);
  const _error = console.error.bind(console);
  const _warn  = console.warn.bind(console);

  const post = (type, args) =>
    window.parent.postMessage({ type: 'console', level: type, args: args.map(String) }, '*');

  console.log   = (...a) => { _log(...a);   post('log',   a); };
  console.error = (...a) => { _error(...a); post('error', a); };
  console.warn  = (...a) => { _warn(...a);  post('warn',  a); };

  window.onerror = (msg, src, line) => post('error', [\`\${msg} (line \${line})\`]);
<\/script>
<script>${js}<\/script>
</body>
</html>`;
}
