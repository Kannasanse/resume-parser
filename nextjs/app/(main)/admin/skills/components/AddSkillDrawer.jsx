'use client';
import { useState, useEffect } from 'react';

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:ring-offset-1 ${
        checked ? 'bg-[var(--c-primary)]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ── Slug generator ────────────────────────────────────────────────────────────

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── AddSkillDrawer ────────────────────────────────────────────────────────────

export default function AddSkillDrawer({ open, onClose, skill, categories, onSaved }) {
  const isEditing = Boolean(skill?.id);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [aliases, setAliases] = useState([]);
  const [aliasInput, setAliasInput] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isTrending, setIsTrending] = useState(false);

  // Track whether slug was manually edited
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Populate form when skill changes ───────────────────────────────────────

  useEffect(() => {
    if (open) {
      if (skill) {
        setName(skill.name || '');
        setSlug(skill.slug || '');
        setCategory(skill.category_id ?? skill.category ?? '');
        setSubcategory(skill.subcategory || '');
        setAliases(skill.aliases || []);
        setDescription(skill.description || '');
        setIconUrl(skill.icon_url || '');
        setIsActive(skill.is_active ?? true);
        setIsTrending(skill.is_trending ?? false);
        setSlugManuallyEdited(true); // existing slug — don't auto-overwrite
      } else {
        setName('');
        setSlug('');
        setCategory('');
        setSubcategory('');
        setAliases([]);
        setAliasInput('');
        setDescription('');
        setIconUrl('');
        setIsActive(true);
        setIsTrending(false);
        setSlugManuallyEdited(false);
      }
      setError('');
    }
  }, [open, skill]);

  // Auto-generate slug from name (only when not manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(toSlug(name));
    }
  }, [name, slugManuallyEdited]);

  // ── Alias tag input ────────────────────────────────────────────────────────

  const addAlias = (raw) => {
    const tag = raw.trim().replace(/,+$/, '').trim();
    if (tag && !aliases.includes(tag)) {
      setAliases(prev => [...prev, tag]);
    }
    setAliasInput('');
  };

  const handleAliasKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAlias(aliasInput);
    } else if (e.key === 'Backspace' && !aliasInput && aliases.length > 0) {
      setAliases(prev => prev.slice(0, -1));
    }
  };

  const handleAliasBlur = () => {
    if (aliasInput.trim()) addAlias(aliasInput);
  };

  const removeAlias = (tag) => {
    setAliases(prev => prev.filter(a => a !== tag));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Skill name is required.'); return; }
    setError('');
    setSaving(true);

    const body = {
      name: name.trim(),
      slug: slug.trim() || toSlug(name),
      category,
      subcategory: subcategory.trim() || null,
      aliases,
      description: description.trim() || null,
      icon_url: iconUrl.trim() || null,
      is_active: isActive,
      is_trending: isTrending,
    };

    try {
      const url = isEditing ? `/api/v1/skills/${skill.id}` : '/api/v1/admin/skills';
      const method = isEditing ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save skill.');
      onSaved(d.skill);
      onClose();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)] flex-shrink-0 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-base text-[var(--c-text)] font-heading">
            {isEditing ? 'Edit Skill' : 'Add Skill'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--c-text-muted)] hover:text-[var(--c-text)] text-xl leading-none p-1 rounded transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-text)] mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. React"
              required
              className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-text)] mb-1.5">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
              placeholder="e.g. react"
              className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)]"
            />
            <p className="text-xs text-[var(--c-text-muted)] mt-1">auto-generated from name</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-text)] mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]"
            >
              <option value="">— Select category —</option>
              {categories.map(c => (
                <option key={c.id ?? c.slug ?? c} value={c.id ?? c.slug ?? c}>
                  {c.name ?? c}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-text)] mb-1.5">
              Subcategory <span className="text-[var(--c-text-muted)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={subcategory}
              onChange={e => setSubcategory(e.target.value)}
              placeholder="e.g. Frameworks"
              className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)]"
            />
          </div>

          {/* Aliases */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-text)] mb-1.5">Aliases</label>
            <div
              className="flex flex-wrap gap-1.5 p-2 border border-[var(--c-border)] rounded-lg bg-white min-h-[2.5rem] cursor-text focus-within:ring-2 focus-within:ring-[var(--c-primary)]"
              onClick={() => document.getElementById('alias-input')?.focus()}
            >
              {aliases.map(tag => (
                <span
                  key={tag}
                  className="chip-primary flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeAlias(tag)}
                    className="hover:opacity-70 leading-none ml-0.5"
                    aria-label={`Remove alias ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="alias-input"
                type="text"
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value)}
                onKeyDown={handleAliasKeyDown}
                onBlur={handleAliasBlur}
                placeholder={aliases.length === 0 ? 'Type and press Enter or comma…' : ''}
                className="flex-1 min-w-[8rem] text-sm outline-none bg-transparent text-[var(--c-text)] placeholder:text-[var(--c-text-muted)]"
              />
            </div>
            <p className="text-xs text-[var(--c-text-muted)] mt-1">Press Enter or comma to add</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-text)] mb-1.5">
              Description <span className="text-[var(--c-text-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this skill…"
              className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)] resize-none"
            />
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-sm font-medium text-[var(--c-text)] mb-1.5">
              Icon URL <span className="text-[var(--c-text-muted)] font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={iconUrl}
              onChange={e => setIconUrl(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)]"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="toggle-active" className="text-sm font-medium text-[var(--c-text)]">Active</label>
                <p className="text-xs text-[var(--c-text-muted)] mt-0.5">Visible and selectable by users</p>
              </div>
              <Toggle id="toggle-active" checked={isActive} onChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="toggle-trending" className="text-sm font-medium text-[var(--c-text)]">Trending</label>
                <p className="text-xs text-[var(--c-text-muted)] mt-0.5">Highlight as a trending skill</p>
              </div>
              <Toggle id="toggle-trending" checked={isTrending} onChange={setIsTrending} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--c-border)] flex-shrink-0 bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--c-text-muted)] border border-[var(--c-border)] rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[var(--c-primary)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Skill'}
          </button>
        </div>
      </div>
    </div>
  );
}
