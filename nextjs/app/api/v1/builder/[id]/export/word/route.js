import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType,
  UnderlineType, convertInchesToTwip, convertMillimetersToTwip,
} from 'docx';

export const dynamic = 'force-dynamic';

// ── Helpers ────────────────────────────────────────────────────────────────────

const PT = (pt) => pt * 2; // half-points (docx unit for font size)

function hr(color = 'BFBFBF', size = 6) {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
    spacing: { before: 0, after: 60 },
  });
}

function sectionHeading(text, color = '1a1a1a') {
  return [
    new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: PT(10), color, font: 'Calibri', characterSpacing: 60 })],
      spacing: { before: 200, after: 0 },
    }),
    hr(color.replace('#', ''), 6),
  ];
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text: typeof text === 'string' ? text.replace(/^[-•*]\s+/, '') : String(text), size: PT(10), font: 'Calibri' })],
    spacing: { after: 40 },
  });
}

function entryHeader(left, right, leftBold = true) {
  return new Paragraph({
    children: [
      new TextRun({ text: left, bold: leftBold, size: PT(11), font: 'Calibri' }),
      new TextRun({ text: right ? `  |  ${right}` : '', size: PT(10), color: '666666', font: 'Calibri' }),
    ],
    spacing: { before: 120, after: 20 },
  });
}

function subLine(text) {
  if (!text) return null;
  return new Paragraph({
    children: [new TextRun({ text, size: PT(10), color: '555555', italics: true, font: 'Calibri' })],
    spacing: { after: 40 },
  });
}

// ── Document builder ────────────────────────────────────────────────────────────

function buildDoc(resume) {
  const pi = resume.personal_info || {};
  const sections = (resume.sections || []).filter(s => s.enabled !== false).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const accentColor = (resume.design_settings?.accentColor || '185FA5').replace('#', '');

  const children = [];

  // ── Header ───────────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [new TextRun({ text: pi.name || '', bold: true, size: PT(24), font: 'Calibri', color: accentColor })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));

  if (pi.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: pi.title, size: PT(13), italics: true, font: 'Calibri', color: '444444' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }));
  }

  // Contact line
  const contacts = [pi.email, pi.phone, pi.location, pi.linkedin || pi.link].filter(Boolean);
  if (contacts.length) {
    children.push(new Paragraph({
      children: contacts.map((c, i) => new TextRun({
        text: i < contacts.length - 1 ? `${c}  ·  ` : c,
        size: PT(10), font: 'Calibri', color: '555555',
      })),
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }));
  }

  children.push(hr(accentColor, 8));

  // ── Sections ─────────────────────────────────────────────────────────────────
  for (const sec of sections) {
    const c = sec.content || {};

    if (sec.type === 'summary') {
      children.push(...sectionHeading(sec.title || 'Summary', accentColor));
      if (c.text) children.push(new Paragraph({ children: [new TextRun({ text: c.text, size: PT(10), font: 'Calibri' })], spacing: { after: 60 } }));

    } else if (sec.type === 'work_experience') {
      children.push(...sectionHeading(sec.title || 'Work Experience', accentColor));
      for (const e of c.entries || []) {
        children.push(entryHeader(`${e.title || ''}${e.employer ? ` — ${e.employer}` : ''}`, e.dates));
        const loc = subLine([e.location].filter(Boolean).join(' · '));
        if (loc) children.push(loc);
        for (const b of (e.bullets || [])) children.push(bullet(b));
      }

    } else if (sec.type === 'education') {
      children.push(...sectionHeading(sec.title || 'Education', accentColor));
      for (const e of c.entries || []) {
        children.push(entryHeader(e.school || '', e.dates));
        const deg = subLine(e.degree || '');
        if (deg) children.push(deg);
      }

    } else if (sec.type === 'skills') {
      children.push(...sectionHeading(sec.title || 'Skills', accentColor));
      const names = (c.entries || []).map(e => e.name).filter(Boolean);
      if (names.length) {
        children.push(new Paragraph({
          children: [new TextRun({ text: names.join('  ·  '), size: PT(10), font: 'Calibri' })],
          spacing: { after: 60 },
        }));
      }

    } else if (sec.type === 'certifications') {
      children.push(...sectionHeading(sec.title || 'Certifications', accentColor));
      for (const e of c.entries || []) {
        const label = [e.name, e.issuer && `(${e.issuer})`, e.date].filter(Boolean).join(' ');
        children.push(new Paragraph({ children: [new TextRun({ text: label, size: PT(10), font: 'Calibri' })], bullet: { level: 0 }, spacing: { after: 40 } }));
      }

    } else if (sec.type === 'projects') {
      children.push(...sectionHeading(sec.title || 'Projects', accentColor));
      for (const e of c.entries || []) {
        children.push(entryHeader(e.title || '', e.dates));
        if (e.role) children.push(subLine(`Technologies: ${e.role}`));
        if (e.link) children.push(subLine(`Link: ${e.link}`));
        if (e.description) children.push(new Paragraph({ children: [new TextRun({ text: e.description, size: PT(10), font: 'Calibri' })], spacing: { after: 60 } }));
      }

    } else if (sec.type === 'languages') {
      children.push(...sectionHeading(sec.title || 'Languages', accentColor));
      const langs = (c.entries || []).map(e => e.level ? `${e.name} (${e.level})` : e.name).filter(Boolean);
      if (langs.length) {
        children.push(new Paragraph({
          children: [new TextRun({ text: langs.join('  ·  '), size: PT(10), font: 'Calibri' })],
          spacing: { after: 60 },
        }));
      }

    } else if (sec.type === 'hobbies' || sec.type === 'references' || sec.type === 'custom') {
      children.push(...sectionHeading(sec.title || '', accentColor));
      if (c.text) children.push(new Paragraph({ children: [new TextRun({ text: c.text, size: PT(10), font: 'Calibri' })], spacing: { after: 60 } }));
      for (const e of c.entries || []) {
        const vals = Object.values(e).filter(v => typeof v === 'string' && v);
        if (vals.length) children.push(bullet(vals.join(' · ')));
      }
    }
  }

  const isLetter = (resume.design_settings?.pageSize || 'a4') === 'letter';

  return new Document({
    sections: [{
      properties: {
        page: {
          size: isLetter
            ? { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) }
            : { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
          margin: {
            top:    convertInchesToTwip(0.6),
            bottom: convertInchesToTwip(0.6),
            left:   convertInchesToTwip(0.75),
            right:  convertInchesToTwip(0.75),
          },
        },
      },
      children,
    }],
  });
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: resume } = await supabase
      .from('builder_resumes')
      .select('*, builder_sections(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!resume) return Response.json({ error: 'Not found' }, { status: 404 });

    // Reshape sections to match what the rest of the app expects
    resume.sections = (resume.builder_sections || [])
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(s => ({ ...s, enabled: s.enabled !== false }));

    const doc = buildDoc(resume);
    const buffer = await Packer.toBuffer(doc);

    const pi = resume.personal_info || {};
    const nameParts = (pi.name || '').trim().split(/\s+/).filter(Boolean);
    const filename = nameParts.length >= 2
      ? `${nameParts[0]}_${nameParts[nameParts.length - 1]}_Resume.docx`
      : (nameParts[0] ? `${nameParts[0]}_Resume.docx` : 'Resume.docx');

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      },
    });
  } catch (err) {
    console.error('[word-export]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
