'use client';
import { useEffect, useRef } from 'react';

export default function EditorPromptModal({
  open,
  title,
  description,
  inputLabel,
  defaultValue = '',
  placeholder = '',
  onConfirm,
  onCancel,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  secondaryAction,  // { label, onClick, destructive? }
  type = 'input',   // 'input' | 'confirm'
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && type === 'input' && inputRef.current) {
      inputRef.current.value = defaultValue;
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 40);
      return () => clearTimeout(t);
    }
  }, [open, defaultValue, type]);

  if (!open) return null;

  function handleKeyDown(e) {
    if (e.key === 'Enter' && type === 'input') {
      e.preventDefault();
      onConfirm?.(inputRef.current?.value ?? '');
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div
        style={{
          background: 'white', borderRadius: 12,
          padding: '24px', width: 400, maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
        onKeyDown={handleKeyDown}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2A', margin: '0 0 6px' }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {type === 'input' && (
          <div style={{ marginTop: description ? 0 : 12, marginBottom: 20 }}>
            {inputLabel && (
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
                {inputLabel}
              </label>
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              style={{
                width: '100%', padding: '9px 12px', fontSize: 14,
                border: '1.5px solid #D1DCE8', borderRadius: 8,
                outline: 'none', color: '#2C2C2A', background: '#F9FAFB',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#185FA5'; e.target.style.background = '#fff'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#D1DCE8'; e.target.style.background = '#F9FAFB'; }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              style={{
                marginRight: 'auto', padding: '7px 14px', fontSize: 13, fontWeight: 600,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: secondaryAction.destructive ? '#FEE2E2' : '#F4F8FC',
                color: secondaryAction.destructive ? '#D93025' : '#6B7280',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: '1px solid #D1DCE8', background: 'white', color: '#6B7280', cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(type === 'input' ? (inputRef.current?.value ?? '') : '')}
            style={{
              padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: 'none', background: '#185FA5', color: 'white', cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
