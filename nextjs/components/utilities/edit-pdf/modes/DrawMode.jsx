'use client';

import { useEffect, useRef } from 'react';

function toRgba(hex, opacity) {
  if (!hex) return `rgba(0,0,0,${opacity})`;
  const sanitized = hex.replace('#', '');
  const full =
    sanitized.length === 3
      ? sanitized.split('').map((c) => c + c).join('')
      : sanitized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function useDrawMode({ fabricCanvas, active, drawProps, onRecord }) {
  const stateRef = useRef({ isDown: false, startX: 0, startY: 0, activeObject: null, arrowHead: null });

  useEffect(() => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas;
    let cancelled = false;
    let cleanupFn = null;

    import('fabric').then((f) => {
      if (cancelled) return;

      function getPointer(e) {
        return canvas.getPointer(e.e);
      }

      function applyFreeDrawing() {
        const { tool, strokeColor, strokeWidth, opacity } = drawProps || {};
        const brush = new f.PencilBrush(canvas);
        const alpha = tool === 'highlighter' ? 0.4 : (opacity ?? 1);
        brush.color = toRgba(strokeColor ?? '#000000', alpha);
        brush.width = strokeWidth ?? (tool === 'highlighter' ? 20 : 2);
        canvas.freeDrawingBrush = brush;
        canvas.isDrawingMode = true;
      }

      function disableFreeDrawing() {
        canvas.isDrawingMode = false;
      }

      function createArrowhead(x1, y1, x2, y2, color, strokeWidth) {
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
        const size = Math.max(10, strokeWidth * 4);
        return new f.Triangle({
          left: x2, top: y2, originX: 'center', originY: 'center',
          width: size, height: size, fill: color, stroke: color,
          strokeWidth: 1, angle, selectable: false, evented: false,
        });
      }

      function onMouseDown(opt) {
        const { tool, strokeColor, strokeWidth, fillColor, opacity } = drawProps || {};
        const p = getPointer(opt);
        const state = stateRef.current;
        state.isDown = true;
        state.startX = p.x;
        state.startY = p.y;
        state.activeObject = null;
        state.arrowHead = null;

        const stroke = toRgba(strokeColor ?? '#000000', opacity ?? 1);
        const fill = fillColor ? toRgba(fillColor, opacity ?? 1) : 'transparent';
        const lw = strokeWidth ?? 2;

        let obj = null;
        if (tool === 'line' || tool === 'arrow') {
          obj = new f.Line([p.x, p.y, p.x, p.y], {
            stroke, strokeWidth: lw, selectable: false, evented: false,
            originX: 'center', originY: 'center',
          });
        } else if (tool === 'rect') {
          obj = new f.Rect({ left: p.x, top: p.y, width: 0, height: 0, stroke, strokeWidth: lw, fill, selectable: false, evented: false });
        } else if (tool === 'circle') {
          obj = new f.Ellipse({ left: p.x, top: p.y, rx: 0, ry: 0, stroke, strokeWidth: lw, fill, selectable: false, evented: false });
        }
        if (obj) { canvas.add(obj); state.activeObject = obj; }
      }

      function onMouseMove(opt) {
        const state = stateRef.current;
        if (!state.isDown || !state.activeObject) return;
        const { tool, strokeColor, strokeWidth, opacity } = drawProps || {};
        const p = getPointer(opt);
        const { startX, startY } = state;

        if (tool === 'line') {
          state.activeObject.set({ x2: p.x, y2: p.y });
        } else if (tool === 'arrow') {
          state.activeObject.set({ x2: p.x, y2: p.y });
          if (state.arrowHead) canvas.remove(state.arrowHead);
          const stroke = toRgba(strokeColor ?? '#000000', opacity ?? 1);
          const head = createArrowhead(startX, startY, p.x, p.y, stroke, strokeWidth ?? 2);
          canvas.add(head);
          state.arrowHead = head;
        } else if (tool === 'rect') {
          const w = p.x - startX, h = p.y - startY;
          state.activeObject.set({ left: w < 0 ? p.x : startX, top: h < 0 ? p.y : startY, width: Math.abs(w), height: Math.abs(h) });
        } else if (tool === 'circle') {
          state.activeObject.set({ left: Math.min(p.x, startX), top: Math.min(p.y, startY), rx: Math.abs(p.x - startX) / 2, ry: Math.abs(p.y - startY) / 2 });
        }
        canvas.renderAll();
      }

      function onMouseUp() {
        const state = stateRef.current;
        if (!state.isDown) return;
        state.isDown = false;
        const objects = [];
        if (state.activeObject) { state.activeObject.set({ selectable: true, evented: true }); objects.push(state.activeObject); }
        if (state.arrowHead) { state.arrowHead.set({ selectable: true, evented: true }); objects.push(state.arrowHead); }
        if (objects.length && onRecord) onRecord({ type: 'draw', objects });
        state.activeObject = null;
        state.arrowHead = null;
        canvas.renderAll();
      }

      function onPathCreated(opt) {
        if (onRecord) onRecord({ type: 'draw', objects: [opt.path] });
      }

      if (!active) {
        disableFreeDrawing();
        cleanupFn = null;
        return;
      }

      const { tool } = drawProps ?? {};
      const isFreeDraw = ['pen', 'highlighter', 'eraser'].includes(tool);

      if (isFreeDraw) {
        applyFreeDrawing();
        canvas.on('path:created', onPathCreated);
        cleanupFn = () => { disableFreeDrawing(); canvas.off('path:created', onPathCreated); };
      } else {
        disableFreeDrawing();
        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);
        cleanupFn = () => {
          canvas.off('mouse:down', onMouseDown);
          canvas.off('mouse:move', onMouseMove);
          canvas.off('mouse:up', onMouseUp);
        };
      }
    });

    return () => {
      cancelled = true;
      if (cleanupFn) { cleanupFn(); cleanupFn = null; }
      canvas.isDrawingMode = false;
    };
  }, [fabricCanvas, active, drawProps, onRecord]);

  return {};
}
