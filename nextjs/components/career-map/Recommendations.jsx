'use client';
import { useState } from 'react';

function salaryRange(min, max) {
  if (!min && !max) return null;
  const fmt = n => `$${Math.round(n / 1000)}k`;
  return `${fmt(min)} – ${fmt(max)}`;
}

const OUTLOOK_COLOR = {
  High: 'bg-[var(--c-success-bg)] text-[var(--c-success)]',
  Medium: 'bg-yellow-50 text-yellow-700',
  Low: 'bg-red-50 text-red-600',
};

export default function Recommendations({ roles, loading, onSelect }) {
  const [selecting, setSelecting] = useState(null);

  async function handleSelect(roleId) {
    setSelecting(roleId);
    await onSelect(roleId);
    setSelecting(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--c-text)]">Finding the best roles for you…</h2>
          <p className="text-sm text-[var(--c-text-muted)] mt-1">Our AI is analysing your profile and preferences.</p>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="ds-card p-5 space-y-3">
            <div className="ds-skel h-4 w-48 rounded" />
            <div className="ds-skel h-3 w-32 rounded" />
            <div className="ds-skel h-3 w-full rounded" />
            <div className="ds-skel h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!roles.length) {
    return (
      <div className="ds-card p-8 text-center space-y-3">
        <p className="text-sm font-medium text-[var(--c-text)]">No recommendations found</p>
        <p className="text-xs text-[var(--c-text-muted)]">This may be because the role database hasn't been seeded yet. Please run the seed SQL in Supabase and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-gradient-primary font-extrabold tracking-[-0.03em] text-lg">Recommended roles for you</h2>
        <p className="text-sm text-[var(--c-text-muted)] mt-1">Select a role to build your career path map.</p>
      </div>

      <div className="stagger-children space-y-4">
      {roles.map((role, i) => (
        <div key={role.id} className={`card card-interactive p-5 space-y-3 ${i === 0 ? 'ring-2 ring-[#185FA5] ring-offset-2' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="stat-icon flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 8, fontSize: 14, fontWeight: 700 }}>
                #{i + 1}
              </div>
              <div>
                <p className="font-semibold text-[var(--c-text)]">{role.title}</p>
                <p className="text-xs text-[var(--c-text-muted)]">{role.category} · {role.seniority}</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${OUTLOOK_COLOR[role.growth_outlook] || OUTLOOK_COLOR.Medium}`}>
              {role.growth_outlook} growth
            </span>
          </div>

          <p className="text-sm text-[var(--c-text-muted)]">{role.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {(role.core_skills || []).slice(0, 5).map(s => (
              <span key={s} className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-[var(--c-text-muted)]">{salaryRange(role.salary_min_usd, role.salary_max_usd) || ''}</span>
            <button
              onClick={() => handleSelect(role.id)}
              disabled={!!selecting}
              className="group bg-[var(--c-primary)] text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50"
            >
              {selecting === role.id ? 'Building map…' : <>Build Career Map <span className="group-hover:translate-x-1 transition-transform inline-block">→</span></>}
            </button>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
