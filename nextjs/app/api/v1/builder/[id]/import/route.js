import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';
import { parseResumeWithGroq } from '@/lib/parser.js';
import { deductCredits, getBalance } from '@/lib/credits.js';

export const dynamic = 'force-dynamic';

// Convert proficiency text → numeric level (1=Beginner, 2=Intermediate, 3=Advanced)
function profToLevel(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('expert') || t.includes('advan') || t.includes('senior') || t.includes('profic')) return 3;
  if (t.includes('begin') || t.includes('basic') || t.includes('element') || t.includes('familiar')) return 1;
  return 2;
}

// Split a markdown/plain-text description into bullet strings
function toBullets(desc) {
  if (!desc) return [];
  const lines = desc.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const bullets = lines.map(l => l.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').trim()).filter(Boolean);
  // If single long blob, split on '. '
  if (bullets.length === 1 && bullets[0].length > 120) {
    return bullets[0].split(/\.\s+/).filter(s => s.trim()).map(s => s.endsWith('.') ? s : s + '.');
  }
  return bullets;
}

// Join start/end date strings into "Jan 2020 – Mar 2023"
function joinDates(start, end) {
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

    // Credit guard (5 credits for AI import)
    const balance = await getBalance(user.id);
    if (balance < 5) {
      return Response.json({ error: 'Insufficient credits. Resume import costs 5 credits.', code: 'insufficient_credits', balance }, { status: 402 });
    }

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

    // Parse directly with Groq — same engine as the admin/job-profile scorer
    const { ai } = await parseResumeWithGroq(buffer, file.type);

    const pi = ai.personal_info || {};

    // ── personal_info (fields the builder/templates read) ──────────────────────
    const firstExpTitle = Array.isArray(ai.experience) && ai.experience[0]?.title
      ? ai.experience[0].title : '';

    const personalInfo = {
      name:     (pi.name     || '').trim(),
      title:    (pi.title    || pi.headline || firstExpTitle || '').trim(),
      email:    (pi.email    || '').trim(),
      phone:    (pi.phone    || '').trim(),
      location: (pi.location || '').trim(),
      link:     (pi.linkedin || pi.website || pi.github || '').trim(),
      linkedin: (pi.linkedin || '').trim(),
    };

    await supabase
      .from('builder_resumes')
      .update({ personal_info: personalInfo })
      .eq('id', id);

    // ── Rebuild sections with exact builder schema ─────────────────────────────
    await supabase.from('builder_sections').delete().eq('resume_id', id);

    const sections = [];
    let pos = 0;

    // Summary
    const summary = (ai.summary || '').trim();
    if (summary) {
      sections.push({
        resume_id: id, type: 'summary', title: 'Summary',
        content: { text: summary },
        position: pos++,
      });
    }

    // Work Experience — builder reads: title, employer, dates, location, bullets[]
    const experience = Array.isArray(ai.experience) ? ai.experience : [];
    if (experience.length) {
      sections.push({
        resume_id: id, type: 'work_experience', title: 'Work Experience',
        content: {
          entries: experience.map(e => ({
            title:    (e.title    || '').trim(),
            employer: (e.company  || e.employer || e.organization || '').trim(),
            dates:    joinDates(e.start_date, e.end_date),
            location: (e.location || '').trim(),
            bullets:  toBullets(e.description),
          })),
        },
        position: pos++,
      });
    }

    // Education — builder reads: school, degree, dates, location
    const education = Array.isArray(ai.education) ? ai.education : [];
    if (education.length) {
      sections.push({
        resume_id: id, type: 'education', title: 'Education',
        content: {
          entries: education.map(e => ({
            school:   (e.institution || e.school || '').trim(),
            degree:   [e.degree, e.field].filter(Boolean).join(', ').trim(),
            dates:    joinDates(e.start_date, e.end_date || e.graduation_year),
            location: (e.location || '').trim(),
          })),
        },
        position: pos++,
      });
    }

    // Skills — builder reads: name (string), level (1/2/3)
    const skills = Array.isArray(ai.skills) ? ai.skills : [];
    if (skills.length) {
      const entries = skills
        .map(s => typeof s === 'string'
          ? { name: s.trim(), level: 2 }
          : { name: (s.skill || s.name || '').trim(), level: profToLevel(s.proficiency || s.level) }
        )
        .filter(s => s.name);
      if (entries.length) {
        sections.push({
          resume_id: id, type: 'skills', title: 'Skills',
          content: { entries },
          position: pos++,
        });
      }
    }

    // Certifications — builder reads: name, issuer, date
    const certs = Array.isArray(ai.certifications) ? ai.certifications : [];
    if (certs.length) {
      const entries = certs
        .map(c => ({
          name:   (c.name   || '').trim(),
          issuer: (c.issuer || c.organization || '').trim(),
          date:   (c.date   || c.year || '').trim(),
        }))
        .filter(c => c.name);
      if (entries.length) {
        sections.push({
          resume_id: id, type: 'certifications', title: 'Certifications',
          content: { entries },
          position: pos++,
        });
      }
    }

    // Projects — builder reads: title, role (technologies), dates, link, description
    const projects = Array.isArray(ai.projects) ? ai.projects : [];
    if (projects.length) {
      const entries = projects
        .map(p => ({
          title:       (p.name  || p.title || '').trim(),
          role:        (Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '')).trim(),
          dates:       joinDates(p.start_date, p.end_date),
          link:        (p.github_url || p.url || p.link || '').trim(),
          description: (p.description || '').trim(),
        }))
        .filter(p => p.title);
      if (entries.length) {
        sections.push({
          resume_id: id, type: 'projects', title: 'Projects',
          content: { entries },
          position: pos++,
        });
      }
    }

    // Languages — builder reads: name (string), level (text e.g. "Fluent")
    const langs = ai.other?.languages || ai.languages;
    if (Array.isArray(langs) && langs.length) {
      const entries = langs
        .map(l => typeof l === 'string'
          ? { name: l.trim(), level: 'Fluent' }
          : { name: (l.language || l.name || '').trim(), level: (l.proficiency || l.level || 'Fluent') }
        )
        .filter(l => l.name);
      if (entries.length) {
        sections.push({
          resume_id: id, type: 'languages', title: 'Languages',
          content: { entries },
          position: pos++,
        });
      }
    }

    if (sections.length) {
      await supabase.from('builder_sections').insert(sections);
    }

    // Deduct credits after successful import
    const { balance: newBalance } = await deductCredits(user.id, 'resume_import');

    return Response.json({ data: { personalInfo, sectionCount: sections.length, credits_used: 5, credits_remaining: newBalance } });
  } catch (err) {
    console.error('[builder-import]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
