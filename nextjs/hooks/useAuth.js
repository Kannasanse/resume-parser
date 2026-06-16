'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { setAuthToken, clearAuthToken } from '@/lib/authToken';

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch the effective profile via the server so proxy_uid cookie is respected
  const fetchProfile = useCallback(async (token) => {
    if (!token) { setProfile(null); return; }
    try {
      const res = await fetch('/api/v1/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { setProfile(null); return; }
      const { profile: p } = await res.json();
      setProfile(p || null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (session?.access_token) setAuthToken(session.access_token);
      fetchProfile(session?.access_token).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (session?.access_token) {
        setAuthToken(session.access_token);
        fetchProfile(session.access_token);
      } else {
        clearAuthToken();
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuthToken();
    setUser(null);
    setProfile(null);
    router.push('/login');
    router.refresh();
  };

  const isAdmin = profile?.role === 'admin';
  const isActive = profile?.status === 'active';

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || user?.email || ''
    : user?.email || '';

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AU';

  const avatarUrl = profile?.avatar_url || null;

  return { user, profile, loading, signOut, isAdmin, isActive, displayName, initials, avatarUrl };
}
