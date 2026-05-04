'use client';
import { useState, useRef } from 'react';
import { SECTION_TYPES } from './templates.js';

// ── Section type icons ────────────────────────────────────────────────────────

const ICONS = {
  summary: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  work_experience: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  ),
  education: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  certifications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  languages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  hobbies: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  references: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

function SectionTypeIcon({ type }) {
  return (
    <div className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary">
      <div style={{ width: 16, height: 16 }}>{ICONS[type] || ICONS.custom}</div>
    </div>
  );
}

function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-ds-border group-hover:text-ds-textMuted flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors">
      <circle cx="4" cy="3.5" r="1.2"/><circle cx="4" cy="7" r="1.2"/><circle cx="4" cy="10.5" r="1.2"/>
      <circle cx="10" cy="3.5" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="10" cy="10.5" r="1.2"/>
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`text-ds-textMuted flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function getSectionMeta(sec) {
  const isText = ['summary', 'hobbies', 'references'].includes(sec.type);
  if (isText) return null;
  const count = sec.content?.entries?.length ?? 0;
  if (count === 0) return null;
  return `${count} ${count === 1 ? 'entry' : 'entries'}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SectionList({
  sections,
  activeSectionId,
  onSelect,
  onReorder,
  onDelete,
  onToggle,
  onAddSection,
  SectionEditorComponent,
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const dragSrcRef = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDragStart = (e, id) => {
    dragSrcRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(id);
  };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const srcId = dragSrcRef.current;
    if (!srcId || srcId === targetId) { setDragOver(null); return; }
    const ids = sections.map(s => s.id);
    const from = ids.indexOf(srcId);
    const to = ids.indexOf(targetId);
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, srcId);
    onReorder(next);
    dragSrcRef.current = null;
    setDragOver(null);
  };
  const handleDragEnd = () => { dragSrcRef.current = null; setDragOver(null); };

  const existingTypes = new Set(sections.map(s => s.type));

  return (
    <div>
      {sections.length === 0 && (
        <div className="py-8 text-center text-ds-textMuted text-sm">
          No sections yet. Add your first section below.
        </div>
      )}

      {sections.map((sec) => {
        const isActive = activeSectionId === sec.id;
        const isDragTarget = dragOver === sec.id;
        const meta = getSectionMeta(sec);

        return (
          <div
            key={sec.id}
            className={`mb-3.5 rounded-lg border overflow-hidden transition-all duration-150
              ${isDragTarget ? 'border-t-2 border-t-primary' : ''}
              ${isActive
                ? 'border-primary/50 shadow-sm'
                : 'border-ds-border hover:border-ds-textMuted/50 hover:shadow-sm'}
              ${!sec.enabled ? 'opacity-50' : ''}
            `}
          >
            {/* Card header */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, sec.id)}
              onDragOver={(e) => handleDragOver(e, sec.id)}
              onDrop={(e) => handleDrop(e, sec.id)}
              onDragEnd={handleDragEnd}
              className="group flex items-center gap-2.5 px-3.5 py-3 cursor-pointer select-none bg-ds-card"
              onClick={() => onSelect(isActive ? null : sec.id)}
            >
              <DragHandle />
              <SectionTypeIcon type={sec.type} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ds-text truncate">{sec.title}</p>
                {meta && <p className="text-xs text-ds-textMuted mt-0.5">{meta}</p>}
              </div>

              {/* Hover actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(sec.id, !sec.enabled); }}
                  title={sec.enabled ? 'Hide section' : 'Show section'}
                  className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:bg-ds-bg hover:text-ds-text transition-colors"
                >
                  {sec.enabled
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(sec.id); }}
                  title="Remove section"
                  className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:bg-ds-dangerLight hover:text-ds-danger transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>

              <ChevronIcon open={isActive} />
            </div>

            {/* Inline editor */}
            {isActive && SectionEditorComponent && (
              <div className="border-t border-ds-border bg-ds-bg">
                <SectionEditorComponent section={sec} />
              </div>
            )}
          </div>
        );
      })}

      {/* Add section */}
      <div className="mt-1">
        {!showAddMenu ? (
          <button
            onClick={() => setShowAddMenu(true)}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed border-ds-textMuted/40 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add section
          </button>
        ) : (
          <div className="rounded-lg border border-ds-border bg-ds-bg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ds-border">
              <span className="text-sm font-semibold text-ds-text">Add a new section</span>
              <button
                onClick={() => setShowAddMenu(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-border/60 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {SECTION_TYPES.map(st => {
                const alreadyHas = st.singleton && existingTypes.has(st.id);
                return (
                  <button
                    key={st.id}
                    disabled={alreadyHas}
                    onClick={() => { onAddSection(st); setShowAddMenu(false); }}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-colors
                      ${alreadyHas
                        ? 'border-ds-border opacity-40 cursor-not-allowed'
                        : 'border-ds-border hover:border-primary hover:bg-primary/5 cursor-pointer'}`}
                  >
                    <div className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary mt-0.5">
                      <div style={{ width: 14, height: 14 }}>{ICONS[st.id] || ICONS.custom}</div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ds-text leading-tight">{st.label}</p>
                      <p className="text-xs text-ds-textMuted mt-0.5 leading-tight">{st.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-ds-card border border-ds-border rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-heading font-bold text-ds-text">Remove this section?</h3>
            <p className="text-sm text-ds-textSecondary">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 px-4 py-2 bg-ds-danger text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Remove
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-ds-border text-ds-text rounded text-sm hover:bg-ds-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
