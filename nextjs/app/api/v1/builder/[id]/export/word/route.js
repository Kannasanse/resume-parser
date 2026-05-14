import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';
import { buildLayoutConfig, pxToDxa } from '@/lib/layoutConfig.js';
import { buildBlocksForWord, paginateBlocks } from '@/lib/paginationEngine.js';
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  BorderStyle, convertInchesToTwip, convertMillimetersToTwip,
} from 'docx';

export const dynamic = 'force-dynamic';

// ── Helpers ────────────────────────────────────────────────────────────────────

const PT = (pt) => pt * 2; // half-points (docx font size unit)

function hr(color = 'BFBFBF', size = 6) {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
    spacing: { before: 0, after: 60 },
    keepWithNext: true,
  });
}

/** Section heading — two paragraphs: label + underline rule. */
function sectionHeading(text, color = '1a1a1a', forceBreak = false) {
  const paras = [];
  if (forceBreak) {
    // Explicit page break before this section heading (per shared pagination).
    paras.push(new Paragraph({
      children: [new TextRun({ break: 1 })],
      spacing: { before: 0, after: 0 },
    }));
  }
  paras.push(
    new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: PT(10), color, font: 'Calibri', characterSpacing: 60 })],
      spacing: { before: forceBreak ? 0 : 200, after: 0 },
      keepWithNext: true,
      keepLines: true,
    }),
    hr(color.replace('#', ''), 6),
  );
  return paras;
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text: typeof text === 'string' ? text.replace(/^[-•*]\s+/, '') : String(text), size: PT(10), font: 'Calibri' })],
    spacing: { after: 40 },
  });
}

/**
 * Entry header — bold left label + optional right (dates) label.
 * forceBreak inserts an explicit page break before this paragraph when the
 * pagination engine has determined this entry starts a new page.
 */
function entryHeader(left, right, forceBreak = false, leftBold = true) {
  return new Paragraph({
    children: [
      ...(forceBreak ? [new TextRun({ break: 1 })] : []),
      new TextRun({ text: left, bold: leftBold, size: PT(11), font: 'Calibri' }),
      new TextRun({ text: right ? `  |  ${right}` : '', size: PT(10), color: '666666', font: 'Calibri' }),
    ],
    spacing: { before: forceBreak ? 0 : 120, after: 20 },
    keepWithNext: true,
    keepLines: true,
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
  const pi       = resume.personal_info || {};
  const sections = (resume.sections || [])
    .filter(s => s.enabled !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const accentColor = (resume.design_settings?.accentColor || '185FA5').replace('#', '');

  // ── Run the shared pagination engine to determine which blocks need explicit
  //    page breaks inserted before them in the Word XML. ──────────────────────
  const config = buildLayoutConfig(
    resume.spacing_settings || {},
    resume.design_settings  || {},
  );
  const wordBlocks          = buildBlocksForWord(sections, config);
  const { pageBreaks: pbMap } = paginateBlocks(wordBlocks, config);

  // pbMap: section.id or entry pseudo-id → pushPx (> 0 means break before it)
  const needsBreak = (id) => pbMap.has(id) && pbMap.get(id) > 0;

  const children = [];

  // ── Contact header ────────────────────────────────────────────────────────
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

  // ── Sections ──────────────────────────────────────────────────────────────
  for (const sec of sections) {
    const c            = sec.content || {};
    const secBreak     = needsBreak(sec.id);

    if (sec.type === 'summary') {
      children.push(...sectionHeading(sec.title || 'Summary', accentColor, secBreak));
      if (c.text) children.push(new Paragraph({
        children: [new TextRun({ text: c.text, size: PT(10), font: 'Calibri' })],
        spacing: { after: 60 },
      }));

    } else if (sec.type === 'work_experience') {
      children.push(...sectionHeading(sec.title || 'Work Experience', accentColor, secBreak));
      (c.entries || []).forEach((e, idx) => {
        const entryId  = `${sec.id}-entry-${idx}`;
        const entBreak = needsBreak(entryId);
        children.push(entryHeader(`${e.title || ''}${e.employer ? ` — ${e.employer}` : ''}`, e.dates, entBreak));
        const loc = subLine([e.location].filter(Boolean).join(' · '));
        if (loc) children.push(loc);
        // Support both legacy bullets array and rich HTML body (plain text fallback)
        const bullets = (e.bullets || []).filter(Boolean);
        for (const b of bullets) children.push(bullet(b));
        if (!bullets.length && e.body) {
          // Strip HTML tags for a plain-text fallback in Word
          const plain = e.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (plain) children.push(new Paragraph({
            children: [new TextRun({ text: plain, size: PT(10), font: 'Calibri' })],
            spacing: { after: 60 },
          }));
        }
      });

    } else if (sec.type === 'education') {
      children.push(...sectionHeading(sec.title || 'Education', accentColor, secBreak));
      (c.entries || []).forEach((e, idx) => {
        const entryId  = `${sec.id}-entry-${idx}`;
        const entBreak = needsBreak(entryId);
        children.push(entryHeader(e.school || '', e.dates, entBreak));
        const deg = subLine(e.degree || '');
        if (deg) children.push(deg);
      });

    } else if (sec.type === 'skills') {
      children.push(...sectionHeading(sec.title || 'Skills', accentColor, secBreak));
      const names = (c.entries || []).map(e => e.name).filter(Boolean);
      if (names.length) {
        children.push(new Paragraph({
          children: [new TextRun({ text: names.join('  ·  '), size: PT(10), font: 'Calibri' })],
          spacing: { after: 60 },
        }));
      }

    } else if (sec.type === 'certifications') {
      children.push(...sectionHeading(sec.title || 'Certifications', accentColor, secBreak));
      for (const e of (c.entries || [])) {
        const label = [e.name, e.issuer && `(${e.issuer})`, e.date].filter(Boolean).join(' ');
        children.push(new Paragraph({
          children: [new TextRun({ text: label, size: PT(10), font: 'Calibri' })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        }));
      }

    } else if (sec.type === 'projects') {
      children.push(...sectionHeading(sec.title || 'Projects', accentColor, secBreak));
      (c.entries || []).forEach((e, idx) => {
        const entryId  = `${sec.id}-entry-${idx}`;
        const entBreak = needsBreak(entryId);
        children.push(entryHeader(e.title || '', e.dates, entBreak));
        if (e.role)        children.push(subLine(`Technologies: ${e.role}`));
        if (e.link)        children.push(subLine(`Link: ${e.link}`));
        if (e.description) children.push(new Paragraph({
          children: [new TextRun({ text: e.description, size: PT(10), font: 'Calibri' })],
          spacing: { after: 60 },
        }));
      });

    } else if (sec.type === 'languages') {
      children.push(...sectionHeading(sec.title || 'Languages', accentColor, secBreak));
      const langs = (c.entries || []).map(e => e.level ? `${e.name} (${e.level})` : e.name).filter(Boolean);
      if (langs.length) {
        children.push(new Paragraph({
          children: [new TextRun({ text: langs.join('  ·  '), size: PT(10), font: 'Calibri' })],
          spacing: { after: 60 },
        }));
      }

    } else {
      // hobbies, references, custom
      children.push(...sectionHeading(sec.title || '', accentColor, secBreak));
      if (c.text) children.push(new Paragraph({
        children: [new TextRun({ text: c.text, size: PT(10), font: 'Calibri' })],
        spacing: { after: 60 },
      }));
      for (const e of (c.entries || [])) {
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
            ? { width: convertInchesToTwip(8.5),  height: convertInchesToTwip(11) }
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
