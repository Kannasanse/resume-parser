import puppeteer from 'puppeteer';
import { getAuthUser } from '@/lib/authUtils.js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Extend timeout — Puppeteer launch + render can take 10–20 s.
export const maxDuration = 60;

export async function GET(req, { params }) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Determine the base URL so Puppeteer can navigate to the print page.
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const printUrl = `${proto}://${host}/print/${id}`;

  // Forward all auth cookies so the print page can load the resume.
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none', // sharper font rendering in headless
      ],
    });

    const page = await browser.newPage();

    // Pass auth session cookies so the print page can authenticate.
    if (allCookies.length > 0) {
      await page.setCookie(...allCookies.map(c => ({
        name:   c.name,
        value:  c.value,
        domain: new URL(`${proto}://${host}`).hostname,
        path:   '/',
      })));
    }

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    // Suppress the auto-print dialog — we generate the PDF ourselves.
    await page.evaluateOnNewDocument(() => { window.print = () => {}; });

    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30_000 });

    // Wait for web fonts and the pagination engine to settle.
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 1_500));

    // Derive filename from page title (set by the print page to "First_Last_Resume").
    const pageTitle = await page.title();
    const filename  = pageTitle ? `${pageTitle}.pdf` : 'Resume.pdf';

    const pdfBuffer = await page.pdf({
      format:           'A4',
      printBackground:  true,  // preserve accent colours, coloured headings, etc.
      preferCSSPageSize: true,  // honour the @page size declaration
      tagged:           true,   // embeds PDF accessibility tags — improves ATS parsing
    });

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      pdfBuffer.length,
      },
    });
  } catch (err) {
    console.error('[pdf-export]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
