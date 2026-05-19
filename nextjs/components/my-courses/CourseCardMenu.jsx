'use client';
import { useState, useRef, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Mark as Active' },
  { value: 'paused', label: 'Pause course' },
];

export default function CourseCardMenu({ course, onStatusChange, onDelete, onResetProgress }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setConfirmDelete(false); setConfirmReset(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch(`/api/v1/my-courses/${course.id}/reset-progress`, { method: 'POST' });
      if (res.ok) { onResetProgress(course.id); }
    } finally {
      setResetting(false);
      setConfirmReset(false);
      setOpen(false);
    }
  }

  const statusToShow = STATUS_OPTIONS.filter(o => o.value !== course.status);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); setConfirmDelete(false); setConfirmReset(false); }}
        className="w-7 h-7 flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        aria-label="Course options"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50">
          {!confirmDelete && !confirmReset && (
            <>
              {statusToShow.map(o => (
                <button
                  key={o.value}
                  onClick={e => { e.stopPropagation(); onStatusChange(course.id, o.value); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {o.label}
                </button>
              ))}
              <button
                onClick={e => { e.stopPropagation(); setConfirmReset(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Reset progress
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/></svg>
                Remove course
              </button>
            </>
          )}

          {confirmReset && (
            <div className="px-3 py-2">
              <p className="text-xs text-gray-600 mb-2">Reset all progress for this course?</p>
              <div className="flex gap-2">
                <button onClick={e => { e.stopPropagation(); handleReset(); }} disabled={resetting} className="flex-1 text-xs font-medium bg-gray-800 text-white py-1.5 rounded-lg hover:bg-gray-900 disabled:opacity-50">
                  {resetting ? 'Resetting…' : 'Reset'}
                </button>
                <button onClick={e => { e.stopPropagation(); setConfirmReset(false); }} className="flex-1 text-xs font-medium border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirmDelete && (
            <div className="px-3 py-2">
              <p className="text-xs text-gray-600 mb-2">Remove this course from your list?</p>
              <div className="flex gap-2">
                <button onClick={e => { e.stopPropagation(); onDelete(course.id); setOpen(false); }} className="flex-1 text-xs font-medium bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700">
                  Remove
                </button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} className="flex-1 text-xs font-medium border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
