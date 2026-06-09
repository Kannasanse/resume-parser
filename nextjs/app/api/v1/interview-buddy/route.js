import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await requireUser(request);

    const { data, error } = await supabase
      .from('interview_kits')
      .select('id, title, company, role_level, depth, question_count, categories, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return Response.json({ kits: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
