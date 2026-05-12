import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';

export const dynamic = 'force-dynamic';

const BUCKET = 'profile-photos';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: resume } = await supabase
      .from('builder_resumes')
      .select('id, personal_info')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!resume) return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('photo');
    if (!file) return Response.json({ error: 'No file provided.' }, { status: 400 });

    if (!ALLOWED.includes(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG, and WebP images are supported.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return Response.json({ error: 'Image must be under 5 MB.' }, { status: 400 });
    }

    await ensureBucket();

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${user.id}/${id}_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const photoUrl = urlData.publicUrl;

    await supabase
      .from('builder_resumes')
      .update({ personal_info: { ...(resume.personal_info || {}), photo: photoUrl } })
      .eq('id', id);

    return Response.json({ url: photoUrl });
  } catch (err) {
    console.error('[photo-upload]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: resume } = await supabase
      .from('builder_resumes')
      .select('id, personal_info')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!resume) return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const pi = resume.personal_info || {};
    const { photo: _, ...rest } = pi;

    await supabase
      .from('builder_resumes')
      .update({ personal_info: rest })
      .eq('id', id);

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
