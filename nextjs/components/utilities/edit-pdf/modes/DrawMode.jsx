'use client';

import { useEffect, useRef } from 'react';

/**
 * Converts a hex color + opacity into an rgba string.
 */
function toRgba(hex, opacity) {
  if (!hex) return `rgba(0,0,0,${opacity})`;
  const sanitized = hex.replace('#', '');
  const full =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((c) => c + c)
          .join('')
      : sanitized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/**
 * Creates a fabric arrowhead Triangle positioned at the end of a line,
 * rotated to match the line direction.
 */
function createArrowhead(fabric, x1, y1, x2, y2, color, strokeWidth) {
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
  const size = Math.max(10, strokeWidth * 4);
  return new fabric.Triangle({
    left: x2,
    top: y2,
    originX: 'center',
    originY: 'center',
    width: size,
    height: size,
    fill: color,
    stroke: color,
    strokeWidth: 1,
    angle,
    selectable: false,
    evented: false,
  });
}

export function useDrawMode({ fabricCanvas, active, drawProps, onRecord }) {
  const stateRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    activeObject: null,
    arrowHead: null,
  });

  useEffect(() => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas;
    const fabric = window.fabric;
    if (!fabric) return;

    // ── helpers ──────────────────────────────────────────────────────────────

    function getPointer(e) {
      return canvas.getPointer(e.e);
    }

    function applyFreeDrawing() {
      const { tool, strokeColor, strokeWidth, opacity } = drawProps;

      if (tool === 'eraser') {
        // Use EraserBrush when available (fabric v5+), else white PencilBrush
        if (fabric.EraserBrush) {
          canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        } else {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = '#ffffff';
        }
        canvas.freeDrawingBrush.width = strokeWidth ?? 20;
      } else {
        const brush = new fabric.PencilBrush(canvas);
        const alpha = tool === 'highlighter' ? 0.4 : (opacity ?? 1);
        brush.color = toRgba(strokeColor ?? '#000000', alpha);
        brush.width = strokeWidth ?? (tool === 'highlighter' ? 20 : 2);
        canvas.freeDrawingBrush = brush;
      }

      canvas.isDrawingMode = true;
    }

    function disableFreeDrawing() {
      canvas.isDrawingMode = false;
    }

    // ── shape mouse handlers ──────────────────────────────────────────────────

    function onMouseDown(opt) {
      const { tool, strokeColor, strokeWidth, fillColor, opacity } = drawProps;
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

      if (tool === 'line') {
        const line = new fabric.Line([p.x, p.y, p.x, p.y], {
          stroke,
          strokeWidth: lw,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(line);
        state.activeObject = line;
      } else if (tool === 'arrow') {
        const line = new fabric.Line([p.x, p.y, p.x, p.y], {
          stroke,
          strokeWidth: lw,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(line);
        state.activeObject = line;
      } else if (tool === 'rect') {
        const rect = new fabric.Rect({
          left: p.x,
          top: p.y,
          width: 0,
          height: 0,
          stroke,
          strokeWidth: lw,
          fill,
          selectable: false,
          evented: false,
        });
        canvas.add(rect);
        state.activeObject = rect;
      } else if (tool === 'circle') {
        const ellipse = new fabric.Ellipse({
          left: p.x,
          top: p.y,
          rx: 0,
          ry: 0,
          stroke,
          strokeWidth: lw,
          fill,
          selectable: false,
          evented: false,
        });
        canvas.add(ellipse);
        state.activeObject = ellipse;
      }
    }

    function onMouseMove(opt) {
      const state = stateRef.current;
      if (!state.isDown || !state.activeObject) return;

      const { tool, strokeColor, strokeWidth, opacity } = drawProps;
      const p = getPointer(opt);
      const { startX, startY } = state;

      if (tool === 'line') {
        state.activeObject.set({ x2: p.x, y2: p.y });
      } else if (tool === 'arrow') {
        state.activeObject.set({ x2: p.x, y2: p.y });
        // Remove old arrowhead and redraw
        if (state.arrowHead) canvas.remove(state.arrowHead);
        const stroke = toRgba(strokeColor ?? '#000000', opacity ?? 1);
        const head = createArrowhead(
          fabric,
          startX,
          startY,
          p.x,
          p.y,
          stroke,
          strokeWidth ?? 2,
        );
        canvas.add(head);
        state.arrowHead = head;
      } else if (tool === 'rect') {
        const w = p.x - startX;
        const h = p.y - startY;
        state.activeObject.set({
          left: w < 0 ? p.x : startX,
          top: h < 0 ? p.y : startY,
          width: Math.abs(w),
          height: Math.abs(h),
        });
      } else if (tool === 'circle') {
        const rx = Math.abs(p.x - startX) / 2;
        const ry = Math.abs(p.y - startY) / 2;
        state.activeObject.set({
          left: Math.min(p.x, startX),
          top: Math.min(p.y, startY),
          rx,
          ry,
        });
      }

      canvas.renderAll();
    }

    function onMouseUp() {
      const state = stateRef.current;
      if (!state.isDown) return;
      state.isDown = false;

      const objects = [];
      if (state.activeObject) {
        state.activeObject.set({ selectable: true, evented: true });
        objects.push(state.activeObject);
      }
      if (state.arrowHead) {
        state.arrowHead.set({ selectable: true, evented: true });
        objects.push(state.arrowHead);
      }

      if (objects.length && onRecord) {
        onRecord({ type: 'draw', objects });
      }

      state.activeObject = null;
      state.arrowHead = null;
      canvas.renderAll();
    }

    function onPathCreated(opt) {
      if (onRecord) {
        onRecord({ type: 'draw', objects: [opt.path] });
      }
    }

    // ── activate / deactivate ─────────────────────────────────────────────────

    if (!active) {
      disableFreeDrawing();
      return;
    }

    const { tool } = drawProps ?? {};
    const isFreeDraw = ['pen', 'highlighter', 'eraser'].includes(tool);

    if (isFreeDraw) {
      applyFreeDrawing();
      canvas.on('path:created', onPathCreated);
      return () => {
        disableFreeDrawing();
        canvas.off('path:created', onPathCreated);
      };
    } else {
      disableFreeDrawing();
      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);
      return () => {
        canvas.off('mouse:down', onMouseDown);
        canvas.off('mouse:move', onMouseMove);
        canvas.off('mouse:up', onMouseUp);
      };
    }
  }, [fabricCanvas, active, drawProps, onRecord]);

  return {};
}
