'use client';
import { useState, useEffect } from 'react';

function EmailChip({ email, onRemove }) {
  return (
    <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
      {email}
      <button type="button" onClick={onRemove}
        className="hover:text-ds-danger transition-colors leading-none">
        ×
      </button>
    </span>
  );
}

export default function AdminInvitePage() {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails]         = useState([]);
  const [role, setRole]             = useState('user');
  const [sending, setSending]       = useState(false);
  const [results, setResults]       = useState(null);
  const [error, setError]           = useState('');

  const [invites, setInvites]       = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/invite?limit=50')
      .then(r => r.json())
      .then(d => setInvites(d.invites || []))
      .catch(() => {})
      .finally(() => setLoadingInvites(false));
  }, [results]);

  const addEmail = (raw) => {
    const parts = raw.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
    const valid = parts.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const deduped = valid.filter(e => !emails.includes(e));
    if (deduped.length) setEmails(prev => [...prev, ...deduped]);
  };

  const handleKeyDown = (e) => {
    if (['Enter', ',', ' ', 'Tab'].includes(e.key)) {
      e.preventDefault();
      addEmail(emailInput);
      setEmailInput('');
    }
    if (e.key === 'Backspace' && !emailInput && emails.length) {
      setEmails(prev => prev.slice(0, -1));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    addEmail(text);
    setEmailInput('');
  };

  const handleSend = async (ev) => {
    ev.preventDefault();
    const allEmails = [...emails, ...(emailInput.trim() ? [emailInput.trim().toLowerCase()] : [])];
    const valid = allEmails.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (!valid.length) { setError('Add at least one valid email address.'); return; }

    setSending(true);
    setError('');
    setResults(null);
    try {
      const res = await fetch('/api/v1/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: valid, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send invitations.'); return; }
      setResults(data.results);
      setEmails([]);
      setEmailInput('');
    } catch {
      setError('Failed to send invitations. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!confirm('Cancel this invitation?')) return;
    await fetch(`/api/v1/admin/invite?id=${inviteId}`, { method: 'DELETE' });
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ds-text font-heading">Invite Users</h1>
        <p className="text-sm text-ds-textMuted mt-1">Send email invitations. Invitations expire after 7 days.</p>
      </div>

      <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-4">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">
              Email Addresses
            </label>
            <div
              className="min-h-[80px] w-full border border-ds-inputBorder rounded px-3 py-2 bg-ds-bg flex flex-wrap gap-1.5 items-start cursor-text focus-within:ring-2 focus-within:ring-primary focus-within:border-primary"
              onClick={() => document.getElementById('email-chip-input')?.focus()}
            >
              {emails.map(e => (
                <EmailChip key={e} email={e} onRemove={() => setEmails(prev => prev.filter(x => x !== e))} />
              ))}
              <input
                id="email-chip-input"
                value={emailInput}
                onChange={ev => setEmailInput(ev.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => { if (emailInput.trim()) { addEmail(emailInput); setEmailInput(''); } }}
                placeholder={emails.length ? '' : 'Type emails, press Enter or comma to add…'}
                className="flex-1 min-w-32 bg-transparent text-sm text-ds-text placeholder-ds-textMuted outline-none"
              />
            </div>
            <p className="text-xs text-ds-textMuted mt-1">Press Enter, comma, or paste multiple emails at once.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{error}</p>}

          {results && (
            <div className="space-y-1">
              {results.map(r => (
                <div key={r.email} className={`flex items-center gap-2 text-xs rounded px-3 py-1.5 ${r.ok ? 'bg-ds-successLight text-ds-success' : 'bg-ds-dangerLight text-ds-danger'}`}>
                  <span>{r.ok ? '✓' : '✗'}</span>
                  <span>{r.email}</span>
                  {r.warning && <span className="text-amber-600 ml-auto">{r.warning}</span>}
                  {r.error   && <span className="ml-auto">{r.error}</span>}
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={sending || (!emails.length && !emailInput.trim())}
            className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {sending
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span>
              : `Send Invitation${emails.length + (emailInput.trim() ? 1 : 0) > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>

      {/* Pending invites list */}
      <div>
        <h2 className="text-sm font-semibold text-ds-textMuted uppercase tracking-wide mb-3">Pending Invitations</h2>
        <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
          {loadingInvites
            ? <div className="p-4 space-y-2">{Array.from({length:3}).map((_,i) => <div key={i} className="h-10 bg-ds-border/60 rounded-md animate-pulse"/>)}</div>
            : invites.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).length === 0
              ? <p className="px-4 py-6 text-sm text-ds-textMuted text-center">No pending invitations.</p>
              : (
                <table className="w-full text-sm">
                  <thead className="border-b border-ds-border bg-ds-bg">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Email</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Expires</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ds-border">
                    {invites
                      .filter(i => !i.used_at && new Date(i.expires_at) > new Date())
                      .map(invite => (
                        <tr key={invite.id} className="hover:bg-ds-bg/50">
                          <td className="px-4 py-2.5 text-ds-text">{invite.email}</td>
                          <td className="px-4 py-2.5 text-ds-textMuted capitalize">{invite.role}</td>
                          <td className="px-4 py-2.5 text-ds-textMuted text-xs">{new Date(invite.expires_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => handleCancelInvite(invite.id)}
                              className="text-xs text-ds-danger hover:underline">Cancel</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )
          }
        </div>
      </div>
    </div>
  );
}
