export async function runJava(code) {
  const res = await fetch('/api/v1/playground/run-java', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Run failed: ${res.status}`);
  }

  return { stdout: data.stdout, stderr: data.stderr, exitCode: data.exitCode };
}
