'use client';
import { ToolCard } from '@/components/utilities/ToolCard';

// ── Icons ─────────────────────────────────────────────────────────────────────
const I = ({ d, extra }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {extra}
    <path d={d} />
  </svg>
);

function MergeIcon()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><line x1="12" y1="2" x2="12" y2="22"/></svg>; }
function SplitIcon()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="m21 3-7 7"/><path d="M8 21H3v-5"/><path d="m3 21 7-7"/><line x1="3" y1="12" x2="21" y2="12"/></svg>; }
function CompressIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>; }
function RotateIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-4"/></svg>; }
function OrganiseIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function RemoveIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>; }
function NumberIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>; }
function WatermarkIcon(){ return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/></svg>; }
function CropIcon()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>; }
function RepairIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>; }
function ExtractIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>; }
function CompareIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" opacity=".4"/><rect x="3" y="3" width="9" height="13" rx="2"/><rect x="12" y="3" width="9" height="13" rx="2"/></svg>; }
function RedactIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="8" rx="1" fill="currentColor" stroke="none" opacity=".15"/><rect x="3" y="8" width="18" height="8" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>; }
function FlattenIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 8 3 12 8 16"/><polyline points="16 8 21 12 16 16"/></svg>; }
function WordIcon()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>; }
function ExcelIcon()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="14" y2="9"/></svg>; }
function PptIcon()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function ImgToPdfIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="13" height="13" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m16 12-3-3L5 16"/><path d="M19 8v8M19 16h-4"/></svg>; }
function HtmlIcon()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>; }
function TextIcon()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>; }
function MarkdownIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="9 16 9 8 12 11 15 8 15 16"/></svg>; }
function PdfWordIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>; }
function PdfExcelIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m8 13 2 2 4-4"/></svg>; }
function ImageIcon()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>; }
function PdfTextIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>; }
function PdfHtmlIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>; }
function CompressImgIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>; }
function ResizeImgIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>; }
function ConvertImgIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>; }
function CropImgIcon()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>; }
function LockIcon()        { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function UnlockIcon()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>; }
function PenIcon()         { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>; }
function MergeWordIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><line x1="12" y1="2" x2="12" y2="22"/></svg>; }

// ── Tool data ─────────────────────────────────────────────────────────────────
const PDF_TOOLS = [
  { href: '/utilities/pdf/merge',          name: 'Merge PDF',             description: 'Combine multiple PDF files into one, in any order.',           icon: <MergeIcon />,    gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
  { href: '/utilities/pdf/split',          name: 'Split PDF',             description: 'Extract pages or split a PDF into multiple files.',             icon: <SplitIcon />,    gradient: 'from-[#FEF3C7] to-[#FDE68A]' },
  { href: '/utilities/pdf/compress',       name: 'Compress PDF',          description: 'Reduce file size while keeping quality acceptable.',            icon: <CompressIcon />, gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
  { href: '/utilities/pdf/rotate',         name: 'Rotate Pages',          description: 'Rotate individual pages or all pages in a PDF.',               icon: <RotateIcon />,   gradient: 'from-[#EDE9FE] to-[#DDD6FE]' },
  { href: '/utilities/pdf/organise',       name: 'Organise Pages',        description: 'Reorder, rotate, or delete pages in a PDF.',                   icon: <OrganiseIcon />, gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
  { href: '/utilities/pdf/remove-pages',   name: 'Remove Pages',          description: 'Select and permanently remove pages from a PDF.',              icon: <RemoveIcon />,   gradient: 'from-[#FEE2E2] to-[#FECACA]' },
  { href: '/utilities/pdf/page-numbers',   name: 'Add Page Numbers',      description: 'Stamp page numbers onto every page of a PDF.',                 icon: <NumberIcon />,   gradient: 'from-[#FEF3C7] to-[#FDE68A]' },
  { href: '/utilities/pdf/watermark',      name: 'Add Watermark',         description: 'Overlay text (DRAFT, CONFIDENTIAL…) on all pages.',            icon: <WatermarkIcon />,gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
  { href: '/utilities/pdf/crop',           name: 'Crop PDF',              description: 'Trim margins from PDF pages using custom measurements.',        icon: <CropIcon />,     gradient: 'from-[#EDE9FE] to-[#DDD6FE]' },
  { href: '/utilities/pdf/repair',         name: 'Repair PDF',            description: 'Rebuild a corrupted or damaged PDF structure.',                 icon: <RepairIcon />,   gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
  { href: '/utilities/pdf/extract-images', name: 'Extract Images',        description: 'Export selected PDF pages as individual image files.',          icon: <ExtractIcon />,  gradient: 'from-[#FEF3C7] to-[#FDE68A]' },
  { href: '/utilities/pdf/compare',        name: 'Compare PDFs',          description: 'View two PDF documents side by side for comparison.',           icon: <CompareIcon />,  gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
  { href: '/utilities/pdf/redact',         name: 'Redact PDF',            description: 'Black out sensitive text throughout a PDF document.',           icon: <RedactIcon />,   gradient: 'from-[#FEE2E2] to-[#FECACA]' },
  { href: '/utilities/pdf/flatten',        name: 'Flatten PDF',           description: 'Bake form fields and annotations into static page content.',    icon: <FlattenIcon />,  gradient: 'from-[#EDE9FE] to-[#DDD6FE]' },
];

const TO_PDF_TOOLS = [
  { href: '/utilities/documents/word-to-pdf',     name: 'Word to PDF',       description: 'Convert a DOCX document to a clean PDF.',                    icon: <WordIcon />,     gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
  { href: '/utilities/documents/excel-to-pdf',    name: 'Excel to PDF',      description: 'Convert a spreadsheet to a formatted PDF.',                  icon: <ExcelIcon />,    gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
  { href: '/utilities/documents/ppt-to-pdf',      name: 'PowerPoint to PDF', description: 'Convert a presentation file to PDF format.',                 icon: <PptIcon />,      gradient: 'from-[#FEF3C7] to-[#FDE68A]' },
  { href: '/utilities/documents/images-to-pdf',   name: 'Images to PDF',     description: 'Combine multiple images into a single PDF document.',         icon: <ImgToPdfIcon />, gradient: 'from-[#FEE2E2] to-[#FECACA]' },
  { href: '/utilities/documents/html-to-pdf',     name: 'HTML to PDF',       description: 'Render an HTML page or snippet as a PDF document.',           icon: <HtmlIcon />,     gradient: 'from-[#EDE9FE] to-[#DDD6FE]' },
  { href: '/utilities/documents/text-to-pdf',     name: 'Text to PDF',       description: 'Turn plain text or pasted content into a PDF.',               icon: <TextIcon />,     gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
  { href: '/utilities/documents/markdown-to-pdf', name: 'Markdown to PDF',   description: 'Write or paste Markdown and export it as a styled PDF.',      icon: <MarkdownIcon />, gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
];

const FROM_PDF_TOOLS = [
  { href: '/utilities/pdf/to-word',    name: 'PDF to Word',    description: 'Convert a PDF to an editable DOCX document.',                   icon: <PdfWordIcon />,  gradient: 'from-[#EDE9FE] to-[#DDD6FE]' },
  { href: '/utilities/pdf/to-excel',   name: 'PDF to Excel',   description: 'Extract text from a PDF into a spreadsheet.',                   icon: <PdfExcelIcon />, gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
  { href: '/utilities/pdf/to-images',  name: 'PDF to Images',  description: 'Export each PDF page as a JPG or PNG image.',                   icon: <ImageIcon />,    gradient: 'from-[#FEE2E2] to-[#FECACA]' },
  { href: '/utilities/documents/pdf-to-text', name: 'PDF to Text', description: 'Extract all text content from a PDF file.',                icon: <PdfTextIcon />,  gradient: 'from-[#FEF3C7] to-[#FDE68A]' },
  { href: '/utilities/pdf/to-html',    name: 'PDF to HTML',    description: 'Convert a PDF\'s text content into a structured HTML file.',   icon: <PdfHtmlIcon />,  gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
];

const IMAGE_TOOLS = [
  { href: '/utilities/images/compress', name: 'Compress Image',   description: 'Reduce image file size while preserving visual quality.',  icon: <CompressImgIcon />, gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
  { href: '/utilities/images/resize',   name: 'Resize Image',     description: 'Change image dimensions by pixels, percentage, or preset.', icon: <ResizeImgIcon />,   gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
  { href: '/utilities/images/convert',  name: 'Convert Format',   description: 'Convert images between JPG, PNG, and WebP formats.',       icon: <ConvertImgIcon />,  gradient: 'from-[#FEF3C7] to-[#FDE68A]' },
  { href: '/utilities/images/crop',     name: 'Crop Image',       description: 'Select and crop a region from any image.',                  icon: <CropImgIcon />,     gradient: 'from-[#EDE9FE] to-[#DDD6FE]' },
];

const SECURITY_TOOLS = [
  { href: '/utilities/security/protect', name: 'Password Protect', description: 'Lock a PDF with a password to restrict access.',    icon: <LockIcon />,   gradient: 'from-[#FEE2E2] to-[#FECACA]' },
  { href: '/utilities/security/unlock',  name: 'Unlock PDF',       description: 'Remove the password from a protected PDF.',         icon: <UnlockIcon />, gradient: 'from-[#D1FAE5] to-[#A7F3D0]' },
  { href: '/utilities/security/sign',    name: 'Sign PDF',         description: 'Add your signature to a PDF document.',             icon: <PenIcon />,    gradient: 'from-[#EDE9FE] to-[#DDD6FE]' },
  { href: '/utilities/documents/merge-word', name: 'Merge Word Docs', description: 'Combine multiple DOCX files into one document.', icon: <MergeWordIcon />, gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
];

function RecordIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>; }

const RECORDING_TOOLS = [
  { href: '/utilities/recorder', name: 'Screen Recorder & Transcript', description: 'Record your screen or upload a video to get an instant timestamped transcript. Install the Chrome extension for live transcription.', icon: <RecordIcon />, gradient: 'from-[#E6F1FB] to-[#D4E8F8]' },
];

// ── Hub page ──────────────────────────────────────────────────────────────────
const SECTION_LABEL = 'text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-[#4A6380] mb-4';

export default function UtilitiesHubPage() {
  return (
    <div className="gradient-mesh-1 min-h-screen p-6 space-y-10">
      <div>
        <h1 className="text-2xl font-bold font-heading text-gradient-primary">Utilities</h1>
        <p className="text-sm text-ds-textMuted mt-0.5">34 tools to work with PDFs, documents, images, and recordings — free, private, fast.</p>
      </div>

      <section>
        <p className={SECTION_LABEL}>PDF Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PDF_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>

      <section>
        <p className={SECTION_LABEL}>Convert to PDF</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TO_PDF_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>

      <section>
        <p className={SECTION_LABEL}>Convert from PDF</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FROM_PDF_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>

      <section>
        <p className={SECTION_LABEL}>Image Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {IMAGE_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>

      <section>
        <p className={SECTION_LABEL}>Security Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SECURITY_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>

      <section>
        <p className={SECTION_LABEL}>Recording Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {RECORDING_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
        </div>
      </section>
    </div>
  );
}
