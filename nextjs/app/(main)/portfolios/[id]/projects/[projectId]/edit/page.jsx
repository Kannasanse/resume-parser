'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';
import { getPortfolio, createProject, updateProject } from '@/lib/portfolioApi';

const CATEGORIES = ['Web App', 'Mobile App', 'Design', 'Research', 'Writing', 'Other'];
const STATUSES = [
  { value: 'completed',   label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'concept',     label: 'Concept' },
];
const VISIBILITIES = [
  { value: 'public',   label: 'Public' },
  { value: 'private',  label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
];
const ROLES = ['Lead Developer', 'Designer', 'Contributor', 'Researcher', 'Writer', 'Other'];
const TEAM_SIZES = [
  { value: 'solo',  label: 'Solo' },
  { value: 'small', label: 'Small team' },
  { value: 'large', label: 'Large team' },
];

function AccordionPanel({ id, title, openPanel, setOpenPanel, children }) {
  const isOpen = openPanel === id;
  return (
    <div className="ds-paper overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenPanel(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-ds-card hover:bg-ds-bg transition-colors text-left"
      >
        <span className="text-sm font-medium text-ds-text">{title}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={`text-ds-textMuted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-4 border-t border-ds-border bg-ds-bg space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-ds-textMuted">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full bg-ds-card border border-ds-border rounded px-3 py-2 text-sm text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
const selectCls = `${inputCls} cursor-pointer`;

export default function ProjectEditPage() {
  const { id: portfolioId, projectId } = useParams();
  const router = useRouter();
  const isNew = projectId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saveStatus, setSaveStatus] = useState('');
  const [openPanel, setOpenPanel] = useState('basic');
  const saveTimer = useRef(null);
  const savedProjectId = useRef(null);

  const [form, setForm] = useState({
    title: '',
    tagline: '',
    category: '',
    status: 'concept',
    featured: false,
    visibility: 'public',
    description: '',
    project_url: '',
    source_url: '',
    tech_stack: [],
    start_date: '',
    end_date: '',
    ongoing: false,
    role: '',
    role_description: '',
    team_size: 'solo',
    outcomes: [],
    cover_image_url: '',
    gallery_urls: '',
    case_study_enabled: false,
    case_study_problem: '',
    case_study_process: '',
    case_study_solution: '',
    case_study_results: '',
  });

  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const res = await fetch(`/api/v1/portfolios/${portfolioId}/projects/${projectId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        const p = data.project || data;
        if (p) {
          savedProjectId.current = p.id;
          setForm({
            title: p.title || '',
            tagline: p.tagline || '',
            category: p.category || '',
            status: p.status || 'concept',
            featured: p.featured || false,
            visibility: p.visibility || 'public',
            description: p.description || '',
            project_url: p.project_url || '',
            source_url: p.source_url || '',
            tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
            start_date: p.start_date || '',
            end_date: p.end_date || '',
            ongoing: p.ongoing || false,
            role: p.role || '',
            role_description: p.role_description || '',
            team_size: p.team_size || 'solo',
            outcomes: Array.isArray(p.outcomes) ? p.outcomes : [],
            cover_image_url: p.cover_image_url || '',
            gallery_urls: Array.isArray(p.gallery_urls) ? p.gallery_urls.join('\n') : (p.gallery_urls || ''),
            case_study_enabled: p.case_study_enabled || false,
            case_study_problem: p.case_study?.problem || '',
            case_study_process: p.case_study?.process || '',
            case_study_solution: p.case_study?.solution || '',
            case_study_results: p.case_study?.results || '',
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [portfolioId, projectId, isNew]);

  const triggerAutoSave = (updatedForm) => {
    if (!updatedForm.title.trim()) return;
    clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const payload = {
          ...updatedForm,
          gallery_urls: updatedForm.gallery_urls
            ? updatedForm.gallery_urls.split('\n').map(s => s.trim()).filter(Boolean)
            : [],
          case_study: updatedForm.case_study_enabled ? {
            problem: updatedForm.case_study_problem,
            process: updatedForm.case_study_process,
            solution: updatedForm.case_study_solution,
            results: updatedForm.case_study_results,
          } : null,
        };
        delete payload.case_study_problem;
        delete payload.case_study_process;
        delete payload.case_study_solution;
        delete payload.case_study_results;

        if (isNew && !savedProjectId.current) {
          const res = await createProject(portfolioId, payload);
          if (res.project?.id) {
            savedProjectId.current = res.project.id;
            window.history.replaceState(null, '', `/portfolios/${portfolioId}/projects/${res.project.id}/edit`);
          }
        } else {
          await updateProject(portfolioId, savedProjectId.current || projectId, payload);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 1000);
  };

  const update = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    triggerAutoSave(next);
  };

  const addTech = () => {
    const val = techInput.trim();
    if (!val || form.tech_stack.includes(val)) return;
    const next = { ...form, tech_stack: [...form.tech_stack, val] };
    setForm(next);
    setTechInput('');
    triggerAutoSave(next);
  };

  const removeTech = (tag) => {
    const next = { ...form, tech_stack: form.tech_stack.filter(t => t !== tag) };
    setForm(next);
    triggerAutoSave(next);
  };

  const addOutcome = () => {
    const next = { ...form, outcomes: [...form.outcomes, { metric: '', value: '' }] };
    setForm(next);
  };

  const updateOutcome = (idx, field, val) => {
    const outcomes = form.outcomes.map((o, i) => i === idx ? { ...o, [field]: val } : o);
    update({ outcomes });
  };

  const removeOutcome = (idx) => {
    const outcomes = form.outcomes.filter((_, i) => i !== idx);
    update({ outcomes });
  };

  const handleSaveBack = async () => {
    if (!form.title.trim()) return;
    clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    try {
      const payload = {
        ...form,
        gallery_urls: form.gallery_urls
          ? form.gallery_urls.split('\n').map(s => s.trim()).filter(Boolean)
          : [],
        case_study: form.case_study_enabled ? {
          problem: form.case_study_problem,
          process: form.case_study_process,
          solution: form.case_study_solution,
          results: form.case_study_results,
        } : null,
      };
      delete payload.case_study_problem;
      delete payload.case_study_process;
      delete payload.case_study_solution;
      delete payload.case_study_results;

      if (isNew && !savedProjectId.current) {
        await createProject(portfolioId, payload);
      } else {
        await updateProject(portfolioId, savedProjectId.current || projectId, payload);
      }
      router.push(`/portfolios/${portfolioId}/projects`);
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-6">
        <Sk className="h-8 w-64" />
        {[1,2,3].map(i => <Sk key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/portfolios/${portfolioId}/projects`} className="text-ds-textMuted hover:text-ds-text transition-colors shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <h1 className="font-heading font-bold text-xl text-ds-text truncate">
            {isNew ? 'New Project' : (form.title || 'Edit Project')}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveStatus === 'saving' && <span className="text-xs text-ds-textMuted">Saving…</span>}
          {saveStatus === 'saved'  && <span className="text-xs text-ds-success font-medium">Saved</span>}
          {saveStatus === 'error'  && <span className="text-xs text-ds-danger">Save failed</span>}
          <button
            onClick={handleSaveBack}
            disabled={!form.title.trim()}
            className="bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Save & Back
          </button>
        </div>
      </div>

      {/* Accordion panels */}
      <div className="space-y-3">

        {/* 1. Basic Info */}
        <AccordionPanel id="basic" title="Basic Info" openPanel={openPanel} setOpenPanel={setOpenPanel}>
          <Field label="Title *">
            <input value={form.title} onChange={e => update({ title: e.target.value })} placeholder="Project title" className={inputCls} />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={e => update({ tagline: e.target.value })} placeholder="One-line summary" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.category} onChange={e => update({ category: e.target.value })} className={selectCls}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => update({ status: e.target.value })} className={selectCls}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Visibility">
              <select value={form.visibility} onChange={e => update({ visibility: e.target.value })} className={selectCls}>
                {VISIBILITIES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </Field>
            <Field label=" ">
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => update({ featured: e.target.checked })} className="accent-primary w-4 h-4" />
                <span className="text-sm text-ds-text">Featured project</span>
              </label>
            </Field>
          </div>
        </AccordionPanel>

        {/* 2. Description */}
        <AccordionPanel id="description" title="Description" openPanel={openPanel} setOpenPanel={setOpenPanel}>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => update({ description: e.target.value })}
              placeholder="Describe the project…"
              rows={5}
              className={inputCls}
            />
          </Field>
          <Field label="Project URL">
            <input value={form.project_url} onChange={e => update({ project_url: e.target.value })} placeholder="https://…" className={inputCls} />
          </Field>
          <Field label="Source Code URL">
            <input value={form.source_url} onChange={e => update({ source_url: e.target.value })} placeholder="https://github.com/…" className={inputCls} />
          </Field>
        </AccordionPanel>

        {/* 3. Tech Stack */}
        <AccordionPanel id="tech" title="Tech Stack" openPanel={openPanel} setOpenPanel={setOpenPanel}>
          <div className="flex gap-2">
            <input
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
              placeholder="Type a technology and press Enter"
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={addTech}
              className="bg-primary text-white rounded px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
              Add
            </button>
          </div>
          {form.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tech_stack.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-ds-card border border-ds-border rounded-full px-3 py-1 text-sm text-ds-text">
                  {tag}
                  <button type="button" onClick={() => removeTech(tag)} className="text-ds-textMuted hover:text-ds-danger transition-colors ml-1 leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </AccordionPanel>

        {/* 4. Timeline & Role */}
        <AccordionPanel id="timeline" title="Timeline & Role" openPanel={openPanel} setOpenPanel={setOpenPanel}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input type="date" value={form.start_date} onChange={e => update({ start_date: e.target.value })} className={inputCls} />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                value={form.ongoing ? '' : form.end_date}
                onChange={e => update({ end_date: e.target.value })}
                disabled={form.ongoing}
                className={`${inputCls} disabled:opacity-50`}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ongoing} onChange={e => update({ ongoing: e.target.checked })} className="accent-primary w-4 h-4" />
            <span className="text-sm text-ds-text">Ongoing</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">
              <select value={form.role} onChange={e => update({ role: e.target.value })} className={selectCls}>
                <option value="">— Select —</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Team Size">
              <select value={form.team_size} onChange={e => update({ team_size: e.target.value })} className={selectCls}>
                {TEAM_SIZES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Role Description">
            <textarea
              value={form.role_description}
              onChange={e => update({ role_description: e.target.value })}
              placeholder="Describe your specific contribution…"
              rows={3}
              className={inputCls}
            />
          </Field>
        </AccordionPanel>

        {/* 5. Outcomes */}
        <AccordionPanel id="outcomes" title="Outcomes" openPanel={openPanel} setOpenPanel={setOpenPanel}>
          <div className="space-y-2">
            {form.outcomes.map((o, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={o.metric}
                  onChange={e => updateOutcome(idx, 'metric', e.target.value)}
                  placeholder="Metric"
                  className={`${inputCls} flex-1`}
                />
                <input
                  value={o.value}
                  onChange={e => updateOutcome(idx, 'value', e.target.value)}
                  placeholder="Value"
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={() => removeOutcome(idx)}
                  className="text-ds-textMuted hover:text-ds-danger transition-colors shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addOutcome}
            className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add outcome
          </button>
        </AccordionPanel>

        {/* 6. Media */}
        <AccordionPanel id="media" title="Media" openPanel={openPanel} setOpenPanel={setOpenPanel}>
          <Field label="Cover Image URL">
            <input value={form.cover_image_url} onChange={e => update({ cover_image_url: e.target.value })} placeholder="https://…" className={inputCls} />
          </Field>
          <div className="bg-ds-bg border border-dashed border-ds-border rounded px-4 py-3 text-center">
            <p className="text-xs text-ds-textMuted">Image upload coming soon</p>
          </div>
          <Field label="Gallery URLs" hint="One URL per line">
            <textarea
              value={form.gallery_urls}
              onChange={e => update({ gallery_urls: e.target.value })}
              placeholder="https://…"
              rows={4}
              className={inputCls}
            />
          </Field>
        </AccordionPanel>

        {/* 7. Case Study */}
        <AccordionPanel id="casestudy" title="Case Study" openPanel={openPanel} setOpenPanel={setOpenPanel}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.case_study_enabled}
              onChange={e => update({ case_study_enabled: e.target.checked })}
              className="accent-primary w-4 h-4"
            />
            <span className="text-sm text-ds-text font-medium">Enable case study mode</span>
          </label>

          {form.case_study_enabled && (
            <div className="space-y-4 pt-2">
              {[
                { key: 'case_study_problem',  label: 'Problem' },
                { key: 'case_study_process',  label: 'Process' },
                { key: 'case_study_solution', label: 'Solution' },
                { key: 'case_study_results',  label: 'Results' },
              ].map(({ key, label }) => (
                <Field key={key} label={label}>
                  <textarea
                    value={form[key]}
                    onChange={e => update({ [key]: e.target.value })}
                    placeholder={`Describe the ${label.toLowerCase()}…`}
                    rows={4}
                    className={inputCls}
                  />
                </Field>
              ))}
            </div>
          )}
        </AccordionPanel>
      </div>
    </div>
  );
}
