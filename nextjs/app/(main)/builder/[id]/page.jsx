'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuilderResume,
  updateBuilderResume,
  createBuilderSection,
  updateBuilderSection,
  deleteBuilderSection,
  reorderBuilderSections,
  importResumeFile,
} from '@/lib/builderApi';
import { TEMPLATES, SECTION_TYPES, getDefaultContent } from '@/components/builder/templates.js';
import SectionList from '@/components/builder/SectionList.jsx';
import SectionEditor from '@/components/builder/SectionEditor.jsx';
import DesignPanel from '@/components/builder/DesignPanel.jsx';
import ResumePreview from '@/components/builder/ResumePreview.jsx';
import TemplateGallery from '@/components/builder/TemplateGallery.jsx';
import Link from 'next/link';

// ── Personal info editor ──────────────────────────────────────────────────────

function PersonalInfoEditor({ info, onChange }) {
  const set = (k, v) => onChange({ ...info, [k]: v });
  const Field = ({ label, k, placeholder, type = 'text' }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">{label}</label>
      <input
        defaultValue={info[k] || ''}
        onBlur={(e) => set(k, e.target.value.replace(/<[^>]*>/g, ''))}
        placeholder={placeholder}
        type={type}
        className="w-full px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
      />
    </div>
  );
  return (
    <div className="p-3 space-y-2">
      <Field label="Full Name" k="name" placeholder="Jane Smith" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Email" k="email" placeholder="jane@example.com" type="email" />
        <Field label="Phone" k="phone" placeholder="+1 (555) 000-0000" />
      </div>
      <Field label="Location" k="location" placeholder="New York, NY" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="LinkedIn" k="linkedin" placeholder="linkedin.com/in/jane" />
        <Field label="GitHub" k="github" placeholder="github.com/jane" />
      </div>
      <Field label="Website" k="website" placeholder="janesmith.com" />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Profile Summary</label>
        <textarea
          defaultValue={info.summary || ''}
          onBlur={(e) => set('summary', e.target.value.replace(/<[^>]*>/g, ''))}
          placeholder="Brief professional summary..."
          rows={3}
          className="w-full px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y"
        />
      </div>
    </div>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────

function Toast({ message, type = 'info', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = {
    info: 'bg-ds-card border-ds-border text-ds-text',
    success: 'bg-ds-successLight border-ds-success/30 text-ds-success',
    error: 'bg-ds-dangerLight border-ds-danger/30 text-ds-danger',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg border shadow-lg text-sm font-medium ${colors[type]}`}>
      {message}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export default function BuilderEditor() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'design' | 'personal'
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [sectionSaveStatus, setSectionSaveStatus] = useState({});
  const [toast, setToast] = useState(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const debounceRefs = useRef({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['builder-resume', id],
    queryFn: () => getBuilderResume(id),
  });

  const resume = data?.data;
  const sections = resume?.sections || [];
  const personalInfo = resume?.personal_info || {};
  const designSettings = resume?.design_settings || {};
  const templateId = resume?.template_id || 'classic-professional';

  // ── Preview state (debounced copy of resume) ──────────────────────────────
  const [previewResume, setPreviewResume] = useState(null);

  useEffect(() => {
    if (resume) setPreviewResume(resume);
  }, [resume]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateResumeMutation = useMutation({
    mutationFn: (patch) => updateBuilderResume(id, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(['builder-resume', id], (old) =>
        old ? { ...old, data: { ...old.data, ...res.data } } : old
      );
    },
    onError: () => showToast("We couldn't save your changes. Please try again.", 'error'),
  });

  const addSectionMutation = useMutation({
    mutationFn: (payload) => createBuilderSection(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-resume', id] });
      showToast('Section added.', 'success');
    },
    onError: () => showToast("We couldn't add the section. Please try again.", 'error'),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId) => deleteBuilderSection(id, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-resume', id] });
      setActiveSectionId(null);
      showToast('Section removed.', 'success');
    },
    onError: () => showToast("We couldn't remove the section. Please try again.", 'error'),
  });

  const reorderMutation = useMutation({
    mutationFn: (order) => reorderBuilderSections(id, order),
    onSuccess: (res) => {
      queryClient.setQueryData(['builder-resume', id], (old) =>
        old ? { ...old, data: { ...old.data, sections: res.data } } : old
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-resume', id] });
      showToast("We couldn't save the new order. Please try again.", 'error');
    },
  });

  const importMutation = useMutation({
    mutationFn: (file) => importResumeFile(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-resume', id] });
      setShowImport(false);
      setImportFile(null);
      showToast('Resume imported successfully.', 'success');
    },
    onError: () => showToast("We couldn't parse the file. Please try again.", 'error'),
  });

  // ── Debounced section save ─────────────────────────────────────────────────

  const debouncedSaveSection = useCallback((sectionId, patch) => {
    setSectionSaveStatus(s => ({ ...s, [sectionId]: 'saving' }));

    if (debounceRefs.current[sectionId]) clearTimeout(debounceRefs.current[sectionId]);
    debounceRefs.current[sectionId] = setTimeout(async () => {
      try {
        await updateBuilderSection(id, sectionId, patch);
        setSectionSaveStatus(s => ({ ...s, [sectionId]: 'saved' }));
        queryClient.setQueryData(['builder-resume', id], (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              sections: old.data.sections.map(s =>
                s.id === sectionId ? { ...s, ...patch } : s
              ),
            },
          };
        });
        setTimeout(() => setSectionSaveStatus(s => ({ ...s, [sectionId]: null })), 2000);
      } catch {
        setSectionSaveStatus(s => ({ ...s, [sectionId]: 'error' }));
        showToast("Changes couldn't be saved. Please try again.", 'error');
      }
    }, 1200);
  }, [id, queryClient, showToast]);

  // Update preview optimistically on section content change
  const handleSectionContentChange = useCallback((sectionId, content) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, content } : s),
      };
    });
    debouncedSaveSection(sectionId, { content });
  }, [debouncedSaveSection]);

  const handleSectionTitleChange = useCallback((sectionId, title) => {
    if (!title.trim()) return;
    setPreviewResume(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, title } : s),
      };
    });
    debouncedSaveSection(sectionId, { title });
  }, [debouncedSaveSection]);

  const handleToggleSection = useCallback((sectionId, enabled) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, enabled } : s),
      };
    });
    debouncedSaveSection(sectionId, { enabled });
  }, [debouncedSaveSection]);

  // ── Personal info debounce ─────────────────────────────────────────────────

  const piDebounceRef = useRef(null);
  const handlePersonalInfoChange = useCallback((pi) => {
    setPreviewResume(prev => prev ? { ...prev, personal_info: pi } : prev);
    if (piDebounceRef.current) clearTimeout(piDebounceRef.current);
    piDebounceRef.current = setTimeout(() => {
      updateResumeMutation.mutate({ personal_info: pi });
    }, 1200);
  }, [updateResumeMutation]);

  // ── Design change ─────────────────────────────────────────────────────────

  const designDebounceRef = useRef(null);
  const handleDesignChange = useCallback((ds) => {
    setPreviewResume(prev => prev ? { ...prev, design_settings: ds } : prev);
    if (designDebounceRef.current) clearTimeout(designDebounceRef.current);
    designDebounceRef.current = setTimeout(() => {
      updateResumeMutation.mutate({ design_settings: ds });
    }, 800);
  }, [updateResumeMutation]);

  // ── Template change ───────────────────────────────────────────────────────

  const handleTemplateSelect = useCallback((tplId) => {
    setPreviewResume(prev => prev ? { ...prev, template_id: tplId } : prev);
    updateResumeMutation.mutate({ template_id: tplId });
    setShowGallery(false);
    showToast('Template applied.', 'success');
  }, [updateResumeMutation, showToast]);

  // ── Reorder ───────────────────────────────────────────────────────────────

  const handleReorder = useCallback((orderedIds) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      const byId = Object.fromEntries(prev.sections.map(s => [s.id, s]));
      return { ...prev, sections: orderedIds.map(sid => byId[sid]).filter(Boolean) };
    });
    reorderMutation.mutate(orderedIds);
  }, [reorderMutation]);

  // ── Add section ───────────────────────────────────────────────────────────

  const handleAddSection = useCallback((sectionTypeDef) => {
    addSectionMutation.mutate({
      type: sectionTypeDef.id,
      title: sectionTypeDef.defaultTitle,
      content: getDefaultContent(sectionTypeDef.id),
      position: sections.length,
    });
  }, [addSectionMutation, sections.length]);

  // ── Title update ──────────────────────────────────────────────────────────

  const handleTitleBlur = (v) => {
    const t = v.trim();
    if (t && t !== resume?.title) {
      updateResumeMutation.mutate({ title: t });
    }
    setTitleEditing(false);
  };

  // ── Active section ────────────────────────────────────────────────────────

  const activeSection = sections.find(s => s.id === activeSectionId) || null;
  // Keep preview section data in sync for the active section
  const previewSection = previewResume?.sections?.find(s => s.id === activeSectionId) || activeSection;

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center text-ds-textMuted">
        Loading editor…
      </div>
    );
  }
  if (error || !resume) {
    return (
      <div className="p-8 text-center">
        <p className="text-ds-danger mb-3">Resume not found.</p>
        <Link href="/builder" className="text-sm text-primary hover:underline">← Back to My Resumes</Link>
      </div>
    );
  }

  const previewData = previewResume || resume;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-ds-card border-b border-ds-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/builder" className="flex-shrink-0 text-ds-textMuted hover:text-ds-text transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          {titleEditing ? (
            <input
              defaultValue={resume.title}
              autoFocus
              onBlur={(e) => handleTitleBlur(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              className="text-sm font-semibold border border-primary rounded px-2 py-0.5 bg-ds-card text-ds-text focus:outline-none min-w-0 max-w-48"
            />
          ) : (
            <button
              onClick={() => setTitleEditing(true)}
              className="text-sm font-semibold text-ds-text hover:text-primary transition-colors truncate max-w-48"
              title="Click to rename"
            >
              {resume.title}
            </button>
          )}
          {updateResumeMutation.isPending && (
            <span className="text-xs text-ds-textMuted flex items-center gap-1 flex-shrink-0">
              <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block" />
              Saving
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Import */}
          <button
            onClick={() => setShowImport(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-ds-border text-ds-text rounded hover:bg-ds-bg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          {/* Change template */}
          <button
            onClick={() => setShowGallery(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-ds-border text-ds-text rounded hover:bg-ds-bg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Templates
          </button>
        </div>
      </div>

      {/* Body: left panel + preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[380px] flex-shrink-0 border-r border-ds-border bg-ds-card flex flex-col overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-ds-border flex-shrink-0">
            {[
              { id: 'personal', label: 'Personal' },
              { id: 'content', label: 'Sections' },
              { id: 'design', label: 'Design' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); if (t.id !== 'content') setActiveSectionId(null); }}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2
                  ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-ds-textMuted hover:text-ds-text'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'personal' && (
              <div className="h-full overflow-y-auto">
                <PersonalInfoEditor
                  info={personalInfo}
                  onChange={handlePersonalInfoChange}
                />
              </div>
            )}

            {activeTab === 'content' && (
              <SectionList
                sections={previewData.sections || []}
                activeSectionId={activeSectionId}
                onSelect={setActiveSectionId}
                onReorder={handleReorder}
                onDelete={(sectionId) => deleteSectionMutation.mutate(sectionId)}
                onToggle={handleToggleSection}
                onAddSection={handleAddSection}
                SectionEditorComponent={previewSection ? (props) => (
                  <SectionEditor
                    section={previewSection}
                    onContentChange={(content) => handleSectionContentChange(previewSection.id, content)}
                    onTitleChange={(title) => handleSectionTitleChange(previewSection.id, title)}
                    saveStatus={sectionSaveStatus[previewSection.id]}
                  />
                ) : null}
              />
            )}

            {activeTab === 'design' && (
              <DesignPanel
                design={designSettings}
                onChange={handleDesignChange}
              />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-200">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-ds-card border-b border-ds-border text-xs text-ds-textMuted flex-shrink-0">
            <span className="font-medium">Preview</span>
            <span>
              {(previewData.design_settings?.pageSize || 'a4').toUpperCase()} ·{' '}
              {TEMPLATES?.find?.(t => t.id === templateId)?.name || templateId}
            </span>
          </div>
          <ResumePreview
            resume={previewData}
            designSettings={previewData.design_settings || {}}
            className="flex-1"
          />
        </div>
      </div>

      {/* Template gallery overlay */}
      {showGallery && (
        <TemplateGallery
          currentTemplateId={templateId}
          onSelect={handleTemplateSelect}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowImport(false)} />
          <div className="relative bg-ds-card border border-ds-border rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-heading font-bold text-ds-text">Import Resume</h3>
            <p className="text-sm text-ds-textSecondary">
              Upload an existing PDF or DOCX file. We&apos;ll extract your information and populate the editor.
              <strong className="text-ds-warning"> This will replace all current sections.</strong>
            </p>
            <div>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-ds-text file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
              />
              {importFile && <p className="text-xs text-ds-success mt-1">✓ {importFile.name}</p>}
            </div>
            {importMutation.isError && (
              <p className="text-xs text-ds-danger">{importMutation.error?.message || 'Import failed. Try again.'}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => importMutation.mutate(importFile)}
                disabled={!importFile || importMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all"
              >
                {importMutation.isPending ? 'Importing…' : 'Import'}
              </button>
              <button
                onClick={() => { setShowImport(false); setImportFile(null); }}
                className="flex-1 px-4 py-2 border border-ds-border text-ds-text rounded text-sm hover:bg-ds-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
