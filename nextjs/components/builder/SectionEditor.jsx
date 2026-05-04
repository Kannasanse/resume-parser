'use client';
import { useState, useCallback } from 'react';

// ── Generic field components ──────────────────────────────────────────────────

function Field({ label, children, error }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">{label}</label>}
      {children}
      {error && <p className="text-xs text-ds-danger">{error}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, maxLength = 150, className = '' }) {
  const [localVal, setLocalVal] = useState(value || '');

  const handleChange = (e) => {
    const v = e.target.value.replace(/<[^>]*>/g, '');
    setLocalVal(v);
  };

  const handleBlur = () => onChange(localVal);

  return (
    <input
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors ${className}`}
    />
  );
}

function Textarea({ value, onChange, placeholder, maxLength = 2000, rows = 3 }) {
  const [localVal, setLocalVal] = useState(value || '');
  const charCount = localVal.length;
  const nearLimit = charCount > maxLength * 0.9;

  const handleChange = (e) => {
    const v = e.target.value.replace(/<[^>]*>/g, '');
    if (v.length <= maxLength) setLocalVal(v);
  };

  const handleBlur = () => onChange(localVal);

  return (
    <div>
      <textarea
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y"
      />
      <p className={`text-right text-xs mt-0.5 ${nearLimit ? 'text-ds-warning' : 'text-ds-textMuted'}`}>
        {charCount}/{maxLength}
      </p>
    </div>
  );
}

function DateInput({ value, onChange, placeholder }) {
  const [localVal, setLocalVal] = useState(value || '');
  const [error, setError] = useState('');

  const validate = (v) => {
    if (!v) return '';
    if (v.toLowerCase() === 'present') return '';
    if (!/^\d{2}\/\d{4}$/.test(v)) return 'Use MM/YYYY format';
    const [mm] = v.split('/');
    if (parseInt(mm) < 1 || parseInt(mm) > 12) return 'Invalid month';
    return '';
  };

  const handleBlur = () => {
    const err = validate(localVal);
    setError(err);
    if (!err) onChange(localVal);
  };

  return (
    <div>
      <input
        value={localVal}
        onChange={(e) => { setLocalVal(e.target.value); setError(''); }}
        onBlur={handleBlur}
        placeholder={placeholder || 'MM/YYYY'}
        maxLength={10}
        className={`w-full px-2.5 py-1.5 text-sm border rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary transition-colors ${error ? 'border-ds-danger focus:ring-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`}
      />
      {error && <p className="text-xs text-ds-danger mt-0.5">{error}</p>}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function EntryHeader({ title, expanded, onToggle, onDelete }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-ds-bg rounded cursor-pointer hover:bg-ds-border/20 transition-colors"
      onClick={onToggle}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className={`text-ds-textMuted transition-transform ${expanded ? 'rotate-90' : ''}`}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
      <span className="flex-1 text-sm font-medium text-ds-text truncate">{title || 'New entry'}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="w-5 h-5 flex items-center justify-center text-ds-textMuted hover:text-ds-danger transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  );
}

// ── Section-specific editors ──────────────────────────────────────────────────

function SummaryEditor({ content, onChange }) {
  return (
    <Field label="Summary text">
      <Textarea
        value={content.text || ''}
        onChange={(v) => onChange({ ...content, text: v })}
        placeholder="Write a compelling professional summary..."
        rows={4}
      />
    </Field>
  );
}

function SimpleTextEditor({ content, onChange, placeholder }) {
  return (
    <Field>
      <Textarea
        value={content.text || ''}
        onChange={(v) => onChange({ ...content, text: v })}
        placeholder={placeholder || ''}
        rows={3}
      />
    </Field>
  );
}

function WorkExperienceEditor({ content, onChange }) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const entries = content.entries || [];

  const update = (idx, patch) => {
    const updated = entries.map((e, i) => i === idx ? { ...e, ...patch } : e);
    onChange({ ...content, entries: updated });
  };

  const add = () => {
    const newEntry = { title: '', company: '', location: '', start_date: '', end_date: '', current: false, description: '' };
    onChange({ ...content, entries: [...entries, newEntry] });
    setExpandedIdx(entries.length);
  };

  const remove = (idx) => {
    onChange({ ...content, entries: entries.filter((_, i) => i !== idx) });
    setExpandedIdx(null);
  };

  return (
    <div className="space-y-2">
      {entries.map((e, idx) => (
        <div key={idx} className="border border-ds-border rounded overflow-hidden">
          <EntryHeader
            title={[e.title, e.company].filter(Boolean).join(' at ') || 'New Entry'}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onDelete={() => remove(idx)}
          />
          {expandedIdx === idx && (
            <div className="p-3 space-y-2 bg-ds-card">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Job Title">
                  <Input value={e.title} onChange={(v) => update(idx, { title: v })} placeholder="Software Engineer" />
                </Field>
                <Field label="Company">
                  <Input value={e.company} onChange={(v) => update(idx, { company: v })} placeholder="Acme Corp" />
                </Field>
              </div>
              <Field label="Location">
                <Input value={e.location} onChange={(v) => update(idx, { location: v })} placeholder="New York, NY" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start Date">
                  <DateInput value={e.start_date} onChange={(v) => update(idx, { start_date: v })} />
                </Field>
                <Field label="End Date">
                  <DateInput value={e.current ? 'Present' : e.end_date} onChange={(v) => update(idx, { end_date: v, current: false })} placeholder="MM/YYYY or Present" />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-ds-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={e.current || false}
                  onChange={(ev) => update(idx, { current: ev.target.checked, end_date: ev.target.checked ? '' : e.end_date })}
                  className="accent-primary"
                />
                Currently working here
              </label>
              {!e.current && e.end_date && e.start_date && e.end_date < e.start_date && (
                <p className="text-xs text-ds-danger">End date cannot be earlier than start date.</p>
              )}
              <Field label="Description">
                <Textarea value={e.description} onChange={(v) => update(idx, { description: v })} placeholder="Describe your responsibilities and achievements..." rows={4} />
              </Field>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded hover:bg-primary/5 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Entry
      </button>
    </div>
  );
}

function EducationEditor({ content, onChange }) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const entries = content.entries || [];

  const update = (idx, patch) => onChange({ ...content, entries: entries.map((e, i) => i === idx ? { ...e, ...patch } : e) });
  const add = () => { onChange({ ...content, entries: [...entries, { institution: '', degree: '', field: '', start_date: '', end_date: '', grade: '' }] }); setExpandedIdx(entries.length); };
  const remove = (idx) => { onChange({ ...content, entries: entries.filter((_, i) => i !== idx) }); setExpandedIdx(null); };

  return (
    <div className="space-y-2">
      {entries.map((e, idx) => (
        <div key={idx} className="border border-ds-border rounded overflow-hidden">
          <EntryHeader
            title={[e.institution, e.degree].filter(Boolean).join(' · ') || 'New Entry'}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onDelete={() => remove(idx)}
          />
          {expandedIdx === idx && (
            <div className="p-3 space-y-2 bg-ds-card">
              <Field label="Institution">
                <Input value={e.institution} onChange={(v) => update(idx, { institution: v })} placeholder="University Name" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Degree">
                  <Input value={e.degree} onChange={(v) => update(idx, { degree: v })} placeholder="B.S., M.S., Ph.D." />
                </Field>
                <Field label="Field of Study">
                  <Input value={e.field} onChange={(v) => update(idx, { field: v })} placeholder="Computer Science" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start Date">
                  <DateInput value={e.start_date} onChange={(v) => update(idx, { start_date: v })} />
                </Field>
                <Field label="End Date">
                  <DateInput value={e.end_date} onChange={(v) => update(idx, { end_date: v })} placeholder="MM/YYYY or Present" />
                </Field>
              </div>
              <Field label="Grade / GPA">
                <Input value={e.grade} onChange={(v) => update(idx, { grade: v })} placeholder="3.8 GPA" />
              </Field>
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded hover:bg-primary/5 transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Entry
      </button>
    </div>
  );
}

function SkillsEditor({ content, onChange }) {
  const entries = content.entries || [];
  const [newSkill, setNewSkill] = useState('');
  const profOptions = ['Expert', 'Advanced', 'Intermediate', 'Beginner'].map(v => ({ value: v, label: v }));

  const add = () => {
    const sk = newSkill.trim().replace(/<[^>]*>/g, '');
    if (!sk) return;
    onChange({ ...content, entries: [...entries, { skill: sk, proficiency: 'Intermediate' }] });
    setNewSkill('');
  };

  const remove = (idx) => onChange({ ...content, entries: entries.filter((_, i) => i !== idx) });
  const updateProf = (idx, proficiency) => onChange({ ...content, entries: entries.map((e, i) => i === idx ? { ...e, proficiency } : e) });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add a skill..."
          maxLength={80}
          className="flex-1 px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
        />
        <button onClick={add} className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors">Add</button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {entries.map((e, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="flex-1 text-sm bg-primary/5 text-primary px-2.5 py-1 rounded-full truncate">{e.skill}</span>
            <select
              value={e.proficiency || 'Intermediate'}
              onChange={(ev) => updateProf(idx, ev.target.value)}
              className="text-xs border border-ds-inputBorder rounded px-1.5 py-1 bg-ds-card text-ds-text focus:outline-none"
            >
              {profOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => remove(idx)} className="w-5 h-5 flex items-center justify-center text-ds-textMuted hover:text-ds-danger transition-colors flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificationsEditor({ content, onChange }) {
  const entries = content.entries || [];
  const [expandedIdx, setExpandedIdx] = useState(0);
  const update = (idx, patch) => onChange({ ...content, entries: entries.map((e, i) => i === idx ? { ...e, ...patch } : e) });
  const add = () => { onChange({ ...content, entries: [...entries, { name: '', issuer: '', date: '' }] }); setExpandedIdx(entries.length); };
  const remove = (idx) => { onChange({ ...content, entries: entries.filter((_, i) => i !== idx) }); setExpandedIdx(null); };

  return (
    <div className="space-y-2">
      {entries.map((e, idx) => (
        <div key={idx} className="border border-ds-border rounded overflow-hidden">
          <EntryHeader title={e.name || 'New Certification'} expanded={expandedIdx === idx} onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)} onDelete={() => remove(idx)} />
          {expandedIdx === idx && (
            <div className="p-3 space-y-2 bg-ds-card">
              <Field label="Certification Name"><Input value={e.name} onChange={(v) => update(idx, { name: v })} placeholder="AWS Certified Solutions Architect" /></Field>
              <Field label="Issuing Organization"><Input value={e.issuer} onChange={(v) => update(idx, { issuer: v })} placeholder="Amazon Web Services" /></Field>
              <Field label="Date"><DateInput value={e.date} onChange={(v) => update(idx, { date: v })} placeholder="MM/YYYY" /></Field>
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded hover:bg-primary/5 transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Certification
      </button>
    </div>
  );
}

function ProjectsEditor({ content, onChange }) {
  const entries = content.entries || [];
  const [expandedIdx, setExpandedIdx] = useState(0);
  const update = (idx, patch) => onChange({ ...content, entries: entries.map((e, i) => i === idx ? { ...e, ...patch } : e) });
  const add = () => { onChange({ ...content, entries: [...entries, { name: '', description: '', technologies: '', url: '' }] }); setExpandedIdx(entries.length); };
  const remove = (idx) => { onChange({ ...content, entries: entries.filter((_, i) => i !== idx) }); setExpandedIdx(null); };

  return (
    <div className="space-y-2">
      {entries.map((e, idx) => (
        <div key={idx} className="border border-ds-border rounded overflow-hidden">
          <EntryHeader title={e.name || 'New Project'} expanded={expandedIdx === idx} onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)} onDelete={() => remove(idx)} />
          {expandedIdx === idx && (
            <div className="p-3 space-y-2 bg-ds-card">
              <Field label="Project Name"><Input value={e.name} onChange={(v) => update(idx, { name: v })} placeholder="My Awesome Project" /></Field>
              <Field label="Technologies"><Input value={e.technologies} onChange={(v) => update(idx, { technologies: v })} placeholder="React, Node.js, PostgreSQL" /></Field>
              <Field label="URL / GitHub"><Input value={e.url} onChange={(v) => update(idx, { url: v })} placeholder="https://github.com/..." /></Field>
              <Field label="Description"><Textarea value={e.description} onChange={(v) => update(idx, { description: v })} placeholder="Describe what you built..." rows={3} /></Field>
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded hover:bg-primary/5 transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Project
      </button>
    </div>
  );
}

function LanguagesEditor({ content, onChange }) {
  const entries = content.entries || [];
  const levels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic', 'Conversational'].map(v => ({ value: v, label: v }));
  const update = (idx, patch) => onChange({ ...content, entries: entries.map((e, i) => i === idx ? { ...e, ...patch } : e) });
  const add = () => onChange({ ...content, entries: [...entries, { language: '', level: 'Conversational' }] });
  const remove = (idx) => onChange({ ...content, entries: entries.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-2">
      {entries.map((e, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input value={e.language} onChange={(v) => update(idx, { language: v })} placeholder="e.g. Spanish" className="flex-1" />
          <select value={e.level} onChange={(ev) => update(idx, { level: ev.target.value })} className="text-sm border border-ds-inputBorder rounded px-2 py-1.5 bg-ds-card text-ds-text focus:outline-none">
            {levels.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => remove(idx)} className="w-5 h-5 flex items-center justify-center text-ds-textMuted hover:text-ds-danger transition-colors flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded hover:bg-primary/5 transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Language
      </button>
    </div>
  );
}

function CustomEditor({ content, onChange }) {
  const entries = content.entries || [];
  const [expandedIdx, setExpandedIdx] = useState(0);
  const update = (idx, patch) => onChange({ ...content, entries: entries.map((e, i) => i === idx ? { ...e, ...patch } : e) });
  const add = () => { onChange({ ...content, entries: [...entries, { title: '', description: '' }] }); setExpandedIdx(entries.length); };
  const remove = (idx) => { onChange({ ...content, entries: entries.filter((_, i) => i !== idx) }); setExpandedIdx(null); };

  return (
    <div className="space-y-2">
      {entries.map((e, idx) => (
        <div key={idx} className="border border-ds-border rounded overflow-hidden">
          <EntryHeader title={e.title || 'New Entry'} expanded={expandedIdx === idx} onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)} onDelete={() => remove(idx)} />
          {expandedIdx === idx && (
            <div className="p-3 space-y-2 bg-ds-card">
              <Field label="Title"><Input value={e.title} onChange={(v) => update(idx, { title: v })} placeholder="Entry title" /></Field>
              <Field label="Description"><Textarea value={e.description} onChange={(v) => update(idx, { description: v })} rows={3} /></Field>
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-sm text-primary border border-dashed border-primary/40 rounded hover:bg-primary/5 transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Entry
      </button>
    </div>
  );
}

const SECTION_EDITORS = {
  summary: SummaryEditor,
  work_experience: WorkExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  certifications: CertificationsEditor,
  projects: ProjectsEditor,
  languages: LanguagesEditor,
  hobbies: (props) => <SimpleTextEditor {...props} placeholder="Reading, hiking, photography..." />,
  references: (props) => <SimpleTextEditor {...props} placeholder="Available upon request" />,
  custom: CustomEditor,
};

export default function SectionEditor({ section, onContentChange, onTitleChange, saveStatus }) {
  const EditorComp = SECTION_EDITORS[section.type];

  return (
    <div className="p-3 space-y-3">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <input
          defaultValue={section.title}
          onBlur={(e) => onTitleChange(e.target.value)}
          placeholder="Section name"
          className="flex-1 px-2.5 py-1.5 text-sm font-semibold border border-ds-inputBorder rounded bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
        />
        {saveStatus === 'saving' && (
          <span className="text-xs text-ds-textMuted flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block" />
            Saving
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-ds-success">Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-ds-danger">Error saving</span>
        )}
      </div>

      {EditorComp ? (
        <EditorComp
          content={section.content || {}}
          onChange={onContentChange}
        />
      ) : (
        <p className="text-sm text-ds-textMuted">Unknown section type: {section.type}</p>
      )}
    </div>
  );
}
