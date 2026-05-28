'use client';
import Link from 'next/link';

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function ShieldCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ToolPageLayout({ icon, title, description, parentHref = '/utilities', parentLabel = 'Utilities', children }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#9CA3AF] mb-6 flex items-center gap-1.5">
        <Link href="/utilities" className="hover:text-[#185FA5] transition-colors">Utilities</Link>
        {parentHref !== '/utilities' && (
          <>
            <ChevronRight />
            <Link href={parentHref} className="hover:text-[#185FA5] transition-colors">{parentLabel}</Link>
          </>
        )}
        <ChevronRight />
        <span className="text-[#6B7280]">{title}</span>
      </nav>

      {/* Tool header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#E6F1FB] to-[#D4E8F8] dark:from-[rgba(24,95,165,0.2)] dark:to-[rgba(24,95,165,0.1)] shadow-sm flex-shrink-0 text-[#185FA5]">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2C2C2A] dark:text-[#E8EFF7] tracking-tight">{title}</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] mt-0.5">{description}</p>
        </div>
      </div>

      {children}

      {/* Privacy notice */}
      <div className="flex items-start gap-2 mt-8 p-3 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
        <span className="text-[#1D9E75] mt-0.5 flex-shrink-0"><ShieldCheck /></span>
        <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1]">
          <strong className="text-[#2C2C2A] dark:text-[#E8EFF7]">Your files are private.</strong>
          {' '}Client-side tools never upload your files. Server-side tools delete your files immediately after processing. Nothing is stored on our servers.
        </p>
      </div>
    </div>
  );
}
