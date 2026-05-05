import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS   = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/join', '/access-denied'];
const ADMIN_ONLY_PATHS = ['/resumes', '/jobs', '/upload', '/admin'];
const ADMIN_ONLY_API   = ['/api/v1/resumes', '/api/v1/jobs', '/api/v1/admin', '/api/v1/organizations'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isPublicPath    = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isPublicShare   = pathname.startsWith('/r/') || pathname.startsWith('/api/public/');
  const isPublicApiAuth = pathname.startsWith('/api/v1/auth/');

  if (isPublicShare || isPublicApiAuth) return supabaseResponse;

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!user) {
    if (isPublicPath || pathname.startsWith('/auth/')) return supabaseResponse;
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  const role    = user.user_metadata?.role || 'user';
  const isAdmin = role === 'admin';
  const emailConfirmed = !!user.email_confirmed_at;

  // Unconfirmed: only permit auth/ and verify-email paths
  if (!emailConfirmed) {
    if (pathname.startsWith('/verify-email') || pathname.startsWith('/auth/') || isPublicApiAuth) {
      return supabaseResponse;
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }

  // Redirect confirmed users away from public auth pages
  if (isPublicPath && pathname !== '/access-denied') {
    return NextResponse.redirect(new URL(isAdmin ? '/resumes' : '/builder', request.url));
  }

  // Root → dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAdmin ? '/resumes' : '/builder', request.url));
  }

  // ── Role enforcement: API ──────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const blocked = ADMIN_ONLY_API.some(p => pathname.startsWith(p));
    if (blocked && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return supabaseResponse;
  }

  // ── Role enforcement: Pages ────────────────────────────────────────────────
  const isAdminPage = ADMIN_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL('/builder', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
