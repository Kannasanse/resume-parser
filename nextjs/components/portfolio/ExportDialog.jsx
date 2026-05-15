'use client';

import { useState, useEffect } from 'react';

const IconDocument = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <polyline points="9 14 12 17 15 14" />
  </svg>
);

const IconShare = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="4" x2="14" y2="14" />
    <line x1="14" y1="4" x2="4" y2="14" />
  </svg>
);

export default function ExportDialog({ portfolioId, portfolio, isOpen, onClose }) {
  const [selectedCard, setSelectedCard] = useState('pdf');
  const [includeCover, setIncludeCover] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(false);
  const [pageSize, setPageSize] = useState('A4');
  const [colorMode, setColorMode] = useState('colour');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = `https://proflect-neo.vercel.app/portfolios/${portfolio?.slug ?? portfolioId}`;

  async function handleExportPDF() {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/v1/portfolios/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId,
          config: { includeCover, includeTOC, pageSize, colorMode },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'PDF export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${portfolio?.title ?? 'portfolio'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-ds-card border border-ds-border rounded-xl p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ds-text">Export Portfolio</h2>
          <button
            onClick={onClose}
            className="text-ds-textMuted hover:text-ds-text transition-colors rounded p-1"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

        {/* Option cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* PDF card */}
          <button
            onClick={() => setSelectedCard('pdf')}
            className={`text-left p-4 rounded-lg border transition-colors ${
              selectedCard === 'pdf'
                ? 'border-[#185FA5] bg-blue-50'
                : 'border-ds-border bg-ds-bg hover:border-[#185FA5]/50'
            }`}
          >
            <div className="mb-2"><IconDocument /></div>
            <div className="text-sm font-semibold text-ds-text mb-1">PDF Portfolio</div>
            <div className="text-xs text-ds-textMuted leading-relaxed">
              A multi-page PDF of your full portfolio. ATS-readable text.
            </div>
            <div className="mt-3">
              <span className="inline-block px-3 py-1.5 text-xs font-medium rounded bg-[#185FA5] text-white">
                Export as PDF
              </span>
            </div>
          </button>

          {/* Share card */}
          <button
            onClick={() => setSelectedCard('share')}
            className={`text-left p-4 rounded-lg border transition-colors ${
              selectedCard === 'share'
                ? 'border-[#185FA5] bg-blue-50'
                : 'border-ds-border bg-ds-bg hover:border-[#185FA5]/50'
            }`}
          >
            <div className="mb-2"><IconShare /></div>
            <div className="text-sm font-semibold text-ds-text mb-1">Share Link</div>
            <div className="text-xs text-ds-textMuted leading-relaxed">
              Copy your portfolio URL to share with employers.
            </div>
            <div className="mt-3">
              <span className="inline-block px-3 py-1.5 text-xs font-medium rounded border border-[#185FA5] text-[#185FA5]">
                Copy Link
              </span>
            </div>
          </button>
        </div>

        {/* PDF config panel */}
        {selectedCard === 'pdf' && (
          <div className="space-y-4 border-t border-ds-border pt-4">
            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCover}
                  onChange={(e) => setIncludeCover(e.target.checked)}
                  className="w-4 h-4 accent-[#185FA5]"
                />
                <span className="text-sm text-ds-text">Include cover page</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTOC}
                  onChange={(e) => setIncludeTOC(e.target.checked)}
                  className="w-4 h-4 accent-[#185FA5]"
                />
                <span className="text-sm text-ds-text">Include table of contents</span>
              </label>
            </div>

            {/* Page size */}
            <div>
              <span className="text-xs font-medium text-ds-textMuted block mb-1.5">Page size</span>
              <div className="flex gap-2">
                {['A4', 'Letter'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPageSize(s)}
                    className={`px-4 py-1.5 text-xs font-medium rounded border transition-colors ${
                      pageSize === s
                        ? 'bg-[#185FA5] text-white border-[#185FA5]'
                        : 'border-ds-border text-ds-text hover:border-[#185FA5]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour mode */}
            <div>
              <span className="text-xs font-medium text-ds-textMuted block mb-1.5">Colour mode</span>
              <div className="flex gap-2">
                {[{ label: 'Colour', value: 'colour' }, { label: 'B&W', value: 'bw' }].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setColorMode(m.value)}
                    className={`px-4 py-1.5 text-xs font-medium rounded border transition-colors ${
                      colorMode === m.value
                        ? 'bg-[#185FA5] text-white border-[#185FA5]'
                        : 'border-ds-border text-ds-text hover:border-[#185FA5]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {exportError && (
              <div className="text-xs text-ds-danger bg-ds-dangerLight border border-ds-danger/20 rounded p-2.5">
                {exportError}
              </div>
            )}

            {/* Export button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-[#185FA5] text-white hover:bg-[#1450894] disabled:opacity-60 transition-colors"
            >
              {exporting ? 'Generating PDF...' : 'Export PDF'}
            </button>

            <p className="text-xs text-ds-textMuted text-center">
              PDF generation uses Puppeteer server-side. May take 10–30 seconds.
            </p>
          </div>
        )}

        {/* Share link panel */}
        {selectedCard === 'share' && (
          <div className="border-t border-ds-border pt-4 space-y-3">
            <div className="bg-ds-bg border border-ds-border rounded-lg px-3 py-2 text-xs text-ds-textMuted break-all">
              {shareUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className={`w-full py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                copied
                  ? 'border-ds-success bg-ds-successLight text-ds-success'
                  : 'border-[#185FA5] text-[#185FA5] hover:bg-blue-50'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
