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
  secondaryAction,
  type = 'input',
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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/35"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div
        className="bg-white dark:bg-[#1A2C45] rounded-xl p-6 w-[400px] max-w-[calc(100vw-32px)] shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-[15px] font-bold text-[#2C2C2A] dark:text-[#E8EFF7] mb-1.5">
          {title}
        </h3>
        {description && (
          <p className="text-[13px] text-[#6B7280] dark:text-[#8BA3C1] mb-4 leading-relaxed">
            {description}
          </p>
        )}

        {type === 'input' && (
          <div className={`${description ? '' : 'mt-3'} mb-5`}>
            {inputLabel && (
              <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#8BA3C1] mb-1.5">
                {inputLabel}
              </label>
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm border border-[#D1DCE8] dark:border-white/10 rounded-lg bg-[#F9FAFB] dark:bg-[#0D1830] text-[#2C2C2A] dark:text-[#E8EFF7] outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 transition-colors placeholder:text-[#9CA3AF] dark:placeholder:text-[#4B6280]"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={`mr-auto px-3.5 py-[7px] text-[13px] font-semibold rounded-lg ${
                secondaryAction.destructive
                  ? 'bg-red-50 dark:bg-red-900/20 text-[#D93025] dark:text-red-400'
                  : 'bg-[#F4F8FC] dark:bg-white/5 text-[#6B7280] dark:text-[#8BA3C1]'
              }`}
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-[7px] text-[13px] font-semibold rounded-lg border border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#1A2C45] text-[#6B7280] dark:text-[#8BA3C1] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(type === 'input' ? (inputRef.current?.value ?? '') : '')}
            className="px-4 py-[7px] text-[13px] font-semibold rounded-lg bg-[#185FA5] text-white hover:bg-[#0C447C] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
