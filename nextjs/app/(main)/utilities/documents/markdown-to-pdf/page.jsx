'use client';

import { useState, useEffect, useRef } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { ProcessingState } from '@/components/utilities/ProcessingState';

export default function MarkdownToPdfPage() {
  const [markdown, setMarkdown] = useState('');
  const [tab, setTab] = useState('write');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleFileUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setMarkdown(text);
    setTab('write');
    e.target.value = '';
  }

  async function handleConvert() {
    if (!markdown.trim()) return;
    setProcessing(true);
    setError('');
    try {
      const form = new FormData();
      form.append('markdown', markdown);
      const res = await fetch('/api/v1/utilities/documents/markdown-to-pdf', { method: 'POST', body: form });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Conversion failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Conversion failed.');
    } finally {
      setProcessing(false);
    }
  }

  const tabs = [
    { value: 'write', label: 'Write' },
    { value: 'preview', label: 'Preview' },
  ];

  return (
    <ToolPageLayout
      icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="9 16 9 8 12 11 15 8 15 16"/></svg>}
      title="Markdown to PDF"
      description="Write or paste Markdown and export it as a styled PDF document."
      parentHref="/utilities/documents"
      parentLabel="Document Tools"
    >
      {processing ? (
        <ProcessingState message="Generating PDF…" hint="Converting Markdown to HTML and rendering server-side." />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {tabs.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    tab === value
                      ? 'bg-[#185FA5] text-white border-[#185FA5]'
                      : 'text-[#6B7280] border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:text-[#185FA5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#185FA5] hover:underline"
            >
              Upload .md file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {tab === 'write' ? (
            <textarea
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              placeholder={'# Hello World\n\nWrite your **Markdown** here…'}
              rows={18}
              className="w-full px-4 py-3 text-sm font-mono text-[#2C2C2A] dark:text-[#E8EFF7] bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] border border-[#D1DCE8] dark:border-white/8 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-[#185FA5]/40"
            />
          ) : (
            <MarkdownPreview markdown={markdown} />
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            onClick={handleConvert}
            disabled={!markdown.trim()}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate PDF →
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}

function MarkdownPreview({ markdown }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!markdown.trim()) {
      setHtml('');
      return;
    }
    import('marked').then(({ marked }) => {
      setHtml(marked.parse(markdown));
    });
  }, [markdown]);

  if (!markdown.trim()) {
    return (
      <div className="flex items-center justify-center h-48 p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
        <p className="text-sm text-[#9CA3AF]">Nothing to preview yet.</p>
      </div>
    );
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none p-5 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 min-h-48 overflow-auto"
      dangerouslySetInnerHTML={{ __html: html || '<p style="color:#9CA3AF">Rendering…</p>' }}
    />
  );
}
