'use client';
import { ToolCard } from '@/components/utilities/ToolCard';

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

const SECURITY_TOOLS = [
  {
    href: '/utilities/security/protect',
    name: 'Password Protect PDF',
    description: 'Lock a PDF with a password to restrict access.',
    icon: <LockIcon />,
    gradient: 'from-[#FEE2E2] to-[#FECACA]',
  },
  {
    href: '/utilities/security/unlock',
    name: 'Unlock PDF',
    description: 'Remove the password from a protected PDF.',
    icon: <UnlockIcon />,
    gradient: 'from-[#D1FAE5] to-[#A7F3D0]',
  },
  {
    href: '/utilities/security/sign',
    name: 'Sign PDF',
    description: 'Add your signature to a PDF document.',
    icon: <PenIcon />,
    gradient: 'from-[#EDE9FE] to-[#DDD6FE]',
  },
];

export default function SecurityToolsPage() {
  return (
    <div className="gradient-mesh-1 min-h-screen p-6">
      <nav className="text-xs text-[#9CA3AF] mb-6 flex items-center gap-1.5">
        <a href="/utilities" className="hover:text-[#185FA5] transition-colors">Utilities</a>
        <ChevronRight />
        <span className="text-[#6B7280]">Security Tools</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-gradient-primary">Security Tools</h1>
        <p className="text-sm text-ds-textMuted mt-0.5">Protect, unlock, and sign PDF documents.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SECURITY_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
      </div>
    </div>
  );
}
