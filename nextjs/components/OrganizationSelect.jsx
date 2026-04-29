'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrganizations, createOrganization } from '@/lib/api';

export default function OrganizationSelect({ value, onChange, inputCls = '' }) {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef(null);

  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  });

  // Only sync display name from a confirmed selection (non-null value)
  useEffect(() => {
    if (!value) return;
    const match = orgs.find(o => o.id === value);
    if (match) setInputValue(match.name);
  }, [value, orgs]);

  const filtered = inputValue.trim()
    ? orgs.filter(o => o.name.toLowerCase().includes(inputValue.toLowerCase()))
    : orgs;

  const exactMatch = orgs.find(o => o.name.toLowerCase() === inputValue.trim().toLowerCase());

  // Close dropdown on outside click (outside the whole container)
  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClear = () => {
    onChange(null, '');
    setInputValue('');
    setOpen(false);
  };

  const select = (org) => {
    onChange(org.id, org.name);
    setInputValue(org.name);
    setOpen(false);
  };

  const handleKeyDown = async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (exactMatch) { select(exactMatch); return; }
    setCreating(true);
    try {
      const org = await createOrganization(trimmed);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      select(org);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateClick = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || exactMatch) return;
    setCreating(true);
    try {
      const org = await createOrganization(trimmed);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      select(org);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          placeholder="Search or type to create…"
          className={inputCls}
          onChange={e => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // If user typed but didn't select, reset to the current confirmed selection
            setTimeout(() => {
              const match = orgs.find(o => o.id === value);
              setInputValue(match ? match.name : '');
              setOpen(false);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          disabled={creating}
        />
        {value && (
          <button type="button" onMouseDown={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ds-textMuted hover:text-ds-text text-sm leading-none">
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-ds-card border border-ds-border rounded shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(org => (
            <button key={org.id} type="button" onMouseDown={() => select(org)}
              className="w-full text-left px-3 py-2 text-sm text-ds-text hover:bg-ds-bg transition-colors">
              {org.name}
            </button>
          ))}

          {inputValue.trim() && !exactMatch && (
            <button type="button" onMouseDown={handleCreateClick} disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary-light transition-colors border-t border-ds-border disabled:opacity-50">
              {creating ? 'Creating…' : `Create "${inputValue.trim()}"`}
            </button>
          )}

          {filtered.length === 0 && !inputValue.trim() && (
            <p className="px-3 py-2 text-sm text-ds-textMuted">No organizations yet. Type to create one.</p>
          )}
        </div>
      )}
    </div>
  );
}
