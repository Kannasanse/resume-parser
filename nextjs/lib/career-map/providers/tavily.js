const TRUSTED_DOMAINS = [
  'developer.mozilla.org',
  'javascript.info',
  'react.dev',
  'docs.python.org',
  'realpython.com',
  'freecodecamp.org',
  'css-tricks.com',
  'roadmap.sh',
  'dev.to',
  'medium.com',
  'towardsdatascience.com',
  'docs.docker.com',
  'kubernetes.io',
  'digitalocean.com/community',
  'baeldung.com',
  'geeksforgeeks.org',
  'tutorialspoint.com',
  'w3schools.com',
  'learn.microsoft.com',
];

export async function searchWithTavily(query) {
  if (!process.env.TAVILY_API_KEY) {
    console.warn('[Tavily] TAVILY_API_KEY not set — skipping');
    return null;
  }
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth:        'advanced',
        include_domains:     TRUSTED_DOMAINS,
        max_results:         3,
        include_answer:      false,
        include_raw_content: true,
      }),
    });

    if (!response.ok) {
      console.error('[Tavily] Error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const results = data.results ?? [];
    if (results.length === 0) return null;

    // Prefer raw_content (full page text) over the short snippet in content
    const best = results
      .map(r => ({ ...r, _text: r.raw_content || r.content || '' }))
      .filter(r => r._text.length > 300)
      .sort((a, b) => b._text.length - a._text.length)[0];

    if (!best) return null;

    return {
      content: best._text,
      url:     best.url,
      title:   best.title,
      quality: Math.min(1, best._text.length / 3000),
    };
  } catch (err) {
    console.error('[Tavily] Exception:', err);
    return null;
  }
}
