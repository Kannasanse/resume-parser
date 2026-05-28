'use client';
import { ToolCard } from '@/components/utilities/ToolCard';

const PDF_TOOLS = [
  {
    href: '/utilities/pdf/merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one, in any order.',
    icon: <MergeIcon />,
    gradient: 'from-[#E6F1FB] to-[#D4E8F8]',
  },
  {
    href: '/utilities/pdf/split',
    name: 'Split PDF',
    description: 'Extract pages or split a PDF into multiple files.',
    icon: <SplitIcon />,
    gradient: 'from-[#FEF3C7] to-[#FDE68A]',
  },
  {
    href: '/utilities/pdf/compress',
    name: 'Compress PDF',
    description: 'Reduce file size while keeping quality acceptable.',
    icon: <CompressIcon />,
    gradient: 'from-[#D1FAE5] to-[#A7F3D0]',
  },
  {
    href: '/utilities/pdf/to-word',
    name: 'PDF to Word',
    description: 'Convert a PDF to an editable DOCX document.',
    icon: <WordIcon />,
    gradient: 'from-[#EDE9FE] to-[#DDD6FE]',
  },
  {
    href: '/utilities/pdf/to-images',
    name: 'PDF to Images',
    description: 'Export each PDF page as a JPG or PNG image.',
    icon: <ImageIcon />,
    gradient: 'from-[#FEE2E2] to-[#FECACA]',
  },
  {
    href: '/utilities/pdf/organise',
    name: 'Organise Pages',
    description: 'Reorder, rotate, or delete pages in a PDF.',
    icon: <OrganiseIcon />,
    gradient: 'from-[#E6F1FB] to-[#D4E8F8]',
  },
  {
    href: '/utilities/pdf/page-numbers',
    name: 'Add Page Numbers',
    description: 'Stamp page numbers onto every page of a PDF.',
    icon: <NumberIcon />,
    gradient: 'from-[#FEF3C7] to-[#FDE68A]',
  },
  {
    href: '/utilities/pdf/watermark',
    name: 'Add Watermark',
    description: 'Overlay text (DRAFT, CONFIDENTIAL…) on all pages.',
    icon: <WatermarkIcon />,
    gradient: 'from-[#D1FAE5] to-[#A7F3D0]',
  },
];

const IMAGE_TOOLS = [
  {
    href: '/utilities/images/compress',
    name: 'Compress Image',
    description: 'Reduce image file size while preserving visual quality.',
    icon: <CompressImgIcon />,
    gradient: 'from-[#D1FAE5] to-[#A7F3D0]',
  },
  {
    href: '/utilities/images/resize',
    name: 'Resize Image',
    description: 'Change image dimensions by pixels, percentage, or preset.',
    icon: <ResizeImgIcon />,
    gradient: 'from-[#E6F1FB] to-[#D4E8F8]',
  },
  {
    href: '/utilities/images/convert',
    name: 'Convert Format',
    description: 'Convert images between JPG, PNG, and WebP formats.',
    icon: <ConvertImgIcon />,
    gradient: 'from-[#FEF3C7] to-[#FDE68A]',
  },
  {
    href: '/utilities/images/crop',
    name: 'Crop Image',
    description: 'Select and crop a region from any image.',
    icon: <CropImgIcon />,
    gradient: 'from-[#EDE9FE] to-[#DDD6FE]',
  },
];

const DOC_TOOLS = [
  {
    href: '/utilities/documents/word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert a DOCX document to a clean PDF.',
    icon: <WordToPdfIcon />,
    gradient: 'from-[#EDE9FE] to-[#DDD6FE]',
  },
  {
    href: '/utilities/documents/pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract all text content from a PDF file.',
    icon: <TextIcon />,
    gradient: 'from-[#FEE2E2] to-[#FECACA]',
  },
  {
    href: '/utilities/documents/merge-word',
    name: 'Merge Word Docs',
    description: 'Combine multiple DOCX files into one document.',
    icon: <MergeIcon />,
    gradient: 'from-[#E6F1FB] to-[#D4E8F8]',
  },
  {
    href: '/utilities/documents/text-to-pdf',
    name: 'Text to PDF',
    description: 'Turn plain text or pasted content into a PDF.',
    icon: <NotebookIcon />,
    gradient: 'from-[#FEF3C7] to-[#FDE68A]',
  },
];

function MergeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><line x1="12" y1="2" x2="12" y2="22"/></svg>;
}
function SplitIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="m21 3-7 7"/><path d="M8 21H3v-5"/><path d="m3 21 7-7"/><line x1="3" y1="12" x2="21" y2="12"/></svg>;
}
function CompressIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>;
}
function WordIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
}
function ImageIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
}
function OrganiseIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function NumberIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
}
function WatermarkIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/></svg>;
}
function WordToPdfIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;
}
function TextIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
}
function NotebookIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function CompressImgIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>;
}
function ResizeImgIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>;
}
function ConvertImgIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
}
function CropImgIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>;
}

export default function UtilitiesHubPage() {
  return (
    <div className="gradient-mesh-1 min-h-screen p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading text-gradient-primary">Utilities</h1>
        <p className="text-sm text-ds-textMuted mt-0.5">Free tools to work with your files — fast, private, no storage.</p>
      </div>

      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#4A6380] mb-4">PDF Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PDF_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#4A6380] mb-4">Document Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {DOC_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#4A6380] mb-4">Image Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {IMAGE_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>
    </div>
  );
}
