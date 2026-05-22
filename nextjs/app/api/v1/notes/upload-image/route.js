import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BUCKET = 'note-images';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return Response.json({ error: 'noteId query param is required' }, { status: 400 });
    }

    // Verify the note belongs to the user
    const { data: note, error: noteErr } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (noteErr || !note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG, WebP, and GIF images are supported' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length > MAX_BYTES) {
      return Response.json({ error: 'Image must be under 10 MB' }, { status: 400 });
    }

    // Sanitize filename to avoid path traversal
    const originalName = file.name || 'image';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${safeName}`;
    const path = `${user.id}/${noteId}/${filename}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return Response.json({ url: urlData.publicUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}
