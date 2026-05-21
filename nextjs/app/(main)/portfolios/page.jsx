'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sk } from '@/components/Skeleton';
import { listPortfolios, createPortfolio, deletePortfolio, updatePortfolio, checkSlug } from '@/lib/portfolioApi';

const TEMPLATES = [
  { id: 'minimal',     name: 'Minimal',     desc: 'Clean and distraction-free' },
  { id: 'creative',    name: 'Creative',    desc: 'Bold layouts for designers' },
  { id: 'developer',   name: 'Developer',   desc: 'Code-first with project focus' },
  { id: 'corporate',   name: 'Corporate',   desc: 'Polished professional look' },
  { id: 'freelancer',  name: 'Freelancer',  desc: 'Services and client-friendly' },
];

const STATUS_STYLES = {
  draft:     'bg-ds-bg text-ds-textMuted border border-ds-border',
  published: 'bg-ds-successLight text-ds-success',
  archived:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function CreatePortfolioDialog({ onClose, onCreated }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState('minimal');
  const [slugStatus, setSlugStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const slugTimer = useRef(null);
  const slugManuallyEdited = useRef(false);

  useEffect(() => {
    if (!slugManuallyEdited.current) {
      setSlug(toSlug(name));
    }
  }, [name]);

  const validateSlugFormat = (s) => /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s) && s.length >= 3;

  const checkSlugAvailability = (s) => {
    clearTimeout(slugTimer.current);
    if (!validateSlugFormat(s)) {
      setSlugStatus('invalid');
      return;
    }
    setSlugStatus('checking');
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await checkSlug(s);
        setSlugStatus(res.available ? 'available' : 'taken');
      } catch {
        setSlugStatus(null);
      }
    }, 500);
  };

  const handleSlugChange = (e) => {
    slugManuallyEdited.current = true;
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
    checkSlugAvailability(val);
  };

  const handleSlugBlur = () => {
    if (slug) checkSlugAvailability(slug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!validateSlugFormat(slug)) { setError('Slug must be at least 3 chars, lowercase letters, numbers, hyphens.'); return; }
    if (slugStatus === 'taken') { setError('That slug is already taken.'); return; }
    if (slugStatus === 'checking') { setError('Please wait for slug check.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await createPortfolio({ name: name.trim(), slug, template });
      if (res.portfolio?.id) {
        onCreated();
        router.push(`/portfolios/${res.portfolio.id}/edit`);
      } else {
        setError(res.error || 'Failed to create portfolio.');
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-ds-border">
          <h2 className="font-heading font-bold text-ds-text text-lg">New Portfolio</h2>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-ds-text">Portfolio Name <span className="text-ds-danger">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Portfolio"
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-sm text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ds-text">Slug <span className="text-ds-danger">*</span></label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ds-textMuted whitespace-nowrap">proflect.com/p/</span>
              <input
                value={slug}
                onChange={handleSlugChange}
                onBlur={handleSlugBlur}
                placeholder="my-portfolio"
                className="flex-1 bg-ds-bg border border-ds-border rounded px-3 py-2 text-sm text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {slugStatus === 'checking' && <span className="text-xs text-ds-textMuted">Checking…</span>}
              {slugStatus === 'available' && <span className="text-xs text-ds-success font-medium">Available</span>}
              {slugStatus === 'taken' && <span className="text-xs text-ds-danger font-medium">Taken</span>}
              {slugStatus === 'invalid' && <span className="text-xs text-ds-danger font-medium">Invalid</span>}
            </div>
            <p className="text-xs text-ds-textMuted">Min 3 chars, lowercase letters, numbers, hyphens.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ds-text">Template</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`text-left px-3 py-3 rounded border transition-all ${template === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-ds-border bg-ds-bg hover:border-primary/40'}`}
                >
                  <div className="text-sm font-medium text-ds-text">{t.name}</div>
                  <div className="text-xs text-ds-textMuted mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-ds-dangerLight text-ds-danger text-sm rounded px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-ds-textMuted border border-ds-border rounded hover:bg-ds-bg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PortfolioCardMenu({ portfolio, onRename, onArchive, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-ds-card border border-ds-border rounded-lg shadow-lg z-20 py-1">
          <button onClick={() => { setOpen(false); onRename(); }}
            className="w-full text-left px-4 py-2 text-sm text-ds-text hover:bg-ds-bg transition-colors">
            Rename
          </button>
          <button onClick={() => { setOpen(false); onArchive(); }}
            className="w-full text-left px-4 py-2 text-sm text-ds-text hover:bg-ds-bg transition-colors">
            {portfolio.status === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
          <div className="border-t border-ds-border my-1" />
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2 text-sm text-ds-danger hover:bg-ds-dangerLight transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function RenameDialog({ portfolio, onClose, onSaved }) {
  const [name, setName] = useState(portfolio.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updatePortfolio(portfolio.id, { name: name.trim() });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-heading font-bold text-ds-text">Rename Portfolio</h2>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
          className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ds-textMuted border border-ds-border rounded hover:bg-ds-bg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ portfolio, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deletePortfolio(portfolio.id);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-heading font-bold text-ds-text">Delete Portfolio?</h2>
        <p className="text-sm text-ds-textMuted">
          <span className="font-medium text-ds-text">{portfolio.name}</span> and all its sections and projects will be permanently removed.
        </p>
        <div className="bg-ds-dangerLight rounded px-3 py-2">
          <p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ds-textMuted border border-ds-border rounded hover:bg-ds-bg transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="bg-ds-danger text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PortfolioCard({ portfolio, onRefresh }) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleArchive = async () => {
    const newStatus = portfolio.status === 'archived' ? 'draft' : 'archived';
    await updatePortfolio(portfolio.id, { status: newStatus });
    onRefresh();
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <>
      <div className={`card card-interactive flex flex-col overflow-hidden ${portfolio.status === 'published' ? 'card-featured' : ''}`}>
        {/* Gradient header */}
        <div className="h-20 bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-primary-dark)] relative flex-shrink-0">
          <div className="absolute bottom-2 right-2">
            <PortfolioCardMenu
              portfolio={portfolio}
              onRename={() => setRenaming(true)}
              onArchive={handleArchive}
              onDelete={() => setDeleting(true)}
            />
          </div>
          <span className={`absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${portfolio.status === 'published' ? 'bg-[var(--c-success-bg)] text-[#066043]' : portfolio.status === 'archived' ? 'bg-amber-100 text-amber-700' : 'bg-white/20 text-white'}`}>
            {portfolio.status || 'draft'}
          </span>
        </div>

        <div className="p-4 flex-1">
          <div className="flex-1 min-w-0 mb-2">
            <h3 className="font-semibold text-[var(--c-text)] truncate">{portfolio.name}</h3>
            <p className="text-xs text-[var(--c-text-2)] mt-0.5">/{portfolio.slug}</p>
          </div>

          <p className="text-xs text-[var(--c-text-3)] capitalize mb-3">{portfolio.template || 'minimal'} template</p>

          <div className="flex items-center gap-4 text-xs text-[var(--c-text-2)]">
            <span>{portfolio.section_count ?? 0} sections</span>
            <span>{portfolio.project_count ?? 0} projects</span>
            {portfolio.status === 'published' && (
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {portfolio.view_count ?? 0} views
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--c-text-3)] mt-2">Updated {fmtDate(portfolio.updated_at)}</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-ds-border">
          <Link
            href={`/portfolios/${portfolio.id}/edit`}
            className="flex-1 text-center btn-primary rounded px-3 py-1.5 text-sm"
          >
            Edit
          </Link>
          {portfolio.status === 'published' && (
            <a
              href={`/p/${portfolio.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center border border-ds-border text-ds-text rounded px-3 py-1.5 text-sm font-medium hover:bg-ds-bg transition-colors"
            >
              View
            </a>
          )}
        </div>
      </div>

      {renaming && (
        <RenameDialog portfolio={portfolio} onClose={() => setRenaming(false)} onSaved={onRefresh} />
      )}
      {deleting && (
        <DeleteConfirmDialog portfolio={portfolio} onClose={() => setDeleting(false)} onDeleted={onRefresh} />
      )}
    </>
  );
}

export default function PortfoliosPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPortfolios();
      setPortfolios(res.portfolios || []);
    } catch {
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-ds-text">My Portfolios</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Portfolio
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg p-4 space-y-3">
              <Sk className="h-5 w-40" />
              <Sk className="h-3 w-24" />
              <div className="flex gap-2">
                <Sk className="h-5 w-16" />
                <Sk className="h-5 w-20" />
              </div>
              <Sk className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-ds-bg border border-ds-border flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-textMuted">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div>
            <p className="font-heading font-semibold text-ds-text">No portfolios yet</p>
            <p className="text-sm text-ds-textMuted mt-1">Showcase your work by creating your first portfolio.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create your first portfolio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map(p => (
            <PortfolioCard key={p.id} portfolio={p} onRefresh={load} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePortfolioDialog onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  );
}
