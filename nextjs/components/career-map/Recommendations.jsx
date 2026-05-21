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

const PATH_BADGE = {
  vertical:   { label: '↑ Vertical',   className: 'bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.20)] text-[#185FA5] dark:text-[#5B9FD4]' },
  horizontal: { label: '→ Horizontal', className: 'bg-[#F0FDF4] dark:bg-[rgba(21,128,61,0.15)] text-[#15803D] dark:text-[#4ade80]' },
  diagonal:   { label: '↗ Diagonal',   className: 'bg-[#FFF7ED] dark:bg-[rgba(194,65,12,0.15)] text-[#C2410C] dark:text-[#fb923c]' },
};

function ReasonText({ reason }) {
  if (!reason) return null;
  return (
    <p className="text-[13px] italic leading-snug text-[#6B7280] dark:text-[#8BA3C1]">
      <span className="text-[#185FA5] dark:text-[#5B9FD4]" style={{ fontFamily: 'Georgia, serif', fontSize: 16, lineHeight: 0, verticalAlign: '-3px', marginRight: 2 }}>"</span>
      {reason}
    </p>
  );
}

function ReadinessBar({ score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 70 ? '#1D9E75' : pct >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#E5E7EB] dark:bg-[rgba(255,255,255,0.10)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[12px] font-medium flex-shrink-0" style={{ color }}>{pct}% ready</span>
    </div>
  );
}

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
        <p className="text-xs text-[var(--c-text-muted)]">Something went wrong generating your recommendations. Please try again.</p>
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
        {roles.map((role, i) => {
          const pathBadge = PATH_BADGE[role.pathType] || PATH_BADGE.vertical;
          const salary = salaryRange(role.salary_min_usd, role.salary_max_usd);
          const skills = role.core_skills || role.matched_skills || [];
          const neededSkills = role.key_skills_needed || [];

          return (
            <div key={role.id} className={`card card-interactive p-5 space-y-3 ${i === 0 ? 'card-featured' : ''}`}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="stat-icon flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 8, fontSize: 14, fontWeight: 700 }}>
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--c-text)]">{role.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-[var(--c-text-muted)]">{role.category} · {role.seniority}</p>
                      {role.pathType && (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${pathBadge.className}`}>
                          {pathBadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {role.growth_outlook && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${OUTLOOK_COLOR[role.growth_outlook] || OUTLOOK_COLOR.Medium}`}>
                    {role.growth_outlook} growth
                  </span>
                )}
              </div>

              {/* Personalised reason */}
              <ReasonText reason={role.reason} />

              {/* Readiness bar */}
              {role.readiness_score != null && (
                <ReadinessBar score={role.readiness_score} />
              )}

              {/* Matched skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 5).map(s => (
                    <span key={s} className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}

              {/* Skills to gain */}
              {neededSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {neededSkills.slice(0, 3).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[#FFF7ED] dark:bg-[rgba(194,65,12,0.15)] text-[#C2410C] dark:text-[#fb923c] border border-[#FED7AA] dark:border-[rgba(194,65,12,0.30)]">
                      + {s}
                    </span>
                  ))}
                  {neededSkills.length > 3 && (
                    <span className="text-xs text-[var(--c-text-muted)]">+{neededSkills.length - 3} more to learn</span>
                  )}
                </div>
              )}

              {/* Description (legacy DB roles) */}
              {role.description && !role.reason && (
                <p className="text-sm text-[var(--c-text-muted)]">{role.description}</p>
              )}

              {/* Footer row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  {salary && <span className="text-sm text-[var(--c-text-muted)]">{salary}</span>}
                  {role.estimated_months != null && (
                    <span className="text-xs text-[var(--c-text-muted)]">~{role.estimated_months}mo transition</span>
                  )}
                </div>
                <button
                  onClick={() => handleSelect(role.id)}
                  disabled={!!selecting}
                  className="group btn-primary text-sm px-4 py-1.5 disabled:opacity-50"
                >
                  {selecting === role.id
                    ? 'Building map…'
                    : <><span>Build Career Map</span> <span className="group-hover:translate-x-1 transition-transform inline-block">→</span></>
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
