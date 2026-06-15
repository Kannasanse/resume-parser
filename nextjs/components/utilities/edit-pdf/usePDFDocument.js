'use client';
import { useState, useCallback } from 'react';

export function usePDFDocument() {
  const [pdfDoc, setPdfDoc] = useState(null);       // pdf-lib PDFDocument
  const [pdfBytes, setPdfBytes] = useState(null);   // original ArrayBuffer
  const [filename, setFilename] = useState('document.pdf');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPDF = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPdfDoc(doc);
      setPdfBytes(bytes);
      setFilename(file.name);
      setPageCount(doc.getPageCount());
      setCurrentPage(0);
    } catch (e) {
      setError(e.message || 'Failed to load PDF');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPdfDoc(null);
    setPdfBytes(null);
    setFilename('document.pdf');
    setPageCount(0);
    setCurrentPage(0);
    setError(null);
  }, []);

  return {
    pdfDoc, pdfBytes, filename, pageCount,
    currentPage, setCurrentPage,
    loading, error,
    loadPDF, reset,
  };
}
