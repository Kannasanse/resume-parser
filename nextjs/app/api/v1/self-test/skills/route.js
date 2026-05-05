import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await requireUser(request);
    const { data, error } = await supabase
      .from('question_library')
      .select('skill_tag')
      .not('skill_tag', 'is', null)
      .neq('skill_tag', '');
    if (error) throw error;
    const skills = [...new Set((data || []).map(r => r.skill_tag))].sort();
    return Response.json({ skills });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}
