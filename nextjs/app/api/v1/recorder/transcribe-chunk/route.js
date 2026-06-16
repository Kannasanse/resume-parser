import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request) {
  try {
    const { user } = await requireUser(request);

    const formData = await request.formData();
    const chunk = formData.get('file');
    const sessionId = formData.get('sessionId') || null;
    const index = parseInt(formData.get('index') || '0', 10);
    const language = formData.get('language') || null;

    if (!chunk || typeof chunk === 'string') {
      return Response.json({ error: 'No audio chunk provided.' }, { status: 400 });
    }

    const whisperForm = new FormData();
    whisperForm.append('file', chunk, `chunk_${index}.webm`);
    whisperForm.append('model', 'whisper-large-v3-turbo');
    whisperForm.append('response_format', 'verbose_json');
    if (language && language !== 'auto') {
      whisperForm.append('language', language);
    }

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: whisperForm,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return Response.json(
        { error: err.error?.message || 'Transcription failed.' },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Offset timestamps so they're relative to session start (each chunk = 10 s)
    const timeOffset = index * 10;
    const segments = (data.segments || []).map(seg => ({
      ...seg,
      start: seg.start + timeOffset,
      end: seg.end + timeOffset,
    }));

    // Persist chunk in Supabase if a sessionId was provided
    if (sessionId) {
      const { data: existing } = await supabase
        .from('transcript_sessions')
        .select('chunks')
        .eq('session_id', sessionId)
        .maybeSingle();

      const existingChunks = Array.isArray(existing?.chunks) ? [...existing.chunks] : [];
      existingChunks[index] = { index, text: data.text, segments };

      await supabase.from('transcript_sessions').upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          chunks: existingChunks,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
    }

    return Response.json({ text: data.text || '', segments });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[recorder/transcribe-chunk]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
