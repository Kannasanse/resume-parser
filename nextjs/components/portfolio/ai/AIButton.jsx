'use client';

export default function AIButton({ label, onGenerate, disabled, loading, usageError }) {
  if (usageError) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded">
        {typeof usageError === 'string' ? usageError : "You've used all 5 AI generations this month."}
      </div>
    );
  }

  return (
    <button
      onClick={onGenerate}
      disabled={disabled || loading}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-[#185FA5] text-[#185FA5] hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="w-3 h-3 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin inline-block" />
          Generating...
        </>
      ) : (
        <>
          <span aria-hidden="true">✦</span>
          {label}
        </>
      )}
    </button>
  );
}
