'use client';

import { useEffect, useRef } from 'react';

function hexToRgba(hex, opacity) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function useAnnotateMode({ fabricCanvas, active, annotateProps, onRecord }) {
  const stateRef = useRef({
    isDrawing: false,
    startX: 0,
    startY: 0,
    activeShape: null,
    arrowHead: null,
    arrowLine: null,
  });

  useEffect(() => {
    if (!fabricCanvas) return;
    if (!active) {
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection = true;
      return;
    }

    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;

    const getPointer = (e) => fabricCanvas.getPointer(e.e);

    const onMouseDown = (e) => {
      const { x, y } = getPointer(e);
      const state = stateRef.current;
      state.isDrawing = true;
      state.startX = x;
      state.startY = y;

      const { type, color = '#FFFF00', opacity = 0.35 } = annotateProps || {};
      const strokeColor = color;
      const fillColor = hexToRgba(color, type === 'highlight' ? 0.35 : 0);

      let shape = null;

      if (type === 'highlight') {
        shape = new fabric.Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: hexToRgba(color, 0.35),
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: false,
          evented: false,
          opacity: 1,
        });
        fabricCanvas.add(shape);
        state.activeShape = shape;
      } else if (type === 'rectangle') {
        shape = new fabric.Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(shape);
        state.activeShape = shape;
      } else if (type === 'circle') {
        shape = new fabric.Ellipse({
          left: x,
          top: y,
          rx: 0,
          ry: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(shape);
        state.activeShape = shape;
      } else if (type === 'arrow') {
        const line = new fabric.Line([x, y, x, y], {
          stroke: strokeColor,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        const head = new fabric.Triangle({
          left: x,
          top: y,
          width: 12,
          height: 14,
          fill: strokeColor,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
          angle: 90,
        });
        fabricCanvas.add(line);
        fabricCanvas.add(head);
        state.arrowLine = line;
        state.arrowHead = head;
        state.activeShape = line;
      }

      fabricCanvas.renderAll();
    };

    const onMouseMove = (e) => {
      const state = stateRef.current;
      if (!state.isDrawing) return;

      const { x, y } = getPointer(e);
      const { startX, startY } = state;
      const { type } = annotateProps || {};

      if (type === 'highlight' || type === 'rectangle') {
        const shape = state.activeShape;
        if (!shape) return;
        const left = Math.min(x, startX);
        const top = Math.min(y, startY);
        const width = Math.abs(x - startX);
        const height = Math.abs(y - startY);
        shape.set({ left, top, width, height });
      } else if (type === 'circle') {
        const shape = state.activeShape;
        if (!shape) return;
        const rx = Math.abs(x - startX) / 2;
        const ry = Math.abs(y - startY) / 2;
        const left = Math.min(x, startX);
        const top = Math.min(y, startY);
        shape.set({ left, top, rx, ry });
      } else if (type === 'arrow') {
        const line = state.arrowLine;
        const head = state.arrowHead;
        if (!line || !head) return;

        line.set({ x2: x, y2: y });

        const dx = x - startX;
        const dy = y - startY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        head.set({ left: x, top: y, angle });
      }

      fabricCanvas.renderAll();
    };

    const onMouseUp = (e) => {
      const state = stateRef.current;
      if (!state.isDrawing) return;
      state.isDrawing = false;

      const { type } = annotateProps || {};

      let recordedObjects = [];

      if (type === 'arrow') {
        const line = state.arrowLine;
        const head = state.arrowHead;
        if (line) {
          line.set({ selectable: true, evented: true });
          recordedObjects.push(line);
        }
        if (head) {
          head.set({ selectable: true, evented: true });
          recordedObjects.push(head);
        }
        state.arrowLine = null;
        state.arrowHead = null;
      } else {
        const shape = state.activeShape;
        if (shape) {
          shape.set({ selectable: true, evented: true });
          recordedObjects.push(shape);
        }
      }

      state.activeShape = null;
      fabricCanvas.renderAll();

      if (onRecord && recordedObjects.length > 0) {
        onRecord(recordedObjects);
      }
    };

    fabricCanvas.on('mouse:down', onMouseDown);
    fabricCanvas.on('mouse:move', onMouseMove);
    fabricCanvas.on('mouse:up', onMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', onMouseDown);
      fabricCanvas.off('mouse:move', onMouseMove);
      fabricCanvas.off('mouse:up', onMouseUp);
    };
  }, [fabricCanvas, active, annotateProps, onRecord]);

  return {};
}
