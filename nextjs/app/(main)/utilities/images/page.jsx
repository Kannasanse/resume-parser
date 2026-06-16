'use client';
import { ToolCard } from '@/components/utilities/ToolCard';

function CompressIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>;
}
function ResizeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>;
}
function ConvertIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
}
function CropIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>;
}

const IMAGE_TOOLS = [
  {
    href: '/utilities/images/compress',
    name: 'Compress Image',
    description: 'Reduce image file size while preserving visual quality.',
    icon: <CompressIcon />,
    gradient: 'from-[#D1FAE5] to-[#A7F3D0]',
  },
  {
    href: '/utilities/images/resize',
    name: 'Resize Image',
    description: 'Change image dimensions by pixels, percentage, or preset.',
    icon: <ResizeIcon />,
    gradient: 'from-[#E6F1FB] to-[#D4E8F8]',
  },
  {
    href: '/utilities/images/convert',
    name: 'Convert Format',
    description: 'Convert images between JPG, PNG, and WebP formats.',
    icon: <ConvertIcon />,
    gradient: 'from-[#FEF3C7] to-[#FDE68A]',
  },
  {
    href: '/utilities/images/crop',
    name: 'Crop Image',
    description: 'Select and crop a region from any image.',
    icon: <CropIcon />,
    gradient: 'from-[#EDE9FE] to-[#DDD6FE]',
  },
];

export default function ImageToolsHubPage() {
  return (
    <div className="gradient-mesh-1 min-h-screen p-6">
      <nav className="text-xs text-[#9CA3AF] mb-6 flex items-center gap-1.5">
        <a href="/utilities" className="hover:text-[#185FA5] transition-colors">Utilities</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        <span className="text-[#6B7280]">Image Tools</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-gradient-primary">Image Tools</h1>
        <p className="text-sm text-ds-textMuted mt-0.5">Compress, resize, convert, and crop images — all in your browser.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {IMAGE_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
      </div>
    </div>
  );
}
