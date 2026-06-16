'use client';
import { useState, useEffect, useCallback } from 'react';

function useDebounce(value, ms = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debouncedValue;
}

function trackAnalytics(skillId, eventType, context) {
  if (!skillId) return;
  fetch('/api/v1/skills/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skillId, eventType, context }),
  }).catch(() => {});
}

function TrendingBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 px-1.5 py-0.5 rounded-full ml-1">
      <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2L3 14h9l-1.5 8L21 10h-9L13.5 2z"/></svg>
      Hot
    </span>
  );
}

function SelectedChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full text-[13px] font-medium bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.2)] text-[#185FA5] dark:text-[#5B9FD4] border border-[rgba(24,95,165,0.25)] dark:border-[rgba(91,159,212,0.3)]">
      {label}
      <button
        onClick={onRemove}
        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#185FA5] dark:hover:bg-[#5B9FD4] hover:text-white transition-colors text-[#185FA5] dark:text-[#5B9FD4]"
        aria-label={`Remove ${label}`}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </span>
  );
}

function SkillChip({ skill, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center h-8 px-3.5 rounded-full text-[13px] transition-all border ${
        selected
          ? 'bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.2)] border-[#185FA5] dark:border-[#5B9FD4] text-[#185FA5] dark:text-[#5B9FD4]'
          : 'bg-[#F4F8FC] dark:bg-white/5 border-[#D1DCE8] dark:border-white/10 text-[#2C2C2A] dark:text-[#E8EFF7] hover:border-[#185FA5]/40 dark:hover:border-white/20'
      }`}
    >
      {selected && (
        <svg className="mr-1.5 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      {skill.name}
      {skill.is_trending && !selected && <TrendingBadge />}
    </button>
  );
}

export default function SkillSelector({
  value = [],
  onChange,
  maxSkills = 8,
  context = 'course_creation',
  placeholder = 'Search skills e.g. Python, Docker, React…',
}) {
  const [searchText, setSearchText]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularByCategory, setPopularByCategory] = useState({});
  const [popularFlat, setPopularFlat]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searching, setSearching]         = useState(false);
  const [hasExactMatch, setHasExactMatch] = useState(false);
  const [skillMap, setSkillMap]           = useState({});

  const debouncedQuery = useDebounce(searchText, 300);

  useEffect(() => {
    fetch('/api/v1/skills/popular?limit=64')
      .then(r => r.json())
      .then(data => {
        setPopularFlat(data.skills || []);
        setPopularByCategory(data.byCategory || {});
        const map = {};
        (data.skills || []).forEach(s => { map[s.name] = s; });
        setSkillMap(prev => ({ ...prev, ...map }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSearchResults([]); setHasExactMatch(false); return; }
    setSearching(true);
    fetch(`/api/v1/skills/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`)
      .then(r => r.json())
      .then(data => {
        setSearchResults(data.skills || []);
        setHasExactMatch(!!data.hasExactMatch);
        const map = {};
        (data.skills || []).forEach(s => { map[s.name] = s; });
        setSkillMap(prev => ({ ...prev, ...map }));
        if (data.skills?.[0]?.id) trackAnalytics(data.skills[0].id, 'search', context);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedQuery, context]);

  const toggleSkill = useCallback((skillName) => {
    const skill = skillMap[skillName];
    if (value.includes(skillName)) {
      onChange(value.filter(s => s !== skillName));
      if (skill?.id) trackAnalytics(skill.id, 'deselect', context);
    } else {
      if (value.length >= maxSkills) return;
      onChange([...value, skillName]);
      if (skill?.id) trackAnalytics(skill.id, 'select', context);
    }
  }, [value, onChange, maxSkills, skillMap, context]);

  const addCustomSkill = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= maxSkills) return;
    onChange([...value, trimmed]);
    setSearchText('');
  }, [value, onChange, maxSkills]);

  const displayResults = debouncedQuery.trim() ? searchResults : null;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
          {searching
            ? <div className="w-4 h-4 rounded-full border-2 border-[#D1DCE8] dark:border-white/10 border-t-[#185FA5] animate-spin" />
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          }
        </div>
        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && searchText.trim() && !hasExactMatch) addCustomSkill(searchText);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-[#D1DCE8] dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#0D1830] text-[#2C2C2A] dark:text-[#E8EFF7] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-[#185FA5] transition-all"
        />
      </div>

      {/* Selected chips */}
      {value.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#8BA3C1]">
              Selected ({value.length}/{maxSkills})
            </span>
            {value.length >= 2 && (
              <button onClick={() => onChange([])} className="text-xs text-[#D93025] hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {value.map(name => (
              <SelectedChip key={name} label={name} onRemove={() => toggleSkill(name)} />
            ))}
          </div>
        </div>
      )}

      {/* Skill suggestions */}
      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 bg-[#F4F8FC] dark:bg-white/10 rounded animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className="h-8 w-20 bg-[#F4F8FC] dark:bg-white/10 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : displayResults ? (
          <div>
            <div className="flex flex-wrap gap-2">
              {displayResults.map(skill => (
                <SkillChip key={skill.id} skill={skill} selected={value.includes(skill.name)} onClick={() => toggleSkill(skill.name)} />
              ))}
              {!hasExactMatch && searchText.trim() && (
                <button
                  onClick={() => addCustomSkill(searchText)}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[13px] transition-all bg-amber-50 dark:bg-amber-900/20 border border-dashed border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400"
                >
                  + Add &ldquo;{searchText.trim()}&rdquo; as custom skill
                </button>
              )}
              {displayResults.length === 0 && !searchText.trim() && (
                <p className="text-sm text-[#9CA3AF]">No skills found.</p>
              )}
            </div>
          </div>
        ) : (
          Object.entries(popularByCategory).length > 0
            ? Object.entries(popularByCategory).map(([category, skills]) => (
                <div key={category}>
                  <p className="text-[11px] uppercase tracking-widest text-[#9CA3AF] mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <SkillChip key={skill.id || skill.name} skill={skill} selected={value.includes(skill.name)} onClick={() => toggleSkill(skill.name)} />
                    ))}
                  </div>
                </div>
              ))
            : popularFlat.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {popularFlat.map(skill => (
                    <SkillChip key={skill.id || skill.name} skill={skill} selected={value.includes(skill.name)} onClick={() => toggleSkill(skill.name)} />
                  ))}
                </div>
              )
        )}
      </div>
    </div>
  );
}
