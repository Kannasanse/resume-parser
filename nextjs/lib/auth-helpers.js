import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import supabase from './supabase.js'; // service-role client

// Build a cookie-based Supabase client from a Next.js Request object
function buildSupabaseFromRequest(request) {
  let res = NextResponse.next({ request });
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );
  return { client, res };
}

// Returns { user, profile } or throws a Response with appropriate status
export async function requireAdmin(request) {
  const { client } = buildSupabaseFromRequest(request);
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    throw Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, status, first_name, last_name, email')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    throw Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (profile.role !== 'admin') {
    throw Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
  }
  if (profile.status === 'deactivated') {
    throw Response.json({ error: 'Account deactivated' }, { status: 403 });
  }

  return { user, profile };
}

// Returns { user, profile } or throws
export async function requireUser(request) {
  const { client } = buildSupabaseFromRequest(request);
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    throw Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, status, first_name, last_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'deactivated') {
    throw Response.json({ error: 'Account inactive' }, { status: 403 });
  }

  return { user, profile };
}

// Log an admin action to audit_log
export async function auditLog({ performedBy, action, targetUserId, targetEmail, details, ipAddress }) {
  await supabase.from('audit_log').insert({
    performed_by: performedBy,
    action,
    target_user_id: targetUserId || null,
    target_email: targetEmail || null,
    details: details || null,
    ip_address: ipAddress || null,
  });
}

// Check + enforce login rate limiting (max 5 attempts → 15 min lock)
export async function checkLoginRateLimit(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('failed_login_attempts, locked_until')
    .eq('id', userId)
    .single();

  if (!profile) return { blocked: false };

  if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(profile.locked_until) - new Date()) / 60000);
    return { blocked: true, minutesLeft };
  }

  return { blocked: false, attempts: profile.failed_login_attempts };
}

export async function recordFailedLogin(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('failed_login_attempts')
    .eq('id', userId)
    .single();

  if (!profile) return;
  const newAttempts = (profile.failed_login_attempts || 0) + 1;
  const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

  await supabase
    .from('profiles')
    .update({ failed_login_attempts: newAttempts, locked_until: lockedUntil, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function clearFailedLogins(userId) {
  await supabase
    .from('profiles')
    .update({ failed_login_attempts: 0, locked_until: null, last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', userId);
}

// Check email resend rate limit (3 per hour)
export async function checkResendLimit(email) {
  const { data } = await supabase
    .from('email_resend_limits')
    .select('resend_count, window_start')
    .eq('email', email)
    .single();

  if (!data) return { allowed: true };

  const windowAge = Date.now() - new Date(data.window_start).getTime();
  if (windowAge > 3600000) return { allowed: true }; // window expired

  if (data.resend_count >= 3) return { allowed: false, retryAfter: Math.ceil((3600000 - windowAge) / 60000) };
  return { allowed: true };
}

export async function incrementResendCount(email) {
  const { data } = await supabase
    .from('email_resend_limits')
    .select('resend_count, window_start')
    .eq('email', email)
    .single();

  const windowAge = data ? Date.now() - new Date(data.window_start).getTime() : null;
  const resetWindow = !data || windowAge > 3600000;

  await supabase.from('email_resend_limits').upsert({
    email,
    resend_count: resetWindow ? 1 : (data.resend_count + 1),
    window_start: resetWindow ? new Date().toISOString() : data.window_start,
    updated_at: new Date().toISOString(),
  });
}
