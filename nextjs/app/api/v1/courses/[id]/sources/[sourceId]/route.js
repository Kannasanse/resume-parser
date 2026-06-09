import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id: courseId, sourceId } = params;

    const { data: source } = await supabase
      .from('course_sources')
      .select('file_path')
      .eq('id', sourceId)
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();

    if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Remove stored file if present
    if (source.file_path) {
      await supabase.storage.from('course-sources').remove([source.file_path]);
    }

    await supabase
      .from('course_sources')
      .delete()
      .eq('id', sourceId)
      .eq('user_id', user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('course source DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
