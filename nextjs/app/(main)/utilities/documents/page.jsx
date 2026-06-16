'use client';
import { ToolCard } from '@/components/utilities/ToolCard';

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18"/>
  </svg>
);

const DOCUMENT_TOOLS = [
  { href: '/utilities/documents/word-to-pdf',     name: 'Word to PDF',       description: 'Convert a DOCX document to a clean PDF.',                      gradient: 'from-[#E6F1FB] to-[#D4E8F8]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { href: '/utilities/documents/excel-to-pdf',    name: 'Excel to PDF',      description: 'Convert a spreadsheet to a formatted PDF.',                     gradient: 'from-[#D1FAE5] to-[#A7F3D0]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg> },
  { href: '/utilities/documents/ppt-to-pdf',      name: 'PowerPoint to PDF', description: 'Convert a presentation file to PDF format.',                    gradient: 'from-[#FEF3C7] to-[#FDE68A]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { href: '/utilities/documents/images-to-pdf',   name: 'Images to PDF',     description: 'Combine multiple images into a single PDF document.',            gradient: 'from-[#FEE2E2] to-[#FECACA]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { href: '/utilities/documents/html-to-pdf',     name: 'HTML to PDF',       description: 'Render an HTML page or snippet as a PDF document.',              gradient: 'from-[#EDE9FE] to-[#DDD6FE]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
  { href: '/utilities/documents/text-to-pdf',     name: 'Text to PDF',       description: 'Turn plain text or pasted content into a PDF.',                  gradient: 'from-[#E6F1FB] to-[#D4E8F8]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { href: '/utilities/documents/markdown-to-pdf', name: 'Markdown to PDF',   description: 'Write or paste Markdown and export it as a styled PDF.',         gradient: 'from-[#D1FAE5] to-[#A7F3D0]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { href: '/utilities/documents/pdf-to-text',     name: 'PDF to Text',       description: 'Extract all text content from a PDF file.',                      gradient: 'from-[#FEF3C7] to-[#FDE68A]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { href: '/utilities/documents/merge-word',      name: 'Merge Word Docs',   description: 'Combine multiple DOCX files into one document.',                 gradient: 'from-[#E6F1FB] to-[#D4E8F8]',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H2v12h6"/><path d="M16 6h6v12h-6"/><line x1="12" y1="3" x2="12" y2="21"/></svg> },
];

export default function DocumentToolsHubPage() {
  return (
    <div className="gradient-mesh-1 min-h-screen p-6">
      <nav className="text-xs text-[#9CA3AF] mb-6 flex items-center gap-1.5">
        <a href="/utilities" className="hover:text-[#185FA5] transition-colors">Utilities</a>
        <Chevron />
        <span className="text-[#6B7280]">Document Tools</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-gradient-primary">Document Tools</h1>
        <p className="text-sm text-ds-textMuted mt-0.5">Convert documents to and from PDF — Word, Excel, PowerPoint, HTML, and more.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {DOCUMENT_TOOLS.map(t => <ToolCard key={t.href} {...t} />)}
      </div>
    </div>
  );
}
