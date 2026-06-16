'use client';

import { useState, useCallback } from 'react';

export function useSignatureMode({ fabricCanvas, active, onRecord }) {
  const [signatures, setSignatures] = useState([]);

  const addSignature = useCallback(
    async (dataUrl) => {
      if (!fabricCanvas || !dataUrl) return;

      const { FabricImage } = await import('fabric');

      const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });
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
      });

      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.renderAll();

      setSignatures((prev) => [...prev, img]);

      if (onRecord) onRecord(fabricCanvas.toJSON());

      img.on('modified', () => {
        if (onRecord) onRecord(fabricCanvas.toJSON());
      });
    },
    [fabricCanvas, onRecord]
  );

  return { addSignature, signatures };
}
