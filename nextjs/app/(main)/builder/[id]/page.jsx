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
import { TEMPLATES, SECTION_TYPES, getDefaultContent, resolveDesign } from '@/components/builder/templates.js';
import SectionList from '@/components/builder/SectionList.jsx';
import SectionEditor from '@/components/builder/SectionEditor.jsx';
import DesignPanel from '@/components/builder/DesignPanel.jsx';
import ResumePreview from '@/components/builder/ResumePreview.jsx';
import TemplateGallery from '@/components/builder/TemplateGallery.jsx';
import ShareModal from '@/components/builder/ShareModal.jsx';
import ATSPanel from '@/components/builder/ATSPanel.jsx';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';


// ── Save button ───────────────────────────────────────────────────────────────

function SaveButton({ onClick, saving, saved, error }) {
  if (saving) return (
    <button disabled className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-xs font-semibold bg-primary/60 text-white cursor-not-allowed">
      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
      Saving…
    </button>
  );
  if (error) return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-xs font-semibold bg-ds-danger text-white hover:bg-ds-danger/90 transition-colors">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Retry save
    </button>
  );
  if (saved) return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-xs font-semibold bg-ds-successLight border border-ds-success/30 text-ds-success hover:bg-ds-success/10 transition-colors">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Saved
    </button>
  );
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Save
    </button>
  );
}

// ── Personal info card ────────────────────────────────────────────────────────

function PersonalInfoCard({ info, onChange, resumeId }) {
  const [open, setOpen] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef(null);
  const set = (k, v) => onChange({ ...info, [k]: v });

  const inputCls = 'w-full px-[10px] py-2 text-[13px] border border-ds-inputBorder rounded-[7px] bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-colors';

  const F = ({ label, k, placeholder, type = 'text' }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold text-ds-text">{label}</label>
      <input
        key={k + (info[k] || '')}
        defaultValue={info[k] || ''}
        onBlur={e => set(k, e.target.value.replace(/<[^>]*>/g, ''))}
        placeholder={placeholder}
        type={type}
        className={inputCls}
      />
    </div>
  );

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !resumeId) return;
    setPhotoLoading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`/api/v1/builder/${resumeId}/photo`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) onChange({ ...info, photo: data.url });
    } catch (err) {
      console.error('Photo upload failed:', err.message);
    } finally {
      setPhotoLoading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!resumeId) return;
    await fetch(`/api/v1/builder/${resumeId}/photo`, { method: 'DELETE' });
    const { photo: _, ...rest } = info;
    onChange(rest);
  };

  const initials = (info.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();

  return (
    <div className="border-b border-ds-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-[18px] py-[11px] text-left hover:bg-ds-bg/40 transition-colors"
      >
        <span className="flex-shrink-0 text-ds-textMuted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span className="flex-1 text-[13px] font-semibold text-ds-text">Personal Details</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 text-ds-textMuted"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-[18px] pb-4 flex flex-col gap-[10px]">
          {/* Photo upload */}
          <div className="flex items-center gap-3 py-1">
            <div className="relative flex-shrink-0">
              <div
                className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-ds-border bg-ds-bg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                {info.photo ? (
                  <img src={info.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[18px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #94A3B8, #64748B)' }}>
                    {initials || (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                  </div>
                )}
                {photoLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
                className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 text-left"
              >
                {info.photo ? 'Change photo' : 'Upload photo'}
              </button>
              {info.photo && (
                <button
                  onClick={handleRemovePhoto}
                  className="text-xs text-ds-textMuted hover:text-ds-danger transition-colors text-left"
                >
                  Remove
                </button>
              )}
              <p className="text-[11px] text-ds-textMuted leading-tight">JPG, PNG or WebP · Max 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <F label="Full name" k="name" placeholder="Jane Smith" />
          <F label="Job title" k="title" placeholder="Software Engineer" />
          <div className="grid grid-cols-2 gap-2">
            <F label="Email" k="email" placeholder="jane@example.com" type="email" />
            <F label="Phone" k="phone" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Location" k="location" placeholder="New York, NY" />
            <F label="Link" k="link" placeholder="linkedin.com/in/jane" />
          </div>
        </div>
      )}
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

// ── Export & Share dropdown ───────────────────────────────────────────────────

function ExportShareButton({ resumeId, onShare }) {
  const [open, setOpen] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const downloadPdf = async () => {
    setPdfLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/v1/builder/${resumeId}/export/pdf`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match ? match[1] : 'Resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadWord = async () => {
    setWordLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/v1/builder/${resumeId}/export/word`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match ? match[1] : 'Resume.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Word export failed: ' + err.message);
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 1 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-ds-card border border-ds-border rounded-xl shadow-xl z-50 overflow-hidden min-w-[200px]">
          {/* Share */}
          <button
            onClick={() => { onShare(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ds-text hover:bg-ds-bg transition-colors"
          >
            <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </span>
            <div className="text-left">
              <div className="font-semibold text-[12px]">Share link</div>
              <div className="text-[11px] text-ds-textMuted">Copy a shareable URL</div>
            </div>
          </button>

          <div className="h-px bg-ds-border mx-3" />

          {/* PDF */}
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ds-text hover:bg-ds-bg transition-colors disabled:opacity-60"
          >
            <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </span>
            <div className="text-left">
              <div className="font-semibold text-[12px]">{pdfLoading ? 'Generating PDF…' : 'Download PDF'}</div>
              <div className="text-[11px] text-ds-textMuted">ATS-friendly text-based PDF</div>
            </div>
          </button>

          {/* Word */}
          <button
            onClick={downloadWord}
            disabled={wordLoading}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-ds-text hover:bg-ds-bg transition-colors disabled:opacity-50"
          >
            <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              {wordLoading
                ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <path d="M9 13l2 2 4-4"/>
                  </svg>
              }
            </span>
            <div className="text-left">
              <div className="font-semibold text-[12px]">{wordLoading ? 'Generating…' : 'Download Word'}</div>
              <div className="text-[11px] text-ds-textMuted">.docx format</div>
            </div>
          </button>
        </div>
      )}
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
  const [importFile, setImportFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [zoom, setZoom] = useState(0.72);
  const [mobileTab, setMobileTab] = useState('edit'); // 'edit' | 'preview'
  const [panelMode, setPanelMode] = useState('content'); // 'content' | 'customize'
  const [customizeTab, setCustomizeTab] = useState('design'); // 'design' | 'spacing' | 'sections'
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [showATS, setShowATS] = useState(false);
  const [atsState, setAtsState] = useState('idle');
  const [atsData, setAtsData] = useState(null);
  const [atsError, setAtsError] = useState('');
  const [atsStale, setAtsStale] = useState(false);
  const atsLastScoredAt = useRef(null);

  const [insufficientCredits, setInsufficientCredits] = useState(null); // { message }

  const handleAnalyzeATS = useCallback(async (jobDescription = null) => {
    setAtsState('loading');
    setAtsError('');
    setAtsStale(false);
    try {
      const res = await fetch(`/api/v1/builder/${id}/ats-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobDescription || '' }),
      });
      const json = await res.json();
      if (res.status === 402 && json.code === 'insufficient_credits') {
        setAtsState('idle');
        setInsufficientCredits({ message: json.error });
        return;
      }
      if (res.status === 422) {
        setAtsState('error');
        setAtsError(json.error || 'Validation error');
        return;
      }
      if (res.status === 504) {
        setAtsState('error');
        setAtsError('Scoring is taking longer than expected. Please try again.');
        return;
      }
      if (!res.ok) throw new Error(json.error || "We couldn't generate your score right now. Please try again in a moment.");
      setAtsData(json);
      setAtsState('done');
      atsLastScoredAt.current = Date.now();
    } catch (err) {
      setAtsError(err.message);
      setAtsState('error');
    }
  }, [id]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['builder-resume', id],
    queryFn: () => getBuilderResume(id),
  });

  const resume = data?.data;
  const sections = resume?.sections || [];
  const personalInfo = resume?.personal_info || {};
  const footerSettings = resume?.footer_settings || { pageNumbers: false, email: false, name: false };
  const spacingSettings = resume?.spacing_settings || { fontSize: 11, lineHeight: 1.15, marginTop: 15, marginBottom: 15, marginLeft: 15, marginRight: 15, entrySpacing: 2 };
  const layoutSettings = resume?.layout_settings || { columnLayout: 'one', sectionColumns: {}, pageBreaks: [], titleSize: 'medium', subtitleSize: 'medium', listStyle: 'bullet', headingIcon: 'none' };

  const [previewResume, setPreviewResume] = useState(null);
  useEffect(() => { if (resume) setPreviewResume(resume); }, [resume]);

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  // ── Mutations (structural ops still save instantly) ───────────────────────

  const updateResumeMutation = useMutation({
    mutationFn: (patch) => updateBuilderResume(id, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(['builder-resume', id], (old) =>
        old ? { ...old, data: { ...old.data, ...res.data } } : old
      );
    },
    onError: () => showToast("We couldn't save your changes. Please try again.", 'error'),
  });

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
    onError: (err) => {
      if (err?.code === 'insufficient_credits') {
        setShowImport(false);
        setInsufficientCredits({ message: err.message });
      } else {
        showToast("We couldn't parse the file. Please try again.", 'error');
      }
    },
  });

  // ── Local-only change handlers (preview updates; saved on explicit Save) ──

  const handleSectionContentChange = useCallback((sectionId, content) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, content } : s) };
    });
    setSaveState('idle');
    setAtsStale(true);
  }, []);

  const handleSectionTitleChange = useCallback((sectionId, title) => {
    if (!title.trim()) return;
    setPreviewResume(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, title } : s) };
    });
    setSaveState('idle');
    setAtsStale(true);
  }, []);

  const handleToggleSection = useCallback((sectionId, enabled) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, enabled } : s) };
    });
    setSaveState('idle');
    setAtsStale(true);
  }, []);

  const handlePersonalInfoChange = useCallback((pi) => {
    setPreviewResume(prev => prev ? { ...prev, personal_info: pi } : prev);
    setSaveState('idle');
    setAtsStale(true);
  }, []);

  const handleDesignChange = useCallback((ds) => {
    setPreviewResume(prev => prev ? { ...prev, design_settings: ds } : prev);
    setSaveState('idle');
  }, []);

  const handleFooterChange = useCallback((fs) => {
    setPreviewResume(prev => prev ? { ...prev, footer_settings: fs } : prev);
    setSaveState('idle');
  }, []);

  const handleSpacingChange = useCallback((ss) => {
    setPreviewResume(prev => prev ? { ...prev, spacing_settings: ss } : prev);
    setSaveState('idle');
  }, []);

  const handleLayoutChange = useCallback((ls) => {
    setPreviewResume(prev => prev ? { ...prev, layout_settings: ls } : prev);
    setSaveState('idle');
  }, []);

  // ── Single save ───────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!previewResume || saveState === 'saving') return;
    setSaveState('saving');
    try {
      // Save resume-level fields
      await updateBuilderResume(id, {
        personal_info: previewResume.personal_info,
        design_settings: previewResume.design_settings,
        spacing_settings: previewResume.spacing_settings,
        layout_settings: previewResume.layout_settings,
        footer_settings: previewResume.footer_settings,
      });
      // Save all sections
      await Promise.all(
        (previewResume.sections || []).map(s =>
          updateBuilderSection(id, s.id, { content: s.content, title: s.title, enabled: s.enabled, display_settings: s.display_settings })
        )
      );
      // Update query cache
      queryClient.setQueryData(['builder-resume', id], (old) =>
        old ? { ...old, data: { ...old.data, ...previewResume } } : old
      );
      setSaveState('saved');
      setTimeout(() => setSaveState(st => st === 'saved' ? 'idle' : st), 3000);
    } catch {
      setSaveState('error');
      showToast("Couldn't save. Please try again.", 'error');
    }
  }, [id, previewResume, saveState, queryClient, showToast]);

  const handleSectionDisplayChange = useCallback((sectionId, displaySettings) => {
    setPreviewResume(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, display_settings: displaySettings } : s) };
    });
    setSaveState('idle');
  }, []);

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
          <div className="w-[340px] flex-shrink-0 border-r border-ds-border bg-ds-card overflow-y-auto p-3 space-y-2.5">
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
          <div className="flex-1 bg-[#E6ECF2] flex flex-col overflow-hidden">
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
      <div className="flex items-center gap-3 px-4 h-14 bg-ds-card border-b border-ds-border flex-shrink-0">
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
              className="font-semibold text-ds-text border border-primary rounded px-2 py-0.5 text-sm bg-ds-card focus:outline-none min-w-0 max-w-48"
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

        {/* Save button */}
        <SaveButton
          onClick={handleSave}
          saving={saveState === 'saving'}
          saved={saveState === 'saved'}
          error={saveState === 'error'}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowATS(true)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-white rounded-md transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
              boxShadow: '0 0 12px rgba(139,92,246,0.5), 0 2px 6px rgba(99,102,241,0.3)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {atsData ? (
              <>ATS Score: <span style={{ marginLeft: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 5px' }}>{atsData.score}</span></>
            ) : 'Get ATS Score'}
          </button>
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
          <ExportShareButton resumeId={id} onShare={() => setShowShare(true)} />
        </div>
      </div>

      {/* ── Mobile tab bar ───────────────────────────────────────────────── */}
      <div className="flex md:hidden border-b border-ds-border bg-ds-card flex-shrink-0">
        <button
          onClick={() => setMobileTab('edit')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${mobileTab === 'edit' ? 'text-primary border-b-2 border-primary' : 'text-ds-textMuted'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${mobileTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-ds-textMuted'}`}
        >
          Preview
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Left panel (340px, Content / Customize) ───────────────────────── */}
        <div className={`${mobileTab === 'preview' ? 'hidden md:flex' : 'flex'} flex-col md:w-[340px] md:flex-none flex-1 border-r border-ds-border bg-ds-card overflow-hidden`}>

          {/* Sticky panel header */}
          <div className="flex-shrink-0 bg-ds-card border-b border-ds-border sticky top-0 z-10">
            <div className="px-[18px] pt-[14px] pb-[14px]">
              {/* Mode toggle */}
              <div className="flex p-1 bg-ds-bg rounded-[10px] gap-1">
                {[
                  { id: 'content', label: 'Content', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg> },
                  { id: 'customize', label: 'Customize', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPanelMode(m.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-[9px] px-3 text-[13px] font-semibold rounded-[7px] transition-all ${panelMode === m.id ? 'bg-ds-bg text-primary shadow-sm' : 'text-ds-textMuted hover:text-ds-text'}`}
                  >
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tabs row (Customize mode only) */}
            {panelMode === 'customize' && (
              <div className="flex border-t border-ds-border">
                {[
                  { id: 'design', label: 'Design' },
                  { id: 'spacing', label: 'Spacing' },
                  { id: 'sections', label: 'Sections' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setCustomizeTab(t.id)}
                    className={`flex-1 py-[10px] text-xs font-semibold text-center border-b-2 transition-colors ${customizeTab === t.id ? 'text-primary border-primary' : 'text-ds-textMuted border-transparent hover:text-ds-text'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable panel body */}
          <div className="flex-1 overflow-y-auto">
            {panelMode === 'content' ? (
              <div>
                {/* Personal details */}
                <PersonalInfoCard info={personalInfo} onChange={handlePersonalInfoChange} resumeId={id} />
                {/* Section list */}
                <SectionList
                  sections={previewData.sections || []}
                  activeSectionId={activeSectionId}
                  onSelect={setActiveSectionId}
                  onReorder={handleReorder}
                  onDelete={(sectionId) => deleteSectionMutation.mutate(sectionId)}
                  onToggle={handleToggleSection}
                  onAddSection={handleAddSection}
                  sectionEditorNode={previewSection ? (
                    <SectionEditor
                      section={previewSection}
                      onContentChange={(content) => handleSectionContentChange(previewSection.id, content)}
                      onTitleChange={(title) => handleSectionTitleChange(previewSection.id, title)}
                      resumeId={id}
                    />
                  ) : null}
                />
              </div>
            ) : (
              <DesignPanel
                activeTab={customizeTab}
                design={previewData.design_settings || {}}
                onChange={handleDesignChange}
                footerSettings={previewData.footer_settings || footerSettings}
                onFooterChange={handleFooterChange}
                spacingSettings={previewData.spacing_settings || spacingSettings}
                onSpacingChange={handleSpacingChange}
                layoutSettings={previewData.layout_settings || layoutSettings}
                onLayoutChange={handleLayoutChange}
                personalInfo={previewData.personal_info || {}}
                sections={previewData.sections || []}
                onSectionDisplayChange={handleSectionDisplayChange}
                onSectionReorder={handleReorder}
                onSectionToggle={handleToggleSection}
              />
            )}
          </div>
        </div>

        {/* Preview pane */}
        <div className={`${mobileTab === 'edit' ? 'hidden md:flex' : 'flex'} flex-col md:flex-1 flex-1 overflow-hidden bg-[#E6ECF2]`}>
          {/* Preview toolbar */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-ds-card border-b border-ds-border text-xs flex-shrink-0 justify-center">
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

          {/* Resume preview — single render, correct page breaks, no slicing math */}
          <ResumePreview
            resume={previewData}
            designSettings={previewData.design_settings || {}}
            scale={zoom}
            className="flex-1"
          />
        </div>

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
          <div className="relative bg-ds-card border border-ds-border rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
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

      {/* ATS panel */}
      {showATS && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[199]"
            onClick={() => setShowATS(false)}
          />
          <ATSPanel
            resumeId={id}
            onClose={() => setShowATS(false)}
            atsState={atsState}
            atsData={atsData}
            atsError={atsError}
            onAnalyze={handleAnalyzeATS}
            isStale={atsStale}
          />
        </>
      )}

      {/* Insufficient credits modal */}
      {insufficientCredits && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setInsufficientCredits(null)} />
          <div className="relative bg-ds-card border border-ds-border rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
              </svg>
            </div>
            <h3 className="font-bold text-ds-text mb-2">Not enough credits</h3>
            <p className="text-sm text-ds-textMuted mb-5">{insufficientCredits.message}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setInsufficientCredits(null)}
                className="h-9 px-4 text-sm font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg transition-colors">
                Dismiss
              </button>
              <a href="/credits"
                className="h-9 px-4 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center">
                View Credits →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
