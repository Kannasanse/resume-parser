import { requireUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const EMPTY_RESULT = { title: '', description: '', image: null, favicon: null, url: '' };

function extractMeta(html, property) {
  // Match og: properties
  const ogMatch = html.match(
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  ) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i')
  );
  if (ogMatch) return ogMatch[1];
  return null;
}

function extractMetaName(html, name) {
  const match = html.match(
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  ) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i')
  );
  if (match) return match[1];
  return null;
}

function extractTitle(html) {
  const ogTitle = extractMeta(html, 'og:title');
  if (ogTitle) return ogTitle;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  return '';
}

function extractDescription(html) {
  const ogDesc = extractMeta(html, 'og:description');
  if (ogDesc) return ogDesc;

  return extractMetaName(html, 'description') || '';
}

function extractImage(html) {
  return extractMeta(html, 'og:image') || null;
}

export async function GET(request) {
  try {
    const { user } = await requireUser(request); // eslint-disable-line no-unused-vars
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return Response.json({ error: 'url query param is required' }, { status: 400 });
    }

    // Basic URL validation
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return Response.json({ ...EMPTY_RESULT, url: targetUrl });
    }

    const domain = parsedUrl.hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

    // Fetch with 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let html;
    try {
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkPreviewBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return Response.json({ ...EMPTY_RESULT, favicon, url: targetUrl });
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return Response.json({ ...EMPTY_RESULT, favicon, url: targetUrl });
      }

      // Read only first 100KB to avoid huge payloads
      const buffer = await response.arrayBuffer();
      html = new TextDecoder('utf-8', { fatal: false }).decode(
        buffer.byteLength > 102400 ? buffer.slice(0, 102400) : buffer
      );
    } catch {
      clearTimeout(timeoutId);
      return Response.json({ ...EMPTY_RESULT, url: targetUrl });
    }

    const title = extractTitle(html);
    const description = extractDescription(html);
    const image = extractImage(html);

    return Response.json({ title, description, image, favicon, url: targetUrl });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ...EMPTY_RESULT });
  }
}
