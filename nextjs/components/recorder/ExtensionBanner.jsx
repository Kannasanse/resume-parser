'use client';
import { useState, useEffect } from 'react';

export function ExtensionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.__proflectExt) return;

    const onReady = () => setVisible(false);
    window.addEventListener('proflect-ext-ready', onReady);
    setVisible(true);

    return () => window.removeEventListener('proflect-ext-ready', onReady);
  }, []);

  if (!visible) return null;

  return (
    <div className="mt-6 rounded-2xl border border-[#D1DCE8] dark:border-white/10 bg-gradient-to-r from-[#E6F1FB] to-[#F4F8FC] dark:from-[rgba(24,95,165,0.12)] dark:to-[rgba(24,95,165,0.05)] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#185FA5] flex items-center justify-center text-white flex-shrink-0 text-base font-bold">
        ✦
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">
          Want live transcription while videos play?
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] mt-0.5">
          Install the Proflect Chrome Extension to auto-transcribe YouTube, Udemy, or any video directly in your browser.
        </p>
      </div>
      <a
        href="#extension"
        className="flex-shrink-0 px-4 py-2 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        onClick={e => e.preventDefault()}
      >
        Install Chrome Extension →
      </a>
    </div>
  );
}
