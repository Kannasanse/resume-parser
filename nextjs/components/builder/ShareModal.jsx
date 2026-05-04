'use client';
import { useState, useEffect, useCallback } from 'react';

export default function ShareModal({ resumeId, onClose }) {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchShare = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/builder/${resumeId}/share`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setShareData(json.data);
    } catch (err) {
      setError(err.message || 'Could not load share status.');
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => { fetchShare(); }, [fetchShare]);

  const enable = async () => {
    setToggling(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/builder/${resumeId}/share`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setShareData(json.data);
    } catch (err) {
      setError("We couldn't create your public link. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  const disable = async () => {
    setToggling(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/builder/${resumeId}/share`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setShareData(json.data);
    } catch (err) {
      setError("We couldn't disable your link. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  const copyLink = async () => {
    if (!shareData?.url) return;
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — URL is still visible in the input
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-ds-text">Share Resume</h3>
            <p className="text-xs text-ds-textMuted mt-0.5">Generate a public link anyone can view without logging in.</p>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-ds-textMuted hover:text-ds-text transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-4 text-center text-ds-textMuted text-sm">Loading…</div>
        ) : (
          <>
            {/* Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-b border-ds-border">
              <div>
                <p className="text-sm font-medium text-ds-text">Public link</p>
                <p className={`text-xs mt-0.5 ${shareData?.enabled ? 'text-ds-success' : 'text-ds-textMuted'}`}>
                  {shareData?.enabled ? 'Active — anyone with the link can view' : 'Disabled — only you can see this resume'}
                </p>
              </div>
              <button
                onClick={shareData?.enabled ? disable : enable}
                disabled={toggling}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${shareData?.enabled ? 'bg-ds-success' : 'bg-ds-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${shareData?.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* URL field + copy */}
            {shareData?.enabled && shareData?.url && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareData.url}
                    onClick={e => e.target.select()}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-ds-inputBorder rounded bg-ds-bg text-ds-text font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={copyLink}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${copied ? 'bg-ds-success text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <p className="text-xs text-ds-textMuted">
                  Changes you save will appear on this page within 60 seconds.
                </p>
              </div>
            )}

            {!shareData?.enabled && !loading && (
              <div className="text-xs text-ds-textMuted bg-ds-bg rounded p-3">
                Enable the public link above to share your resume with recruiters. No sign-in required for viewers.
              </div>
            )}

            {error && (
              <p className="text-xs text-ds-danger bg-ds-dangerLight px-3 py-2 rounded">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
