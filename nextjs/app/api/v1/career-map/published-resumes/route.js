import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await requireUser(request);

    // Fetch all builder resumes for this user
    const { data: resumes, error } = await supabase
      .from('builder_resumes')
      .select('id, title, template_id, updated_at, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    if (!resumes || resumes.length === 0) {
      return NextResponse.json({ resumes: [] });
    }

    // Fetch sections for each resume to extract skills preview
    const resumeIds = resumes.map(r => r.id);
    const { data: sections } = await supabase
      .from('builder_sections')
      .select('resume_id, type, title, content')
      .in('resume_id', resumeIds);

    const sectionsByResume = {};
    for (const s of sections || []) {
      if (!sectionsByResume[s.resume_id]) sectionsByResume[s.resume_id] = [];
      sectionsByResume[s.resume_id].push(s);
    }

    // Extract top skills from skills section content
    function extractSkills(resumeSections) {
      const skillsSection = resumeSections?.find(s =>
        s.type === 'skills' || s.title?.toLowerCase().includes('skill')
      );
      if (!skillsSection?.content) return [];

      const c = skillsSection.content;
      // Common skill section structures
      if (Array.isArray(c.skills)) return c.skills.slice(0, 5).map(s => (typeof s === 'string' ? s : s.name || s.skill || '')).filter(Boolean);
      if (Array.isArray(c.items)) return c.items.slice(0, 5).map(s => (typeof s === 'string' ? s : s.name || s.label || '')).filter(Boolean);
      if (typeof c.text === 'string') return c.text.split(/[,;|]/).map(s => s.trim()).filter(Boolean).slice(0, 5);
      return [];
    }

    const enriched = resumes.map(r => {
      const rSections = sectionsByResume[r.id] || [];
      return {
        id: r.id,
        title: r.title || 'Untitled Resume',
        templateId: r.template_id,
        updatedAt: r.updated_at,
        createdAt: r.created_at,
        sectionCount: rSections.length,
        skillsPreview: extractSkills(rSections),
      };
    });

    // Fetch the last career map session to pre-select resume
    const { data: lastSession } = await supabase
      .from('career_map_sessions')
      .select('resume_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      resumes: enriched,
      lastUsedResumeId: lastSession?.resume_id || null,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('published-resumes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
