'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createBuilderResume, createBuilderSection, importResumeFile } from '@/lib/builderApi';
import { TEMPLATES, TEMPLATE_CATEGORIES, SECTION_TYPES, getDefaultContent } from '@/components/builder/templates.js';
import { TemplateThumbnail } from '@/components/builder/ResumePreview.jsx';

const DEFAULT_SECTIONS = ['summary', 'work_experience', 'education', 'skills'];

export default function NewResumePage() {
  const router = useRouter();
  const [step, setStep] = useState('template'); // 'template' | 'title' | 'import'
  const [selectedTemplate, setSelectedTemplate] = useState('classic-professional');
  const [category, setCategory] = useState('All');
  const [title, setTitle] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState('blank'); // 'blank' | 'import'

  const createMutation = useMutation({
    mutationFn: async () => {
      // Create the resume
      const res = await createBuilderResume({ title: title.trim() || 'Untitled Resume', template_id: selectedTemplate });
      const resumeId = res.data.id;

      // Add default sections if starting blank
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

      // Import from file if selected
      if (importMode === 'import' && importFile) {
        await importResumeFile(resumeId, importFile);
      }

      return resumeId;
    },
    onSuccess: (id) => {
      router.push(importMode === 'import' ? `/builder/${id}/review` : `/builder/${id}`);
    },
  });

  const filtered = TEMPLATES.filter(t => category === 'All' || t.style === category);

  if (step === 'template') {
    return (
      <div className="space-y-5 max-w-4xl">
        <div>
          <button onClick={() => router.push('/builder')} className="text-sm text-ds-textMuted hover:text-ds-text transition-colors mb-4 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <h1 className="font-heading text-xl font-bold text-ds-text">Choose a Template</h1>
          <p className="text-sm text-ds-textMuted mt-0.5">Select a template to start building your resume.</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-btn transition-colors
                ${category === cat ? 'bg-primary text-white' : 'bg-ds-card border border-ds-border text-ds-textMuted hover:text-ds-text'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className="cursor-pointer"
            >
              <TemplateThumbnail
                templateId={t.id}
                active={selectedTemplate === t.id}
                label={t.name}
                style={t.style}
                plan={t.plan}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setStep('title')}
            className="px-6 py-2.5 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'title') {
    return (
      <div className="max-w-lg">
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
                <p className="text-xs text-ds-success mt-1">
                  ✓ {importFile.name}
                </p>
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
