'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getResume, deleteResume, exportResume, reparseResume, scoreResume, getResumes } from '@/lib/api';
import { deduplicateByEmail } from '@/lib/resumeUtils';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import HoldToDelete from '@/components/HoldToDelete';
import { Sk } from '@/components/Skeleton';

function DeleteModal({ name, onCancel, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-ds-card rounded-lg border border-ds-border shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-ds-dangerLight flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ds-danger">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="font-heading font-bold text-ds-text text-base">Delete Resume?</h2>
            <p className="text-sm text-ds-textSecondary mt-1 leading-relaxed">
              <span className="font-medium">{name}</span> and all associated scores will be permanently removed.
            </p>
          </div>
        </div>
        <div className="bg-ds-dangerLight rounded px-4 py-3">
          <p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <HoldToDelete onDelete={onDelete} />
          <button onClick={onCancel}
            className="w-full px-5 py-2.5 text-sm font-medium text-ds-textMuted border border-ds-border rounded-btn hover:bg-ds-bg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function parseInline(text) {
  const result = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index));
    if (m[1])      result.push(<strong key={m.index} className="font-semibold text-ds-text">{m[1]}</strong>);
    else if (m[2]) result.push(<em key={m.index}>{m[2]}</em>);
    else if (m[3]) result.push(<em key={m.index}>{m[3]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) result.push(text.slice(last));
  return result.length ? result : text;
}

const BULLET_RE = /^[\s]*[-•·▪*]\s+/;
const NUM_RE    = /^[\s]*\d+\.\s+/;

function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    out.push(
      <ul key={`ul${out.length}`} className="list-disc pl-4 space-y-0.5 mt-1">
        {listItems.map((li, i) => (
          <li key={i} className="text-sm text-ds-textSecondary leading-relaxed">{parseInline(li)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); continue; }
    if (BULLET_RE.test(line) || NUM_RE.test(line)) {
      listItems.push(line.replace(BULLET_RE, '').replace(NUM_RE, '').trim());
    } else {
      flushList();
      out.push(
        <p key={`p${out.length}`} className="text-sm text-ds-textSecondary leading-relaxed">
          {parseInline(line.trim())}
        </p>
      );
    }
  }
  flushList();
  return <div className="space-y-1">{out}</div>;
}

function Section({ title, children }) {
  return (
    <div className="bg-ds-card rounded border border-ds-border p-6">
      <h2 className="font-heading text-base font-semibold text-ds-text mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-ds-textMuted w-20 flex-shrink-0 text-xs uppercase tracking-wide font-medium pt-0.5">{label}</span>
      {href
        ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value}</a>
        : <span className="text-ds-text break-words">{value}</span>}
    </div>
  );
}

function Tag({ children, className = '' }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-btn font-medium ${className || 'bg-primary-light text-primary'}`}>
      {children}
    </span>
  );
}

const PROF_COLORS = {
  Expert:       'bg-emerald-500',
  Advanced:     'bg-primary',
  Intermediate: 'bg-amber-400',
  Beginner:     'bg-ds-textMuted',
};

function ProficiencyDot({ level }) {
  const cls = PROF_COLORS[level];
  if (!cls) return null;
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${cls}`} title={level} />;
}

function normaliseUrl(raw) {
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `https://${raw}`;
}

function pick(...values) { return values.find(v => v != null && v !== '') ?? null; }
function pickArr(...arrays) { return arrays.find(a => Array.isArray(a) && a.length > 0) ?? []; }

export default function ResumeDetail() {
  const { id }      = useParams();
  const router      = useRouter();
  const queryClient = useQueryClient();
  const [selectedScoreIdx, setSelectedScoreIdx] = useState(0);
  const [reparsing, setReparsing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: resume, isLoading, error } = useQuery({
    queryKey: ['resume', id],
    queryFn:  () => getResume(id),
  });

  // Fetch full list for prev/next navigation
  const { data: listData } = useQuery({
    queryKey: ['resumes-nav'],
    queryFn:  () => getResumes(1, 500),
    staleTime: 60000,
  });

  const navList = deduplicateByEmail(listData?.data || []).map(({ resume }) => resume.id);
  const currentIdx = navList.indexOf(id);
  const prevId = currentIdx > 0 ? navList[currentIdx - 1] : null;
  const nextId = currentIdx >= 0 && currentIdx < navList.length - 1 ? navList[currentIdx + 1] : null;

  const handleDelete = async () => {
    await deleteResume(id);
    router.push('/resumes');
  };

  const handleReparse = async () => {
    setReparsing(true);
    try {
      // Phase 1: parse
      const result = await reparseResume(id);
      queryClient.invalidateQueries({ queryKey: ['resume', id] });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });

      // Phase 2: score (if resume has a linked job)
      if (result?.job_id) {
        await scoreResume(id, result.job_id).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['resume', id] });
      }
    } finally {
      setReparsing(false);
    }
  };

  const handleExport = async (format) => {
    const { data } = await exportResume(id, format);
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url; a.download = `resume_${id}.${format}`; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Sk className="h-4 w-28" />
      </div>
      <div className="bg-ds-card rounded-lg border border-ds-border p-5 flex items-start gap-5">
        <Sk className="w-16 h-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <Sk className="h-6 w-48" />
          <Sk className="h-4 w-36" />
          <div className="flex gap-2 pt-1">
            <Sk className="h-5 w-24 rounded-btn" />
            <Sk className="h-5 w-20 rounded-btn" />
            <Sk className="h-5 w-16 rounded-btn" />
          </div>
        </div>
        <div className="flex gap-2">
          <Sk className="h-8 w-20 rounded-btn" />
          <Sk className="h-8 w-20 rounded-btn" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-ds-card rounded-lg border border-ds-border p-5 space-y-3">
          <Sk className="h-5 w-36" />
          <div className="space-y-2">
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-5/6" />
            <Sk className="h-3 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
  if (error || !resume) return <p className="text-ds-danger">Resume not found.</p>;

  const pd = resume.parsed_data?.[0];
  const rj = pd?.raw_json || {};

  const pi = rj.personal_info || {};
  const name     = pick(pi.name,     rj.candidate_name, pd?.candidate_name);
  const email    = pick(pi.email,    rj.email,          pd?.email);
  const phone    = pick(pi.phone,    rj.phone,          pd?.phone);
  const linkedin = pick(pi.linkedin);
  const github   = pick(pi.github);
  const location = pick(pi.location);
  const website  = pick(pi.website);
  const otherLinks = pi.other_links || [];

  const summary = pick(rj.summary, rj.candidate_summary, pd?.summary);

  const skills = pickArr(
    pd?.skills,
    Array.isArray(rj.skills) ? rj.skills.map(s => (typeof s === 'string' ? s : s?.skill) || '').filter(Boolean) : null,
  );

  const skillProfMap = {};
  if (Array.isArray(rj.skills) && rj.skills.length > 0 && typeof rj.skills[0] === 'object') {
    for (const s of rj.skills) {
      if (s?.skill) skillProfMap[s.skill.toLowerCase()] = s.proficiency;
    }
  }
  const hasProfData = Object.keys(skillProfMap).length > 0;

  const experience = pickArr(rj.experience, pd?.work_experience);
  const projects   = pickArr(rj.projects);
  const education  = pickArr(rj.education, pd?.education);
  const certs      = pickArr(rj.certifications);

  const other = rj.other || {};
  const hasOther = other.languages?.length || other.awards?.length || other.publications?.length ||
                   other.volunteer?.length || other.interests?.length || other.misc?.length;

  const scores      = resume.scores || [];
  const activeScore = scores[selectedScoreIdx] || null;

  const resumeName = name || 'this resume';

  return (
    <div className="space-y-4">
      {showDeleteModal && (
        <DeleteModal
          name={resumeName}
          onCancel={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
        />
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left: back + prev/next */}
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/resumes')}
            className="text-sm text-ds-textMuted hover:text-ds-text transition-colors">
            ← All Profiles
          </button>
          {navList.length > 1 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-ds-border">
              <button
                onClick={() => prevId && router.push(`/resumes/${prevId}`)}
                disabled={!prevId}
                title="Previous candidate"
                className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text hover:bg-ds-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span className="text-xs text-ds-textMuted px-1 tabular-nums">
                {currentIdx + 1} / {navList.length}
              </span>
              <button
                onClick={() => nextId && router.push(`/resumes/${nextId}`)}
                disabled={!nextId}
                title="Next candidate"
                className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text hover:bg-ds-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleReparse} disabled={reparsing}
            className="text-sm border border-ds-border px-3 py-1.5 rounded-btn text-ds-text hover:bg-ds-card disabled:opacity-50 transition-colors">
            {reparsing
              ? <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Re-parsing…</span>
              : 'Re-parse'}
          </button>
          <button onClick={() => handleExport('json')}
            className="text-sm border border-ds-border px-3 py-1.5 rounded-btn text-ds-text hover:bg-ds-card transition-colors">
            <span className="hidden sm:inline">Export </span>JSON
          </button>
          <button onClick={() => handleExport('csv')}
            className="text-sm border border-ds-border px-3 py-1.5 rounded-btn text-ds-text hover:bg-ds-card transition-colors">
            <span className="hidden sm:inline">Export </span>CSV
          </button>
          <button onClick={() => setShowDeleteModal(true)}
            className="text-sm bg-ds-dangerLight text-ds-danger border border-ds-dangerLight px-3 py-1.5 rounded-btn hover:bg-ds-danger hover:text-white transition-colors">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-ds-card rounded border border-ds-border p-6">
            <h1 className="font-heading text-xl font-bold text-ds-text mb-0.5">
              {name || 'Unknown Candidate'}
            </h1>
            {location && <p className="text-sm text-ds-textMuted mb-3">{location}</p>}
            <div className="space-y-1.5 mt-3">
              <InfoRow label="Email"    value={email}   href={email ? `mailto:${email}` : null} />
              <InfoRow label="Phone"    value={phone} />
              <InfoRow label="LinkedIn" value={linkedin} href={normaliseUrl(linkedin)} />
              <InfoRow label="GitHub"   value={github}   href={normaliseUrl(github)} />
              <InfoRow label="Website"  value={website}  href={normaliseUrl(website)} />
              {otherLinks.map((link, i) => (
                <InfoRow key={i} label="Link" value={link} href={normaliseUrl(link)} />
              ))}
              <InfoRow label="File" value={resume.file_name} />
            </div>
            {summary && (
              <p className="mt-4 text-sm text-ds-textSecondary border-t border-ds-border pt-4 leading-relaxed">
                {summary}
              </p>
            )}
          </div>

          {skills.length > 0 && (
            <Section title={`Skills (${skills.length})`}>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => {
                  const prof = skillProfMap[s.toLowerCase()];
                  return (
                    <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-btn font-medium bg-primary-light text-primary">
                      {s}
                      {prof && <ProficiencyDot level={prof} />}
                    </span>
                  );
                })}
              </div>
              {hasProfData && (
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {Object.entries(PROF_COLORS).map(([label, cls]) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-ds-textMuted">
                      <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {experience.length > 0 && (
            <Section title="Experience">
              <div className="space-y-6">
                {experience.map((w, i) => (
                  <div key={i} className="border-l-2 border-primary-light pl-4">
                    <p className="font-semibold text-ds-text">{w.title}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {w.company  && <span className="text-sm text-ds-textTertiary">{w.company}</span>}
                      {w.location && <span className="text-xs text-ds-textMuted">· {w.location}</span>}
                    </div>
                    {(w.start_date || w.end_date) && (
                      <p className="text-xs text-ds-textMuted mt-0.5 font-mono">
                        {[w.start_date, w.end_date || 'Present'].filter(Boolean).join(' – ')}
                      </p>
                    )}
                    {w.description && (
                      <div className="mt-2">
                        <MarkdownText text={w.description} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {projects.length > 0 && (
            <Section title="Projects">
              <div className="space-y-5">
                {projects.map((p, i) => (
                  <div key={i} className="border-l-2 border-ds-border pl-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ds-text">{p.name}</p>
                      {p.github_url && (
                        <a href={normaliseUrl(p.github_url)} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                          </svg>
                          GitHub
                        </a>
                      )}
                    </div>
                    {p.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.technologies.map(t => <Tag key={t} className="bg-ds-bg text-ds-textMuted">{t}</Tag>)}
                      </div>
                    )}
                    {p.description && (
                      <div className="mt-2"><MarkdownText text={p.description} /></div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {education.length > 0 && (
            <Section title="Education">
              <div className="space-y-4">
                {education.map((e, i) => (
                  <div key={i} className="border-l-2 border-ds-border pl-4">
                    <p className="font-semibold text-ds-text">{e.institution}</p>
                    <p className="text-sm text-ds-textTertiary mt-0.5">
                      {[e.degree, e.field ? `in ${e.field}` : null].filter(Boolean).join(' ')}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {(e.start_date || e.end_date || e.graduation_year) && (
                        <p className="text-xs text-ds-textMuted font-mono">
                          {e.start_date && e.end_date
                            ? `${e.start_date} – ${e.end_date}`
                            : e.graduation_year || e.end_date || e.start_date}
                        </p>
                      )}
                      {e.grade && (
                        <span className="text-xs bg-ds-successLight text-ds-success px-2 py-0.5 rounded-btn font-medium">
                          {e.grade}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {certs.length > 0 && (
            <Section title="Certifications">
              <div className="space-y-2.5">
                {certs.map((c, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-ds-text">{c.name}</p>
                      {c.issuer && <p className="text-xs text-ds-textMuted">{c.issuer}</p>}
                    </div>
                    {c.date && <span className="text-xs text-ds-textMuted font-mono flex-shrink-0">{c.date}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {hasOther && (
            <Section title="Other">
              <div className="space-y-3">
                {other.languages?.length > 0 && (
                  <div>
                    <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium mb-1.5">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {other.languages.map(l => <Tag key={l} className="bg-ds-bg text-ds-textMuted">{l}</Tag>)}
                    </div>
                  </div>
                )}
                {other.awards?.length > 0 && (
                  <div>
                    <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium mb-1.5">Awards</p>
                    <ul className="space-y-0.5">{other.awards.map((a, i) => <li key={i} className="text-sm text-ds-textSecondary">· {a}</li>)}</ul>
                  </div>
                )}
                {other.publications?.length > 0 && (
                  <div>
                    <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium mb-1.5">Publications</p>
                    <ul className="space-y-0.5">{other.publications.map((p, i) => <li key={i} className="text-sm text-ds-textSecondary">· {p}</li>)}</ul>
                  </div>
                )}
                {other.volunteer?.length > 0 && (
                  <div>
                    <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium mb-1.5">Volunteer</p>
                    <ul className="space-y-0.5">{other.volunteer.map((v, i) => <li key={i} className="text-sm text-ds-textSecondary">· {v}</li>)}</ul>
                  </div>
                )}
                {other.interests?.length > 0 && (
                  <div>
                    <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium mb-1.5">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {other.interests.map(x => <Tag key={x} className="bg-ds-bg text-ds-textMuted">{x}</Tag>)}
                    </div>
                  </div>
                )}
                {other.misc?.length > 0 && (
                  <ul className="space-y-0.5">{other.misc.map((m, i) => <li key={i} className="text-sm text-ds-textSecondary">· {m}</li>)}</ul>
                )}
              </div>
            </Section>
          )}
        </div>

        {scores.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-ds-card rounded border border-ds-border overflow-hidden sticky top-4">
              <div className="border-b border-ds-border px-4 py-4">
                <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest mb-2">Match Score</p>
                <select value={selectedScoreIdx} onChange={e => setSelectedScoreIdx(Number(e.target.value))}
                  className="w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
                  {scores.map((s, i) => (
                    <option key={s.job_profile_id} value={i}>
                      {s.job_profiles?.title || 'Job Profile'} — {Math.round((s.overall_score ?? 0) * 100)}/100 ({s.band})
                    </option>
                  ))}
                </select>
              </div>
              {activeScore && (
                <div className="p-5">
                  {scores.length > 1 && activeScore.job_profiles && (
                    <div className="flex gap-1.5 mb-4 flex-wrap">
                      {activeScore.job_profiles.role_type && (
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-btn">{activeScore.job_profiles.role_type}</span>
                      )}
                      {activeScore.job_profiles.seniority && (
                        <span className="text-xs bg-ds-bg text-ds-textMuted px-2 py-0.5 rounded-btn">{activeScore.job_profiles.seniority}</span>
                      )}
                    </div>
                  )}
                  <ScoreBreakdown score={activeScore} />
                  {activeScore.score_summary && (() => {
                    const s = activeScore.score_summary;
                    return (
                      <div className="mt-5 pt-5 border-t border-ds-border space-y-3">
                        <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-widest">AI Assessment</p>
                        {s.summary && (
                          <p className="text-xs text-ds-textSecondary leading-relaxed">{s.summary}</p>
                        )}
                        {s.strengths?.length > 0 && (
                          <div className="bg-ds-successLight rounded p-3 space-y-1.5">
                            <p className="text-xs font-semibold text-ds-success uppercase tracking-wide">Strong Areas</p>
                            <ul className="space-y-1">
                              {s.strengths.map((item, i) => (
                                <li key={i} className="text-xs text-ds-text flex items-start gap-1.5">
                                  <span className="text-ds-success mt-0.5 flex-shrink-0">✓</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {s.gaps?.length > 0 && (
                          <div className="bg-ds-dangerLight rounded p-3 space-y-1.5">
                            <p className="text-xs font-semibold text-ds-danger uppercase tracking-wide">Areas to Improve</p>
                            <ul className="space-y-1">
                              {s.gaps.map((item, i) => (
                                <li key={i} className="text-xs text-ds-text flex items-start gap-1.5">
                                  <span className="text-ds-danger mt-0.5 flex-shrink-0">✗</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
