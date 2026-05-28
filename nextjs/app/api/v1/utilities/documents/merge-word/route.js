import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import { Document, Paragraph, Packer, PageBreak } from 'docx';
import mammoth from 'mammoth';

export const dynamic = 'force-dynamic';

const MAX_BYTES_EACH = 50 * 1024 * 1024;

export async function POST(request) {
  try {
    await requireUser(request);

    const form = await request.formData();
    const files = form.getAll('files');

    if (!files.length || files.some(f => typeof f === 'string')) {
      return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
    }
    if (files.length < 2) {
      return NextResponse.json({ error: 'Provide at least 2 files.' }, { status: 400 });
    }
    for (const f of files) {
      if (f.size > MAX_BYTES_EACH) {
        return NextResponse.json({ error: `${f.name} exceeds 50 MB limit.` }, { status: 413 });
      }
    }

    // Extract plain text from each DOCX and combine with page breaks
    const allParagraphs = [];

    for (let i = 0; i < files.length; i++) {
      const bytes = Buffer.from(await files[i].arrayBuffer());
      const { value: text } = await mammoth.extractRawText({ buffer: bytes });
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      if (i > 0) {
        // Page break between documents
        allParagraphs.push(new Paragraph({ children: [new PageBreak()] }));
      }

      for (const line of lines) {
        allParagraphs.push(new Paragraph({ text: line, spacing: { after: 120 } }));
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: allParagraphs }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="merged.docx"',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/documents/merge-word]', err);
    return NextResponse.json({ error: 'Merge failed.' }, { status: 500 });
  }
}
