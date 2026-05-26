'use client';
import { useMemo } from 'react';
import { marked } from 'marked';
import SectionSourceBadge from '@/components/career-map/SectionSourceBadge';

marked.setOptions({ breaks: true, gfm: true });

export default function GeneratedContent({ section, content: contentProp, onRegenerate }) {
  const content = section?.content ?? contentProp ?? '';

  const html = useMemo(() => {
    try { return marked.parse(content); } catch { return content; }
  }, [content]);

  return (
    <div className="animate-fade-in-up">
      <SectionSourceBadge
        sourceType={section?.source_type}
        sourceDomain={section?.source_domain}
        sourceUrl={section?.source_url}
        sourceTitle={section?.source_title}
      />
      <div
        className="prose-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="flex justify-end mt-4 pt-3 border-t border-[var(--c-primary-light)]">
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 text-xs text-[var(--c-text-muted)] hover:text-[var(--c-primary)] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/>
          </svg>
          Not satisfied? Generate again
        </button>
      </div>
    </div>
  );
}
