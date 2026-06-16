import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
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
    const html = form.get('html');

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'No HTML provided.' }, { status: 400 });
    }
    if (Buffer.byteLength(html, 'utf8') > MAX_BYTES) {
      return NextResponse.json({ error: 'Content too large (max 100 MB).' }, { status: 413 });
    }

    // Wrap fragment in a full HTML document if needed
    const trimmed = html.trimStart();
    const fullHtml =
      trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')
        ? html
        : `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;padding:20px}img{max-width:100%}</style></head><body>${html}</body></html>`;

    const id = randomUUID();
    htmlPath = join(tmpdir(), `html-to-pdf-${id}.html`);
    await writeFile(htmlPath, fullHtml, 'utf8');

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
        'Content-Disposition': 'attachment; filename="converted.pdf"',
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/documents/html-to-pdf]', err);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (htmlPath) unlink(htmlPath).catch(() => {});
  }
}
