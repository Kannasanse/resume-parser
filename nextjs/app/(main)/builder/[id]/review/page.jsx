'use client';
import { useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBuilderResume, updateBuilderResume, updateBuilderSection, deleteBuilderSection, createBuilderSection } from '@/lib/builderApi';
import { SECTION_TYPES, getDefaultContent } from '@/components/builder/templates.js';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

// ── Field-level helpers ───────────────────────────────────────────────────────

function isMissing(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && !v.trim()) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function countFields(personalInfo, sections) {
  const piFields = ['name', 'email', 'phone', 'location', 'linkedin', 'github'];
  const total = piFields.length;
  const extracted = piFields.filter(k => !isMissing(personalInfo[k])).length;

  let sTotal = 0, sExtracted = 0;
  for (const sec of sections) {
    const c = sec.content || {};
    if (sec.type === 'summary' || sec.type === 'hobbies' || sec.type === 'references') {
      sTotal++;
      if (!isMissing(c.text)) sExtracted++;
    } else {
      const entries = c.entries || [];
      for (const e of entries) {
        const vals = Object.values(e).filter(v => typeof v === 'string');
        sTotal += vals.length;
        sExtracted += vals.filter(v => !isMissing(v)).length;
      }
    }
  }
  return { extracted: extracted + sExtracted, total: total + sTotal };
}

// ── Inline field components ───────────────────────────────────────────────────

function ReviewField({ label, value, onChange, missing, placeholder, type = 'text', multiline = false }) {
  const [local, setLocal] = useState(value || '');
  const cls = `w-full px-2.5 py-1.5 text-sm rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-primary
    ${missing && !local.trim() ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 focus:ring-amber-400' : 'border-ds-inputBorder bg-ds-card focus:border-primary'}`;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">{label}</label>
        {missing && !local.trim() && (
          <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-medium" title="We couldn't extract this — please fill in manually">
            ⚠ Not found
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={local}
          onChange={e => setLocal(e.target.value.replace(/<[^>]*>/g, ''))}
          onBlur={() => onChange(local)}
          placeholder={placeholder}
          rows={3}
          className={cls + ' resize-y'}
        />
      ) : (
        <input
          type={type}
          value={local}
          onChange={e => setLocal(e.target.value.replace(/<[^>]*>/g, ''))}
          onBlur={() => onChange(local)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

// ── Section accordions ────────────────────────────────────────────────────────

function SectionAccordion({ section, onContentChange, onDelete, fallback }) {
  const [open, setOpen] = useState(true);
  const c = section.content || {};
  const entries = c.entries || [];
  const isText = ['summary', 'hobbies', 'references'].includes(section.type);

  const updateEntry = (idx, patch) => {
    const updated = entries.map((e, i) => i === idx ? { ...e, ...patch } : e);
    onContentChange({ ...c, entries: updated });
  };
  const removeEntry = (idx) => onContentChange({ ...c, entries: entries.filter((_, i) => i !== idx) });
  const addEntry = () => onContentChange({ ...c, entries: [...entries, {}] });

  const missingCount = isText
    ? (isMissing(c.text) ? 1 : 0)
    : entries.reduce((n, e) => n + Object.values(e).filter(v => typeof v === 'string' && isMissing(v)).length, 0);

  return (
    <div className="border border-ds-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-ds-card hover:bg-ds-bg transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-ds-textMuted transition-transform ${open ? 'rotate-90' : ''}`}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="font-medium text-sm text-ds-text">{section.title}</span>
          {missingCount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
              {missingCount} missing
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-ds-textMuted hover:text-ds-danger transition-colors p-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </button>

      {open && (
        <div className="px-4 py-3 bg-ds-bg space-y-3">
          {isText ? (
            <ReviewField
              label="Content"
              value={c.text}
              onChange={v => onContentChange({ ...c, text: v })}
              missing={isMissing(c.text) || fallback}
              placeholder="Enter content..."
              multiline
            />
          ) : (
            <>
              {entries.map((e, idx) => (
                <div key={idx} className="border border-ds-border rounded p-3 bg-ds-card space-y-2 relative">
                  <button onClick={() => removeEntry(idx)} className="absolute top-2 right-2 text-ds-textMuted hover:text-ds-danger transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <EntryFields type={section.type} entry={e} onChange={patch => updateEntry(idx, patch)} fallback={fallback} />
                </div>
              ))}
              <button
                onClick={addEntry}
                className="text-xs text-primary border border-dashed border-primary/40 rounded px-3 py-1.5 hover:bg-primary/5 transition-colors w-full"
              >
                + Add entry
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EntryFields({ type, entry: e, onChange, fallback }) {
  const f = (k) => (
    <ReviewField
      key={k}
      label={k.replace(/_/g, ' ')}
      value={e[k]}
      onChange={v => onChange({ [k]: v })}
      missing={isMissing(e[k]) || fallback}
      placeholder={`Enter ${k.replace(/_/g, ' ')}...`}
      multiline={k === 'description'}
    />
  );

  if (type === 'work_experience') return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{['title','company','location','start_date','end_date'].map(f)}<div className="sm:col-span-2">{f('description')}</div></div>;
  if (type === 'education') return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{['institution','degree','field','start_date','end_date','grade'].map(f)}</div>;
  if (type === 'skills') return <div className="grid grid-cols-2 gap-2">{['skill','proficiency'].map(f)}</div>;
  if (type === 'certifications') return <div className="grid grid-cols-2 gap-2">{['name','issuer','date'].map(f)}</div>;
  if (type === 'projects') return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{['name','technologies','url'].map(f)}<div className="sm:col-span-2">{f('description')}</div></div>;
  if (type === 'languages') return <div className="grid grid-cols-2 gap-2">{['language','level'].map(f)}</div>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{Object.keys(e).filter(k => typeof e[k] === 'string').map(f)}</div>;
}

// ── Personal info review panel ────────────────────────────────────────────────

function PersonalInfoReview({ info, onChange, fallback }) {
  const [open, setOpen] = useState(true);
  const fields = [
    { k: 'name', label: 'Full Name', placeholder: 'Your full name' },
    { k: 'email', label: 'Email', placeholder: 'your@email.com', type: 'email' },
    { k: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' },
    { k: 'location', label: 'Location', placeholder: 'City, Country' },
    { k: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/...' },
    { k: 'github', label: 'GitHub', placeholder: 'github.com/...' },
    { k: 'website', label: 'Website', placeholder: 'yoursite.com' },
  ];
  const missingCount = fields.filter(f => isMissing(info[f.k])).length;

  return (
    <div className="border border-ds-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 bg-ds-card hover:bg-ds-bg transition-colors">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-ds-textMuted transition-transform ${open ? 'rotate-90' : ''}`}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="font-medium text-sm text-ds-text">Personal Information</span>
          {missingCount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">{missingCount} missing</span>
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 bg-ds-bg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(f => (
              <ReviewField
                key={f.k}
                label={f.label}
                value={info[f.k]}
                onChange={v => onChange({ ...info, [f.k]: v })}
                missing={isMissing(info[f.k]) || fallback}
                placeholder={f.placeholder}
                type={f.type}
              />
            ))}
          </div>
          <div className="mt-3">
            <ReviewField
              label="Summary"
              value={info.summary}
              onChange={v => onChange({ ...info, summary: v })}
              missing={isMissing(info.summary)}
              placeholder="Brief professional summary..."
              multiline
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main review page ──────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [validationError, setValidationError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const debounceRefs = useRef({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['builder-resume', id],
    queryFn: () => getBuilderResume(id),
  });

  const resume = data?.data;
  const sections = resume?.sections || [];
  const personalInfo = resume?.personal_info || {};
  const fallback = !!resume?.design_settings?.import_meta?.fallback;

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Debounced saves ─────────────────────────────────────────────────────────

  const piDebounce = useRef(null);
  const handlePIChange = useCallback((pi) => {
    queryClient.setQueryData(['builder-resume', id], old =>
      old ? { ...old, data: { ...old.data, personal_info: pi } } : old
    );
    if (piDebounce.current) clearTimeout(piDebounce.current);
    piDebounce.current = setTimeout(() => {
      updateBuilderResume(id, { personal_info: pi }).catch(() =>
        showToast("Couldn't save changes. Retrying...", 'error')
      );
    }, 1000);
  }, [id, queryClient, showToast]);

  const handleSectionContent = useCallback((sectionId, content) => {
    queryClient.setQueryData(['builder-resume', id], old => {
      if (!old) return old;
      return { ...old, data: { ...old.data, sections: old.data.sections.map(s => s.id === sectionId ? { ...s, content } : s) } };
    });
    if (debounceRefs.current[sectionId]) clearTimeout(debounceRefs.current[sectionId]);
    debounceRefs.current[sectionId] = setTimeout(() => {
      updateBuilderSection(id, sectionId, { content }).catch(() =>
        showToast("Couldn't save changes.", 'error')
      );
    }, 1000);
  }, [id, queryClient, showToast]);

  const handleDeleteSection = useCallback(async (sectionId) => {
    queryClient.setQueryData(['builder-resume', id], old =>
      old ? { ...old, data: { ...old.data, sections: old.data.sections.filter(s => s.id !== sectionId) } } : old
    );
    await deleteBuilderSection(id, sectionId).catch(() =>
      showToast("Couldn't remove section.", 'error')
    );
  }, [id, queryClient, showToast]);

  // ── Confirm ─────────────────────────────────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    setValidationError('');
    const currentResume = queryClient.getQueryData(['builder-resume', id])?.data;
    const pi = currentResume?.personal_info || {};
    const secs = currentResume?.sections || [];

    // Validate at least name or email
    if (!pi.name?.trim() && !pi.email?.trim()) {
      setValidationError('Please fill in at least your name or email in Personal Information before continuing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check for work experience entries with no title
    for (const sec of secs) {
      if (sec.type === 'work_experience') {
        const empty = (sec.content?.entries || []).some(e => !e.title?.trim());
        if (empty) {
          setValidationError('Please fill in all required fields (Job Title) or remove incomplete entries before continuing.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    setConfirmLoading(true);
    try {
      // Clear import_meta flag
      const ds = currentResume?.design_settings || {};
      if (ds.import_meta) {
        const { import_meta: _, ...rest } = ds;
        await updateBuilderResume(id, { design_settings: rest });
      }
      router.push(`/builder/${id}`);
    } catch {
      showToast("We couldn't save your resume. Please try again.", 'error');
      setConfirmLoading(false);
    }
  }, [id, queryClient, router, showToast]);

  // ── Start Fresh ──────────────────────────────────────────────────────────────

  const startFreshMutation = useMutation({
    mutationFn: async () => {
      const secs = queryClient.getQueryData(['builder-resume', id])?.data?.sections || [];
      await Promise.all(secs.map(s => deleteBuilderSection(id, s.id)));
      await updateBuilderResume(id, {
        personal_info: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', summary: '' },
        design_settings: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-resume', id] });
      router.push(`/builder/${id}`);
    },
    onError: () => showToast("Couldn't reset the resume. Please try again.", 'error'),
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="max-w-2xl mx-auto space-y-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <Sk className="h-7 w-56" />
        <Sk className="h-5 w-32" />
      </div>
      <div className="bg-ds-card rounded-lg border border-ds-border p-5 space-y-3">
        <Sk className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Sk className="h-3 w-20" />
              <Sk className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-ds-card rounded-lg border border-ds-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Sk className="h-5 w-36" />
            <Sk className="h-6 w-16 rounded" />
          </div>
          <div className="space-y-2">
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-4/5" />
          </div>
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Sk className="flex-1 h-11 rounded-btn" />
        <Sk className="h-11 w-32 rounded-btn" />
      </div>
    </div>
  );
  if (error || !resume) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-ds-danger">We couldn't load your parsed data. Please try uploading again.</p>
        <Link href="/builder/new" className="text-sm text-primary hover:underline">← Retry Upload</Link>
      </div>
    );
  }

  const { extracted, total } = countFields(personalInfo, sections);
  const currentSections = queryClient.getQueryData(['builder-resume', id])?.data?.sections || sections;
  const currentPI = queryClient.getQueryData(['builder-resume', id])?.data?.personal_info || personalInfo;

  return (
    <div className="max-w-3xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-xl font-bold text-ds-text">Review Your Imported Resume</h1>
          <button
            onClick={() => startFreshMutation.mutate()}
            disabled={startFreshMutation.isPending}
            className="text-sm text-ds-textMuted hover:text-ds-danger transition-colors underline"
          >
            {startFreshMutation.isPending ? 'Clearing…' : 'Start Fresh'}
          </button>
        </div>
        <p className="text-sm text-ds-textSecondary">Check the details below and make any corrections before opening the editor.</p>
      </div>

      {/* Progress summary */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-5 ${extracted === total ? 'bg-ds-successLight' : 'bg-amber-50 dark:bg-amber-900/10'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${extracted === total ? 'bg-ds-success text-white' : 'bg-amber-400 text-white'}`}>
          {extracted === total ? '✓' : '!'}
        </div>
        <div>
          <p className={`font-semibold text-sm ${extracted === total ? 'text-ds-success' : 'text-amber-700'}`}>
            {extracted} of {total} fields successfully extracted
          </p>
          {extracted < total && (
            <p className="text-xs text-amber-600 mt-0.5">Fields marked ⚠ were not found — please fill them in manually.</p>
          )}
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="mb-4 px-4 py-3 bg-ds-dangerLight border border-ds-danger/30 rounded text-sm text-ds-danger">
          {validationError}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        <PersonalInfoReview info={currentPI} onChange={handlePIChange} fallback={fallback} />
        {currentSections.map(sec => (
          <SectionAccordion
            key={sec.id}
            section={sec}
            onContentChange={(content) => handleSectionContent(sec.id, content)}
            onDelete={() => handleDeleteSection(sec.id)}
            fallback={fallback}
          />
        ))}
      </div>

      {/* Start Fresh — bottom link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => startFreshMutation.mutate()}
          disabled={startFreshMutation.isPending}
          className="text-sm text-ds-textMuted hover:text-ds-danger transition-colors underline"
        >
          Start Fresh — discard all imported data
        </button>
      </div>

      {/* Sticky confirm bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-ds-card border-t border-ds-border px-4 py-3 flex items-center justify-between gap-3">
        <Link href={`/builder/${id}`} className="text-sm text-ds-textMuted hover:text-ds-text transition-colors">
          ← Skip review, go to editor
        </Link>
        <button
          onClick={handleConfirm}
          disabled={confirmLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-btn font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {confirmLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Confirm and Open Editor
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 right-4 z-50 px-4 py-2.5 rounded-lg border shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-ds-dangerLight border-ds-danger/30 text-ds-danger' : 'bg-ds-card border-ds-border text-ds-text'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
