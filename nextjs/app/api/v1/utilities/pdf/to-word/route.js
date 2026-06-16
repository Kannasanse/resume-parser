import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 50 * 1024 * 1024;

function looksLikeHeading(text) {
  if (text.length > 120) return false;
  if (/^(chapter|section|\d+\.)\s/i.test(text)) return true;
  if (text === text.toUpperCase() && text.length < 60 && /[A-Z]/.test(text)) return true;
  return false;
}

export async function POST(request) {
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

    // Extract text page by page using pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(bytes);
    const rawText = parsed.text || '';

    // Split into paragraphs and build DOCX
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const children = [];

    for (const line of lines) {
      if (looksLikeHeading(line)) {
        children.push(new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: line, size: 24, font: 'Calibri' })],
          spacing: { after: 120 },
        }));
      }
    }

    if (children.length === 0) {
      children.push(new Paragraph({ children: [new TextRun('No text content found in this PDF.')] }));
    }

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="converted.docx"',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[utilities/pdf/to-word]', err);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  }
}
