'use client';

import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function UnlockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function UnlockPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleUnlock() {
    if (!file) return;
    setProcessing(true);
    setError('');
    setDone(false);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      let doc;
      try {
        doc = await PDFDocument.load(bytes, { password });
      } catch {
        throw new Error('Incorrect password. Please check and try again.');
      }
      const out = await PDFDocument.create();
      const pages = await out.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => out.addPage(p));
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unlocked-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Failed to unlock PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolPageLayout
      icon={<UnlockIcon />}
      title="Unlock PDF"
      description="Remove the password from a protected PDF."
      parentHref="/utilities/security"
      parentLabel="Security Tools"
    >
      {!file && (
        <FileDropZone
          accept="application/pdf"
          maxSizeMB={100}
          onFiles={files => { setFile(files[0]); setError(''); setDone(false); }}
        />
      )}

      {file && !processing && (
        <div className="space-y-5">
          {/* File info */}
          <div className="flex items-center justify-between p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#D1FAE5] flex items-center justify-center flex-shrink-0 text-[#185FA5]">
                <UnlockIcon />
              </div>
              <span className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</span>
            </div>
            <button
              onClick={() => { setFile(null); setPassword(''); setError(''); setDone(false); }}
              className="ml-3 text-sm text-[#9CA3AF] hover:text-[#185FA5] transition-colors flex-shrink-0"
            >
              Change file
            </button>
          </div>

          {/* Password input */}
          <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
            <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
              PDF Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter the PDF password"
                onKeyDown={e => { if (e.key === 'Enter') handleUnlock(); }}
                className="w-full border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 pr-10 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
              />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#185FA5] transition-colors"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1.5">
              Leave blank if the PDF uses an empty password or only has owner restrictions.
            </p>
          </div>

          {/* Action */}
          <button
            onClick={handleUnlock}
            className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Unlock PDF →
          </button>

          {done && (
            <div className="p-4 bg-[#D1FAE5] dark:bg-[rgba(16,185,129,0.1)] rounded-xl border border-[#A7F3D0] dark:border-[rgba(16,185,129,0.2)]">
              <p className="text-sm font-medium text-[#065F46] dark:text-[#6EE7B7]">
                PDF unlocked successfully. Check your downloads.
              </p>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}

      {processing && <ProcessingState message="Unlocking your PDF…" hint="Removing password protection" />}
    </ToolPageLayout>
  );
}
