import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 100 * 1024 * 1024;

export async function POST(request) {
  try {
    await requireUser(request);

    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 100 MB).' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => import('pdfjs-dist'));
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;

    let body = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map(item => item.str)
        .join(' ')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      body += `<section class="page">\n<h2>Page ${i}</h2>\n<p>${text}</p>\n</section>\n`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Converted PDF</title>
<style>
  body { font-family: sans-serif; max-width: 800px; margin: auto; padding: 20px; color: #222; line-height: 1.6; }
  section { margin-bottom: 2em; border-bottom: 1px solid #ccc; padding-bottom: 1em; }
  h2 { color: #666; font-size: 1rem; }
</style>
</head>
<body>
${body}</body>
</html>`;

    return new Response(Buffer.from(html, 'utf8'), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="document.html"',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/pdf/to-html]', err);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  }
}
