import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import mammoth from 'mammoth';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request) {
  let htmlPath;
  try {
    await requireUser(request);

    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 50 MB).' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Convert DOCX → HTML with mammoth
    const { value: bodyHtml } = await mammoth.convertToHtml({ buffer: bytes });

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; line-height: 1.6; margin: 40px; color: #111; }
  h1, h2, h3 { margin-top: 1.2em; }
  p { margin: 0.6em 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; }
  img { max-width: 100%; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;

    const id = randomUUID();
    htmlPath = join(tmpdir(), `word-to-pdf-${id}.html`);
    await writeFile(htmlPath, html, 'utf8');

    // Render to PDF with Puppeteer
    let browser;
    try {
      const chromium = await import('@sparticuz/chromium').then(m => m.default).catch(() => null);
      const puppeteer = chromium
        ? await import('puppeteer-core').then(m => m.default)
        : await import('puppeteer').then(m => m.default);

      browser = chromium
        ? await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true })
        : await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

      const page = await browser.newPage();
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } });
      await browser.close();

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="converted.pdf"',
          'Content-Length': String(pdfBuffer.length),
        },
      });
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/documents/word-to-pdf]', err);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  } finally {
    if (htmlPath) unlink(htmlPath).catch(() => {});
  }
}
