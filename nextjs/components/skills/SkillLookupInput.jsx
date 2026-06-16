'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import SkillCreatePanel from './SkillCreatePanel';

function PlusCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>
    </svg>
  );
}

/**
 * SkillLookupInput — searches the skills library with alias matching and on-the-fly creation.
 *
 * Props:
 *   selectedSkills  — array of { id, name } objects
 *   onChange(skills) — called with updated array of { id, name }
 *   categories      — array of category objects from API (for create panel)
 *   placeholder     — input placeholder text
 *   maxSkills       — max number of skills (default 10)
 */
export default function SkillLookupInput({
  selectedSkills = [],
  onChange,
  categories = [],
  placeholder = 'Search or add a skill…',
  maxSkills = 10,
}) {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [creating, setCreating]       = useState(false);
  const [toast, setToast]             = useState(null);

  const inputRef    = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const excluded = selectedSkills.map(s => s.id);
      const r = await fetch(`/api/v1/skills/search?q=${encodeURIComponent(q)}&limit=10`);
      const d = await r.json();
      const filtered = (d.skills || []).filter(s => !excluded.includes(s.id));
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSkills]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setCreating(false);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleFocus = () => {
    setOpen(true);
    if (!query) search('');
  };

  const selectSkill = (skill) => {
    if (selectedSkills.length >= maxSkills) return;
    if (selectedSkills.find(s => s.id === skill.id)) return;

    const entry = { id: skill.id, name: skill.name };
    onChange([...selectedSkills, entry]);

    if (skill.matchedAlias) {
      showToast('info', `Mapped to "${skill.name}" — "${skill.matchedAlias}" is an alias`);
    }

    setQuery('');
    setOpen(false);
    setCreating(false);
    inputRef.current?.focus();
  };

  const removeSkill = (id) => {
    onChange(selectedSkills.filter(s => s.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setCreating(false); }
    if (e.key === 'Backspace' && !query && selectedSkills.length) {
      onChange(selectedSkills.slice(0, -1));
    }
  };

  const initiateCreate = () => {
    setOpen(false);
    setCreating(true);
  };

  const handleCreated = (skill, merged, message) => {
    if (selectedSkills.length >= maxSkills) return;
    if (!selectedSkills.find(s => s.id === skill.id)) {
      onChange([...selectedSkills, { id: skill.id, name: skill.name }]);
    }
    setCreating(false);
    setQuery('');
    if (message) {
      showToast('info', message);
    } else {
      showToast('success', `Added "${skill.name}" to the skill library`);
    }
    inputRef.current?.focus();
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const hasExactMatch = results.some(s => s.name.toLowerCase() === query.toLowerCase());
  const canCreate = query.trim().length >= 2 && !hasExactMatch && !loading;
  const atMax = selectedSkills.length >= maxSkills;

  return (
    <div className="relative">
      {/* Selected skill chips + search input */}
      <div
        className="min-h-[42px] w-full px-2 py-1.5 border border-ds-inputBorder rounded bg-ds-bg flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-colors"
        onClick={() => !atMax && inputRef.current?.focus()}
      >
        {selectedSkills.map(s => (
          <span key={s.id} className="chip-primary flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium">
            {s.name}
            <button
              type="button"
              onClick={() => removeSkill(s.id)}
              className="text-primary/60 hover:text-primary leading-none text-sm"
            >×</button>
          </span>
        ))}
        {!atMax && (
          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={selectedSkills.length ? '' : placeholder}
            className="flex-1 min-w-24 text-sm bg-transparent outline-none text-ds-text placeholder-ds-textMuted py-0.5"
          />
        )}
      </div>

      {selectedSkills.length > 0 && (
        <p className="text-xs text-ds-textMuted mt-1">
          {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
          {atMax && ' · maximum reached'}
        </p>
      )}

      {/* Dropdown */}
      {open && !creating && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-2xl shadow-xl overflow-hidden"
        >
          {!query && results.length > 0 && (
            <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Popular skills
            </div>
          )}

          {loading && (
            <div className="px-3 py-3 text-xs text-[var(--c-text-muted)]">Searching…</div>
          )}

          {!loading && results.map(skill => (
            <button
              key={skill.id}
              type="button"
              onMouseDown={() => selectSkill(skill)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors text-left"
            >
              <span className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] flex-1">
                {skill.name}
              </span>
              {skill.matchedAlias && (
                <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                  <MergeIcon /> also known as "{skill.matchedAlias}"
                </span>
              )}
              {skill.category && (
                <span className="text-[10px] text-[#9CA3AF] bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.06)] rounded-full px-2 py-0.5 flex-shrink-0">
                  {skill.category}
                </span>
              )}
            </button>
          ))}

          {!loading && !results.length && query && (
            <div className="px-3 py-2.5 text-xs text-[var(--c-text-muted)]">No results for "{query}"</div>
          )}

          {canCreate && (
            <button
              type="button"
              onMouseDown={initiateCreate}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-[#185FA5] dark:text-[#5B9FD4] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(255,255,255,0.05)] border-t border-[#D1DCE8] dark:border-white/8 text-sm font-medium transition-colors text-left"
            >
              <PlusCircleIcon />
              Create "{query}"
            </button>
          )}
        </div>
      )}

      {/* Inline create panel */}
      {creating && (
        <SkillCreatePanel
          initialName={query}
          categories={categories}
          onConfirm={handleCreated}
          onCancel={() => { setCreating(false); setQuery(''); inputRef.current?.focus(); }}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400'
            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-400'
        }`}>
          {toast.type === 'info' && <MergeIcon />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
