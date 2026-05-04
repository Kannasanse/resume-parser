'use client';
import { useState } from 'react';
import { TEMPLATES, TEMPLATE_CATEGORIES } from './templates.js';
import { TemplateThumbnail } from './ResumePreview.jsx';

export default function TemplateGallery({ currentTemplateId, onSelect, onClose }) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);

  const filtered = TEMPLATES.filter(t => {
    const matchCat = category === 'All' || t.style === category;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.style.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const previewTpl = preview ? TEMPLATES.find(t => t.id === preview) : null;
  const previewIdx = previewTpl ? filtered.indexOf(previewTpl) : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ds-border flex-shrink-0">
          <h2 className="font-heading font-bold text-ds-text text-lg">Choose a Template</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-ds-border flex-shrink-0">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          <div className="flex gap-1 overflow-x-auto">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-btn transition-colors
                  ${category === cat ? 'bg-primary text-white' : 'bg-ds-bg text-ds-textMuted hover:text-ds-text border border-ds-border'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <p className="text-center text-ds-textMuted py-12">No templates match your search.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map(t => (
                <div key={t.id} onClick={() => setPreview(t.id)} className="cursor-pointer">
                  <TemplateThumbnail
                    templateId={t.id}
                    active={t.id === currentTemplateId}
                    label={t.name}
                    style={t.style}
                    plan={t.plan}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-size preview modal */}
      {previewTpl && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-ds-card border border-ds-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Preview header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-ds-border flex-shrink-0">
              <div>
                <h3 className="font-heading font-bold text-ds-text">{previewTpl.name}</h3>
                <p className="text-xs text-ds-textMuted">{previewTpl.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Prev/Next arrows */}
                <button
                  disabled={previewIdx <= 0}
                  onClick={() => setPreview(filtered[previewIdx - 1]?.id)}
                  className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text disabled:opacity-30 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  disabled={previewIdx >= filtered.length - 1}
                  onClick={() => setPreview(filtered[previewIdx + 1]?.id)}
                  className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text disabled:opacity-30 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <button onClick={() => setPreview(null)} className="w-7 h-7 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text transition-colors ml-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* Large thumbnail */}
            <div className="flex-1 overflow-hidden bg-gray-100 flex items-start justify-center p-6">
              <div style={{ width: 320 }}>
                <TemplateThumbnail
                  templateId={previewTpl.id}
                  active={false}
                  label={previewTpl.name}
                  style={previewTpl.style}
                  plan={previewTpl.plan}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-ds-border flex-shrink-0">
              <button
                onClick={() => { onSelect(previewTpl.id); setPreview(null); }}
                className={`flex-1 px-4 py-2.5 font-medium text-sm rounded-btn transition-colors
                  ${previewTpl.id === currentTemplateId
                    ? 'bg-ds-bg border border-ds-border text-ds-textMuted cursor-default'
                    : 'bg-primary text-white hover:bg-primary/90'}`}
              >
                {previewTpl.id === currentTemplateId ? 'Current template' : 'Use this template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
