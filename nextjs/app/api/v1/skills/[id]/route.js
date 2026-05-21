import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

// GET /api/v1/skills/:id — public, no auth
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('skills')
      .select('id, name, slug, category, subcategory, aliases, description, icon_url, is_active, is_trending, related_skills, selection_count, search_count, course_count, source, esco_uri')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Skill not found.' }, { status: 404 });
    }

    return NextResponse.json({ skill: data });
  } catch (err) {
    console.error('[skills/[id] GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/v1/skills/:id — admin only
export async function PATCH(request, { params }) {
  let user;
  try {
    ({ user } = await requireUser(request));
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));

    const allowed = ['name', 'slug', 'category', 'subcategory', 'aliases', 'description', 'icon_url', 'is_active', 'is_trending', 'related_skills'];
    const updates = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ skill: data });
  } catch (err) {
    console.error('[skills/[id] PATCH]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE /api/v1/skills/:id — admin only
export async function DELETE(request, { params }) {
  let user;
  try {
    ({ user } = await requireUser(request));
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[skills/[id] DELETE]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
