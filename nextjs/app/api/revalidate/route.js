import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await requireAdmin(req);
  } catch (e) { return e; }

  console.log('[Revalidate] called at', new Date().toISOString());
  revalidatePath('/home');
  console.log('[Revalidate] /home revalidated');
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
