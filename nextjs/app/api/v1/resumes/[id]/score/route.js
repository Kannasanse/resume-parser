import { upsertScore } from '@/lib/scorer.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { job_id } = await req.json();
    if (!job_id) return Response.json({ error: 'job_id is required' }, { status: 400 });

    const result = await upsertScore(id, job_id);
    if (!result) return Response.json({ error: 'Resume or job profile not found' }, { status: 404 });

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
