'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

const TEMPLATE_NAMES = {
  'classic-professional': 'Classic Professional',
  'modern-slate': 'Modern Slate',
  'minimal-white': 'Minimal White',
  'ats-clean': 'ATS Clean',
  'creative-edge': 'Creative Edge',
  'executive-navy': 'Executive Navy',
  'tech-stack': 'Tech Stack',
  'soft-gradient': 'Soft Gradient',
  'bold-impact': 'Bold Impact',
  'elegant-script': 'Elegant Script',
  'heritage': 'Heritage',
  'corporate-serif': 'Corporate',
  'silver-banner': 'Silver Banner',
  'teal-sidebar': 'Teal Sidebar',
  'timeline': 'Timeline',
  'photo-sidebar': 'Photo Sidebar',
  'beacon': 'Beacon',
  'banded': 'Banded',
  'foundry': 'Foundry',
};

const SECTION_ICONS = {
  summary: '◉', work_experience: '⊞', education: '◎', skills: '⊛',
  certifications: '◈', projects: '⊟', languages: '◐', hobbies: '◑',
  references: '◍', custom: '⊕',
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MetaItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-ds-textMuted">{label}</dt>
      <dd className="text-sm text-ds-text mt-0.5">{value || '—'}</dd>
    </div>
  );
}

function SectionAccordion({ section }) {
  const [open, setOpen] = useState(false);
  const icon = SECTION_ICONS[section.type] || '⊕';
  const entries = section.content?.entries || [];
  const hasContent = entries.length > 0 || section.content?.text;

  return (
    <div className="border border-ds-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ds-bg transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-ds-textMuted text-xs">{icon}</span>
          <span className="text-sm font-medium text-ds-text">{section.title}</span>
          <span className="text-xs text-ds-textMuted">
            {section.entry_count > 0 ? `${section.entry_count} entr${section.entry_count !== 1 ? 'ies' : 'y'}` : 'No content'}
          </span>
          {!section.enabled && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-ds-bg text-ds-textMuted border border-ds-border">Hidden</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {section.preview && !open && (
            <span className="text-xs text-ds-textMuted max-w-[200px] truncate hidden sm:block">{section.preview}</span>
          )}
          <span className={`text-ds-textMuted text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-ds-border px-4 py-3 bg-ds-bg/50">
          {!hasContent ? (
            <p className="text-xs text-ds-textMuted italic">No content added</p>
          ) : section.content?.text ? (
            <p className="text-sm text-ds-text whitespace-pre-wrap leading-relaxed">{section.content.text}</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <SectionEntryPreview key={i} type={section.type} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionEntryPreview({ type, entry }) {
  const fields = [];

  if (type === 'work_experience') {
    if (entry.title)    fields.push({ label: 'Title',    value: entry.title });
    if (entry.company)  fields.push({ label: 'Company',  value: entry.company });
    if (entry.location) fields.push({ label: 'Location', value: entry.location });
    const from = entry.start_date;
    const to   = entry.current ? 'Present' : entry.end_date;
    if (from || to) fields.push({ label: 'Period', value: [from, to].filter(Boolean).join(' – ') });
    if (entry.description) fields.push({ label: 'Description', value: entry.description, long: true });
  } else if (type === 'education') {
    if (entry.degree)      fields.push({ label: 'Degree',      value: entry.degree });
    if (entry.field)       fields.push({ label: 'Field',       value: entry.field });
    if (entry.institution) fields.push({ label: 'Institution', value: entry.institution });
    if (entry.grade)       fields.push({ label: 'Grade',       value: entry.grade });
    const from = entry.start_date;
    const to   = entry.end_date;
    if (from || to) fields.push({ label: 'Period', value: [from, to].filter(Boolean).join(' – ') });
  } else if (type === 'skills') {
    if (entry.skill)       fields.push({ label: 'Skill',       value: entry.skill });
    if (entry.proficiency) fields.push({ label: 'Proficiency', value: entry.proficiency });
  } else if (type === 'certifications') {
    if (entry.name)   fields.push({ label: 'Name',   value: entry.name });
    if (entry.issuer) fields.push({ label: 'Issuer', value: entry.issuer });
    if (entry.date)   fields.push({ label: 'Date',   value: entry.date });
  } else if (type === 'projects') {
    if (entry.title)       fields.push({ label: 'Title',       value: entry.title });
    if (entry.url)         fields.push({ label: 'URL',         value: entry.url });
    if (entry.description) fields.push({ label: 'Description', value: entry.description, long: true });
  } else if (type === 'languages') {
    if (entry.language) fields.push({ label: 'Language', value: entry.language });
    if (entry.level)    fields.push({ label: 'Level',    value: entry.level });
  } else {
    // Generic fallback
    Object.entries(entry).forEach(([k, v]) => {
      if (v && typeof v === 'string') fields.push({ label: k, value: v });
    });
  }

  return (
    <div className="bg-ds-card rounded border border-ds-border px-3 py-2.5 space-y-1.5">
      {fields.map(f => (
        <div key={f.label} className={f.long ? '' : 'flex gap-2'}>
          <span className="text-xs text-ds-textMuted flex-shrink-0 w-20">{f.label}</span>
          <span className={`text-sm text-ds-text ${f.long ? 'whitespace-pre-wrap mt-0.5 block' : ''}`}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminResumeDetailPage() {
  const { id: userId, resumeId } = useParams();
  const [state, setState]   = useState('loading');
  const [data, setData]     = useState(null);
  const [error, setError]   = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const [backUrl, setBackUrl] = useState(`/admin/users/${userId}?tab=resumes`);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const back = new URLSearchParams(window.location.search).get('back');
      if (back) setBackUrl(decodeURIComponent(back));
    }
  }, []);

  useEffect(() => {
    setState('loading');
    fetch(`/api/v1/admin/users/${userId}/resumes/${resumeId}`)
      .then(async r => {
        const body = await r.json();
        if (!r.ok) { setError(body.error || 'Failed to load.'); setState('error'); return; }
        setData(body);
        setState('ready');
      })
      .catch(() => { setError('Network error. Please try again.'); setState('error'); });
  }, [userId, resumeId, retryCount]);

  if (state === 'loading') {
    return (
      <div className="max-w-3xl space-y-6 animate-pulse">
        <Sk className="h-5 w-64" />
        <Sk className="h-40 w-full rounded-lg" />
        <Sk className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-3xl">
        <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger rounded-lg p-5 space-y-3">
          <p className="text-sm font-medium">{error || "We couldn't load this resume's details. Please try again."}</p>
          <div className="flex gap-3">
            <button onClick={() => setRetryCount(c => c + 1)} className="text-sm font-semibold underline">Retry</button>
            <Link href={backUrl} className="text-sm text-ds-textMuted hover:text-ds-text">← Back</Link>
          </div>
        </div>
      </div>
    );
  }

  const { resume, sections } = data;
  const pi = resume.personal_info || {};
  const templateName = TEMPLATE_NAMES[resume.template_id] || resume.template_id || 'Template no longer available';

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ds-textMuted flex-wrap">
        <Link href="/admin/users" className="hover:text-ds-text">User Management</Link>
        <span>/</span>
        <Link href={`/admin/users/${userId}`} className="hover:text-ds-text">Profile</Link>
        <span>/</span>
        <Link href={backUrl} className="hover:text-ds-text">Resumes</Link>
        <span>/</span>
        <span className="text-ds-text font-medium truncate max-w-[180px]">{resume.title}</span>
      </nav>

      {/* Metadata card */}
      <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-ds-text font-heading">{resume.title}</h1>
            <p className="text-xs text-ds-textMuted mt-0.5">Resume ID: {resumeId}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ds-bg text-ds-textMuted border border-ds-border">
            Draft
          </span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetaItem label="Candidate Name"  value={[pi.first_name, pi.last_name].filter(Boolean).join(' ') || '—'} />
          <MetaItem label="Template"        value={templateName} />
          <MetaItem label="Sections"        value={resume.section_count} />
          <MetaItem label="Created"         value={fmt(resume.created_at)} />
          <MetaItem label="Last Modified"   value={fmt(resume.updated_at)} />
          {pi.email && <MetaItem label="Candidate Email" value={pi.email} />}
        </dl>
      </div>

      {/* Sections accordion */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ds-text">Sections</h2>
        {sections.length === 0 ? (
          <div className="bg-ds-card border border-ds-border rounded-lg px-5 py-8 text-center text-sm text-ds-textMuted">
            No sections added yet.
          </div>
        ) : (
          sections.map(s => <SectionAccordion key={s.id} section={s} />)
        )}
      </div>

      {/* Back */}
      <div className="pb-6">
        <Link href={backUrl} className="inline-flex items-center gap-1.5 text-sm text-ds-textMuted hover:text-ds-text transition-colors">
          ← Back to Resumes
        </Link>
      </div>
    </div>
  );
}
