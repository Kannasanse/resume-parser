import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { checkResendLimit, incrementResendCount } from '@/lib/auth-helpers.js';
import { sendVerificationEmail } from '@/lib/email.js';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const limit = await checkResendLimit(email.toLowerCase());
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${limit.retryAfter} minute${limit.retryAfter !== 1 ? 's' : ''}.`, retryAfter: limit.retryAfter },
        { status: 429 }
      );
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate a new confirmation link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      // Don't reveal if user doesn't exist
      await incrementResendCount(email.toLowerCase());
      return NextResponse.json({ ok: true });
    }

    await sendVerificationEmail({ to: email, confirmationUrl: linkData.properties.action_link });
    await incrementResendCount(email.toLowerCase());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[resend-verification] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
