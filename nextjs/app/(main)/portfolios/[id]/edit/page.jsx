'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sk } from '@/components/Skeleton';
import {
  getPortfolio, updatePortfolio, deletePortfolio,
  createSection, updateSection, deleteSection, reorderSections,
  checkSlug,
} from '@/lib/portfolioApi';

const TEMPLATES = [
  { id: 'minimal',    name: 'Minimal',    desc: 'Clean and distraction-free' },
  { id: 'creative',   name: 'Creative',   desc: 'Bold layouts for designers' },
  { id: 'developer',  name: 'Developer',  desc: 'Code-first with project focus' },
  { id: 'corporate',  name: 'Corporate',  desc: 'Polished professional look' },
  { id: 'freelancer', name: 'Freelancer', desc: 'Services and client-friendly' },
];

const SWATCHES = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

const FONT_PAIRS = [
  { id: 'inter',       label: 'Inter + Inter',           sub: 'Modern sans-serif' },
  { id: 'playfair',    label: 'Playfair + Inter',         sub: 'Editorial' },
  { id: 'grotesk',     label: 'Space Grotesk + Inter',    sub: 'Technical' },
  { id: 'merriweather',label: 'Merriweather + Georgia',   sub: 'Classic' },
];

const SECTION_TYPES = [
  { type: 'about',          label: 'About', icon: '👤' },
  { type: 'experience',     label: 'Experience', icon: '💼' },
  { type: 'education',      label: 'Education', icon: '🎓' },
  { type: 'skills',         label: 'Skills', icon: '⚡' },
  { type: 'projects',       label: 'Projects', icon: '🚀' },
  { type: 'certifications', label: 'Certifications', icon: '🏅' },
  { type: 'testimonials',   label: 'Testimonials', icon: '💬' },
  { type: 'services',       label: 'Services', icon: '🛠️' },
  { type: 'contact',        label: 'Contact', icon: '📬' },
  { type: 'custom',         label: 'Custom', icon: '✏️' },
  { type: 'embed',          label: 'Embed', icon: '🔗' },
];

const STATUS_STYLES = {
  draft:     'bg-ds-bg text-ds-textMuted border border-ds-border',
  published: 'bg-ds-successLight text-ds-success',
  archived:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function AddSectionModal({ onClose, onAdd }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ds-modal w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--c-text)]">Add Section</h3>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SECTION_TYPES.map(s => (
            <button
              key={s.type}
              onClick={() => { onAdd(s.type, s.label); onClose(); }}
              className="flex items-center gap-2 px-3 py-2.5 text-left border border-ds-border rounded hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <span className="text-base">{s.icon}</span>
              <span className="text-sm text-ds-text">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionRow({ section, onToggleVisibility, onEdit, dragHandlers }) {
  const typeInfo = SECTION_TYPES.find(t => t.type === section.section_type) || { icon: '📄', label: section.section_type };
  return (
    <div
      draggable
      {...dragHandlers}
      className="flex items-center gap-3 px-3 py-2.5 ds-paper rounded group cursor-default"
    >
      <span className="text-ds-textMuted cursor-grab active:cursor-grabbing select-none text-lg leading-none">⠿</span>
      <span className="text-base">{typeInfo.icon}</span>
      <span className="flex-1 text-sm text-ds-text truncate">{section.title || typeInfo.label}</span>
      <button
        onClick={() => onToggleVisibility(section)}
        className={`text-ds-textMuted hover:text-ds-text transition-colors ${section.is_visible === false ? 'opacity-40' : ''}`}
      >
        {section.is_visible === false ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
      <button onClick={() => onEdit(section)} className="text-xs text-ds-textMuted hover:text-primary transition-colors font-medium">
        Edit
      </button>
    </div>
  );
}

function ContentTab({ portfolioId, sections, setSections }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const dragIdx = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleDragStart = (idx) => (e) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx) => (e) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const updated = [...sections];
    const [moved] = updated.splice(dragIdx.current, 1);
    updated.splice(idx, 0, moved);
    dragIdx.current = idx;
    setSections(updated);
  };

  const handleDrop = async () => {
    dragIdx.current = null;
    const orders = sections.map((s, i) => ({ id: s.id, sort_order: i }));
    await reorderSections(portfolioId, orders);
  };

  const handleToggleVisibility = async (section) => {
    const updated = { is_visible: !(section.is_visible !== false) };
    await updateSection(portfolioId, section.id, updated);
    setSections(prev => prev.map(s => s.id === section.id ? { ...s, ...updated } : s));
  };

  const handleAddSection = async (type, label) => {
    setSaving(true);
    try {
      const res = await createSection(portfolioId, {
        section_type: type,
        title: label,
        sort_order: sections.length,
        is_visible: true,
      });
      if (res.section) setSections(prev => [...prev, res.section]);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (section) => {
    setEditingSection(section);
    setEditTitle(section.title || '');
  };

  const saveEditTitle = async () => {
    if (!editingSection) return;
    await updateSection(portfolioId, editingSection.id, { title: editTitle });
    setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, title: editTitle } : s));
    setEditingSection(null);
  };

  const handleDeleteSection = async (sectionId) => {
    await deleteSection(portfolioId, sectionId);
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setEditingSection(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ds-textMuted font-medium uppercase tracking-wide">Sections</p>
        {saving && <span className="text-xs text-ds-textMuted">Saving…</span>}
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-ds-textMuted text-center py-6">No sections yet. Add one below.</p>
      )}

      <div className="space-y-1.5">
        {sections.map((section, idx) => (
          <SectionRow
            key={section.id}
            section={section}
            onToggleVisibility={handleToggleVisibility}
            onEdit={openEdit}
            dragHandlers={{
              onDragStart: handleDragStart(idx),
              onDragOver: handleDragOver(idx),
              onDrop: handleDrop,
            }}
          />
        ))}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-ds-border rounded py-2.5 text-sm text-ds-textMuted hover:text-ds-text hover:border-primary/50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Section
      </button>

      {showAddModal && <AddSectionModal onClose={() => setShowAddModal(false)} onAdd={handleAddSection} />}

      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingSection(null)} />
          <div className="relative ds-modal w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-[var(--c-text)]">Edit Section</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Title</label>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleDeleteSection(editingSection.id)}
                className="text-xs text-ds-danger hover:underline"
              >
                Delete section
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditingSection(null)}
                  className="px-3 py-1.5 text-sm font-medium text-ds-textMuted border border-ds-border rounded hover:bg-ds-bg transition-colors">
                  Cancel
                </button>
                <button onClick={saveEditTitle}
                  className="bg-primary text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DesignTab({ portfolio, onUpdate }) {
  const [template, setTemplate] = useState(portfolio.template || 'minimal');
  const [color, setColor] = useState(portfolio.settings?.primary_color || '#6366f1');
  const [font, setFont] = useState(portfolio.settings?.font_pair || 'inter');
  const saveTimer = useRef(null);

  const save = (patch) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(patch), 600);
  };

  const handleTemplate = (id) => {
    setTemplate(id);
    save({ template: id });
  };

  const handleColor = (c) => {
    setColor(c);
    save({ settings: { ...portfolio.settings, primary_color: c } });
  };

  const handleFont = (f) => {
    setFont(f);
    save({ settings: { ...portfolio.settings, font_pair: f } });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Template</p>
        <div className="space-y-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => handleTemplate(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded border transition-all ${template === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-ds-border bg-ds-bg hover:border-primary/40'}`}
            >
              <div className="text-sm font-medium text-ds-text">{t.name}</div>
              <div className="text-xs text-ds-textMuted">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Primary Color</p>
        <div className="flex flex-wrap gap-2">
          {SWATCHES.map(c => (
            <button
              key={c}
              onClick={() => handleColor(c)}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-ds-border scale-110' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Font Pairing</p>
        <div className="space-y-2">
          {FONT_PAIRS.map(f => (
            <button
              key={f.id}
              onClick={() => handleFont(f.id)}
              className={`w-full text-left px-3 py-2.5 rounded border transition-all ${font === f.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-ds-border bg-ds-bg hover:border-primary/40'}`}
            >
              <div className="text-sm font-medium text-ds-text">{f.label}</div>
              <div className="text-xs text-ds-textMuted">{f.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ portfolio, onUpdate, onDelete }) {
  const router = useRouter();
  const [name, setName] = useState(portfolio.name || '');
  const [slug, setSlug] = useState(portfolio.slug || '');
  const [slugStatus, setSlugStatus] = useState(null);
  const [status, setStatus] = useState(portfolio.status || 'draft');
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const slugTimer = useRef(null);

  const validateSlugFormat = (s) => /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s) && s.length >= 3;

  const handleSlugChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
    setSlugStatus(null);
    clearTimeout(slugTimer.current);
    if (!validateSlugFormat(val)) { setSlugStatus('invalid'); return; }
    setSlugStatus('checking');
    slugTimer.current = setTimeout(async () => {
      const res = await checkSlug(val, portfolio.id);
      setSlugStatus(res.available ? 'available' : 'taken');
    }, 500);
  };

  const handleSlugSave = async () => {
    if (slugStatus !== 'available' && slug !== portfolio.slug) return;
    await onUpdate({ slug });
  };

  const handleStatusChange = async (s) => {
    setStatus(s);
    await onUpdate({ status: s });
  };

  const handlePublish = async () => {
    setPublishing(true);
    await onUpdate({ status: 'published' });
    setStatus('published');
    setPublishing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deletePortfolio(portfolio.id);
    router.push('/portfolios');
  };

  const publishedUrl = `proflect-neo.vercel.app/portfolios/${portfolio.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${publishedUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Portfolio Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => name.trim() && onUpdate({ name: name.trim() })}
          className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Slug</label>
        <div className="flex gap-2">
          <input
            value={slug}
            onChange={handleSlugChange}
            className="flex-1 bg-ds-bg border border-ds-border rounded px-3 py-2 text-sm text-ds-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            onClick={handleSlugSave}
            disabled={slugStatus === 'taken' || slugStatus === 'invalid' || slugStatus === 'checking'}
            className="bg-primary text-white rounded px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Change
          </button>
        </div>
        {slugStatus === 'checking' && <p className="text-xs text-ds-textMuted">Checking…</p>}
        {slugStatus === 'available' && <p className="text-xs text-ds-success font-medium">Available</p>}
        {slugStatus === 'taken' && <p className="text-xs text-ds-danger font-medium">Already taken</p>}
        {slugStatus === 'invalid' && <p className="text-xs text-ds-danger font-medium">Invalid format</p>}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Status</p>
        <div className="space-y-1.5">
          {['draft', 'published', 'archived'].map(s => (
            <label key={s} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => handleStatusChange(s)}
                className="accent-primary"
              />
              <span className="text-sm text-ds-text capitalize">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {status === 'published' && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Published URL</p>
          <div className="flex items-center gap-2 bg-ds-bg border border-ds-border rounded px-3 py-2">
            <span className="text-sm text-ds-text flex-1 truncate">{publishedUrl}</span>
            <button onClick={handleCopy} className="text-xs text-primary font-medium hover:underline shrink-0">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {status !== 'published' && (
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full bg-ds-success text-white rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : 'Publish Portfolio'}
        </button>
      )}

      <div className="border-t border-ds-border pt-4 space-y-2">
        <p className="text-xs font-medium text-ds-danger uppercase tracking-wide">Danger Zone</p>
        <button
          onClick={() => onUpdate({ status: 'archived' })}
          className="w-full border border-ds-border text-ds-textMuted rounded px-4 py-2 text-sm font-medium hover:bg-ds-bg transition-colors"
        >
          Archive Portfolio
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full bg-ds-dangerLight text-ds-danger rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Delete Portfolio
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-ds-danger">This will permanently delete the portfolio and all its data.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-ds-border text-ds-textMuted rounded px-3 py-2 text-sm hover:bg-ds-bg transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-ds-danger text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortfolioEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getPortfolio(id);
        setPortfolio(res.portfolio || res);
        setSections((res.sections || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (patch) => {
    setSaveStatus('saving');
    try {
      const res = await updatePortfolio(id, patch);
      setPortfolio(prev => ({ ...prev, ...(res.portfolio || patch) }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const STATUS_STYLES_LOCAL = {
    draft:     'bg-[var(--c-neutral-bg)] text-[var(--c-text-2)] border border-[var(--c-border)]',
    published: 'bg-[var(--c-success-bg)] text-[#066043]',
    archived:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const TABS = [
    { id: 'content', label: 'Content' },
    { id: 'design',  label: 'Design' },
    { id: 'settings', label: 'Settings' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        <div className="w-full lg:w-[420px] lg:shrink-0 border-b border-ds-border lg:border-b-0 lg:border-r p-6 space-y-4">
          <Sk className="h-6 w-48" />
          <Sk className="h-4 w-32" />
          <div className="space-y-2 pt-4">
            {[1,2,3].map(i => <Sk key={i} className="h-12 w-full" />)}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Sk className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-ds-textMuted">Portfolio not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -mx-4 -my-4 sm:-my-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-ds-border bg-ds-card shrink-0">
        <Link href="/portfolios" className="text-ds-textMuted hover:text-ds-text transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="font-heading font-semibold text-ds-text truncate text-sm">{portfolio.name}</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES_LOCAL[portfolio.status] || STATUS_STYLES_LOCAL.draft}`}>
            {portfolio.status || 'draft'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {saveStatus === 'saving' && <span className="text-xs text-ds-textMuted">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-xs text-ds-success">Saved</span>}
          {portfolio.status === 'published' ? (
            <a
              href={`https://proflect-neo.vercel.app/portfolios/${portfolio.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-ds-border text-ds-text rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-ds-bg transition-colors"
            >
              Preview
            </a>
          ) : (
            <span
              title="Publish first to preview"
              className="border border-ds-border text-ds-textMuted rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium opacity-50 cursor-not-allowed select-none"
            >
              Preview
            </span>
          )}
          {portfolio.status !== 'published' && (
            <button
              onClick={() => handleUpdate({ status: 'published' })}
              className="bg-primary text-white rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="w-full lg:w-[420px] lg:shrink-0 flex flex-col border-b border-ds-border lg:border-b-0 lg:border-r overflow-hidden max-h-[50vh] lg:max-h-none">
          <div className="flex border-b border-ds-border shrink-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === t.id ? 'text-primary border-b-2 border-primary' : 'text-ds-textMuted hover:text-ds-text'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'content' && (
              <ContentTab portfolioId={id} sections={sections} setSections={setSections} />
            )}
            {activeTab === 'design' && (
              <DesignTab portfolio={portfolio} onUpdate={handleUpdate} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab portfolio={portfolio} onUpdate={handleUpdate} />
            )}
          </div>
        </div>

        {/* Right pane — preview placeholder */}
        <div className="flex-1 overflow-auto bg-[var(--c-bg)] flex items-center justify-center min-h-[300px]">
          <div className="ds-card p-10 text-center max-w-sm">
            <div className="stat-icon mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-textMuted">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <p className="font-heading font-semibold text-ds-text">Preview</p>
            <p className="text-sm text-ds-textMuted mt-1">Coming soon</p>
            <Link
              href={`/portfolios/${id}/projects`}
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              Manage Projects →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
