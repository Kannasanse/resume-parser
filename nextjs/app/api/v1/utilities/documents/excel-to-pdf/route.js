import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import * as XLSX from 'xlsx';
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
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 100 MB).' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const wb = XLSX.read(bytes);
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'No sheets found in the workbook.' }, { status: 400 });
    }
    const tableHtml = XLSX.utils.sheet_to_html(wb.Sheets[sheetName]);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 10pt; padding: 20px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; }
  th { background: #f0f0f0; font-weight: bold; }
  tr:nth-child(even) { background: #f9f9f9; }
</style>
</head>
<body>${tableHtml}</body>
</html>`;

    const id = randomUUID();
    htmlPath = join(tmpdir(), `excel-to-pdf-${id}.html`);
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
      landscape: true,
      printBackground: true,
      margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' },
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
    console.error('[utilities/documents/excel-to-pdf]', err);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (htmlPath) unlink(htmlPath).catch(() => {});
  }
}
