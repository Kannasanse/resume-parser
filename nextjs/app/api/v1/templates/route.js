import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/v1/templates
// Public-ish: returns the list of featured template IDs.
// No auth required — used by the template gallery on the user side.
export async function GET() {
  const { data, error } = await supabase
    .from('template_settings')
    .select('template_id')
    .eq('featured', true);

  if (error) return Response.json({ featuredIds: [] });

  return Response.json({ featuredIds: (data || []).map(r => r.template_id) });
}
