'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePDFDocument } from './usePDFDocument';
import { useUndoRedo } from './useUndoRedo';
import Toolbar from './Toolbar';
import ContextToolbar from './ContextToolbar';
import PageNavigation from './PageNavigation';
import ZoomControls from './ZoomControls';
import PDFRenderer from './PDFRenderer';
import FabricCanvas from './FabricCanvas';
import SignatureModal from './SignatureModal';
import { useTextMode } from './modes/TextMode';
import { useAnnotateMode } from './modes/AnnotateMode';
import { useDrawMode } from './modes/DrawMode';
import { useFormMode, FormOverlay } from './modes/FormMode';
import { useSignatureMode } from './modes/SignatureMode';

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ onOpenFile }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onOpenFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onOpenFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh]">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'flex flex-col items-center justify-center gap-4 w-full max-w-lg border-2 border-dashed rounded-2xl p-14 cursor-pointer transition-colors select-none',
          dragging
            ? 'border-blue-400 bg-blue-950/30'
            : 'border-gray-600 bg-gray-900/50 hover:border-gray-400 hover:bg-gray-900',
        ].join(' ')}
      >
        {/* PDF icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="w-16 h-16 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="8" y="4" width="24" height="32" rx="2" className="text-gray-600" stroke="currentColor" />
          <path d="M26 4v10h10" className="text-gray-600" stroke="currentColor" />
          <path d="M36 14L26 4" className="text-gray-600" stroke="currentColor" />
          <text x="10" y="46" fontSize="10" fontWeight="bold" fill="currentColor" stroke="none" className="text-red-400" style={{ fill: '#ef4444' }}>PDF</text>
        </svg>

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-lg font-semibold text-gray-200">Drop a PDF here to start editing</p>
          <p className="text-sm text-gray-400">or click to browse your files</p>
        </div>

        <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Open PDF
        </div>

        <p className="text-xs text-gray-500 mt-1">Files are never uploaded · 100% in browser · Max 50 MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EditPDFEditor() {
  // ── PDF document state ──────────────────────────────────────────────────────
  const {
    pdfDoc,
    pdfBytes,
    filename,
    pageCount,
    currentPage,
    setCurrentPage,
    loading,
    error,
    loadPDF,
    reset,
  } = usePDFDocument();

  // ── Undo / redo ─────────────────────────────────────────────────────────────
  const { record, undo, redo, canUndo, canRedo } = useUndoRedo();

  // ── Editor state ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState(null);
  const [zoom, setZoom] = useState(100); // stored as percentage
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [fabricCanvases, setFabricCanvases] = useState({}); // page index -> JSON snapshot
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);

  const [textProps, setTextProps] = useState({
    fontSize: 14,
    color: '#000000',
    bold: false,
    italic: false,
    underline: false,
    opacity: 1,
    align: 'left',
  });

  const [annotateProps, setAnnotateProps] = useState({
    type: 'highlight',
    color: '#FFF176',
    opacity: 0.5,
  });

  const [drawProps, setDrawProps] = useState({
    tool: 'pen',
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent',
    opacity: 1,
  });

  // ── Refs ────────────────────────────────────────────────────────────────────
  const pdfCanvasRef = useRef(null);
  const fabricRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // ── Fabric canvas selection tracking ────────────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const onSelected = (e) => setSelectedObject(e.selected?.[0] ?? null);
    const onCleared = () => setSelectedObject(null);

    fc.on('selection:created', onSelected);
    fc.on('selection:updated', onSelected);
    fc.on('selection:cleared', onCleared);

    return () => {
      fc.off('selection:created', onSelected);
      fc.off('selection:updated', onSelected);
      fc.off('selection:cleared', onCleared);
    };
  }, [fabricRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save / restore fabric canvas on page change ──────────────────────────────
  const prevPageRef = useRef(currentPage);

  const saveFabricState = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const json = fc.toJSON();
    setFabricCanvases((prev) => ({ ...prev, [prevPageRef.current]: json }));
  }, []);

  const restoreFabricState = useCallback(
    (pageIndex) => {
      const fc = fabricRef.current;
      if (!fc) return;
      const saved = fabricCanvases[pageIndex];
      if (saved) {
        fc.loadFromJSON(saved, () => fc.renderAll());
      } else {
        fc.clear();
        fc.renderAll();
      }
    },
    [fabricCanvases]
  );

  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      saveFabricState();
      restoreFabricState(currentPage);
      prevPageRef.current = currentPage;
    }
  }, [currentPage, saveFabricState, restoreFabricState]);

  // ── Record helper ────────────────────────────────────────────────────────────
  const handleRecord = useCallback(
    (snapshot) => {
      record({ page: currentPage, snapshot });
    },
    [record, currentPage]
  );

  // ── Undo / redo application ──────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const entry = undo();
    if (!entry) return;
    const fc = fabricRef.current;
    if (!fc) return;
    if (entry.page === currentPage) {
      fc.loadFromJSON(entry.snapshot, () => fc.renderAll());
    }
  }, [undo, currentPage]);

  const handleRedo = useCallback(() => {
    const entry = redo();
    if (!entry) return;
    const fc = fabricRef.current;
    if (!fc) return;
    if (entry.page === currentPage) {
      fc.loadFromJSON(entry.snapshot, () => fc.renderAll());
    }
  }, [redo, currentPage]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // ── Open file ────────────────────────────────────────────────────────────────
  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds 50 MB limit.');
      return;
    }
    // Clear fabric canvases for new document
    setFabricCanvases({});
    setMode(null);
    setSelectedObject(null);
    await loadPDF(file);
    // Reset file input so same file can be re-opened
    e.target.value = '';
  };

  const handleOpenFile = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds 50 MB limit.');
      return;
    }
    setFabricCanvases({});
    setMode(null);
    setSelectedObject(null);
    await loadPDF(file);
  };

  // ── Download ─────────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!pdfBytes) return;

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc2 = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      // Save current page fabric state before exporting
      saveFabricState();

      const pages = pdfDoc2.getPages();

      for (const [pageIdx, json] of Object.entries(fabricCanvases)) {
        const pi = parseInt(pageIdx, 10);
        if (pi >= pages.length || !json) continue;

        // Render fabric JSON to a temp canvas to get a dataURL
        const tempCanvas = document.createElement('canvas');
        const fc = fabricRef.current;
        if (!fc) continue;

        // Get page dimensions
        const page = pages[pi];
        const { width: pageW, height: pageH } = page.getSize();

        const zoomFactor = zoom / 100;

        await new Promise((resolve) => {
          const originalJson = fc.toJSON();
          fc.loadFromJSON(json, async () => {
            const dataUrl = fc.toDataURL({ format: 'png', multiplier: 1 });

            const pngImage = await pdfDoc2.embedPng(dataUrl);
            page.drawImage(pngImage, {
              x: 0,
              y: 0,
              width: pageW,
              height: pageH,
            });

            // Restore the current page state
            if (parseInt(pageIdx, 10) === currentPage) {
              fc.loadFromJSON(originalJson, () => fc.renderAll());
            }
            resolve();
          });
        });
      }

      const savedBytes = await pdfDoc2.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.pdf$/i, '') + '_edited.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[EditPDFEditor] Download error:', err);
    }
  }, [pdfBytes, fabricCanvases, filename, zoom, currentPage, saveFabricState]);

  // ── Zoom controls ────────────────────────────────────────────────────────────
  const ZOOM_STEP = 10;
  const MIN_ZOOM = 25;
  const MAX_ZOOM = 300;

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  const handleSetZoom = (val) => setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, val)));

  const handleFitWidth = () => {
    if (!scrollContainerRef.current) return;
    const containerWidth = scrollContainerRef.current.clientWidth - 48; // 2*p-6
    if (canvasDimensions.width > 0) {
      const baseWidth = canvasDimensions.width / (zoom / 100);
      const newZoom = Math.round((containerWidth / baseWidth) * 100);
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom)));
    }
  };

  const handleFitPage = () => {
    if (!scrollContainerRef.current || canvasDimensions.width === 0) return;
    const containerWidth = scrollContainerRef.current.clientWidth - 48;
    const containerHeight = scrollContainerRef.current.clientHeight - 48;
    const baseWidth = canvasDimensions.width / (zoom / 100);
    const baseHeight = canvasDimensions.height / (zoom / 100);
    const newZoom = Math.round(
      Math.min(
        (containerWidth / baseWidth) * 100,
        (containerHeight / baseHeight) * 100
      )
    );
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom)));
  };

  // ── Page navigation ──────────────────────────────────────────────────────────
  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < pageCount - 1) setCurrentPage(currentPage + 1);
  };

  const handleGoToPage = (idx) => {
    if (idx >= 0 && idx < pageCount) setCurrentPage(idx);
  };

  // ── Delete selected fabric object ─────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObjects();
    if (active && active.length > 0) {
      active.forEach((obj) => fc.remove(obj));
      fc.discardActiveObject();
      fc.renderAll();
      handleRecord(fc.toJSON());
    }
    setSelectedObject(null);
  }, [handleRecord]);

  // ── Mode hooks ────────────────────────────────────────────────────────────────
  const fabricCanvas = fabricRef.current;

  useTextMode({
    fabricCanvas,
    active: mode === 'text',
    textProps,
    onRecord: (snap) => handleRecord(snap),
  });

  useAnnotateMode({
    fabricCanvas,
    active: mode === 'annotate',
    annotateProps,
    onRecord: (objs) => handleRecord(fabricCanvas?.toJSON()),
  });

  useDrawMode({
    fabricCanvas,
    active: mode === 'draw',
    drawProps,
    onRecord: (info) => handleRecord(fabricCanvas?.toJSON()),
  });

  const { fields, fillField, formValues, fieldCount } = useFormMode({
    pdfDoc,
    currentPage,
    active: mode === 'forms',
  });

  const { addSignature } = useSignatureMode({
    fabricCanvas,
    active: mode === 'signature',
    onRecord: (snap) => handleRecord(snap),
  });

  // ── Signature handlers ────────────────────────────────────────────────────────
  const handleNewSignature = () => setShowSignatureModal(true);

  const handleSignatureConfirm = (dataUrl) => {
    addSignature(dataUrl);
    setShowSignatureModal(false);
  };

  // ── Dimensions change callback ────────────────────────────────────────────────
  const handleDimensionsChange = useCallback(({ width, height }) => {
    setCanvasDimensions({ width, height });
  }, []);

  // ── Zoom factor (decimal) ─────────────────────────────────────────────────────
  const zoomFactor = zoom / 100;

  // ── Fabric canvas mode string ─────────────────────────────────────────────────
  const fabricMode =
    mode === 'draw'
      ? 'draw'
      : mode === 'text' || mode === 'annotate' || mode === 'signature'
      ? 'shape'
      : mode === 'forms'
      ? 'view'
      : null;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Top toolbar */}
      <Toolbar
        mode={mode}
        setMode={setMode}
        onOpenFile={handleOpenFileClick}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onDownload={handleDownload}
        hasFile={!!pdfBytes}
      />

      {/* Context toolbar */}
      <ContextToolbar
        mode={mode}
        textProps={textProps}
        setTextProps={setTextProps}
        annotateProps={annotateProps}
        setAnnotateProps={setAnnotateProps}
        drawProps={drawProps}
        setDrawProps={setDrawProps}
        formInfo={{ fieldCount }}
        onNewSignature={handleNewSignature}
        selectedObject={selectedObject}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Main content area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto flex items-start justify-center p-6 relative"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-3">
            <svg className="w-8 h-8 text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-400 text-sm">Loading PDF…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-3">
            <p className="text-red-400 font-medium">Failed to load PDF</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={reset}
              className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !pdfBytes && (
          <EmptyState onOpenFile={handleOpenFile} />
        )}

        {!loading && !error && pdfBytes && (
          <div
            className="relative shadow-2xl"
            style={{ width: canvasDimensions.width || 'auto' }}
          >
            {/* PDF rendering layer */}
            <PDFRenderer
              pdfBytes={pdfBytes}
              currentPage={currentPage}
              zoom={zoomFactor}
              onDimensionsChange={handleDimensionsChange}
              canvasRef={pdfCanvasRef}
            />

            {/* Fabric drawing layer */}
            <FabricCanvas
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              fabricRef={fabricRef}
              mode={fabricMode}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />

            {/* Form fields overlay */}
            {mode === 'forms' && (
              <FormOverlay
                fields={fields}
                formValues={formValues}
                onFill={fillField}
                canvasRef={pdfCanvasRef}
                zoom={zoomFactor}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-gray-900 border-t border-gray-800">
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitWidth={handleFitWidth}
          onFitPage={handleFitPage}
          onSetZoom={handleSetZoom}
        />

        {pdfBytes && (
          <PageNavigation
            currentPage={currentPage}
            pageCount={pageCount}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            onGoTo={handleGoToPage}
          />
        )}

        <div />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Signature modal */}
      <SignatureModal
        open={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={handleSignatureConfirm}
      />
    </div>
  );
}
