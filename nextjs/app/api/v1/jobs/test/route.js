import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.JSEARCH_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'JSEARCH_API_KEY not set in env' }, { status: 500 });
  }

  const params = new URLSearchParams({
    query: 'Business Analyst in Chennai, India',
    page: '1',
    num_pages: '1',
    date_posted: 'month',
    country: 'in',
    language: 'en',
  });

  try {
    const response = await fetch(
      `https://api.openwebninja.com/jsearch/search?${params}`,
      {
        headers: { 'X-API-Key': apiKey },
        cache: 'no-store',
      }
    );

    const text = await response.text();

    let data;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json({ error: 'non-json', raw: text.slice(0, 500) });
    }

    return NextResponse.json({
      http_status:  response.status,
      api_status:   data.status,
      jobs_count:   (data.data ?? []).length,
      first_job:    data.data?.[0] ? { job_id: data.data[0].job_id, title: data.data[0].job_title } : null,
      key_preview:  apiKey.slice(0, 8) + '...',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message });
  }
}
