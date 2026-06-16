function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export async function sendTranscriptToNotes(transcript, videoTitle) {
  const title = videoTitle ? `${videoTitle} — Transcript` : 'Video Transcript';
  const { text, segments = [], language, wordCount } = transcript;

  const content = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: videoTitle || 'Video Transcript' }],
      },
      {
        type: 'paragraph',
        content: [{
          type: 'text',
          text: `Transcribed on ${new Date().toLocaleDateString()} · ${wordCount ?? 0} words · Language: ${language || 'unknown'}`,
        }],
      },
      { type: 'horizontalRule' },
      ...(segments.length > 0
        ? segments.flatMap(seg => [
            {
              type: 'heading',
              attrs: { level: 3 },
              content: [{ type: 'text', text: formatTime(seg.start) }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: seg.text.trim() }],
            },
          ])
        : [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: text || '' }],
            },
          ]
      ),
    ],
  };

  const res = await fetch('/api/v1/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create note.');
  }

  const { note } = await res.json();
  return note;
}
