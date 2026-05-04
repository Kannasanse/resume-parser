import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';
import { parseResume } from '@/lib/parser.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    // Verify ownership
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

    // Update personal_info on the resume
    const personalInfo = {
      name: pi.name || rj.candidate_name || '',
      email: pi.email || rj.email || '',
      phone: pi.phone || rj.phone || '',
      location: pi.location || '',
      linkedin: pi.linkedin || '',
      github: pi.github || '',
      website: pi.website || '',
      summary: rj.summary || '',
    };

    await supabase
      .from('builder_resumes')
      .update({ personal_info: personalInfo })
      .eq('id', id);

    // Delete existing sections and rebuild from parsed data
    await supabase.from('builder_sections').delete().eq('resume_id', id);

    const sectionsToCreate = [];
    let pos = 0;

    if (rj.summary) {
      sectionsToCreate.push({
        resume_id: id, type: 'summary', title: 'Summary',
        content: { text: rj.summary }, position: pos++,
      });
    }

    if (Array.isArray(rj.experience) && rj.experience.length > 0) {
      sectionsToCreate.push({
        resume_id: id, type: 'work_experience', title: 'Work Experience',
        content: {
          entries: rj.experience.map(e => ({
            title: e.title || '',
            company: e.company || '',
            location: e.location || '',
            start_date: e.start_date || '',
            end_date: e.end_date || '',
            current: !e.end_date || e.end_date.toLowerCase().includes('present'),
            description: e.description || '',
          })),
        },
        position: pos++,
      });
    }

    if (Array.isArray(rj.education) && rj.education.length > 0) {
      sectionsToCreate.push({
        resume_id: id, type: 'education', title: 'Education',
        content: {
          entries: rj.education.map(e => ({
            institution: e.institution || '',
            degree: e.degree || '',
            field: e.field || '',
            start_date: e.start_date || '',
            end_date: e.end_date || e.graduation_year || '',
            grade: e.grade || '',
          })),
        },
        position: pos++,
      });
    }

    if (Array.isArray(rj.skills) && rj.skills.length > 0) {
      sectionsToCreate.push({
        resume_id: id, type: 'skills', title: 'Skills',
        content: {
          entries: rj.skills.map(s =>
            typeof s === 'string'
              ? { skill: s, proficiency: 'Intermediate' }
              : { skill: s.skill || '', proficiency: s.proficiency || 'Intermediate' }
          ),
        },
        position: pos++,
      });
    }

    if (Array.isArray(rj.certifications) && rj.certifications.length > 0) {
      sectionsToCreate.push({
        resume_id: id, type: 'certifications', title: 'Certifications',
        content: {
          entries: rj.certifications.map(c => ({
            name: c.name || '', issuer: c.issuer || '', date: c.date || '',
          })),
        },
        position: pos++,
      });
    }

    if (Array.isArray(rj.projects) && rj.projects.length > 0) {
      sectionsToCreate.push({
        resume_id: id, type: 'projects', title: 'Projects',
        content: {
          entries: rj.projects.map(p => ({
            name: p.name || '',
            description: p.description || '',
            technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
            url: p.github_url || '',
          })),
        },
        position: pos++,
      });
    }

    const languages = rj.other?.languages;
    if (Array.isArray(languages) && languages.length > 0) {
      sectionsToCreate.push({
        resume_id: id, type: 'languages', title: 'Languages',
        content: { entries: languages.map(l => ({ language: l, level: '' })) },
        position: pos++,
      });
    }

    if (sectionsToCreate.length > 0) {
      await supabase.from('builder_sections').insert(sectionsToCreate);
    }

    return Response.json({
      data: { personalInfo, sectionCount: sectionsToCreate.length },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
