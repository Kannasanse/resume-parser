import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

function categoriseReferrer(ref) {
  if (!ref) return 'direct';
  if (ref.includes('linkedin.com')) return 'linkedin';
  if (ref.includes('google.')) return 'google';
  if (ref.includes('github.')) return 'github';
  if (ref.includes('twitter.') || ref.includes('x.com')) return 'twitter';
  return 'other';
}

export async function POST(req) {
  const { portfolioId, eventType, referrer, projectId } = await req.json();
  if (!portfolioId || !eventType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const countryCode = req.headers.get('x-vercel-ip-country') ?? null;
  await supabase.from('portfolio_analytics').insert({
    portfolio_id: portfolioId,
    event_type: eventType,
    referrer: categoriseReferrer(referrer),
    project_id: projectId ?? null,
    country_code: countryCode,
  });
  // Also increment view_count on page_view
  if (eventType === 'page_view') {
    await supabase.rpc('increment_portfolio_views', { pid: portfolioId }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
