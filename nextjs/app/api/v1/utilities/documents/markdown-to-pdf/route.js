import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import { marked } from 'marked';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 100 * 1024 * 1024;

export async function POST(request) {
  let htmlPath;
  let browser;
  try {
    await requireUser(request);

    const form = await request.formData();
    const markdown = form.get('markdown');

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json({ error: 'No content provided.' }, { status: 400 });
    }
    if (Buffer.byteLength(markdown, 'utf8') > MAX_BYTES) {
      return NextResponse.json({ error: 'Content too large (max 100 MB).' }, { status: 413 });
    }

    const bodyHtml = marked(markdown);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13pt; line-height: 1.7; max-width: 750px; margin: 40px auto; color: #111; padding: 0 20px; }
  h1, h2, h3, h4 { margin-top: 1.4em; }
  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 1em; color: #666; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ddd; padding: 6px 12px; }
  th { background: #f8f8f8; }
  img { max-width: 100%; }
  a { color: #185FA5; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;

    const id = randomUUID();
    htmlPath = join(tmpdir(), `markdown-to-pdf-${id}.html`);
    await writeFile(htmlPath, html, 'utf8');

    const chromium = await import('@sparticuz/chromium').then(m => m.default).catch(() => null);
    const puppeteer = chromium
      ? await import('puppeteer-core').then(m => m.default)
      : await import('puppeteer').then(m => m.default);

    browser = chromium
      ? await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true })
      : await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    await browser.close();
    browser = null;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/documents/markdown-to-pdf]', err);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (htmlPath) unlink(htmlPath).catch(() => {});
  }
}
