import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

function deriveTopic(session) {
  const type = session.input_type;
  const data = (session.input_data || '').trim();
  if (type === 'skills') {
    const skills = data.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    if (!skills.length) return 'Skills Assessment';
    if (skills.length <= 3) return skills.join(', ');
    return `${skills.slice(0, 2).join(', ')} +${skills.length - 2} more`;
  }
  if (type === 'content') {
    const first = data.slice(0, 60);
    return first + (data.length > 60 ? '…' : '');
  }
  // jd: first non-empty line of the job description
  const firstLine = data.split('\n').map(l => l.trim()).find(l => l.length > 3) || 'Job Description';
  return firstLine.slice(0, 60) + (firstLine.length > 60 ? '…' : '');
}

function deriveBand(pct) {
  if (pct >= 80) return 'Strong Match';
  if (pct >= 50) return 'Partial Match';
  return 'Needs Improvement';
}

export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const { searchParams } = new URL(request.url);

    const mode  = searchParams.get('mode') || null;
    const days  = parseInt(searchParams.get('days')) || null;
    const page  = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 10));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('self_test_sessions')
      .select(`
        id, input_type, input_data, difficulty,
        question_count, short_answer_count, created_at,
        self_test_attempts (
          score, max_score, combined_pct, short_answer_count
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mode && ['skills', 'content', 'jd'].includes(mode)) {
      query = query.eq('input_type', mode);
    }
    if (days) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const sessions = (data || []).map(s => {
      const attempts = Array.isArray(s.self_test_attempts) ? s.self_test_attempts : [];
      const attempt  = attempts[0] || null;
      const scorePct = attempt
        ? (attempt.combined_pct ?? (attempt.max_score > 0
            ? Math.round((attempt.score / attempt.max_score) * 100) : 0))
        : 0;
      return {
        id:            s.id,
        topic:         deriveTopic(s),
        mode:          s.input_type,
        score:         scorePct,
        band:          deriveBand(scorePct),
        questionCount: s.question_count,
        hasShortAnswer: (s.short_answer_count > 0) || ((attempt?.short_answer_count ?? 0) > 0),
        createdAt:     s.created_at,
      };
    });

    return Response.json({
      sessions,
      total: count ?? sessions.length,
      page,
      pages: Math.ceil((count ?? sessions.length) / limit),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}
