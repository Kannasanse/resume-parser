'use client';

import { useEffect } from 'react';

export function useTextMode({ fabricCanvas, active, textProps, onRecord }) {
  useEffect(() => {
    if (!fabricCanvas) return;
    if (!active) {
      fabricCanvas.defaultCursor = 'default';
      fabricCanvas.hoverCursor = 'move';
      return;
    }

    fabricCanvas.defaultCursor = 'text';
    fabricCanvas.hoverCursor = 'text';

    let cancelled = false;
    let off = null;

    import('fabric').then((f) => {
      if (cancelled) return;

      function handleMouseDown(opt) {
        if (opt.target) return;
        const pointer = fabricCanvas.getPointer(opt.e);
        const {
          fontSize = 16,
          color = '#000000',
          bold = false,
          italic = false,
          underline = false,
        } = textProps || {};

        const itext = new f.IText('Text', {
          left: pointer.x,
          top: pointer.y,
          fontSize,
          fill: color,
          fontWeight: bold ? 'bold' : 'normal',
          fontStyle: italic ? 'italic' : 'normal',
          underline,
          fontFamily: 'Helvetica',
          editable: true,
          selectable: true,
          hasControls: true,
        });

        fabricCanvas.add(itext);
        fabricCanvas.setActiveObject(itext);
        itext.enterEditing();
        itext.selectAll();
        fabricCanvas.renderAll();

        if (onRecord) onRecord(fabricCanvas.toJSON());
        itext.on('editing:exited', () => { if (onRecord) onRecord(fabricCanvas.toJSON()); });
        itext.on('modified', () => { if (onRecord) onRecord(fabricCanvas.toJSON()); });
      }

      fabricCanvas.on('mouse:down', handleMouseDown);
      off = () => {
        fabricCanvas.off('mouse:down', handleMouseDown);
        fabricCanvas.defaultCursor = 'default';
        fabricCanvas.hoverCursor = 'move';
      };
    });

    return () => {
      cancelled = true;
      if (off) off();
      fabricCanvas.defaultCursor = 'default';
      fabricCanvas.hoverCursor = 'move';
    };
  }, [fabricCanvas, active, textProps, onRecord]);
}

export function getTextObjects(fabricCanvas) {
  if (!fabricCanvas) return [];
  return fabricCanvas.getObjects('i-text').map((obj) => ({
    text: obj.text,
    left: obj.left,
    top: obj.top,
    fontSize: obj.fontSize,
    color: obj.fill,
    fontFamily: obj.fontFamily || 'Helvetica',
    fontWeight: obj.fontWeight,
    fontStyle: obj.fontStyle,
    underline: obj.underline,
  }));
}
