import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

function sectionPreview(section) {
  const c = section.content || {};
  const entries = c.entries || [];
  switch (section.type) {
    case 'summary':
    case 'hobbies':
    case 'references': {
      const text = (c.text || '').trim();
      return text ? text.slice(0, 120) + (text.length > 120 ? '…' : '') : null;
    }
    case 'work_experience': {
      const e = entries[0];
      if (!e) return null;
      return [e.title, e.company].filter(Boolean).join(' · ');
    }
    case 'education': {
      const e = entries[0];
      if (!e) return null;
      return [e.degree, e.institution].filter(Boolean).join(' · ');
    }
    case 'skills': {
      const names = entries.slice(0, 5).map(e => e.skill).filter(Boolean);
      return names.length ? names.join(', ') + (entries.length > 5 ? ` +${entries.length - 5} more` : '') : null;
    }
    case 'certifications': {
      const e = entries[0];
      return e ? [e.name, e.issuer].filter(Boolean).join(' · ') : null;
    }
    case 'projects': {
      const e = entries[0];
      return e?.title || null;
    }
    case 'languages': {
      const names = entries.slice(0, 5).map(e => e.language).filter(Boolean);
      return names.length ? names.join(', ') : null;
    }
    default: {
      const e = entries[0];
      return e ? JSON.stringify(e).slice(0, 80) : null;
    }
  }
}

export async function GET(request, { params }) {
  try {
    const { user: admin } = await requireAdmin(request);
    const { id: userId, resumeId } = await params;

    const { data: resume, error: rErr } = await supabase
      .from('builder_resumes')
      .select('id, user_id, title, template_id, design_settings, personal_info, created_at, updated_at')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (rErr) throw rErr;
    if (!resume) return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const { data: sections, error: secErr } = await supabase
      .from('builder_sections')
      .select('id, type, title, content, position, enabled, created_at, updated_at')
      .eq('resume_id', resumeId)
      .order('position', { ascending: true });
    if (secErr) throw secErr;

    const sectionDetails = (sections || []).map(s => ({
      id:        s.id,
      type:      s.type,
      title:     s.title,
      position:  s.position,
      enabled:   s.enabled,
      entry_count: Array.isArray(s.content?.entries) ? s.content.entries.length : (s.content?.text ? 1 : 0),
      preview:   sectionPreview(s),
      content:   s.content,
    }));

    await auditLog({
      performedBy:  admin.id,
      action:       'viewed_resume_detail',
      targetUserId: userId,
      details:      { resume_id: resumeId },
    });

    return Response.json({
      resume: {
        id:            resume.id,
        user_id:       resume.user_id,
        title:         resume.title || 'Untitled Resume',
        template_id:   resume.template_id,
        status:        'draft',
        created_at:    resume.created_at,
        updated_at:    resume.updated_at,
        section_count: sectionDetails.length,
        personal_info: resume.personal_info || {},
      },
      sections: sectionDetails,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}
