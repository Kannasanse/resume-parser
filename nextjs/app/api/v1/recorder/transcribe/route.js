import { requireUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_TYPES = [
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg',
  'audio/x-m4a', 'audio/m4a',
  'video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska',
];

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — Groq limit

export async function POST(request) {
  try {
    await requireUser(request);

    const formData = await request.formData();
    const file = formData.get('file');
    const language = formData.get('language') || null;

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: `File too large. Max 25 MB for transcription.` },
        { status: 400 }
      );
    }

    const type = file.type || '';
    const name = file.name || '';
    const hasValidType = ALLOWED_TYPES.includes(type);
    const hasValidExt = /\.(mp4|webm|mov|mkv|mp3|m4a|wav|ogg|mpeg)$/i.test(name);

    if (!hasValidType && !hasValidExt) {
      return Response.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    const whisperForm = new FormData();
    whisperForm.append('file', file);
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
    const segments = data.segments || [];
    const srt = generateSRT(segments);

    return Response.json({
      text: data.text || '',
      segments,
      language: data.language || null,
      srt,
      wordCount: (data.text || '').split(/\s+/).filter(Boolean).length,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[recorder/transcribe]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function generateSRT(segments) {
  return segments
    .map((seg, i) => {
      const start = srtTime(seg.start);
      const end = srtTime(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}

function srtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}
