'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { FileDropZone } from '@/components/utilities/FileDropZone';
import { FileList } from '@/components/utilities/FileList';
import { ProcessingState } from '@/components/utilities/ProcessingState';

function MergeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"/><line x1="12" y1="2" x2="12" y2="22"/></svg>;
}

export default function MergePDFPage() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function addFiles(incoming) {
    const valid = incoming.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))].slice(0, 20);
    });
  }

  async function handleMerge() {
    if (files.length < 2) return;
    setProcessing(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const out = await merged.save();
      const blob = new Blob([out], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'merged.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to merge PDFs. Make sure all files are valid PDFs.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolPageLayout icon={<MergeIcon />} title="Merge PDF" description="Combine multiple PDF files into one, in the order you choose." parentHref="/utilities/pdf" parentLabel="PDF Tools">
      {processing ? (
        <ProcessingState message="Merging PDFs…" />
      ) : (
        <>
          <FileDropZone accept=".pdf,application/pdf" multiple maxSizeMB={50} onFiles={addFiles} />

          {files.length > 0 && (
            <>
              <FileList
                files={files}
                onRemove={i => setFiles(f => f.filter((_, idx) => idx !== i))}
                onReorder={setFiles}
              />
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handleMerge}
                  disabled={files.length < 2}
                  className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Merge {files.length} PDF{files.length !== 1 ? 's' : ''} →
                </button>
                <button onClick={() => setFiles([])} className="text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                  Clear all
                </button>
              </div>
            </>
          )}

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </>
      )}
    </ToolPageLayout>
  );
}
