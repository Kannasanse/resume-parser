import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    if (error) throw error;
    return Response.json(data || []);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: name.trim() })
      .select('id, name')
      .single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
