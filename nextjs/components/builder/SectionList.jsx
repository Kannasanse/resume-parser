'use client';
import { useState, useRef } from 'react';
import { SECTION_TYPES } from './templates.js';

function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-ds-textMuted flex-shrink-0 cursor-grab active:cursor-grabbing">
      <circle cx="4" cy="3.5" r="1.2" /><circle cx="4" cy="7" r="1.2" /><circle cx="4" cy="10.5" r="1.2" />
      <circle cx="10" cy="3.5" r="1.2" /><circle cx="10" cy="7" r="1.2" /><circle cx="10" cy="10.5" r="1.2" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`text-ds-textMuted transition-transform ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

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
    const fromIdx = ids.indexOf(srcId);
    const toIdx = ids.indexOf(targetId);
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, srcId);
    onReorder(reordered);
    dragSrcRef.current = null;
    setDragOver(null);
  };

  const handleDragEnd = () => {
    dragSrcRef.current = null;
    setDragOver(null);
  };

  const existingTypes = new Set(sections.map(s => s.type));

  return (
    <div className="flex flex-col h-full">
      {/* Section list */}
      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 && (
          <div className="px-4 py-8 text-center text-ds-textMuted text-sm">
            No sections yet. Add your first section below.
          </div>
        )}

        {sections.map((sec) => {
          const isActive = activeSectionId === sec.id;
          const isDragTarget = dragOver === sec.id;

          return (
            <div key={sec.id}>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, sec.id)}
                onDragOver={(e) => handleDragOver(e, sec.id)}
                onDrop={(e) => handleDrop(e, sec.id)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none border-l-2 transition-colors
                  ${isActive ? 'bg-primary/5 border-primary' : 'border-transparent hover:bg-ds-bg'}
                  ${isDragTarget ? 'border-t-2 border-t-primary' : ''}
                  ${!sec.enabled ? 'opacity-50' : ''}
                `}
                onClick={() => onSelect(isActive ? null : sec.id)}
              >
                <DragHandle />
                <span className="flex-1 text-sm font-medium text-ds-text truncate">{sec.title}</span>

                {/* Toggle enable/disable */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(sec.id, !sec.enabled); }}
                  title={sec.enabled ? 'Hide section' : 'Show section'}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-ds-textMuted hover:text-ds-text transition-opacity"
                >
                  {sec.enabled
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(sec.id); }}
                  title="Remove section"
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-ds-textMuted hover:text-ds-danger transition-opacity"
                >
                  <TrashIcon />
                </button>

                <ChevronIcon open={isActive} />
              </div>

              {/* Inline editor when active */}
              {isActive && SectionEditorComponent && (
                <div className="border-t border-ds-border bg-ds-bg">
                  <SectionEditorComponent section={sec} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add section button */}
      <div className="border-t border-ds-border p-3 relative">
        <button
          onClick={() => setShowAddMenu(v => !v)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-dashed border-primary/40 rounded hover:bg-primary/5 hover:border-primary transition-colors"
        >
          <PlusIcon />
          Add Section
        </button>

        {showAddMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-ds-card border border-ds-border rounded shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
              {SECTION_TYPES.map(st => {
                const alreadyHas = st.singleton && existingTypes.has(st.id);
                return (
                  <button
                    key={st.id}
                    disabled={alreadyHas}
                    onClick={() => { onAddSection(st); setShowAddMenu(false); }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                      ${alreadyHas ? 'opacity-40 cursor-not-allowed text-ds-textMuted' : 'text-ds-text hover:bg-ds-bg cursor-pointer'}`}
                  >
                    <span className="text-xs w-4 text-center">{st.icon}</span>
                    {st.label}
                    {alreadyHas && <span className="ml-auto text-xs text-ds-textMuted">Added</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl p-5 max-w-sm w-full space-y-4">
            <h3 className="font-heading font-bold text-ds-text">Remove section?</h3>
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
