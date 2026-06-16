'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ src, initials, size = 96 }) {
  if (src) {
    return (
      <img
        src={src}
        alt="Profile"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-ds-border"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-primary/10 border-2 border-ds-border flex items-center justify-center font-bold text-primary select-none"
    >
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ first_name: '', last_name: '', headline: '', city: '', country: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/v1/profile')
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            first_name: data.first_name || '',
            last_name:  data.last_name  || '',
            headline:   data.headline   || '',
            city:       data.city       || '',
            country:    data.country    || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required.';
    return e;
  }

  async function handleSave(ev) {
    ev.preventDefault();
    setError(''); setSuccess('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(p => ({
        ...p,
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        headline:   form.headline.trim(),
        city:       form.city.trim(),
        country:    form.country.trim(),
      }));
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setAvatarError('');

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('File must be under 5 MB.');
      ev.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarUploading(true);
    try {
      const res = await fetch('/api/v1/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(p => ({ ...p, avatar_url: data.avatar_url }));
    } catch (err) {
      setAvatarError(err.message || 'Upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
      ev.target.value = '';
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError('');
    setAvatarUploading(true);
    try {
      await fetch('/api/v1/profile/avatar', { method: 'DELETE' });
      setProfile(p => ({ ...p, avatar_url: null }));
    } catch {
      setAvatarError('Failed to remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  }

  const initials = [form.first_name, form.last_name]
    .filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AU';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ds-bg py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-ds-text font-heading">My Profile</h1>
          <p className="text-sm text-ds-textSecondary mt-1">Manage your personal information and account details.</p>
        </div>

        {/* Avatar card */}
        <div className="bg-ds-card border border-ds-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-ds-text mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <Avatar src={profile?.avatar_url} initials={initials} size={80} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarUploading}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-btn hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {profile?.avatar_url ? 'Change photo' : 'Upload photo'}
                </button>
                {profile?.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="px-3 py-1.5 text-xs font-semibold border border-ds-border text-ds-textSecondary rounded-btn hover:bg-ds-bg disabled:opacity-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-ds-textMuted">JPEG, PNG, WebP or GIF · Max 5 MB</p>
              {avatarError && <p className="text-xs text-ds-danger">{avatarError}</p>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Personal info card */}
        <form onSubmit={handleSave} noValidate>
          <div className="bg-ds-card border border-ds-border rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-ds-text">Personal Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">
                  First Name <span className="text-ds-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => { setForm(f => ({ ...f, first_name: e.target.value })); setSuccess(''); }}
                  placeholder="Jane"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors.first_name ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`}
                />
                {errors.first_name && <p className="text-xs text-ds-danger mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => { setForm(f => ({ ...f, last_name: e.target.value })); setSuccess(''); }}
                  placeholder="Doe"
                  className="w-full border border-ds-inputBorder rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Job Title</label>
              <input
                type="text"
                value={form.headline}
                onChange={e => { setForm(f => ({ ...f, headline: e.target.value })); setSuccess(''); }}
                placeholder="e.g. Senior React Developer"
                className="w-full border border-ds-inputBorder rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              <p className="text-xs text-ds-textMuted mt-1">Used to personalise job recommendations.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setSuccess(''); }}
                placeholder="e.g. Chennai"
                className="w-full border border-ds-inputBorder rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={e => { setForm(f => ({ ...f, country: e.target.value })); setSuccess(''); }}
                placeholder="e.g. India"
                className="w-full border border-ds-inputBorder rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Email Address</label>
              <input
                type="email"
                value={profile?.email || user?.email || ''}
                readOnly
                className="w-full border border-ds-border rounded-lg px-3 py-2.5 text-sm bg-ds-bg/50 text-ds-textMuted cursor-not-allowed"
              />
              <p className="text-xs text-ds-textMuted mt-1">Email cannot be changed.</p>
            </div>

            {error && (
              <div className="sm:col-span-2 text-sm text-ds-danger bg-ds-dangerLight rounded-lg px-4 py-3">{error}</div>
            )}
            {success && (
              <div className="sm:col-span-2 text-sm text-ds-success bg-ds-successLight rounded-lg px-4 py-3">{success}</div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-btn hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {saving
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span>
                  : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Account details card */}
        <div className="bg-ds-card border border-ds-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ds-text">Account Details</h2>
          <div className="divide-y divide-ds-border">
            <div className="flex justify-between items-center py-3">
              <span className="text-xs font-semibold text-ds-textSecondary uppercase tracking-wide">Role</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${profile?.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-ds-bg text-ds-textSecondary border border-ds-border'}`}>
                {profile?.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-xs font-semibold text-ds-textSecondary uppercase tracking-wide">Member Since</span>
              <span className="text-sm text-ds-text">{formatDate(profile?.created_at)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-xs font-semibold text-ds-textSecondary uppercase tracking-wide">Last Signed In</span>
              <span className="text-sm text-ds-text">{formatDateTime(profile?.last_login_at)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
