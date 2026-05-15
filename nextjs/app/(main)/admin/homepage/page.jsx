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
import HeroEditor        from './editors/HeroEditor.jsx';
import StatsEditor       from './editors/StatsEditor.jsx';
import FeaturesEditor    from './editors/FeaturesEditor.jsx';
import StepsEditor       from './editors/StepsEditor.jsx';
import PricingEditor     from './editors/PricingEditor.jsx';
import CtaEditor         from './editors/CtaEditor.jsx';
import FooterEditor      from './editors/FooterEditor.jsx';
import TestimonialsEditor from './editors/TestimonialsEditor.jsx';
import CustomTextEditor  from './editors/CustomTextEditor.jsx';
import CustomHtmlEditor  from './editors/CustomHtmlEditor.jsx';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = { primary: '#185FA5', dark: '#0C447C', light: '#E6F1FB', teal: '#1D9E75', charcoal: '#2C2C2A', secondary: '#6B7280', border: '#D1DCE8', surface: '#FFFFFF', bg: '#F4F8FC', error: '#D93025', warning: '#F59E0B' };

const SECTION_LABELS = { hero: 'Hero', stats: 'Social Proof', features: 'Features', steps: 'How It Works', pricing: 'Pricing', cta: 'CTA Banner', footer: 'Footer', testimonials: 'Testimonials', custom_text: 'Custom Text', custom_html: 'Custom HTML' };

const SEEDED_SECTION_KEYS = ['hero', 'stats', 'features', 'steps', 'pricing', 'cta', 'footer'];

const SECTION_TYPE_META = [
  { type: 'hero',         icon: '📝', title: 'Hero',         description: 'Full-width hero with CTA buttons', unique: true },
  { type: 'stats',        icon: '📊', title: 'Stats Bar',    description: 'Social proof stats with numbers',  unique: false },
  { type: 'features',     icon: '⭐', title: 'Features',     description: 'Feature cards grid',               unique: false },
  { type: 'steps',        icon: '🔢', title: 'How It Works', description: 'Numbered steps section',           unique: false },
  { type: 'pricing',      icon: '💰', title: 'Pricing',      description: 'Pricing plan cards',               unique: false },
  { type: 'cta',          icon: '📣', title: 'CTA Banner',   description: 'Full-width call to action',        unique: false },
  { type: 'footer',       icon: '🔗', title: 'Footer',       description: 'Site footer with links',           unique: true },
  { type: 'testimonials', icon: '💬', title: 'Testimonials', description: 'Customer quotes and reviews',      unique: false },
  { type: 'custom_text',  icon: '📰', title: 'Custom Text',  description: 'Rich text block section',          unique: false },
  { type: 'custom_html',  icon: '🖼️', title: 'Custom HTML',  description: 'Raw HTML/embed block',            unique: false },
];

function getDefaultContent(type) {
  const id = () => crypto.randomUUID();
  const map = {
    hero:         { badge_text: '', heading: 'New Hero Heading', subheading: '', primary_cta_label: 'Get started', primary_cta_href: '/signup', secondary_cta_label: '', secondary_cta_href: '', trust_items: [] },
    stats:        { items: [{ id: id(), value: '0', label: 'Stat Label' }] },
    features:     { items: [{ id: id(), icon: 'default', title: 'Feature Title', description: '', sort_order: 1 }] },
    steps:        { items: [{ id: id(), title: 'Step Title', description: '', sort_order: 1 }] },
    pricing:      { items: [{ id: id(), plan_name: 'Plan', price: '$0', period: 'per month', description: '', is_highlighted: false, highlight_label: '', cta_label: 'Get started', cta_href: '/signup', cta_variant: 'outlined', features: [], sort_order: 1 }] },
    cta:          { heading: 'Ready to get started?', subtext: '', primary_cta_label: 'Get started', primary_cta_href: '/signup', secondary_cta_label: '', secondary_cta_href: '' },
    footer:       { tagline: '', columns: [], copyright: `© ${new Date().getFullYear()} Proflect. All rights reserved.` },
    testimonials: { items: [{ id: id(), quote: '', author: '', role: '', company: '', sort_order: 1 }] },
    custom_text:  { content: '' },
    custom_html:  { html: '' },
  };
  return map[type] || {};
}

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

// ── Delete confirm dialog ──────────────────────────────────────────────────────
function DeleteConfirmDialog({ sectionName, onConfirm, onCancel }) {
  return (
    <Dialog
      title="Delete section?"
      body={`Are you sure you want to delete "${sectionName}"? This cannot be undone after publishing.`}
      confirmLabel="Delete"
      confirmStyle="error"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// ── Add Section Dialog ─────────────────────────────────────────────────────────
function AddSectionDialog({
  sections, step, selectedType, name, sectionKey, keyTouched, position, isVisible,
  isKeyValid, isKeyUnique, generateKey,
  onSelectType, onNext, onBack, onNameChange, onKeyChange, onPositionChange, onVisibleChange,
  onConfirm, onClose,
}) {
  const canAdvance = selectedType !== null;
  const keyOk = isKeyValid(sectionKey) && isKeyUnique(sectionKey);
  const canConfirm = name.trim().length > 0 && keyOk;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: C.surface, borderRadius: 16, padding: 28, maxWidth: step === 1 ? 560 : 480, width: '100%', boxShadow: '0 8px 32px rgba(12,68,124,0.16)', maxHeight: '90vh', overflowY: 'auto' }}>
        {step === 1 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, margin: 0 }}>Add New Section</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.secondary, fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {SECTION_TYPE_META.map(card => {
                const isDisabled = card.unique && sections.some(s => s.section_type === card.type);
                const isSelected = selectedType === card.type;
                return (
                  <div key={card.type}
                    onClick={() => { if (!isDisabled) { onSelectType(card.type); } }}
                    onDoubleClick={() => { if (!isDisabled && card.type) { onSelectType(card.type); onNext(); } }}
                    style={{
                      border: isSelected ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                      borderRadius: 10, padding: '14px 16px', cursor: isDisabled ? 'not-allowed' : 'pointer',
                      background: isSelected ? C.light : isDisabled ? '#F9FAFB' : C.surface,
                      opacity: isDisabled ? 0.5 : 1, transition: 'border-color 150ms, background 150ms',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{card.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isDisabled ? C.secondary : C.charcoal }}>{card.title}</div>
                    <div style={{ fontSize: 12, color: C.secondary, marginTop: 2, lineHeight: 1.4 }}>{card.description}</div>
                    {isDisabled && <div style={{ fontSize: 11, color: C.secondary, marginTop: 4, fontStyle: 'italic' }}>Already added</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ fontSize: 14, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '8px 18px', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button onClick={onNext} disabled={!canAdvance}
                style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: canAdvance ? C.primary : C.border, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: canAdvance ? 'pointer' : 'not-allowed' }}>
                Next →
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.secondary, display: 'flex', alignItems: 'center', padding: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, margin: 0 }}>Configure new section</h2>
              <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.secondary, fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {/* Section name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.secondary, marginBottom: 5 }}>Section name</label>
                <input type="text" value={name} onChange={e => onNameChange(e.target.value)} placeholder="e.g. Customer Reviews"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: 14, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 8, outline: 'none', background: '#fff', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              {/* Section key */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.secondary, marginBottom: 5 }}>Section key <span style={{ fontFamily: 'monospace', fontStyle: 'normal' }}>(unique identifier)</span></label>
                <input type="text" value={sectionKey} onChange={e => onKeyChange(e.target.value)} placeholder="e.g. customer_reviews"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: 14, color: C.charcoal, border: `1px solid ${sectionKey && !keyOk ? C.error : C.border}`, borderRadius: 8, outline: 'none', background: '#fff', fontFamily: 'monospace' }}
                  onFocus={e => e.target.style.borderColor = sectionKey && !keyOk ? C.error : C.primary}
                  onBlur={e => e.target.style.borderColor = sectionKey && !keyOk ? C.error : C.border} />
                {sectionKey && !isKeyValid(sectionKey) && <p style={{ fontSize: 12, color: C.error, margin: '4px 0 0' }}>Only lowercase letters, numbers, and underscores.</p>}
                {sectionKey && isKeyValid(sectionKey) && !isKeyUnique(sectionKey) && <p style={{ fontSize: 12, color: C.error, margin: '4px 0 0' }}>This key is already in use.</p>}
              </div>

              {/* Position */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: C.secondary, marginBottom: 5 }}>Insert position</label>
                <select value={position} onChange={e => onPositionChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 8, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}>
                  <option value="top">At the top</option>
                  {sections.map(s => (
                    <option key={s.section_key} value={s.section_key}>After: {SECTION_LABELS[s.section_type] || s.section_key}</option>
                  ))}
                  <option value="bottom">At the bottom</option>
                </select>
              </div>

              {/* Visibility */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => onVisibleChange(!isVisible)} style={{ position: 'relative', width: 36, height: 20, borderRadius: 99, background: isVisible ? C.primary : C.border, transition: 'background 200ms', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: isVisible ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                </div>
                <span style={{ fontSize: 14, color: C.charcoal }}>Visible on publish</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ fontSize: 14, fontWeight: 500, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, padding: '8px 18px', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button onClick={onConfirm} disabled={!canConfirm}
                style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: canConfirm ? C.primary : C.border, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: canConfirm ? 'pointer' : 'not-allowed' }}>
                Add Section
              </button>
            </div>
          </>
        )}
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
      <button onClick={() => onSelect(section.section_key)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: section.is_visible ? C.charcoal : C.secondary, fontStyle: section.is_visible ? 'normal' : 'italic', padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {SECTION_LABELS[section.section_type] || section.section_key}
      </button>
    </div>
  );
}

// ── Section editor header ──────────────────────────────────────────────────────
function EditorHeader({ section, onDelete }) {
  const canDelete = !SEEDED_SECTION_KEYS.includes(section.section_key);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.charcoal, margin: 0 }}>{SECTION_LABELS[section.section_type] || section.section_key}</h2>
        <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 99, padding: '2px 10px', background: section.is_visible ? '#D1FAE5' : '#F3F4F6', color: section.is_visible ? C.teal : C.secondary }}>
          {section.is_visible ? 'Visible' : 'Hidden'}
        </span>
        {canDelete && (
          <button onClick={onDelete} title="Delete this section"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 150ms' }}
            onMouseEnter={e => e.currentTarget.style.color = C.error}
            onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        )}
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

  // Add/Delete section state
  const [sectionsToDelete, setSectionsToDelete] = useState([]);
  const [addDialogOpen,    setAddDialogOpen]    = useState(false);
  const [addStep,          setAddStep]          = useState(1);
  const [addType,          setAddType]          = useState(null);
  const [addName,          setAddName]          = useState('');
  const [addKey,           setAddKey]           = useState('');
  const [addKeyTouched,    setAddKeyTouched]    = useState(false);
  const [addPosition,      setAddPosition]      = useState('bottom');
  const [addVisible,       setAddVisible]       = useState(true);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState(null);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const res = await fetch('/api/v1/admin/homepage');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { sections: rows, lastPublished: lp } = await res.json();
      console.log('[Admin CMS] sections loaded:', rows?.length, rows?.map(s => s.section_key));
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
    setSections(prev => {
      const next = prev.map(s => s.id === id ? { ...s, is_visible: !s.is_visible } : s);
      const changed = next.find(s => s.id === id);
      console.log('[Admin CMS] visibility toggle', changed?.section_key, '→ is_visible:', changed?.is_visible);
      return next;
    });
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

  // ── Add/Delete helpers ──────────────────────────────────────────────────────
  const generateKey = (name) => name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_');
  const isKeyValid  = (k) => /^[a-z0-9_]+$/.test(k) && k.length > 0;
  const isKeyUnique = (k) => !sections.some(s => s.section_key === k);

  const resetAddDialog = () => { setAddStep(1); setAddType(null); setAddName(''); setAddKey(''); setAddKeyTouched(false); setAddPosition('bottom'); setAddVisible(true); };

  const handleAddSection = () => {
    const newSection = {
      id: crypto.randomUUID(),
      section_key:  addKey,
      section_type: addType,
      title:        addName,
      subtitle:     null,
      overline:     null,
      is_visible:   addVisible,
      sort_order:   0,
      content:      getDefaultContent(addType),
    };
    let next = [...sections];
    if (addPosition === 'top')         next = [newSection, ...next];
    else if (addPosition === 'bottom') next = [...next, newSection];
    else {
      const idx = next.findIndex(s => s.section_key === addPosition);
      next.splice(idx >= 0 ? idx + 1 : next.length, 0, newSection);
    }
    next = next.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSections(next);
    setSelected(addKey);
    setIsDirty(true);
    setAddDialogOpen(false);
    resetAddDialog();
    toast('Section added. Fill in the content and publish to make it live.');
  };

  const handleDeleteSection = (key) => {
    const next = sections.filter(s => s.section_key !== key).map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSections(next);
    setSectionsToDelete(prev => [...prev, key]);
    if (selected === key) setSelected(next[0]?.section_key || null);
    setDeleteConfirmKey(null);
    setIsDirty(true);
    toast('Section deleted. Publish to apply changes.', 'warning');
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
      console.log('[Admin CMS] publishing sections:', sections.map(s => ({ key: s.section_key, is_visible: s.is_visible })));
      const res = await fetch('/api/v1/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, sectionsToDelete }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || res.status); }
      const { published_at } = await res.json();
      console.log('[Admin CMS] publish success, published_at:', published_at);
      setIsDirty(false);
      setLastPublished(published_at);
      setSectionsToDelete([]);
      toast('Homepage published successfully');
    } catch (err) {
      toast(`Publish failed: ${err.message}`, 'error');
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
      case 'hero':         return <HeroEditor        {...sectionProps} />;
      case 'stats':        return <StatsEditor       {...sectionProps} />;
      case 'features':     return <FeaturesEditor    {...sectionProps} />;
      case 'steps':        return <StepsEditor       {...sectionProps} />;
      case 'pricing':      return <PricingEditor     {...sectionProps} />;
      case 'cta':          return <CtaEditor         {...sectionProps} />;
      case 'footer':       return <FooterEditor      {...sectionProps} />;
      case 'testimonials': return <TestimonialsEditor {...sectionProps} />;
      case 'custom_text':  return <CustomTextEditor  {...sectionProps} />;
      case 'custom_html':  return <CustomHtmlEditor  {...sectionProps} />;
      default:             return <p style={{ color: C.secondary }}>No editor for type: {currentSection.section_type}</p>;
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
            <>
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
              <button onClick={() => setAddDialogOpen(true)}
                style={{ width: '100%', marginTop: 16, height: 40, border: `1px dashed ${C.primary}`, borderRadius: 8, background: 'transparent', color: C.primary, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 150ms' }}
                onMouseEnter={e => e.currentTarget.style.background = C.light}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Section
              </button>
            </>
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
              <EditorHeader section={currentSection} onDelete={() => setDeleteConfirmKey(currentSection.section_key)} />
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

      {/* Add section dialog */}
      {addDialogOpen && (
        <AddSectionDialog
          sections={sections}
          step={addStep}
          selectedType={addType}
          name={addName}
          sectionKey={addKey}
          keyTouched={addKeyTouched}
          position={addPosition}
          isVisible={addVisible}
          isKeyValid={isKeyValid}
          isKeyUnique={isKeyUnique}
          generateKey={generateKey}
          onSelectType={(t) => setAddType(t)}
          onNext={() => setAddStep(2)}
          onBack={() => setAddStep(1)}
          onNameChange={(v) => { setAddName(v); if (!addKeyTouched) setAddKey(generateKey(v)); }}
          onKeyChange={(v) => { setAddKey(v); setAddKeyTouched(true); }}
          onPositionChange={setAddPosition}
          onVisibleChange={setAddVisible}
          onConfirm={handleAddSection}
          onClose={() => { setAddDialogOpen(false); resetAddDialog(); }}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteConfirmKey && (
        <DeleteConfirmDialog
          sectionName={SECTION_LABELS[sections.find(s => s.section_key === deleteConfirmKey)?.section_type] || deleteConfirmKey}
          onConfirm={() => handleDeleteSection(deleteConfirmKey)}
          onCancel={() => setDeleteConfirmKey(null)}
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
