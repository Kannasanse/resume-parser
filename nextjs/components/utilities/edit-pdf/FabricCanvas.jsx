'use client';

import { useEffect, useRef } from 'react';

export default function FabricCanvas({ width, height, fabricRef, onReady, mode }) {
  const canvasEl = useRef(null);
  const fabricInstance = useRef(null);

  useEffect(() => {
    let fc;
    import('fabric').then(({ Canvas }) => {
      if (!canvasEl.current) return;
      fc = new Canvas(canvasEl.current, {
        selection: true,
        preserveObjectStacking: true,
        enableRetinaScaling: false,
      });
      fc.setDimensions({ width: width || 800, height: height || 1100 });

      // fabric v6 replaces the canvas with a wrapper div (position: relative).
      // We need it positioned absolutely so it overlays the PDF canvas.
      const container = fc.elements?.container;
      if (container) {
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
      }

      fabricInstance.current = fc;
      if (fabricRef) fabricRef.current = fc;
      if (onReady) onReady(fc);
    });
    return () => {
      if (fc) {
        fc.dispose();
        fabricInstance.current = null;
        if (fabricRef) fabricRef.current = null;
        if (onReady) onReady(null);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize when width/height change
  useEffect(() => {
    const fc = fabricInstance.current;
    if (!fc || !width || !height) return;
    fc.setDimensions({ width, height });
    const container = fc.elements?.container;
    if (container) {
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
    }
    fc.renderAll();
  }, [width, height]);

  // Update interaction mode and pointer events
  useEffect(() => {
    const fc = fabricInstance.current;
    if (!fc) return;
    const container = fc.elements?.container;
    const upperEl = fc.elements?.upper?.el;

    if (mode === 'draw') {
      fc.isDrawingMode = true;
      fc.selection = false;
    } else if (mode === 'select') {
      fc.isDrawingMode = false;
      fc.selection = true;
    } else if (mode === 'text' || mode === 'shape' || mode === 'image') {
      fc.isDrawingMode = false;
      fc.selection = false;
    } else {
      fc.isDrawingMode = false;
      fc.selection = true;
    }

    // Disable pointer events in view/forms mode so form inputs are clickable
    const noPointer = mode === 'view';
    if (upperEl) upperEl.style.pointerEvents = noPointer ? 'none' : 'auto';
    if (container) container.style.pointerEvents = noPointer ? 'none' : 'auto';

    fc.renderAll();
  }, [mode]);

  // The canvas element — fabric will replace this with its container div
  return <canvas ref={canvasEl} />;
}
