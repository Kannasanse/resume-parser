const BASE_URL = 'https://proflect-neo.vercel.app';

// Handle messages from the popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TRANSCRIBE_CHUNK') {
    transcribeChunk(msg)
      .then(result => sendResponse({ ok: true, ...result }))
      .catch(err  => sendResponse({ ok: false, error: err.message }));
    return true; // async response
  }
});

async function transcribeChunk({ audioData, index, sessionId, language }) {
  // Re-assemble Blob from ArrayBuffer data sent from popup
  const blob     = new Blob([new Uint8Array(audioData)], { type: 'audio/webm;codecs=opus' });
  const formData = new FormData();

  formData.append('file',      blob, `chunk_${index}.webm`);
  formData.append('sessionId', sessionId || '');
  formData.append('index',     String(index));
  if (language && language !== 'auto') {
    formData.append('language', language);
  }

  const res = await fetch(`${BASE_URL}/api/v1/recorder/transcribe-chunk`, {
    method:      'POST',
    credentials: 'include', // sends Proflect auth cookie
    body:        formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json(); // { text, segments }
}
