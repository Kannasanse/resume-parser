'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function TextIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
}

export default function PDFToTextPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleExtract() {
    if (!file) return;
    setProcessing(true); setError(''); setText('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const parts = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        parts.push(`--- Page ${i} ---\n${pageText}`);
      }
      setText(parts.join('\n\n'));
    } catch { setError('Failed to extract text. Make sure the PDF contains selectable text.'); }
    finally { setProcessing(false); }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = file.name.replace(/\.pdf$/i, '') + '.txt'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolPageLayout icon={<TextIcon />} title="PDF to Text" description="Extract all text content from a PDF file." parentHref="/utilities/documents" parentLabel="Document Tools">
      {processing ? <ProcessingState message="Extracting text…" /> :
       !file ? <FileDropZone accept=".pdf,application/pdf" maxSizeMB={50} onFiles={([f]) => { setFile(f); setText(''); }} /> : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
            <button onClick={() => { setFile(null); setText(''); }} className="ml-4 text-xs text-[#9CA3AF] hover:text-[#D93025] transition-colors">Change file</button>
          </div>

          {!text ? (
            <button onClick={handleExtract} className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors">
              Extract Text →
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#9CA3AF]">{text.length.toLocaleString()} characters extracted</p>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-xs px-3 py-1.5 border border-[#D1DCE8] dark:border-white/10 rounded-lg text-[#185FA5] hover:bg-[rgba(24,95,165,0.06)] transition-colors">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={handleDownload} className="text-xs px-3 py-1.5 bg-[#185FA5] hover:bg-[#1454a0] text-white rounded-lg transition-colors">
                    Download .txt
                  </button>
                </div>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={16}
                className="w-full border border-[#D1DCE8] dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:ring-2 focus:ring-[#185FA5] font-mono resize-y"
              />
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
