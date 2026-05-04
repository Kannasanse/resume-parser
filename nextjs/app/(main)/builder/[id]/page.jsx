'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { TEMPLATES, SECTION_TYPES, getDefaultContent, resolveDesign } from '@/components/builder/templates.js';
import SectionList from '@/components/builder/SectionList.jsx';
import SectionEditor from '@/components/builder/SectionEditor.jsx';
import DesignPanel from '@/components/builder/DesignPanel.jsx';
import ResumePreview from '@/components/builder/ResumePreview.jsx';
import TemplateGallery from '@/components/builder/TemplateGallery.jsx';
import ShareModal from '@/components/builder/ShareModal.jsx';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

// ── Save pill ─────────────────────────────────────────────────────────────────

function SavePill({ state }) {
  if (state === 'saving') return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      Saving…
    </span>
  );
  if (state === 'error') return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold bg-ds-dangerLight border border-ds-danger/30 text-ds-danger">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Save failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold bg-ds-successLight border border-ds-success/30 text-ds-success">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      All changes saved
    </span>
  );
}

// ── Personal info card ────────────────────────────────────────────────────────

function PersonalInfoCard({ info, onChange }) {
  const set = (k, v) => onChange({ ...info, [k]: v });
  const Field = ({ label, k, placeholder, type = 'text', span2 = false }) => (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-ds-textMuted mb-1">{label}</label>
      <input
        defaultValue={info[k] || ''}
        onBlur={(e) => set(k, e.target.value.replace(/<[^>]*>/g, ''))}
        placeholder={placeholder}
        type={type}
        className="w-full px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded-md bg-white text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
      />
    </div>
  );

  return (
    <div className="mb-3.5 rounded-lg border border-ds-border overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-3.5 py-3 bg-ds-card border-b border-ds-border">
        <div className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-ds-text">Personal details</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3 bg-white">
        <Field label="Full name" k="name" placeholder="Jane Smith" />
        <Field label="Job title" k="title" placeholder="Software Engineer" />
        <Field label="Email" k="email" placeholder="jane@example.com" type="email" />
        <Field label="Phone" k="phone" placeholder="+1 (555) 000-0000" />
        <Field label="Location" k="location" placeholder="New York, NY" />
        <Field label="Website" k="website" placeholder="janesmith.com" />
        <Field label="LinkedIn" k="linkedin" placeholder="linkedin.com/in/jane" />
        <Field label="GitHub" k="github" placeholder="github.com/jane" />
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-ds-textMuted mb-1">Profile Summary</label>
          <textarea
            defaultValue={info.summary || ''}
            onBlur={(e) => set('summary', e.target.value.replace(/<[^>]*>/g, ''))}
            placeholder="Brief professional summary…"
            rows={3}
            className="w-full px-2.5 py-1.5 text-sm border border-ds-inputBorder rounded-md bg-white text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-y"
          />
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

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
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg border shadow-xl text-sm font-semibold ${colors[type]}`}>
      {message}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export default function BuilderEditor() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeSectionId, setActiveSectionId] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDesign, setShowDesign] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [sectionSaveStatus, setSectionSaveStatus] = useState({});
  const [toast, setToast] = useState(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [zoom, setZoom] = useState(0.72);
  const debounceRefs = useRef({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['builder-resume', id],
    queryFn: () => getBuilderResume(id),
  });

  const resume = data?.data;
  const sections = resume?.sections || [];
  const personalInfo = resume?.personal_info || {};
  const designSettings = resume?.design_settings || {};

  const [previewResume, setPreviewResume] = useState(null);
  useEffect(() => { if (resume) setPreviewResume(resume); }, [resume]);

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  // ── Save state derived from mutations ─────────────────────────────────────

  const updateResumeMutation = useMutation({
    mutationFn: (patch) => updateBuilderResume(id, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(['builder-resume', id], (old) =>
        old ? { ...old, data: { ...old.data, ...res.data } } : old
      );
    },
    onError: () => showToast("We couldn't save your changes. Please try again.", 'error'),
  });

  const saveState = useMemo(() => {
    if (updateResumeMutation.isPending) return 'saving';
    if (Object.values(sectionSaveStatus).some(s => s === 'saving')) return 'saving';
    if (updateResumeMutation.isError) return 'error';
    if (Object.values(sectionSaveStatus).some(s => s === 'error')) return 'error';
    return 'saved';
  }, [updateResumeMutation.isPending, updateResumeMutation.isError, sectionSaveStatus]);

  // ── Section mutations ─────────────────────────────────────────────────────

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

  // ── Debounced section save ────────────────────────────────────────────────

  const debouncedSaveSection = useCallback((sectionId, patch) => {
    setSectionSaveStatus(s => ({ ...s, [sectionId]: 'saving' }));
    if (debounceRefs.current[sectionId]) clearTimeout(debounceRefs.current[sectionId]);
    debounceRefs.current[sectionId] = setTimeout(async () => {
      try {
        await updateBuilderSection(id, sectionId, patch);
        setSectionSaveStatus(s => ({ ...s, [sectionId]: 'saved' }));
        queryClient.setQueryData(['builder-resume', id], (old) => {
          if (!old) return old;
          return { ...old, data: { ...old.data, sections: old.data.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s) } };
        });
        setTimeout(() => setSectionSaveStatus(s => ({ ...s, [sectionId]: null })), 2000);
      } catch {
        setSectionSaveStatus(s => ({ ...s, [sectionId]: 'error' }));
        showToast("Changes couldn't be saved. Please try again.", 'error');
      }
    }, 1200);
  }, [id, queryClient, showToast]);

  const handleSectionContentChange = useCallback((sectionId, content) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, content } : s) };
    });
    debouncedSaveSection(sectionId, { content });
  }, [debouncedSaveSection]);

  const handleSectionTitleChange = useCallback((sectionId, title) => {
    if (!title.trim()) return;
    setPreviewResume(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, title } : s) };
    });
    debouncedSaveSection(sectionId, { title });
  }, [debouncedSaveSection]);

  const handleToggleSection = useCallback((sectionId, enabled) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, enabled } : s) };
    });
    debouncedSaveSection(sectionId, { enabled });
  }, [debouncedSaveSection]);

  // ── Personal info debounce ────────────────────────────────────────────────

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
    if (t && t !== resume?.title) updateResumeMutation.mutate({ title: t });
    setTitleEditing(false);
  };

  // ── Active section ────────────────────────────────────────────────────────

  const previewSection = previewResume?.sections?.find(s => s.id === activeSectionId) || null;

  // ── Page dimensions for zoom ──────────────────────────────────────────────

  const design = resolveDesign(previewResume?.design_settings || {});
  const page = design.page;

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Topbar skeleton */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-ds-border bg-ds-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sk className="h-4 w-20" />
            <Sk className="h-4 w-4" />
            <Sk className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Sk className="h-7 w-28 rounded-full" />
            <Sk className="h-8 w-24 rounded-btn" />
            <Sk className="h-8 w-20 rounded-btn" />
          </div>
        </div>
        {/* Body skeleton */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left pane */}
          <div className="w-[340px] flex-shrink-0 border-r border-ds-border bg-ds-bg overflow-y-auto p-3 space-y-2.5">
            {/* PersonalInfoCard skeleton */}
            <div className="rounded-lg border border-ds-border bg-ds-card overflow-hidden">
              <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-ds-border">
                <Sk className="w-8 h-8 rounded-md" />
                <Sk className="h-4 w-32" />
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Sk className="h-3 w-20" />
                    <Sk className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            {/* Section card skeletons */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-ds-border bg-ds-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-3.5 py-3">
                  <Sk className="w-8 h-8 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="h-4 w-32" />
                    <Sk className="h-3 w-20" />
                  </div>
                  <Sk className="w-4 h-4 rounded" />
                </div>
              </div>
            ))}
          </div>
          {/* Right pane — preview */}
          <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-ds-border bg-ds-card flex-shrink-0">
              <Sk className="h-4 w-28" />
              <div className="flex items-center gap-2">
                <Sk className="h-7 w-24 rounded-full" />
                <Sk className="h-7 w-20 rounded-btn" />
              </div>
            </div>
            <div className="flex-1 flex items-start justify-center pt-8 overflow-auto">
              <Sk className="rounded shadow-lg" style={{ width: 480, height: 680 }} />
            </div>
          </div>
        </div>
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
  const templateName = TEMPLATES?.find(t => t.id === previewData.template_id)?.name || previewData.template_id;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-14 bg-white border-b border-ds-border flex-shrink-0">
        {/* Back */}
        <Link href="/builder" className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-ds-textMuted hidden sm:inline">My resumes</span>
          <span className="text-ds-border hidden sm:inline">›</span>
          {titleEditing ? (
            <input
              defaultValue={resume.title}
              autoFocus
              onBlur={(e) => handleTitleBlur(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              className="font-semibold text-ds-text border border-primary rounded px-2 py-0.5 text-sm bg-white focus:outline-none min-w-0 max-w-48"
            />
          ) : (
            <button
              onClick={() => setTitleEditing(true)}
              className="font-semibold text-ds-text hover:text-primary transition-colors truncate max-w-48"
              title="Click to rename"
            >
              {resume.title}
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Save pill */}
        <SavePill state={saveState} />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowImport(true)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-ds-border text-ds-text rounded-md hover:bg-ds-bg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <button
            onClick={() => setShowGallery(true)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-ds-border text-ds-text rounded-md hover:bg-ds-bg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Templates
          </button>
          <button
            onClick={() => setShowDesign(d => !d)}
            className={`flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border rounded-md transition-colors
              ${showDesign ? 'bg-primary/10 border-primary/40 text-primary' : 'border-ds-border text-ds-text hover:bg-ds-bg'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
            Design
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-ds-border text-ds-text rounded-md hover:bg-ds-bg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
          <button
            onClick={() => window.open(`/print/${id}`, '_blank')}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Editor pane */}
        <div className="flex-1 overflow-y-auto border-r border-ds-border bg-white">
          <div className="px-7 py-6 max-w-2xl">
            <div className="mb-5">
              <h1 className="font-heading text-2xl font-bold text-ds-text">Build your resume</h1>
              <p className="text-sm text-ds-textMuted mt-1">Edit any section — your preview updates in real time.</p>
            </div>

            {/* Personal details card */}
            <PersonalInfoCard info={personalInfo} onChange={handlePersonalInfoChange} />

            {/* Section list */}
            <SectionList
              sections={previewData.sections || []}
              activeSectionId={activeSectionId}
              onSelect={setActiveSectionId}
              onReorder={handleReorder}
              onDelete={(sectionId) => deleteSectionMutation.mutate(sectionId)}
              onToggle={handleToggleSection}
              onAddSection={handleAddSection}
              SectionEditorComponent={previewSection ? () => (
                <SectionEditor
                  section={previewSection}
                  onContentChange={(content) => handleSectionContentChange(previewSection.id, content)}
                  onTitleChange={(title) => handleSectionTitleChange(previewSection.id, title)}
                  saveStatus={sectionSaveStatus[previewSection.id]}
                />
              ) : null}
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center py-6 gap-5 bg-[#f2f3f5]">
          {/* Preview toolbar */}
          <div className="flex items-center gap-1 px-2 py-1 bg-white border border-ds-border rounded-full shadow-sm text-xs flex-shrink-0">
            <button
              onClick={() => setZoom(z => Math.max(0.35, parseFloat((z - 0.1).toFixed(1))))}
              className="w-6 h-6 flex items-center justify-center rounded-full text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
              title="Zoom out"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <span className="font-semibold text-ds-text tabular-nums min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(1.2, parseFloat((z + 0.1).toFixed(1))))}
              className="w-6 h-6 flex items-center justify-center rounded-full text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
              title="Zoom in"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <div className="w-px h-3.5 bg-ds-border mx-1" />
            <span className="font-semibold text-ds-text">{page.id === 'letter' ? 'Letter' : 'A4'}</span>
            <span className="text-ds-textMuted">·</span>
            <span className="text-ds-textMuted">{templateName}</span>
          </div>

          {/* Resume paper */}
          <div
            style={{ width: page.width * zoom, minHeight: page.height * zoom, flexShrink: 0 }}
          >
            <div style={{
              width: page.width,
              minHeight: page.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              boxShadow: '0 4px 24px rgba(23,26,69,.10), 0 0 0 1px rgba(0,0,0,.05)',
              background: '#fff',
            }}>
              <ResumePreview
                resume={previewData}
                designSettings={previewData.design_settings || {}}
                scale={1}
              />
            </div>
          </div>
        </div>

        {/* Design panel overlay */}
        {showDesign && (
          <div className="absolute right-0 inset-y-0 w-72 bg-white border-l border-ds-border shadow-2xl z-30 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ds-border flex-shrink-0">
              <h3 className="font-heading font-bold text-sm text-ds-text">Design</h3>
              <button
                onClick={() => setShowDesign(false)}
                className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:bg-ds-bg hover:text-ds-text transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DesignPanel design={designSettings} onChange={handleDesignChange} />
            </div>
          </div>
        )}
      </div>

      {/* Template gallery overlay */}
      {showGallery && (
        <TemplateGallery
          currentTemplateId={previewData.template_id}
          onSelect={handleTemplateSelect}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowImport(false)} />
          <div className="relative bg-white border border-ds-border rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-heading font-bold text-ds-text">Import Resume</h3>
            <p className="text-sm text-ds-textSecondary">
              Upload a PDF or DOCX file. We'll extract your information and populate the editor.
              <strong className="text-ds-danger"> This will replace all current sections.</strong>
            </p>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={e => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-ds-text file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
            />
            {importFile && <p className="text-xs text-ds-success">✓ {importFile.name}</p>}
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

      {/* Share modal */}
      {showShare && <ShareModal resumeId={id} onClose={() => setShowShare(false)} />}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
