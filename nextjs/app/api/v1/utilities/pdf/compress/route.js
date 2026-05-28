import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const QUALITY = { low: 0.90, medium: 0.72, high: 0.48 };
const MAX_BYTES = 100 * 1024 * 1024;

export async function POST(request) {
  let inPath, outPath;
  try {
    await requireUser(request);

    const form = await request.formData();
    const file = form.get('file');
    const quality = form.get('quality') || 'medium';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 100 MB).' }, { status: 413 });
    }

    const id = randomUUID();
    inPath  = join(tmpdir(), `compress-in-${id}.pdf`);
    outPath = join(tmpdir(), `compress-out-${id}.pdf`);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(inPath, bytes);

    // Re-render each page via pdfjs → canvas → JPEG → embed back via pdf-lib
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => import('pdfjs-dist'));
    if (pdfjsLib.GlobalWorkerOptions) pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    const { PDFDocument } = await import('pdf-lib');
    const { createCanvas } = await import('canvas').catch(() => ({ createCanvas: null }));

    // Fallback: if canvas is not available, return the original with metadata stripped
    if (!createCanvas) {
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach(p => out.addPage(p));
      const compressed = await out.save({ useObjectStreams: true });
      await writeFile(outPath, compressed);
    } else {
      const q = QUALITY[quality] || 0.72;
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
      const out = await PDFDocument.create();
      const scale = quality === 'high' ? 1.2 : quality === 'medium' ? 1.5 : 2.0;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = createCanvas(Math.round(vp.width), Math.round(vp.height));
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const jpegBuf = canvas.toBuffer('image/jpeg', { quality: q });
        const img = await out.embedJpg(jpegBuf);
        const p = out.addPage([vp.width / scale, vp.height / scale]);
        p.drawImage(img, { x: 0, y: 0, width: vp.width / scale, height: vp.height / scale });
      }
      const compressed = await out.save({ useObjectStreams: true });
      await writeFile(outPath, compressed);
    }

    const outBytes = await readFile(outPath);
    return new Response(outBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="compressed.pdf"',
        'Content-Length': String(outBytes.length),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/pdf/compress]', err);
    return NextResponse.json({ error: 'Compression failed.' }, { status: 500 });
  } finally {
    for (const p of [inPath, outPath]) {
      if (p) unlink(p).catch(() => {});
    }
  }
}
