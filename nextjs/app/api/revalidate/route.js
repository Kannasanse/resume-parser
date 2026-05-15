import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await requireAdmin(req);
  } catch (e) { return e; }

  revalidatePath('/home');
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
