'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createBuilderResume, createBuilderSection, importResumeFile } from '@/lib/builderApi';
import { TEMPLATES, TEMPLATE_CATEGORIES, SECTION_TYPES, getDefaultContent } from '@/components/builder/templates.js';
import { TemplatePreviewCard, StarBadge } from '@/components/builder/TemplatePreviewCard.jsx';

const DEFAULT_SECTIONS = ['summary', 'work_experience', 'education', 'skills'];

export default function NewResumePage() {
  return <Suspense><NewResumePageInner /></Suspense>;
}

// ── Template Preview Modal ────────────────────────────────────────────────────
function TemplatePreviewModal({ tpl, filtered, isFeatured, onClose, onUse }) {
  const idx = filtered.indexOf(tpl);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-ds-card border border-ds-border rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ds-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-ds-text">{tpl.name}</h3>
              {isFeatured(tpl.id) && <StarBadge small />}
            </div>
            {tpl.description && <p className="text-xs text-ds-textMuted mt-0.5">{tpl.description}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={idx <= 0}
              onClick={() => onClose(filtered[idx - 1])}
              title="Previous template"
              className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text disabled:opacity-30 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              disabled={idx >= filtered.length - 1}
              onClick={() => onClose(filtered[idx + 1])}
              title="Next template"
              className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text disabled:opacity-30 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button onClick={onClose} title="Close" className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text transition-colors ml-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#0D1830] flex items-start justify-center p-6">
          <div style={{ width: 300 }}>
            <TemplatePreviewCard
              templateId={tpl.id}
              active={false}
              label={tpl.name}
              style={tpl.style}
              plan={tpl.plan}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-ds-border flex-shrink-0">
          <button
            onClick={() => onUse(tpl.id)}
            className="flex-1 px-4 py-2.5 bg-primary text-white font-medium text-sm rounded-btn hover:bg-primary/90 transition-colors"
          >
            Use this template →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function NewResumePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startWithUpload = searchParams.get('upload') === '1';

  const [step, setStep] = useState('template'); // 'template' | 'title'
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [previewTpl, setPreviewTpl] = useState(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState(startWithUpload ? 'import' : 'blank');
  const [featuredIds, setFeaturedIds] = useState([]);

  useEffect(() => {
    fetch('/api/v1/templates')
      .then(r => r.json())
      .then(d => setFeaturedIds(d.featuredIds || []))
      .catch(() => {});
  }, []);

  const isFeatured = id => featuredIds.includes(id);

  const ALL_CATS = featuredIds.length > 0
    ? ['All', 'Featured', ...TEMPLATE_CATEGORIES.filter(c => c !== 'All')]
    : TEMPLATE_CATEGORIES;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await createBuilderResume({ title: title.trim() || 'Untitled Resume', template_id: selectedTemplate });
      const resumeId = res.data.id;

      if (importMode === 'blank') {
        for (let i = 0; i < DEFAULT_SECTIONS.length; i++) {
          const type = DEFAULT_SECTIONS[i];
          const stDef = SECTION_TYPES.find(s => s.id === type);
          await createBuilderSection(resumeId, {
            type,
            title: stDef?.defaultTitle || type,
            content: getDefaultContent(type),
            position: i,
          });
        }
      }

      if (importMode === 'import' && importFile) {
        await importResumeFile(resumeId, importFile);
      }

      return resumeId;
    },
    onSuccess: (id) => {
      router.push(importMode === 'import' ? `/builder/${id}/review` : `/builder/${id}`);
    },
  });

  const filtered = TEMPLATES.filter(t => {
    if (category === 'Featured') return isFeatured(t.id);
    const matchCat = category === 'All' || t.style === category;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.style.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    const aF = isFeatured(a.id) ? 0 : 1;
    const bF = isFeatured(b.id) ? 0 : 1;
    return aF - bF;
  });

  // Navigate prev/next from modal or close it
  const handleModalClose = (nextTpl) => {
    if (nextTpl && nextTpl.id) setPreviewTpl(nextTpl);
    else setPreviewTpl(null);
  };

  const handleUseTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    setPreviewTpl(null);
    setStep('title');
  };

  // ── Template step ────────────────────────────────────────────────────────────
  if (step === 'template') {
    return (
      <>
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-5xl">
          <div>
            <button onClick={() => router.push('/builder')} className="text-sm text-ds-textMuted hover:text-ds-text transition-colors mb-4 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <h1 className="font-heading text-xl font-bold text-ds-text">Choose a Template</h1>
            <p className="text-sm text-ds-textMuted mt-0.5">Click a template to preview and select it.</p>
          </div>

          {/* Search + category filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="px-3 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary transition-colors w-48"
            />
            <div className="flex gap-1.5 flex-wrap">
              {ALL_CATS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-btn transition-colors
                    ${category === cat
                      ? cat === 'Featured' ? 'bg-yellow-400 text-yellow-900' : 'bg-primary text-white'
                      : cat === 'Featured'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100'
                        : 'bg-ds-card border border-ds-border text-ds-textMuted hover:text-ds-text'}`}
                >
                  {cat === 'Featured' ? '★ Featured' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Template grid */}
          {filtered.length === 0 ? (
            <p className="text-center text-ds-textMuted py-8">No templates match your search.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => setPreviewTpl(t)}
                  className="cursor-pointer"
                >
                  <TemplatePreviewCard
                    templateId={t.id}
                    active={selectedTemplate === t.id}
                    label={t.name}
                    style={t.style}
                    plan={t.plan}
                    featured={isFeatured(t.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview modal */}
        {previewTpl && (
          <TemplatePreviewModal
            tpl={previewTpl}
            filtered={filtered}
            isFeatured={isFeatured}
            onClose={handleModalClose}
            onUse={handleUseTemplate}
          />
        )}
      </>
    );
  }

  // ── Title / how-to-start step ────────────────────────────────────────────────
  if (step === 'title') {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-lg">
        <button onClick={() => setStep('template')} className="text-sm text-ds-textMuted hover:text-ds-text transition-colors mb-4 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <h1 className="font-heading text-xl font-bold text-ds-text mb-1">Name your resume</h1>
        <p className="text-sm text-ds-textMuted mb-5">Give it a name so you can find it later.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide block mb-1">Resume Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer Resume"
              maxLength={100}
              className="w-full px-3 py-2 border border-ds-inputBorder rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          {/* Start blank or import */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide block">How to start</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setImportMode('blank')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-colors ${importMode === 'blank' ? 'border-primary bg-primary/5' : 'border-ds-border hover:border-primary/40'}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/>
                  <path d="M14 3v6h6"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-ds-text">Start blank</p>
                  <p className="text-xs text-ds-textMuted">Build from scratch</p>
                </div>
              </button>
              <button
                onClick={() => setImportMode('import')}
                className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-colors ${importMode === 'import' ? 'border-primary bg-primary/5' : 'border-ds-border hover:border-primary/40'}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-ds-text">Import resume</p>
                  <p className="text-xs text-ds-textMuted">Upload PDF or DOCX</p>
                </div>
              </button>
            </div>
          </div>

          {importMode === 'import' && (
            <div>
              <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide block mb-1">Upload file</label>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-ds-text file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
              />
              {importFile && (
                <p className="text-xs text-ds-success mt-1">✓ {importFile.name}</p>
              )}
            </div>
          )}

          {createMutation.isError && (
            <div className="px-3 py-2 bg-ds-dangerLight rounded text-xs text-ds-danger">
              {createMutation.error?.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || (importMode === 'import' && !importFile)}
              className="flex-1 px-5 py-2.5 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {createMutation.isPending
                ? (importMode === 'import' ? 'Importing…' : 'Creating…')
                : 'Create Resume'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
