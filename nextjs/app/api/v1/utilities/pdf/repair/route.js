import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import { PDFDocument } from 'pdf-lib';

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

    // Attempt tolerant load; fall back to standard load if options unsupported
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    }).catch(async () => {
      return PDFDocument.load(bytes, { ignoreEncryption: true });
    });

    const outBytes = await doc.save({ useObjectStreams: false });

    return new Response(outBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="repaired.pdf"',
        'Content-Length': String(outBytes.byteLength),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/pdf/repair]', err);
    return NextResponse.json({ error: 'Repair failed.' }, { status: 500 });
  }
}
