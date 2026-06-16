const EXA_DOMAINS = [
  'freecodecamp.org',
  'developer.mozilla.org',
  'javascript.info',
  'realpython.com',
  'dev.to',
  'roadmap.sh',
  'css-tricks.com',
  'digitalocean.com',
  'baeldung.com',
];

export async function searchWithExa(query) {
  if (!process.env.EXA_API_KEY) {
    console.warn('[Exa] EXA_API_KEY not set — skipping');
    return null;
  }
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        type:           'neural',
        numResults:     3,
        contents:       { text: true, highlights: false },
        includeDomains: EXA_DOMAINS,
      }),
    });

    if (!response.ok) {
      console.error('[Exa] Error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const results = data.results ?? [];
    if (results.length === 0) return null;

    const best = results
      .filter(r => r.text && r.text.length > 400)
      .sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0))[0];

    if (!best) return null;

    return {
      content: best.text,
      url:     best.url,
      title:   best.title,
      quality: Math.min(1, best.text.length / 3000),
    };
  } catch (err) {
    console.error('[Exa] Exception:', err);
    return null;
  }
}
