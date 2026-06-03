'use client';
import { useState } from 'react';
import GeneratedContent from './GeneratedContent';

export default function ExerciseSection({ section, onRegenerate }) {
  const [showSolution, setShowSolution] = useState(false);

  if (!section.is_generated || !section.content) return null;

  // Split the markdown into "before ### Solution" and the solution block
  const solutionMarker = '### Solution';
  const solutionIdx = section.content.indexOf(solutionMarker);
  const hasSolution = solutionIdx !== -1;
  const beforeSolution = hasSolution ? section.content.slice(0, solutionIdx).trim() : section.content;
  const solutionBlock = hasSolution ? section.content.slice(solutionIdx).trim() : '';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200 dark:border-amber-700/40 bg-amber-100/60 dark:bg-amber-900/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Exercise</span>
        </div>
        <div className="p-4">
          <GeneratedContent section={{ ...section, content: beforeSolution }} onRegenerate={onRegenerate} hideActions />
        </div>
      </div>

      {hasSolution && (
        <div>
          {showSolution ? (
            <div className="rounded-xl border border-[var(--c-border)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--c-border)] bg-[var(--c-surface)]">
                <span className="text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-widest">Solution</span>
                <button
                  onClick={() => setShowSolution(false)}
                  className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors"
                >
                  Hide
                </button>
              </div>
              <div className="p-4">
                <GeneratedContent section={{ ...section, content: solutionBlock }} onRegenerate={onRegenerate} hideActions />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSolution(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--c-border)] text-sm text-[var(--c-text-muted)] hover:border-[var(--c-primary)] hover:text-[var(--c-primary)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Reveal solution
            </button>
          )}
        </div>
      )}
    </div>
  );
}
