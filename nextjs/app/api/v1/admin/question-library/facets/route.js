import supabase from '@/lib/supabase.js';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const skill_tag = searchParams.get('skill_tag') || '';

    const DIFFICULTIES = ['easy', 'medium', 'hard'];

    // Fetch skills and topics in parallel; guard against missing columns
    const [skillRes, topicRes] = await Promise.all([
      supabase
        .from('question_library')
        .select('skill_tag')
        .not('skill_tag', 'is', null)
        .neq('skill_tag', ''),
      (() => {
        let q = supabase
          .from('question_library')
          .select('topic')
          .not('topic', 'is', null)
          .neq('topic', '');
        if (skill_tag) q = q.eq('skill_tag', skill_tag);
        return q;
      })(),
    ]);

    // Gracefully handle columns that don't exist yet
    const skills = skillRes.error
      ? []
      : [...new Set((skillRes.data || []).map(r => r.skill_tag))].sort();

    const topics = topicRes.error
      ? []
      : [...new Set((topicRes.data || []).map(r => r.topic))].sort();

    return Response.json({ skills, topics, difficulties: DIFFICULTIES });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}
