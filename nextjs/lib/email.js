// Email abstraction — uses Resend if RESEND_API_KEY is set, otherwise logs to console.
// Set NEXT_PUBLIC_APP_URL in .env.local (e.g. http://localhost:3000).

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function sendEmail({ to, subject, html }) {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || 'noreply@resumeparse.app';
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) throw new Error(error.message);
  } else {
    // Dev fallback — log to console
    console.log('\n📧 [EMAIL — configure RESEND_API_KEY to send real emails]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:', html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    console.log('---');
  }
}

export async function sendInviteEmail({ to, token, role, invitedBy }) {
  const link = `${APP_URL}/join?token=${token}`;
  await sendEmail({
    to,
    subject: `You've been invited to join Resume Builder`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>You've been invited</h2>
        <p>${invitedBy ? `<strong>${invitedBy}</strong> has invited you` : 'You have been invited'} to join Resume Builder as a <strong>${role}</strong>.</p>
        <p>This invitation expires in 7 days.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#FF7814;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Accept Invitation
          </a>
        </p>
        <p style="color:#888;font-size:12px">Or copy this link: ${link}</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail({ to, confirmationUrl }) {
  await sendEmail({
    to,
    subject: 'Verify your email address — Resume Builder',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address and activate your account.</p>
        <p>This link expires in 24 hours.</p>
        <p style="margin:24px 0">
          <a href="${confirmationUrl}" style="background:#FF7814;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Verify Email
          </a>
        </p>
        <p style="color:#888;font-size:12px">Or copy this link: ${confirmationUrl}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  await sendEmail({
    to,
    subject: 'Reset your password — Resume Builder',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#FF7814;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
        </p>
        <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendCreditRequestNotification({ to, userName, userEmail, amount, reason, reviewUrl }) {
  await sendEmail({
    to,
    subject: `Credit request from ${userName} — Resume Builder`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>New credit request</h2>
        <p><strong>${userName}</strong> (${userEmail}) has requested <strong>${amount} credits</strong>.</p>
        ${reason ? `<p style="background:#f5f5f5;padding:12px;border-radius:6px;font-style:italic">"${reason}"</p>` : ''}
        <p style="margin:24px 0">
          <a href="${reviewUrl}" style="background:#FF7814;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Review Request
          </a>
        </p>
        <p style="color:#888;font-size:12px">Or visit: ${reviewUrl}</p>
      </div>
    `,
  });
}

export async function sendCreditRequestDecisionEmail({ to, action, amount, adminNotes }) {
  const approved = action === 'approve';
  await sendEmail({
    to,
    subject: `Your credit request was ${approved ? 'approved' : 'rejected'} — Resume Builder`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Credit request ${approved ? 'approved' : 'rejected'}</h2>
        ${approved
          ? `<p>Great news! Your credit request for <strong>${amount} credits</strong> has been approved and added to your account.</p>`
          : `<p>Your credit request has been reviewed and was not approved at this time.</p>`
        }
        ${adminNotes ? `<p style="background:#f5f5f5;padding:12px;border-radius:6px;font-style:italic">Admin note: "${adminNotes}"</p>` : ''}
        <p style="margin:24px 0">
          <a href="${APP_URL}/credits" style="background:#FF7814;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            View Credits
          </a>
        </p>
      </div>
    `,
  });
}

export async function sendRoleChangedEmail({ to, newRole }) {
  await sendEmail({
    to,
    subject: 'Your account permissions have been updated — Resume Builder',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Account permissions updated</h2>
        <p>Your account role has been changed to <strong>${newRole}</strong>.</p>
        <p>Please log in again for the changes to take effect.</p>
        <p style="margin:24px 0">
          <a href="${APP_URL}/login" style="background:#FF7814;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Log In
          </a>
        </p>
      </div>
    `,
  });
}
