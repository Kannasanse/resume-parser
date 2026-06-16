import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import * as XLSX from 'xlsx';

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
    const wb = XLSX.utils.book_new();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Bucket text items into lines by snapping Y coordinate to 5pt grid
      const lines = {};
      for (const item of content.items) {
        if (!item.str) continue;
        const y = Math.round(item.transform[5] / 5) * 5;
        if (!lines[y]) lines[y] = [];
        lines[y].push(item.str);
      }

      // Sort lines top-to-bottom (higher Y = higher on page in PDF space)
      const rows = Object.keys(lines)
        .sort((a, b) => Number(b) - Number(a))
        .map(y => lines[y]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Page ${i}`);
    }

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="extracted.xlsx"',
        'Content-Length': String(xlsxBuffer.length),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/pdf/to-excel]', err);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  }
}
