'use client';

import { useState, useCallback } from 'react';
import { fabric } from 'fabric';

/**
 * useSignatureMode
 *
 * Manages signature images placed onto a Fabric.js canvas.
 *
 * @param {object}   fabricCanvas  - The active fabric.Canvas instance.
 * @param {boolean}  active        - Whether signature mode is currently active.
 * @param {Function} onRecord      - Called with fabricCanvas.toJSON() after each placement/modification.
 *
 * @returns {{ addSignature: Function, signatures: Array }}
 */
export function useSignatureMode({ fabricCanvas, active, onRecord }) {
  const [signatures, setSignatures] = useState([]);

  /**
   * addSignature(dataUrl)
   * Loads a dataUrl as a fabric.Image, centers it on the canvas scaled to
   * ~200 px wide, then makes it selectable, draggable, and scalable.
   */
  const addSignature = useCallback(
    (dataUrl) => {
      if (!fabricCanvas || !dataUrl) return;

      fabric.Image.fromURL(
        dataUrl,
        (img) => {
          if (!img) return;

          const TARGET_WIDTH = 200;
          const scale = TARGET_WIDTH / (img.width || TARGET_WIDTH);

          const canvasWidth = fabricCanvas.getWidth();
          const canvasHeight = fabricCanvas.getHeight();

          img.set({
            left: (canvasWidth - TARGET_WIDTH) / 2,
            top: (canvasHeight - img.height * scale) / 2,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockUniScaling: false,
            crossOrigin: 'anonymous',
          });

          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();

          setSignatures((prev) => [...prev, img]);

          if (onRecord) {
            onRecord(fabricCanvas.toJSON());
          }

          img.on('modified', () => {
            if (onRecord) {
              onRecord(fabricCanvas.toJSON());
            }
          });
        },
        { crossOrigin: 'anonymous' }
      );
    },
    [fabricCanvas, onRecord]
  );

  return { addSignature, signatures };
}
