function fmtBytes(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function CheckCircle() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function DownloadResult({ onDownload, onReset, beforeBytes, afterBytes, filename }) {
  const reduction = beforeBytes && afterBytes
    ? Math.round((1 - afterBytes / beforeBytes) * 100)
    : null;

  return (
    <div className="rounded-2xl border border-[#D1FAE5] dark:border-[rgba(29,158,117,0.30)] bg-[#F0FDF4] dark:bg-[rgba(29,158,117,0.08)] p-6 text-center">
      <span className="text-[#1D9E75] inline-flex justify-center mb-3"><CheckCircle /></span>
      <p className="text-base font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Ready to download</p>
      {reduction !== null && (
        <p className="text-sm text-[#6B7280] mt-1">
          {fmtBytes(beforeBytes)} → {fmtBytes(afterBytes)}
          <span className="text-[#1D9E75] font-medium ml-1">({reduction}% smaller)</span>
        </p>
      )}
      {filename && !reduction && (
        <p className="text-sm text-[#6B7280] mt-1">{filename}</p>
      )}
      <button
        onClick={onDownload}
        className="mt-4 px-6 py-2.5 bg-[#185FA5] hover:bg-[#1454a0] text-white text-sm font-semibold rounded-xl transition-colors"
      >
        ↓ Download
      </button>
      <button
        onClick={onReset}
        className="text-sm text-[#9CA3AF] hover:text-[#6B7280] mt-3 block mx-auto transition-colors"
      >
        Process another file
      </button>
    </div>
  );
}
