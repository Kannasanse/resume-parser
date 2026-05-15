import puppeteerCore from 'puppeteer-core';
import { getAuthUser } from '@/lib/authUtils.js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Extend timeout — Chromium launch + render can take 10–20 s in serverless.
export const maxDuration = 60;

/**
 * Resolve the Chromium executable path.
 *
 * - In serverless / Lambda environments (NODE_ENV=production or no local
 *   Chrome) we use @sparticuz/chromium which ships a compatible binary.
 * - In local development we fall back to the bundled Chromium that the
 *   full `puppeteer` package installs, if present.
 */
async function getChromiumArgs() {
  // Try @sparticuz/chromium first — works in Lambda / Vercel / Railway.
  try {
    const chromium = (await import('@sparticuz/chromium')).default;
    return {
      executablePath: await chromium.executablePath(),
      args: [
        ...chromium.args,
        '--font-render-hinting=none',
      ],
      defaultViewport: chromium.defaultViewport,
    };
  } catch {
    // Fall back to locally installed Chrome (development).
    const puppeteer = (await import('puppeteer')).default;
    return {
      executablePath: puppeteer.executablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
      defaultViewport: { width: 794, height: 1123 },
    };
  }
}

export async function GET(req, { params }) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const host  = req.headers.get('host') || 'localhost:3000';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const printUrl = `${proto}://${host}/print/${id}`;

  const cookieStore = await cookies();
  const allCookies  = cookieStore.getAll();

  let browser;
  try {
    const { executablePath, args, defaultViewport } = await getChromiumArgs();

    browser = await puppeteerCore.launch({
      executablePath,
      args,
      defaultViewport,
      headless: true,
    });

    const page = await browser.newPage();

    if (allCookies.length > 0) {
      await page.setCookie(...allCookies.map(c => ({
        name:   c.name,
        value:  c.value,
        domain: new URL(`${proto}://${host}`).hostname,
        path:   '/',
      })));
    }

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

    // Suppress the auto-print dialog triggered by the print page.
    await page.evaluateOnNewDocument(() => { window.print = () => {}; });

    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30_000 });

    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 1_500));

    const pageTitle = await page.title();
    const filename  = pageTitle ? `${pageTitle}.pdf` : 'Resume.pdf';

    const pdfBuffer = await page.pdf({
      format:            'A4',
      printBackground:   true,
      preferCSSPageSize: true,
      tagged:            true,
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
