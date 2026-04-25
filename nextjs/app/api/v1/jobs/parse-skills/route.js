import { parseJobSkills } from '@/lib/jobParser.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { description } = await req.json();
    if (!description?.trim()) return Response.json({ error: 'description is required' }, { status: 400 });
    const skills = await parseJobSkills(description);
    return Response.json({ skills });
  } catch (err) {
    console.error('Skill parsing error:', err.message);
    return Response.json({ error: 'Failed to parse skills. Please try again.' }, { status: 500 });
  }
}
