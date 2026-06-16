import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Marketing pages — accessible to everyone, no redirect when authenticated
const MARKETING_PATHS  = ['/home', '/features'];
// Auth pages — redirect away when authenticated
const AUTH_PAGES       = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/join', '/access-denied'];
const PUBLIC_PATHS     = [...MARKETING_PATHS, ...AUTH_PAGES];
// Utility pages — publicly viewable; auth is enforced at the action/upload level
const PUBLIC_UTILITY_PAGES = ['/utilities'];
const ADMIN_ONLY_PATHS = ['/resumes', '/jobs', '/upload', '/admin', '/home/preview'];
const ADMIN_ONLY_API   = ['/api/v1/resumes', '/api/v1/jobs', '/api/v1/admin', '/api/v1/organizations'];
// Job recommendation routes under /api/v1/jobs/ that are user-facing (not admin-only)
const USER_JOB_API     = ['/api/v1/jobs/recommendations', '/api/v1/jobs/interact', '/api/v1/jobs/saved', '/api/v1/jobs/test'];

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
  const isMarketingPath = MARKETING_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isAuthPage      = AUTH_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isPublicShare   = pathname.startsWith('/r/') || pathname.startsWith('/api/public/');
  const isPublicApiAuth = pathname.startsWith('/api/v1/auth/');

  // Public test-taking pages and their API routes
  const isPublicTest = pathname.startsWith('/test/') || pathname.startsWith('/api/v1/test/') || pathname === '/api/v1/jobs/test';

  if (isPublicShare || isPublicApiAuth || isPublicTest) return supabaseResponse;

  // ── Unauthenticated ────────────────────────────────────────────────────────
  const isUtilityPage = PUBLIC_UTILITY_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))
    && !pathname.startsWith('/api/');

  if (!user) {
    if (isPublicPath || isUtilityPage || pathname.startsWith('/auth/')) return supabaseResponse;
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

  // Marketing pages (/home) — let authenticated users view them too, no redirect
  if (isMarketingPath) return supabaseResponse;

  // Redirect confirmed users away from auth pages (login, signup etc.)
  if (isAuthPage && pathname !== '/access-denied') {
    return NextResponse.redirect(new URL(isAdmin ? '/resumes' : '/builder', request.url));
  }

  // Root → dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAdmin ? '/resumes' : '/builder', request.url));
  }

  // ── Role enforcement: API ──────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const isUserJobApi = USER_JOB_API.some(p => pathname.startsWith(p));
    const blocked = !isUserJobApi && ADMIN_ONLY_API.some(p => pathname.startsWith(p));
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)'],
};
