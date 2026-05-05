import { NextResponse } from 'next/server';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { sendInviteEmail } from '@/lib/email.js';
import { randomUUID } from 'crypto';

// GET /api/v1/admin/import — download CSV template
export async function GET(request) {
  try {
    await requireAdmin(request);
    const csv = 'first_name,last_name,email,role\nJane,Smith,jane@example.com,user\nJohn,Doe,john@example.com,admin\n';
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="user-import-template.csv"',
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/v1/admin/import — parse + bulk create users
export async function POST(request) {
  try {
    const { user: adminUser, profile: adminProfile } = await requireAdmin(request);
    const contentType = request.headers.get('content-type') || '';

    let rows = [];

    if (contentType.includes('application/json')) {
      // Accept pre-parsed rows for preview/confirmation
      const body = await request.json();
      rows = body.rows || [];
    } else {
      // Accept multipart form with CSV file
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return NextResponse.json({ error: 'CSV must have a header row and at least one data row.' }, { status: 400 });

      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const reqCols = ['first_name', 'last_name', 'email'];
      const missing = reqCols.filter(c => !header.includes(c));
      if (missing.length) {
        return NextResponse.json({ error: `Missing required columns: ${missing.join(', ')}.` }, { status: 400 });
      }

      rows = lines.slice(1).map((line, i) => {
        const vals = line.split(',').map(v => v.trim());
        const row = {};
        header.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        return { ...row, _line: i + 2 };
      });
    }

    if (rows.length === 0) return NextResponse.json({ error: 'No rows to import.' }, { status: 400 });
    if (rows.length > 500) return NextResponse.json({ error: 'Maximum 500 rows per import.' }, { status: 400 });

    // Validate rows
    const validationErrors = [];
    const validRows = [];
    const seenEmails = new Set();

    for (const row of rows) {
      const line = row._line || '?';
      const errs = [];
      if (!row.first_name?.trim()) errs.push('first_name required');
      if (!row.last_name?.trim())  errs.push('last_name required');
      if (!row.email?.trim())      errs.push('email required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errs.push('invalid email');
      const role = row.role?.trim() || 'user';
      if (!['user', 'admin'].includes(role)) errs.push(`invalid role "${role}" (must be user or admin)`);
      if (seenEmails.has(row.email?.toLowerCase())) errs.push('duplicate email in file');
      else seenEmails.add(row.email?.toLowerCase());

      if (errs.length) {
        validationErrors.push({ line, email: row.email, errors: errs });
      } else {
        validRows.push({ ...row, role });
      }
    }

    // Return validation errors without creating anything
    if (validationErrors.length) {
      return NextResponse.json({ errors: validationErrors, validCount: validRows.length }, { status: 422 });
    }

    // Create invitations for all valid rows
    const results = [];
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inviterName = [adminProfile.first_name, adminProfile.last_name].filter(Boolean).join(' ') || adminProfile.email;

    for (const row of validRows) {
      const email = row.email.toLowerCase();
      const role  = row.role;
      const token = randomUUID();

      // Skip if already has an account
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        results.push({ email, status: 'skipped', reason: 'Account already exists.' });
        continue;
      }

      const { error: insertError } = await supabase.from('invite_tokens').insert({
        token, email, role, invited_by: adminUser.id, expires_at: expiresAt,
      });

      if (insertError) {
        results.push({ email, status: 'error', reason: 'Failed to create invitation.' });
        continue;
      }

      try {
        await sendInviteEmail({ to: email, token, role, invitedBy: inviterName });
        results.push({ email, status: 'invited' });
      } catch {
        results.push({ email, status: 'invited', warning: 'Email delivery failed.' });
      }

      await auditLog({
        performedBy: adminUser.id,
        action: 'user_imported',
        targetEmail: email,
        details: { role, first_name: row.first_name, last_name: row.last_name },
      });
    }

    const counts = results.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
    return NextResponse.json({ results, counts });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[admin/import POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
