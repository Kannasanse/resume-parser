'use client';
import { useState } from 'react';

const BASE_URL = 'https://proflect-neo.vercel.app';

// Icons
function IconLinkedIn() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M16.667 2.5H3.333A.833.833 0 0 0 2.5 3.333v13.334c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V3.333A.833.833 0 0 0 16.667 2.5ZM7.083 14.583H5v-5.5h2.083v5.5Zm-1.041-6.25a1.042 1.042 0 1 1 0-2.083 1.042 1.042 0 0 1 0 2.083Zm8.541 6.25H12.5v-2.917c0-.833-.417-1.25-1.042-1.25-.625 0-1.041.417-1.041 1.25v2.917H8.333v-5.5h2.084v.833c.312-.5.937-.958 1.874-.958 1.334 0 2.292.875 2.292 2.792v2.833Z" />
    </svg>
  );
}

function IconTwitterX() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M15.272 2.5h2.647l-5.784 6.613L19 17.5h-5.328l-4.172-5.455L4.77 17.5H2.12l6.188-7.076L1 2.5h5.462l3.77 4.984L15.272 2.5Zm-.928 13.5h1.467L5.727 4h-1.57l10.187 12Z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="m2.5 5 7.5 6 7.5-6" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M5 11H3a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 3 1h7A1.5 1.5 0 0 1 11.5 3v2" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3l12 12M15 3 3 15" />
    </svg>
  );
}

export default function SharePanel({ portfolio, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  if (!isOpen || !portfolio) return null;

  const portfolioUrl = `${BASE_URL}/portfolios/${portfolio.slug}`;
  const embedCode = `<iframe src="${portfolioUrl}" width="100%" height="600" frameborder="0" title="${portfolio.name ?? 'Portfolio'}" allow="fullscreen"></iframe>`;

  function copyUrl() {
    navigator.clipboard.writeText(portfolioUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    });
  }

  const shareLinks = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`,
      icon: <IconLinkedIn />,
      color: '#0A66C2',
    },
    {
      label: 'Twitter / X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(portfolioUrl)}&text=${encodeURIComponent((portfolio.name ?? 'My Portfolio') + ' — Portfolio')}`,
      icon: <IconTwitterX />,
      color: '#000',
    },
    {
      label: 'Email',
      href: `mailto:?subject=Check out my portfolio&body=${encodeURIComponent(portfolioUrl)}`,
      icon: <IconMail />,
      color: '#185FA5',
    },
  ];

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Share portfolio"
    >
      <div className="relative max-w-md w-full mt-20 bg-white rounded-2xl p-6 shadow-xl border border-[#D1DCE8]">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close share panel"
          className="absolute top-4 right-4 text-[#6B7280] hover:text-[#2C2C2A] transition-colors"
        >
          <IconClose />
        </button>

        <h2 className="text-lg font-bold text-[#2C2C2A] mb-5">Share portfolio</h2>

        {/* Portfolio URL */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1.5">
            Portfolio URL
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={portfolioUrl}
              className="flex-1 min-w-0 px-3 py-2 border border-[#D1DCE8] rounded-lg text-sm text-[#2C2C2A] bg-[#F9FAFB] focus:outline-none"
            />
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D1DCE8] text-sm font-medium text-[#185FA5] hover:bg-[#185FA5]/5 transition-colors whitespace-nowrap"
            >
              <IconCopy />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share on */}
        <div className="mb-5">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-3">
            Share on
          </p>
          <div className="flex gap-3">
            {shareLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${link.label}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D1DCE8] text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
                style={{ color: link.color }}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Embed code */}
        <details className="group">
          <summary className="text-xs font-medium text-[#6B7280] uppercase tracking-wide cursor-pointer hover:text-[#2C2C2A] transition-colors select-none list-none flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              className="transition-transform group-open:rotate-90"
              aria-hidden="true"
            >
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            Embed code
          </summary>
          <div className="mt-3">
            <div className="relative">
              <pre className="bg-[#F9FAFB] border border-[#D1DCE8] rounded-lg p-3 text-xs font-mono text-[#2C2C2A] overflow-x-auto whitespace-pre-wrap break-all">
                <code>{embedCode}</code>
              </pre>
              <button
                onClick={copyEmbed}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white border border-[#D1DCE8] rounded text-xs font-medium text-[#185FA5] hover:bg-[#185FA5]/5 transition-colors"
              >
                <IconCopy />
                {embedCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
