'use client';

import { useState } from 'react';

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default function ExportButton({
  pdfDoc,
  pdfBytes,
  filename,
  fabricCanvases,
  formValues,
  textObjects,
  signatureDataUrls,
  pageCount,
  currentPage,
}) {
  const [exporting, setExporting] = useState(false);

  async function handleDownload() {
    if (!pdfBytes) return;

    setExporting(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(pdfBytes);

      for (let i = 0; i < pageCount; i++) {
        const canvasDataUrl = fabricCanvases[i];
        if (!canvasDataUrl) continue;

        const pngBytes = dataUrlToBytes(canvasDataUrl);
        const img = await doc.embedPng(pngBytes);
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        page.drawImage(img, { x: 0, y: 0, width, height });
      }

      const saved = await doc.save();
      const blob = new Blob([saved], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-' + (filename || 'document.pdf');
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={exporting || !pdfBytes}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
    >
      {exporting ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
            />
          </svg>
          Export PDF
        </>
      )}
    </button>
  );
}
