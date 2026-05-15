'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import HeroEditor     from './editors/HeroEditor.jsx';
import StatsEditor    from './editors/StatsEditor.jsx';
import FeaturesEditor from './editors/FeaturesEditor.jsx';
import StepsEditor    from './editors/StepsEditor.jsx';
import PricingEditor  from './editors/PricingEditor.jsx';
import CtaEditor      from './editors/CtaEditor.jsx';
import FooterEditor   from './editors/FooterEditor.jsx';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = { primary: '#185FA5', dark: '#0C447C', light: '#E6F1FB', teal: '#1D9E75', charcoal: '#2C2C2A', secondary: '#6B7280', border: '#D1DCE8', surface: '#FFFFFF', bg: '#F4F8FC', error: '#D93025', warning: '#F59E0B' };

const SECTION_LABELS = { hero: 'Hero', stats: 'Social Proof', features: 'Features', steps: 'How It Works', pricing: 'Pricing', cta: 'CTA Banner', footer: 'Footer' };

// ── Snackbar ───────────────────────────────────────────────────────────────────
function Snackbar({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? C.error : type === 'warning' ? C.warning : C.teal;
  return (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: bg, color: '#fff', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
      {msg}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────
function Dialog({ title, body, onConfirm, onCancel, confirmLabel = 'Confirm', confirmStyle = 'primary' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onCancel} />
      <div style={{ position: 'relative', background: C.surface, borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(12,68,124,0.16)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, margin: '0 0 10px' }}>{title}</h2>
        <p style={{ fontSize: 14, color: C.secondary, margin: '0 0 24px', lineHeight: 1.6 }}>{body}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ fontSize: 14, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '8px 18px', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: confirmStyle === 'error' ? C.error : C.primary, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Section list item (sortable) ───────────────────────────────────────────────
function SectionListItem({ section, isSelected, onSelect, onToggleVisibility }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  return (
    <div ref={setNodeRef}
      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 10px', borderRadius: 8, borderLeft: isSelected ? `3px solid ${C.primary}` : '3px solid transparent', background: isSelected ? C.light : 'transparent', opacity: isDragging ? 0.7 : 1, transform: CSS.Transform.toString(transform), transition, cursor: 'default', boxSizing: 'border-box' }}
      onMouseEnter={e => { if (!isSelected && !isDragging) e.currentTarget.style.background = C.bg; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
      {/* Drag handle */}
      <button {...listeners} {...attributes} aria-label="Drag to reorder"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, background: 'none', border: 'none', cursor: 'grab', color: C.secondary, padding: 0, flexShrink: 0, touchAction: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
      </button>

      {/* Visibility toggle */}
      <button onClick={e => { e.stopPropagation(); onToggleVisibility(section.id); }} aria-label={section.is_visible ? 'Hide section' : 'Show section'}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, background: 'none', border: 'none', cursor: 'pointer', color: section.is_visible ? C.primary : C.secondary, padding: 0, flexShrink: 0 }}>
        {section.is_visible
          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        }
      </button>

      {/* Label */}
      <button onClick={() => onSelect(section.id)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: section.is_visible ? C.charcoal : C.secondary, fontStyle: section.is_visible ? 'normal' : 'italic', padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {SECTION_LABELS[section.section_type] || section.section_key}
      </button>
    </div>
  );
}

// ── Section editor header ──────────────────────────────────────────────────────
function EditorHeader({ section }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, margin: 0 }}>{SECTION_LABELS[section.section_type] || section.section_key}</h2>
        <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 99, padding: '2px 10px', background: section.is_visible ? '#D1FAE5' : '#F3F4F6', color: section.is_visible ? C.teal : C.secondary }}>
          {section.is_visible ? 'Visible' : 'Hidden'}
        </span>
      </div>
      <p style={{ fontSize: 12, color: C.secondary, margin: 0, fontFamily: 'monospace' }}>section_key: {section.section_key}</p>
      <div style={{ height: 1, background: C.border, marginTop: 16 }} />
    </div>
  );
}

// ── Bottom action bar ──────────────────────────────────────────────────────────
function BottomBar({ isDirty, isSaving, lastPublished, onSaveDraft, onPreview, onPublish }) {
  const fmt = (iso) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
  };

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: C.surface, borderTop: `1px solid ${C.border}`, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isDirty && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.warning, flexShrink: 0 }} />}
        <span style={{ fontSize: 13, color: C.secondary }}>
          {isDirty ? 'Unsaved changes' : lastPublished ? `Last published: ${fmt(lastPublished)}` : 'Not yet published'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSaveDraft} disabled={isSaving}
          style={{ fontSize: 13, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '7px 16px', background: 'transparent', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isSaving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-18 0"/></svg>}
          Save Draft
        </button>
        <button onClick={onPreview}
          style={{ fontSize: 13, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '7px 16px', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Preview
        </button>
        <button onClick={onPublish} disabled={isSaving}
          style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: C.primary, border: 'none', borderRadius: 8, padding: '7px 18px', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(12,68,124,0.20)' }}>
          {isSaving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-18 0"/></svg>}
          Publish Changes
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Skeleton loaders ───────────────────────────────────────────────────────────
function Skeleton({ h = 48, w = '100%', radius = 8 }) {
  return <div style={{ height: h, width: w, borderRadius: radius, background: 'linear-gradient(90deg, #e0e8f0 25%, #f0f5fa 50%, #e0e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CMS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function HomepageCMS() {
  const [sections,      setSections]      = useState([]);
  const [selected,      setSelected]      = useState(null); // section_key
  const [isDirty,       setIsDirty]       = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState(null);
  const [lastPublished, setLastPublished] = useState(null);
  const [snackbar,      setSnackbar]      = useState(null); // { msg, type }
  const [publishDialog, setPublishDialog] = useState(false);
  const [leaveDialog,   setLeaveDialog]   = useState(null); // { href } if set
  const pendingNavRef = useRef(null);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const res = await fetch('/api/v1/admin/homepage');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { sections: rows, lastPublished: lp } = await res.json();
      setSections(rows || []);
      setLastPublished(lp?.published_at || null);
      if (rows?.length) setSelected(rows[0].section_key);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Unsaved changes guard (browser back/close) ──────────────────────────────
  useEffect(() => {
    const fn = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const mark = () => setIsDirty(true);
  const toast = (msg, type = 'success') => setSnackbar({ msg, type });

  const updateSection = (key, patch) => {
    setSections(prev => prev.map(s => s.section_key === key ? { ...s, ...patch } : s));
    mark();
  };

  const toggleVisibility = (id) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, is_visible: !s.is_visible } : s));
    mark();
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleSectionDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex(s => s.id === active.id);
    const newIdx = sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSections(reordered);
    mark();
  };

  // ── Save draft ──────────────────────────────────────────────────────────────
  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/admin/homepage', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sections }) });
      if (!res.ok) throw new Error();
      setIsDirty(false);
      toast('Draft saved');
    } catch {
      toast('Failed to save. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Publish ─────────────────────────────────────────────────────────────────
  const publish = async () => {
    setPublishDialog(false);
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/admin/homepage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sections }) });
      if (!res.ok) throw new Error();
      const { published_at } = await res.json();
      setIsDirty(false);
      setLastPublished(published_at);
      toast('Homepage published successfully');
    } catch {
      toast('Publish failed. Your draft has been saved.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Current section ─────────────────────────────────────────────────────────
  const currentSection = sections.find(s => s.section_key === selected);

  const renderEditor = () => {
    if (!currentSection) return <p style={{ color: C.secondary, fontSize: 14 }}>Select a section from the left panel.</p>;
    const sectionProps = {
      content:         currentSection.content,
      section:         currentSection,
      onChange:        (content) => updateSection(currentSection.section_key, { content }),
      onSectionChange: (patch)   => updateSection(currentSection.section_key, patch),
    };
    switch (currentSection.section_type) {
      case 'hero':     return <HeroEditor     {...sectionProps} />;
      case 'stats':    return <StatsEditor    {...sectionProps} />;
      case 'features': return <FeaturesEditor {...sectionProps} />;
      case 'steps':    return <StepsEditor    {...sectionProps} />;
      case 'pricing':  return <PricingEditor  {...sectionProps} />;
      case 'cta':      return <CtaEditor      {...sectionProps} />;
      case 'footer':   return <FooterEditor   {...sectionProps} />;
      default:         return <p style={{ color: C.secondary }}>No editor for type: {currentSection.section_type}</p>;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/logo.png" alt="Proflect" width={90} height={28} style={{ height: 28, width: 'auto' }} />
          <span style={{ color: C.border }}>›</span>
          <span style={{ fontSize: 13, color: C.secondary }}>Admin</span>
          <span style={{ color: C.border }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Homepage</span>
        </div>
        <a href="/home" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 500, color: C.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View live page
        </a>
      </div>

      {/* Two-panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', paddingBottom: 64 }}>
        {/* Left panel */}
        <div style={{ width: 240, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, padding: '16px 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, marginTop: 0 }}>Page Sections</p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} h={48} radius={8} />)}
            </div>
          ) : loadError ? (
            <p style={{ fontSize: 13, color: C.error }}>{loadError}</p>
          ) : sections.length === 0 ? (
            <p style={{ fontSize: 12, color: C.secondary, lineHeight: 1.6 }}>
              No sections found. Run <code style={{ fontFamily: 'monospace', background: C.bg, padding: '1px 4px', borderRadius: 3 }}>database/homepage_schema.sql</code> in Supabase to seed the homepage data.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map(s => (
                  <SectionListItem key={s.id} section={s}
                    isSelected={selected === s.section_key}
                    onSelect={setSelected}
                    onToggleVisibility={toggleVisibility} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, maxWidth: 720 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Skeleton h={28} w="40%" radius={6} />
                <Skeleton h={16} w="25%" radius={4} />
                <div style={{ height: 1, background: C.border, margin: '8px 0' }} />
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={56} radius={8} />)}
              </div>
            </div>
          ) : loadError ? (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 12, padding: 24, maxWidth: 720 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.error, margin: '0 0 8px' }}>Failed to load homepage content</p>
              <p style={{ fontSize: 14, color: C.error, margin: '0 0 16px' }}>Could not connect to the database. Please refresh the page.</p>
              <button onClick={load} style={{ fontSize: 14, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '7px 16px', background: 'transparent', cursor: 'pointer' }}>Retry</button>
            </div>
          ) : currentSection ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, maxWidth: 720 }}>
              <EditorHeader section={currentSection} />
              {renderEditor()}
            </div>
          ) : sections.length === 0 ? (
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: 24, maxWidth: 720 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E', margin: '0 0 8px' }}>Database not seeded</p>
              <p style={{ fontSize: 14, color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                Run <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 3 }}>database/homepage_schema.sql</code> in the Supabase SQL editor to create and seed the homepage sections table.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <p style={{ fontSize: 14, color: C.secondary }}>Select a section from the left panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <BottomBar
        isDirty={isDirty}
        isSaving={isSaving}
        lastPublished={lastPublished}
        onSaveDraft={saveDraft}
        onPreview={() => window.open('/home/preview', '_blank')}
        onPublish={() => setPublishDialog(true)}
      />

      {/* Publish confirmation dialog */}
      {publishDialog && (
        <Dialog
          title="Publish homepage changes?"
          body="This will update the live homepage immediately. Are you sure?"
          confirmLabel="Publish"
          onConfirm={publish}
          onCancel={() => setPublishDialog(false)}
        />
      )}

      {/* Snackbar */}
      {snackbar && <Snackbar msg={snackbar.msg} type={snackbar.type} onClose={() => setSnackbar(null)} />}

      <style>{`
        @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
      `}</style>
    </div>
  );
}
