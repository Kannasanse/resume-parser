'use client';

import { useEffect, useRef } from 'react';

function hexToRgba(hex, opacity) {
  const clean = (hex || '#ffff00').replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function useAnnotateMode({ fabricCanvas, active, annotateProps, onRecord }) {
  const stateRef = useRef({ isDrawing: false, startX: 0, startY: 0, activeShape: null, arrowHead: null, arrowLine: null });

  useEffect(() => {
    if (!fabricCanvas) return;

    let cancelled = false;
    let cleanupFn = null;

    import('fabric').then((f) => {
      if (cancelled) return;

      const canvas = fabricCanvas;
      const getPointer = (e) => canvas.getPointer(e.e);

      function onMouseDown(e) {
        const { x, y } = getPointer(e);
        const state = stateRef.current;
        state.isDrawing = true;
        state.startX = x;
        state.startY = y;

        const { type, color = '#FFFF00' } = annotateProps || {};
        const strokeColor = color;
        const fillColor = hexToRgba(color, type === 'highlight' ? 0.35 : 0);
        let shape = null;

        if (type === 'highlight' || type === 'rectangle') {
          shape = new f.Rect({
            left: x, top: y, width: 0, height: 0,
            fill: type === 'highlight' ? hexToRgba(color, 0.35) : fillColor,
            stroke: type === 'highlight' ? 'transparent' : strokeColor,
            strokeWidth: type === 'highlight' ? 0 : 2,
            selectable: false, evented: false, opacity: 1,
          });
          canvas.add(shape);
          state.activeShape = shape;
        } else if (type === 'circle') {
          shape = new f.Ellipse({ left: x, top: y, rx: 0, ry: 0, fill: fillColor, stroke: strokeColor, strokeWidth: 2, selectable: false, evented: false });
          canvas.add(shape);
          state.activeShape = shape;
        } else if (type === 'arrow') {
          const line = new f.Line([x, y, x, y], { stroke: strokeColor, strokeWidth: 2, selectable: false, evented: false });
          const head = new f.Triangle({ left: x, top: y, width: 12, height: 14, fill: strokeColor, selectable: false, evented: false, originX: 'center', originY: 'center', angle: 90 });
          canvas.add(line);
          canvas.add(head);
          state.arrowLine = line;
          state.arrowHead = head;
          state.activeShape = line;
        }
        canvas.renderAll();
      }

      function onMouseMove(e) {
        const state = stateRef.current;
        if (!state.isDrawing) return;
        const { x, y } = getPointer(e);
        const { startX, startY } = state;
        const { type } = annotateProps || {};

        if (type === 'highlight' || type === 'rectangle') {
          const shape = state.activeShape;
          if (!shape) return;
          shape.set({ left: Math.min(x, startX), top: Math.min(y, startY), width: Math.abs(x - startX), height: Math.abs(y - startY) });
        } else if (type === 'circle') {
          const shape = state.activeShape;
          if (!shape) return;
          shape.set({ left: Math.min(x, startX), top: Math.min(y, startY), rx: Math.abs(x - startX) / 2, ry: Math.abs(y - startY) / 2 });
        } else if (type === 'arrow') {
          const { arrowLine: line, arrowHead: head } = state;
          if (!line || !head) return;
          line.set({ x2: x, y2: y });
          const angle = Math.atan2(y - startY, x - startX) * (180 / Math.PI) + 90;
          head.set({ left: x, top: y, angle });
        }
        canvas.renderAll();
      }

      function onMouseUp() {
        const state = stateRef.current;
        if (!state.isDrawing) return;
        state.isDrawing = false;
        const { type } = annotateProps || {};
        const recorded = [];
        if (type === 'arrow') {
          if (state.arrowLine) { state.arrowLine.set({ selectable: true, evented: true }); recorded.push(state.arrowLine); }
          if (state.arrowHead) { state.arrowHead.set({ selectable: true, evented: true }); recorded.push(state.arrowHead); }
          state.arrowLine = null;
          state.arrowHead = null;
        } else {
          if (state.activeShape) { state.activeShape.set({ selectable: true, evented: true }); recorded.push(state.activeShape); }
        }
        state.activeShape = null;
        canvas.renderAll();
        if (onRecord && recorded.length > 0) onRecord(recorded);
      }

      if (!active) {
        canvas.isDrawingMode = false;
        canvas.selection = true;
        cleanupFn = null;
        return;
      }

      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);

      cleanupFn = () => {
        canvas.off('mouse:down', onMouseDown);
        canvas.off('mouse:move', onMouseMove);
        canvas.off('mouse:up', onMouseUp);
        canvas.isDrawingMode = false;
        canvas.selection = true;
      };
    });

    return () => {
      cancelled = true;
      if (cleanupFn) { cleanupFn(); cleanupFn = null; }
    };
  }, [fabricCanvas, active, annotateProps, onRecord]);

  return {};
}
