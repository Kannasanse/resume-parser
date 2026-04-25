import { upsertScore } from '@/lib/scorer.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { id: jobId, resumeId } = await params;
    const result = await upsertScore(resumeId, jobId);
    if (!result) return Response.json({ error: 'Resume or job profile not found' }, { status: 404 });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
