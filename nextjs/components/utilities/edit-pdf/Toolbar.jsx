'use client';

const modes = [
  {
    id: 'text',
    label: 'Text',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    id: 'annotate',
    label: 'Annotate',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    id: 'forms',
    label: 'Forms',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <line x1="7" y1="10" x2="17" y2="10" />
        <line x1="7" y1="14" x2="13" y2="14" />
      </svg>
    ),
  },
  {
    id: 'draw',
    label: 'Draw',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M2 16.5C2 16.5 4 15 6 15s4 2 6 2 4-2 6-2 4 1.5 4 1.5" />
        <path d="M3 9l4-4 4 4 4-4 4 4" />
      </svg>
    ),
  },
  {
    id: 'signature',
    label: 'Signature',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M3 17c3-3 4-7 6-7s2 4 4 4 3-4 5-4" />
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    ),
  },
];

export default function Toolbar({
  mode,
  setMode,
  onOpenFile,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDownload,
  hasFile,
}) {
  return (
    <div className="flex items-center justify-between bg-gray-900 border-b border-gray-700 px-4 py-2 gap-4 select-none">
      {/* Left: Open PDF */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenFile}
          title="Open PDF"
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Open PDF
        </button>
      </div>

      {/* Center: Mode buttons */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
        {modes.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => hasFile && setMode(id)}
            title={label}
            disabled={!hasFile}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
              !hasFile
                ? 'text-gray-600 cursor-not-allowed'
                : mode === id
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-300 hover:text-white hover:bg-gray-700',
            ].join(' ')}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Right: Undo, Redo, Download */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className={[
            'p-2 rounded transition-colors',
            canUndo
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 cursor-not-allowed',
          ].join(' ')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className={[
            'p-2 rounded transition-colors',
            canRedo
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 cursor-not-allowed',
          ].join(' ')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="15 14 20 9 15 4" />
            <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        <button
          onClick={onDownload}
          disabled={!hasFile}
          title="Download PDF"
          className={[
            'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors',
            hasFile
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed',
          ].join(' ')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>
    </div>
  );
}
