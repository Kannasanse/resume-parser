export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code?.trim()) {
      return Response.json({ error: 'No code provided.' }, { status: 400 });
    }

    const res = await fetch('https://wandbox.org/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'openjdk-head',
        code,
        options: '',
        stdin: '',
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return Response.json({ error: `Execution service error: ${res.status}${text ? ' — ' + text : ''}` }, { status: 502 });
    }

    const data = await res.json();
    const stdout = (data.program_output || '').split('\n').filter(Boolean);
    const stderr = [
      ...(data.compiler_error  || '').split('\n').filter(Boolean),
      ...(data.program_error   || '').split('\n').filter(Boolean),
    ];
    const exitCode = parseInt(data.status ?? '0', 10);

    return Response.json({ stdout, stderr, exitCode });
  } catch (err) {
    console.error('[run-java]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
