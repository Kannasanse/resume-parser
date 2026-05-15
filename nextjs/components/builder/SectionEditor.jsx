'use client';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor.jsx';

// ── Shared atoms ──────────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
      <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// Dashed add button — used inside sections (skills, bullets, entries)
function AddBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-ds-border rounded-lg text-[12px] font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-colors"
    >
      <PlusIcon />
      {children}
    </button>
  );
}

// Labeled input field
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[12px] font-semibold text-ds-text">{label}</label>}
      {children}
    </div>
  );
}

// Shared input style
const inputCls = 'w-full px-[10px] py-2 border border-ds-inputBorder rounded-[7px] text-[13px] bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-colors';
const textareaCls = inputCls + ' resize-y min-h-[64px] leading-relaxed';

// 2-column field row
function FieldRow({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

// Entry card — matches design's .entry-card / .entry-head / .entry-body
function EntryCard({ title, sub, onDelete, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-ds-border rounded-[9px] overflow-hidden bg-ds-card">
      <div
        className="flex items-center gap-2 px-3 py-[10px] cursor-pointer bg-[#FAFBFC] hover:bg-ds-bg transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-ds-textMuted flex-shrink-0 cursor-grab"><GripIcon /></span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ds-text truncate">{title || '(Untitled)'}</div>
          {sub && <div className="text-[11px] text-ds-textMuted">{sub}</div>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-ds-textMuted hover:bg-ds-bg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-colors"
        >
          <TrashIcon />
        </button>
      </div>
      {open && (
        <div className="p-3 flex flex-col gap-[10px] border-t border-ds-border">
          {children}
        </div>
      )}
    </div>
  );
}

// Convert old bullets array to HTML for backwards compat
function bulletsToHtml(bullets) {
  if (!Array.isArray(bullets) || !bullets.length) return '';
  const items = bullets.filter(b => b?.trim()).map(b => `<li><p>${b}</p></li>`).join('');
  return items ? `<ul>${items}</ul>` : '';
}

// ── Summary ───────────────────────────────────────────────────────────────────

function SummaryEditor({ content, onChange, resumeId }) {
  return (
    <RichTextEditor
      value={content.text || ''}
      onChange={val => onChange({ ...content, text: val })}
      placeholder="Write a compelling professional summary…"
      assistConfig={resumeId ? { resumeId, sectionType: 'summary', context: {} } : undefined}
    />
  );
}

// ── Skills — skill name + sub-skills + proficiency ───────────────────────────

const LEVEL_LABELS = ['', 'Beginner', 'Intermediate', 'Advanced'];

function SkillsEditor({ content, onChange }) {
  const entries = content.entries || [];

  const update = (i, patch) => onChange({ ...content, entries: entries.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const remove = (i) => onChange({ ...content, entries: entries.filter((_, j) => j !== i) });
  const add    = () => onChange({ ...content, entries: [...entries, { name: '', level: 2, subSkills: [] }] });

  const addSubSkill    = (i) => update(i, { subSkills: [...(entries[i].subSkills || []), ''] });
  const updateSubSkill = (i, si, val) => update(i, { subSkills: (entries[i].subSkills || []).map((s, j) => j === si ? val : s) });
  const removeSubSkill = (i, si) => update(i, { subSkills: (entries[i].subSkills || []).filter((_, j) => j !== si) });

  return (
    <div className="flex flex-col gap-2">
      {entries.map((s, i) => (
        <div key={i} className="border border-ds-border rounded-[9px] overflow-hidden bg-ds-card">
          {/* Skill header row */}
          <div className="flex items-center gap-2 px-3 py-2">
            <input
              defaultValue={s.name}
              onBlur={e => update(i, { name: e.target.value })}
              placeholder="Skill name (e.g. Programming)"
              className={inputCls + ' flex-1'}
            />
            {/* Proficiency dots */}
            <div className="flex gap-1 flex-shrink-0" title="Proficiency">
              {[1, 2, 3].map(lv => (
                <button
                  key={lv}
                  title={LEVEL_LABELS[lv]}
                  onClick={() => update(i, { level: s.level === lv ? 0 : lv })}
                  className={`w-6 h-[22px] rounded border flex items-center justify-center transition-colors ${(s.level || 0) >= lv ? 'border-primary bg-primary/10' : 'border-ds-border bg-ds-card'}`}
                >
                  <span style={{ width: 4 + lv * 2, height: 4 + lv * 2, borderRadius: '50%', background: (s.level || 0) >= lv ? '#185FA5' : '#D1DCE8', display: 'block' }} />
                </button>
              ))}
            </div>
            <button onClick={() => remove(i)} className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-colors flex-shrink-0">
              <TrashIcon />
            </button>
          </div>

          {/* Sub-skills */}
          <div className="px-3 pb-2 flex flex-col gap-1.5">
            {(s.subSkills || []).map((ss, si) => (
              <div key={si} className="flex items-center gap-2 pl-4">
                <span className="text-ds-textMuted text-[11px] flex-shrink-0">↳</span>
                <input
                  defaultValue={ss}
                  onBlur={e => updateSubSkill(i, si, e.target.value)}
                  placeholder="Sub-skill (e.g. JavaScript)"
                  className={inputCls + ' flex-1 text-[12px] py-1.5'}
                />
                <button onClick={() => removeSubSkill(i, si)} className="w-[22px] h-[22px] rounded flex items-center justify-center text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-colors flex-shrink-0">
                  <TrashIcon />
                </button>
              </div>
            ))}
            <button
              onClick={() => addSubSkill(i)}
              className="flex items-center gap-1 pl-4 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors w-fit"
            >
              <PlusIcon /> Add sub-skill
            </button>
          </div>
        </div>
      ))}
      <AddBtn onClick={add}>Add skill</AddBtn>
    </div>
  );
}

// ── Work Experience ───────────────────────────────────────────────────────────

function WorkExperienceEditor({ content, onChange, resumeId }) {
  const entries = content.entries || [];

  const update = (i, patch) => onChange({ ...content, entries: entries.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const remove = (i) => onChange({ ...content, entries: entries.filter((_, j) => j !== i) });
  const add = () => onChange({ ...content, entries: [...entries, { title: '', employer: '', dates: '', location: '', body: '' }] });

  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <EntryCard
          key={i}
          title={e.title || '(Untitled role)'}
          sub={[e.employer, e.dates].filter(Boolean).join(' · ')}
          onDelete={() => remove(i)}
          defaultOpen={entries.length === 1}
        >
          <FieldRow>
            <Field label="Job title">
              <input defaultValue={e.title} onBlur={ev => update(i, { title: ev.target.value })} placeholder="Software Engineer" className={inputCls} />
            </Field>
            <Field label="Employer">
              <input defaultValue={e.employer} onBlur={ev => update(i, { employer: ev.target.value })} placeholder="Company name" className={inputCls} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Dates">
              <input defaultValue={e.dates} onBlur={ev => update(i, { dates: ev.target.value })} placeholder="2022 – Present" className={inputCls} />
            </Field>
            <Field label="Location">
              <input defaultValue={e.location} onBlur={ev => update(i, { location: ev.target.value })} placeholder="New York, NY" className={inputCls} />
            </Field>
          </FieldRow>
          <Field label="Description">
            <RichTextEditor
              value={e.body || bulletsToHtml(e.bullets)}
              onChange={val => update(i, { body: val })}
              placeholder="Add an accomplishment, bullet points, or description…"
              assistConfig={resumeId ? { resumeId, sectionType: 'work_experience', context: { jobTitle: e.title, employer: e.employer } } : undefined}
            />
          </Field>
        </EntryCard>
      ))}
      <AddBtn onClick={add}>Add experience</AddBtn>
    </div>
  );
}

// ── Education ─────────────────────────────────────────────────────────────────

function EducationEditor({ content, onChange, resumeId }) {
  const entries = content.entries || [];

  const update = (i, patch) => onChange({ ...content, entries: entries.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const remove = (i) => onChange({ ...content, entries: entries.filter((_, j) => j !== i) });
  const add = () => onChange({ ...content, entries: [...entries, { school: '', degree: '', dates: '', location: '', body: '' }] });

  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <EntryCard
          key={i}
          title={e.school || '(Untitled)'}
          sub={[e.degree, e.dates].filter(Boolean).join(' · ')}
          onDelete={() => remove(i)}
          defaultOpen={entries.length === 1}
        >
          <FieldRow>
            <Field label="School">
              <input defaultValue={e.school} onBlur={ev => update(i, { school: ev.target.value })} placeholder="University name" className={inputCls} />
            </Field>
            <Field label="Degree">
              <input defaultValue={e.degree} onBlur={ev => update(i, { degree: ev.target.value })} placeholder="B.S. Computer Science" className={inputCls} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Dates">
              <input defaultValue={e.dates} onBlur={ev => update(i, { dates: ev.target.value })} placeholder="2018 – 2022" className={inputCls} />
            </Field>
            <Field label="Location">
              <input defaultValue={e.location} onBlur={ev => update(i, { location: ev.target.value })} placeholder="Berkeley, CA" className={inputCls} />
            </Field>
          </FieldRow>
          <Field label="Description">
            <RichTextEditor
              value={e.body || ''}
              onChange={val => update(i, { body: val })}
              placeholder="Add a description of your education entry…"
              assistConfig={resumeId ? { resumeId, sectionType: 'education', context: { school: e.school, degree: e.degree } } : undefined}
            />
          </Field>
        </EntryCard>
      ))}
      <AddBtn onClick={add}>Add education</AddBtn>
    </div>
  );
}

// ── Certifications ────────────────────────────────────────────────────────────

function CertificationsEditor({ content, onChange }) {
  const entries = content.entries || [];
  const update = (i, patch) => onChange({ ...content, entries: entries.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const remove = (i) => onChange({ ...content, entries: entries.filter((_, j) => j !== i) });
  const add = () => onChange({ ...content, entries: [...entries, { name: '', issuer: '', date: '' }] });

  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <EntryCard key={i} title={e.name || '(Untitled)'} sub={[e.issuer, e.date].filter(Boolean).join(' · ')} onDelete={() => remove(i)} defaultOpen={entries.length === 1}>
          <Field label="Certificate name">
            <input defaultValue={e.name} onBlur={ev => update(i, { name: ev.target.value })} placeholder="AWS Certified Solutions Architect" className={inputCls} />
          </Field>
          <FieldRow>
            <Field label="Issuer">
              <input defaultValue={e.issuer} onBlur={ev => update(i, { issuer: ev.target.value })} placeholder="Amazon Web Services" className={inputCls} />
            </Field>
            <Field label="Date">
              <input defaultValue={e.date} onBlur={ev => update(i, { date: ev.target.value })} placeholder="2023" className={inputCls} />
            </Field>
          </FieldRow>
        </EntryCard>
      ))}
      <AddBtn onClick={add}>Add certification</AddBtn>
    </div>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────

function ProjectsEditor({ content, onChange, resumeId }) {
  const entries = content.entries || [];
  const update = (i, patch) => onChange({ ...content, entries: entries.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const remove = (i) => onChange({ ...content, entries: entries.filter((_, j) => j !== i) });
  const add = () => onChange({ ...content, entries: [...entries, { title: '', role: '', dates: '', link: '', body: '' }] });

  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <EntryCard key={i} title={e.title || '(Untitled)'} sub={[e.role, e.dates].filter(Boolean).join(' · ')} onDelete={() => remove(i)} defaultOpen={entries.length === 1}>
          <FieldRow>
            <Field label="Title">
              <input defaultValue={e.title} onBlur={ev => update(i, { title: ev.target.value })} placeholder="Project name" className={inputCls} />
            </Field>
            <Field label="Role / Tech">
              <input defaultValue={e.role} onBlur={ev => update(i, { role: ev.target.value })} placeholder="React, Node.js" className={inputCls} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Dates">
              <input defaultValue={e.dates} onBlur={ev => update(i, { dates: ev.target.value })} placeholder="2023" className={inputCls} />
            </Field>
            <Field label="Link">
              <input defaultValue={e.link} onBlur={ev => update(i, { link: ev.target.value })} placeholder="github.com/…" className={inputCls} />
            </Field>
          </FieldRow>
          <Field label="Description">
            <RichTextEditor
              value={e.body || bulletsToHtml(e.bullets)}
              onChange={val => update(i, { body: val })}
              placeholder="Add a description, bullet points, or achievements…"
              assistConfig={resumeId ? { resumeId, sectionType: 'project', context: { project: e.title, role: e.role } } : undefined}
            />
          </Field>
        </EntryCard>
      ))}
      <AddBtn onClick={add}>Add project</AddBtn>
    </div>
  );
}

// ── Languages ─────────────────────────────────────────────────────────────────

function LanguagesEditor({ content, onChange }) {
  const entries = content.entries || [];
  const levels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Beginner'];
  const update = (i, patch) => onChange({ ...content, entries: entries.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const remove = (i) => onChange({ ...content, entries: entries.filter((_, j) => j !== i) });
  const add = () => onChange({ ...content, entries: [...entries, { name: '', level: 'Fluent' }] });

  return (
    <div className="flex flex-col gap-[6px]">
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <input defaultValue={e.name} onBlur={ev => update(i, { name: ev.target.value })} placeholder="Language" className={inputCls + ' flex-1'} />
          <select
            value={e.level || 'Fluent'}
            onChange={ev => update(i, { level: ev.target.value })}
            className="text-[13px] border border-ds-inputBorder rounded-[7px] px-2 py-2 bg-ds-card text-ds-text focus:outline-none focus:border-primary transition-colors"
          >
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={() => remove(i)} className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-colors flex-shrink-0">
            <TrashIcon />
          </button>
        </div>
      ))}
      <AddBtn onClick={add}>Add language</AddBtn>
    </div>
  );
}

// ── Hobbies / References (simple textarea) ────────────────────────────────────

function SimpleTextEditor({ content, onChange, placeholder }) {
  return (
    <textarea
      className={textareaCls}
      rows={3}
      defaultValue={content.text || ''}
      onBlur={e => onChange({ ...content, text: e.target.value })}
      placeholder={placeholder || ''}
    />
  );
}

// ── Custom ────────────────────────────────────────────────────────────────────

function CustomEditor({ content, onChange }) {
  const entries = content.entries || [];
  const update = (i, patch) => onChange({ ...content, entries: entries.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const remove = (i) => onChange({ ...content, entries: entries.filter((_, j) => j !== i) });
  const add = () => onChange({ ...content, entries: [...entries, { title: '', description: '' }] });

  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <EntryCard key={i} title={e.title || '(Untitled)'} onDelete={() => remove(i)} defaultOpen={entries.length === 1}>
          <Field label="Title">
            <input defaultValue={e.title} onBlur={ev => update(i, { title: ev.target.value })} placeholder="Entry title" className={inputCls} />
          </Field>
          <Field label="Description">
            <RichTextEditor
              value={e.body || e.description || ''}
              onChange={val => update(i, { body: val })}
              placeholder="Add a description…"
            />
          </Field>
        </EntryCard>
      ))}
      <AddBtn onClick={add}>Add entry</AddBtn>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────

const EDITORS = {
  summary:        SummaryEditor,
  work_experience: WorkExperienceEditor,
  education:      EducationEditor,
  skills:         SkillsEditor,
  certifications: CertificationsEditor,
  projects:       ProjectsEditor,
  languages:      LanguagesEditor,
  hobbies:        (p) => <SimpleTextEditor {...p} placeholder="Reading, hiking, photography…" />,
  references:     (p) => <SimpleTextEditor {...p} placeholder="Available upon request" />,
  custom:         CustomEditor,
};

export default function SectionEditor({ section, onContentChange, onTitleChange, resumeId }) {
  const EditorComp = EDITORS[section.type];

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <input
          key={section.id}
          defaultValue={section.title}
          onBlur={e => onTitleChange(e.target.value)}
          placeholder="Section name"
          className="flex-1 px-[10px] py-2 text-[13px] font-semibold border border-ds-inputBorder rounded-[7px] bg-ds-card text-ds-text focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-colors"
        />
      </div>

      {EditorComp
        ? <EditorComp content={section.content || {}} onChange={onContentChange} resumeId={resumeId} />
        : <p className="text-sm text-ds-textMuted">Unknown section type: {section.type}</p>
      }
    </div>
  );
}
