'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFormMode({ pdfDoc, currentPage, active }) {
  const [fields, setFields] = useState([]);
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (!active || !pdfDoc) {
      setFields([]);
      return;
    }

    try {
      const form = pdfDoc.getForm();
      const acroFields = form.getFields();

      const pageFields = [];

      for (const field of acroFields) {
        const widgets = field.acroField.getWidgets();
        if (!widgets || widgets.length === 0) continue;

        for (let wi = 0; wi < widgets.length; wi++) {
          const widget = widgets[wi];

          // Determine which page this widget is on
          let widgetPage = null;
          try {
            const pageRef = widget.P();
            if (pageRef) {
              const pages = pdfDoc.getPages();
              for (let pi = 0; pi < pages.length; pi++) {
                if (pages[pi].ref === pageRef) {
                  widgetPage = pi;
                  break;
                }
              }
            }
          } catch {
            // If we can't determine the page, fall back to page 0
            widgetPage = 0;
          }

          if (widgetPage !== currentPage) continue;

          let rect = { x: 0, y: 0, width: 100, height: 20 };
          try {
            rect = widget.getRectangle();
          } catch {
            // keep default
          }

          const constructorName = field.constructor.name;
          let type = 'text';
          if (constructorName === 'PDFCheckBox') {
            type = 'checkbox';
          } else if (constructorName === 'PDFDropdown' || constructorName === 'PDFOptionList') {
            type = 'select';
          } else if (constructorName === 'PDFRadioGroup') {
            type = 'radio';
          }

          let currentValue = '';
          try {
            if (type === 'checkbox') {
              currentValue = field.isChecked() ? 'true' : 'false';
            } else if (type === 'select') {
              currentValue = field.getSelected()?.[0] ?? '';
            } else {
              currentValue = field.getText() ?? '';
            }
          } catch {
            // keep empty
          }

          let options = [];
          if (type === 'select') {
            try {
              options = field.getOptions() ?? [];
            } catch {
              // keep empty
            }
          }

          const id = `${field.getName()}__widget_${wi}`;

          pageFields.push({
            id,
            name: field.getName(),
            type,
            rect,
            value: currentValue,
            options,
          });
        }
      }

      setFields(pageFields);

      // Seed formValues with current PDF values (don't overwrite user edits)
      setFormValues((prev) => {
        const next = { ...prev };
        for (const f of pageFields) {
          if (!(f.id in next)) {
            next[f.id] = f.value;
          }
        }
        return next;
      });
    } catch (err) {
      console.error('[FormMode] Failed to extract form fields:', err);
      setFields([]);
    }
  }, [pdfDoc, currentPage, active]);

  const fillField = useCallback((id, value) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  return {
    fields,
    fillField,
    formValues,
    fieldCount: fields.length,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormOverlay({ fields, formValues, onFill, canvasRef, zoom }) {
  if (!fields || fields.length === 0) return null;

  const canvas = canvasRef?.current;
  if (!canvas) return null;

  const canvasRect = canvas.getBoundingClientRect();
  // The canvas element's rendered size vs its internal coordinate size
  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;

  // PDF coordinate origin is bottom-left; canvas origin is top-left
  const pdfHeight = canvas.height / zoom;

  return (
    <div
      style={{
        position: 'absolute',
        top: canvas.offsetTop,
        left: canvas.offsetLeft,
        width: canvasRect.width,
        height: canvasRect.height,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {fields.map((field) => {
        const { rect } = field;
        // rect from pdf-lib: { x, y, width, height } in PDF user-space units
        // y is from bottom of page
        const left = rect.x * zoom * scaleX;
        const top = (pdfHeight - rect.y - rect.height) * zoom * scaleY;
        const width = rect.width * zoom * scaleX;
        const height = rect.height * zoom * scaleY;

        const commonStyle = {
          position: 'absolute',
          left,
          top,
          width,
          height,
          pointerEvents: 'all',
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1.5px solid rgba(59, 130, 246, 0.6)',
          borderRadius: 2,
          boxSizing: 'border-box',
          outline: 'none',
          fontSize: Math.max(10, Math.min(14, height * 0.65)),
          padding: '0 3px',
          color: '#1e3a5f',
          cursor: 'text',
        };

        if (field.type === 'checkbox') {
          const checked = formValues[field.id] === 'true';
          return (
            <input
              key={field.id}
              type="checkbox"
              checked={checked}
              title={field.name}
              onChange={(e) => onFill(field.id, e.target.checked ? 'true' : 'false')}
              style={{
                ...commonStyle,
                cursor: 'pointer',
                accentColor: '#3b82f6',
                padding: 0,
              }}
            />
          );
        }

        if (field.type === 'select') {
          return (
            <select
              key={field.id}
              value={formValues[field.id] ?? ''}
              title={field.name}
              onChange={(e) => onFill(field.id, e.target.value)}
              style={{ ...commonStyle, cursor: 'pointer' }}
            >
              <option value="">-- select --</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        }

        // Default: text
        return (
          <input
            key={field.id}
            type="text"
            value={formValues[field.id] ?? ''}
            title={field.name}
            placeholder={field.name}
            onChange={(e) => onFill(field.id, e.target.value)}
            style={commonStyle}
          />
        );
      })}
    </div>
  );
}
