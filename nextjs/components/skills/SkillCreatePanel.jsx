'use client';
import { useState } from 'react';

const CATEGORY_HINTS = {
  'Web & Frontend':        ['react', 'vue', 'angular', 'css', 'html', 'nextjs', 'svelte', 'tailwind', 'webpack'],
  'Backend & APIs':        ['node', 'express', 'django', 'fastapi', 'rails', 'spring', 'laravel', 'graphql'],
  'Programming Languages': ['python', 'javascript', 'typescript', 'java', 'golang', 'rust', 'swift', 'kotlin', 'c++', 'php'],
  'DevOps & Cloud':        ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ci/cd', 'jenkins', 'ansible'],
  'Databases':             ['sql', 'postgres', 'mysql', 'mongodb', 'redis', 'supabase', 'firebase', 'elasticsearch'],
  'Data & AI':             ['machine learning', 'ml', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'nlp', 'openai', 'llm'],
  'Mobile':                ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin', 'expo'],
  'Testing & QA':          ['jest', 'cypress', 'pytest', 'selenium', 'testing', 'playwright', 'vitest'],
};

export function suggestCategory(skillName) {
  if (!skillName) return '';
  const lower = skillName.toLowerCase();
  for (const [category, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some(h => lower.includes(h))) return category;
  }
  return '';
}

const ALL_CATEGORIES = Object.keys(CATEGORY_HINTS);

/**
 * Inline panel shown below the SkillLookupInput when user clicks "Create [name]".
 * Props:
 *   initialName   — pre-filled from what user typed
 *   categories    — array of { id, name, slug } from API (optional, falls back to hints)
 *   onConfirm(skill) — called with the created/merged skill object
 *   onCancel()
 */
export default function SkillCreatePanel({ initialName, categories = [], onConfirm, onCancel }) {
  const [name, setName]         = useState(initialName || '');
  const [category, setCategory] = useState(() => suggestCategory(initialName || ''));
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const catOptions = categories.length
    ? categories.map(c => ({ value: c.slug ?? c.id ?? c, label: c.name ?? c }))
    : ALL_CATEGORIES.map(c => ({ value: c, label: c }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const r = await fetch('/api/v1/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category: category || null }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to create skill');
      onConfirm(d.skill, d.merged, d.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-[var(--c-primary)]/30 bg-[var(--c-primary)]/[0.04] dark:bg-[var(--c-primary)]/[0.08] p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--c-primary)] uppercase tracking-wide">Creating new skill</p>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--c-text)] mb-1">Name</label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setCategory(suggestCategory(e.target.value)); }}
            placeholder="e.g. React Native"
            autoFocus
            className="w-full px-3 py-1.5 text-sm border border-[var(--c-border)] rounded-lg bg-white dark:bg-[#0F1A2E] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--c-text)] mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-[var(--c-border)] rounded-lg bg-white dark:bg-[#0F1A2E] text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]"
          >
            <option value="">— Other —</option>
            {catOptions.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--c-border)] text-[var(--c-text-muted)] hover:bg-[var(--ds-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--c-primary)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Adding…' : 'Add skill →'}
          </button>
        </div>
      </form>
    </div>
  );
}
