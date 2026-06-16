import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/v1/skills/categories
export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('skill_categories')
      .select('id, name, slug, description, icon, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ categories: data || [] });
  } catch (err) {
    console.error('[skills/categories GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
