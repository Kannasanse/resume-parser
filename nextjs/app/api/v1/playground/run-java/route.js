export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code?.trim()) {
      return Response.json({ error: 'No code provided.' }, { status: 400 });
    }

    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'java',
        version: '*',
        files: [{ name: 'Main.java', content: code }],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return Response.json({ error: `Execution service error: ${res.status}${text ? ' — ' + text : ''}` }, { status: 502 });
    }

    const data = await res.json();
    const run     = data.run     || {};
    const compile = data.compile || {};

    return Response.json({
      stdout:   (run.stdout     || '').split('\n').filter(Boolean),
      stderr:   [
        ...(compile.stderr || '').split('\n').filter(Boolean),
        ...(run.stderr     || '').split('\n').filter(Boolean),
      ],
      exitCode: run.code ?? 0,
    });
  } catch (err) {
    console.error('[run-java]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
