'use client';
import { useEffect, useState } from 'react';
import { TemplateThumbnail } from '@/components/builder/ResumePreview.jsx';
import { PageHeading } from '@/components/admin/PageHeading';

function StarIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(null); // template_id being saved

  useEffect(() => {
    fetch('/api/v1/admin/templates')
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleFeatured(templateId, current) {
    setSaving(templateId);
    const next = !current;
    try {
      const res = await fetch('/api/v1/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, featured: next }),
      });
      if (!res.ok) throw new Error();
      setTemplates(prev =>
        prev.map(t => t.id === templateId ? { ...t, featured: next } : t)
      );
    } catch {
      // silently revert on error — could add a toast here
    } finally {
      setSaving(null);
    }
  }

  const featuredCount = templates.filter(t => t.featured).length;

  return (
    <div className="px-6 lg:px-8 pt-8 pb-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeading
          title="Templates"
          subtitle="Mark templates as Featured to highlight them for users in the template gallery."
        />
        {!loading && (
          <span className="text-sm text-ds-textMuted flex-shrink-0 pt-1">
            {featuredCount} of {templates.length} featured
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg p-4 animate-pulse">
              <div className="aspect-[3/4] bg-ds-border/60 rounded mb-3" />
              <div className="h-4 bg-ds-border/60 rounded w-2/3 mb-2" />
              <div className="h-3 bg-ds-border/40 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div
              key={t.id}
              className={`bg-ds-card border rounded-lg overflow-hidden transition-colors
                ${t.featured ? 'border-yellow-400/70' : 'border-ds-border'}`}
            >
              {/* Thumbnail */}
              <div className="bg-gray-100 px-6 pt-4 pb-2">
                <TemplateThumbnail
                  templateId={t.id}
                  active={false}
                  label={t.name}
                  style={t.style}
                  plan={t.plan}
                />
              </div>

              {/* Info + toggle */}
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-ds-text truncate">{t.name}</p>
                  <p className="text-xs text-ds-textMuted mt-0.5">{t.style} · {t.plan}</p>
                  <p className="text-xs text-ds-textMuted mt-1 line-clamp-2">{t.description}</p>
                </div>

                <button
                  onClick={() => toggleFeatured(t.id, t.featured)}
                  disabled={saving === t.id}
                  title={t.featured ? 'Remove from Featured' : 'Mark as Featured'}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-btn border transition-colors disabled:opacity-50
                    ${t.featured
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100'
                      : 'bg-ds-bg border-ds-border text-ds-textMuted hover:text-ds-text hover:border-ds-borderStrong'
                    }`}
                >
                  <StarIcon filled={t.featured} />
                  {saving === t.id ? '…' : t.featured ? 'Featured' : 'Feature'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
