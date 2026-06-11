const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

export async function runJava(code) {
  const res = await fetch(PISTON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'java',
      version: '*',
      files: [{ name: 'Main.java', content: code }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Piston error: ${res.status}`);
  }

  const data = await res.json();
  const run = data.run || {};
  const compile = data.compile || {};

  const stdout = (run.stdout || '').split('\n').filter(Boolean);
  const stderr = [
    ...(compile.stderr || '').split('\n').filter(Boolean),
    ...(run.stderr    || '').split('\n').filter(Boolean),
  ];

  return { stdout, stderr, exitCode: run.code ?? 0 };
}
