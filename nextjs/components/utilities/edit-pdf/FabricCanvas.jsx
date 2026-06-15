'use client';

import { useEffect, useRef } from 'react';

export default function FabricCanvas({ width, height, fabricRef, mode }) {
  const canvasEl = useRef(null);
  const fabricInstance = useRef(null);

  // Mount: create fabric.Canvas
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
      fabricInstance.current = fc;
      if (fabricRef) fabricRef.current = fc;
    });
    return () => {
      if (fc) {
        fc.dispose();
        fabricInstance.current = null;
        if (fabricRef) fabricRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize when width/height change
  useEffect(() => {
    const fc = fabricInstance.current;
    if (!fc || !width || !height) return;
    fc.setDimensions({ width, height });
    fc.renderAll();
  }, [width, height]);

  // Update cursor/interaction mode
  useEffect(() => {
    const fc = fabricInstance.current;
    if (!fc) return;
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
    fc.renderAll();
  }, [mode]);

  return (
    <canvas
      ref={canvasEl}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: mode === 'view' ? 'none' : 'auto',
      }}
    />
  );
}
