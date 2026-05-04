import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';

export const dynamic = 'force-dynamic';

async function ownerCheck(user, id) {
  const { data } = await supabase
    .from('builder_resumes')
    .select('id, share_token, share_enabled')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  return data;
}

// GET — current share status
export async function GET(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const resume = await ownerCheck(user, id);
    if (!resume) return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const origin = new URL(req.url).origin;
    return Response.json({
      data: {
        enabled: resume.share_enabled,
        token: resume.share_token,
        url: resume.share_enabled ? `${origin}/r/${resume.share_token}` : null,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST — enable sharing (generates token if missing)
export async function POST(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await ownerCheck(user, id)))
      return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const { data, error } = await supabase
      .from('builder_resumes')
      .update({ share_enabled: true })
      .eq('id', id)
      .select('share_token, share_enabled')
      .single();

    if (error) throw error;
    const origin = new URL(req.url).origin;
    return Response.json({
      data: {
        enabled: true,
        token: data.share_token,
        url: `${origin}/r/${data.share_token}`,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — disable sharing
export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await ownerCheck(user, id)))
      return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const { error } = await supabase
      .from('builder_resumes')
      .update({ share_enabled: false })
      .eq('id', id);

    if (error) throw error;
    return Response.json({ data: { enabled: false, token: null, url: null } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
