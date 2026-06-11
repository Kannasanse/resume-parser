export const dynamic = 'force-dynamic';

let cachedJavaCompiler = null;

async function getJavaCompiler() {
  if (cachedJavaCompiler) return cachedJavaCompiler;
  const res = await fetch('https://wandbox.org/api/list.json');
  if (!res.ok) throw new Error('Could not fetch compiler list from Wandbox');
  const list = await res.json();
  const entry = list.find(c => c.language === 'Java' && c.name);
  if (!entry) throw new Error('No Java compiler found on Wandbox');
  cachedJavaCompiler = entry.name;
  return cachedJavaCompiler;
}

export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code?.trim()) {
      return Response.json({ error: 'No code provided.' }, { status: 400 });
    }

    const compiler = await getJavaCompiler();

    const res = await fetch('https://wandbox.org/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code, options: '', stdin: '' }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return Response.json({ error: `Execution service error: ${res.status}${text ? ' — ' + text : ''}` }, { status: 502 });
    }

    const data = await res.json();
    const stdout = (data.program_output || '').split('\n').filter(Boolean);
    const stderr = [
      ...(data.compiler_error || '').split('\n').filter(Boolean),
      ...(data.program_error  || '').split('\n').filter(Boolean),
    ];

    return Response.json({ stdout, stderr, exitCode: parseInt(data.status ?? '0', 10) });
  } catch (err) {
    console.error('[run-java]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
