import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';
import { parseResume } from '@/lib/parser.js';

export const dynamic = 'force-dynamic';

// Convert "Beginner"/"Intermediate"/"Advanced"/"Expert" → 1/2/3
function proficiencyToLevel(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('begin') || t.includes('basic') || t.includes('element')) return 1;
  if (t.includes('advan') || t.includes('expert') || t.includes('profic') || t.includes('senior')) return 3;
  return 2; // intermediate / unknown
}

// Split a description string into an array of bullet strings.
// Handles markdown bullets (- / * / •), numbered lists, and plain paragraphs.
function descriptionToBullets(desc) {
  if (!desc) return [];
  const lines = desc
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  const bullets = [];
  for (const line of lines) {
    // Strip leading bullet markers
    const cleaned = line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
    if (cleaned) bullets.push(cleaned);
  }
  // If we got only one long paragraph, split on '. ' as a fallback
  if (bullets.length === 1 && bullets[0].length > 120) {
    const sentences = bullets[0].split(/\.\s+/).filter(s => s.trim());
    return sentences.map(s => s.endsWith('.') ? s : s + '.');
  }
  return bullets;
}

// Combine start/end dates into a single readable string
function combineDates(start, end) {
  const s = (start || '').trim();
  const e = (end || '').trim();
  if (s && e) return `${s} – ${e}`;
  if (e) return e;
  if (s) return `${s} – Present`;
  return '';
}

export async function POST(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: resume } = await supabase
      .from('builder_resumes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!resume) return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file');
    if (!file) return Response.json({ error: 'No file provided.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseResume(buffer, file.type);
    if (!result?.structured) return Response.json({ error: 'Could not parse file.' }, { status: 422 });

    const rj = result.structured.raw_json || result.structured;
    const pi = rj.personal_info || {};

    // ── personal_info (matches builder schema: name, title, email, phone, location, link, linkedin) ──
    const firstExpTitle = Array.isArray(rj.experience) && rj.experience[0]?.title
      ? rj.experience[0].title : '';

    const personalInfo = {
      name:     pi.name || rj.candidate_name || '',
      title:    pi.title || pi.headline || firstExpTitle || '',
      email:    pi.email || rj.email || '',
      phone:    pi.phone || rj.phone || '',
      location: pi.location || '',
      link:     pi.linkedin || pi.website || pi.github || '',
      linkedin: pi.linkedin || '',
    };

    await supabase
      .from('builder_resumes')
      .update({ personal_info: personalInfo })
      .eq('id', id);

    // ── Rebuild sections in the schema the builder/templates expect ──
    await supabase.from('builder_sections').delete().eq('resume_id', id);

    const sections = [];
    let pos = 0;

    // Summary
    if (rj.summary?.trim()) {
      sections.push({
        resume_id: id, type: 'summary', title: 'Summary',
        content: { text: rj.summary.trim() },
        position: pos++,
      });
    }

    // Work Experience — fields: title, employer, dates, location, bullets[]
    if (Array.isArray(rj.experience) && rj.experience.length) {
      sections.push({
        resume_id: id, type: 'work_experience', title: 'Work Experience',
        content: {
          entries: rj.experience.map(e => ({
            title:    e.title || '',
            employer: e.company || e.employer || e.organization || '',
            dates:    combineDates(e.start_date, e.end_date),
            location: e.location || '',
            bullets:  descriptionToBullets(e.description),
          })),
        },
        position: pos++,
      });
    }

    // Education — fields: school, degree, dates, location
    if (Array.isArray(rj.education) && rj.education.length) {
      sections.push({
        resume_id: id, type: 'education', title: 'Education',
        content: {
          entries: rj.education.map(e => ({
            school:   e.institution || e.school || '',
            degree:   [e.degree, e.field].filter(Boolean).join(', ') || '',
            dates:    combineDates(e.start_date, e.end_date || e.graduation_year),
            location: e.location || '',
          })),
        },
        position: pos++,
      });
    }

    // Skills — fields: name (string), level (1/2/3)
    if (Array.isArray(rj.skills) && rj.skills.length) {
      sections.push({
        resume_id: id, type: 'skills', title: 'Skills',
        content: {
          entries: rj.skills.map(s =>
            typeof s === 'string'
              ? { name: s, level: 2 }
              : { name: s.skill || s.name || '', level: proficiencyToLevel(s.proficiency || s.level) }
          ).filter(s => s.name),
        },
        position: pos++,
      });
    }

    // Certifications — fields: name, issuer, date  (already correct)
    if (Array.isArray(rj.certifications) && rj.certifications.length) {
      sections.push({
        resume_id: id, type: 'certifications', title: 'Certifications',
        content: {
          entries: rj.certifications.map(c => ({
            name:   c.name || '',
            issuer: c.issuer || c.organization || '',
            date:   c.date || c.year || '',
          })).filter(c => c.name),
        },
        position: pos++,
      });
    }

    // Projects — fields: title, role, dates, link, description
    if (Array.isArray(rj.projects) && rj.projects.length) {
      sections.push({
        resume_id: id, type: 'projects', title: 'Projects',
        content: {
          entries: rj.projects.map(p => ({
            title:       p.name || p.title || '',
            role:        Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || ''),
            dates:       combineDates(p.start_date, p.end_date),
            link:        p.github_url || p.url || p.link || '',
            description: p.description || '',
          })).filter(p => p.title),
        },
        position: pos++,
      });
    }

    // Languages — fields: name (string), level (text e.g. "Fluent")
    const langs = rj.other?.languages || rj.languages;
    if (Array.isArray(langs) && langs.length) {
      sections.push({
        resume_id: id, type: 'languages', title: 'Languages',
        content: {
          entries: langs.map(l =>
            typeof l === 'string'
              ? { name: l, level: 'Fluent' }
              : { name: l.language || l.name || '', level: l.proficiency || l.level || 'Fluent' }
          ).filter(l => l.name),
        },
        position: pos++,
      });
    }

    if (sections.length) {
      await supabase.from('builder_sections').insert(sections);
    }

    return Response.json({
      data: { personalInfo, sectionCount: sections.length },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
