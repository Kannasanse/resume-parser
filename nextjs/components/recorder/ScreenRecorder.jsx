'use client';
import { useState } from 'react';
import { useScreenRecorder } from '@/lib/recorder/useScreenRecorder';

function fmt(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
function fmtBytes(b) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function pad(n) { return String(n).padStart(2, '0'); }

export function ScreenRecorder({ onTranscript }) {
  const {
    state, duration, fileSize, sourceName, error,
    startRecording, stopRecording, togglePause, downloadRecording, transcribeRecording, reset,
  } = useScreenRecorder();

  const [includeMic, setIncludeMic] = useState(true);

  const supported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getDisplayMedia === 'function';

  return (
    <div className="flex flex-col h-full">
      {/* Card header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6F1FB] to-[#D4E8F8] flex items-center justify-center text-[#185FA5] flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Record Screen</p>
          <p className="text-xs text-[#9CA3AF]">Chrome + Edge only</p>
        </div>
      </div>

      {/* ── IDLE ─────────────────────────────────────────────── */}
      {state === 'idle' && (
        <div className="flex-1 flex flex-col">
          {!supported ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6">
              <svg className="text-[#9CA3AF]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
              <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1]">
                Screen recording requires Chrome or Edge.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
                <svg className="text-[#9CA3AF]" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
                <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] text-center">
                  Record your screen + mic.<br/>Download the clip and transcribe it.
                </p>
              </div>

              <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeMic}
                  onChange={e => setIncludeMic(e.target.checked)}
                  className="rounded border-[#D1DCE8] text-[#185FA5]"
                />
                <span className="text-xs text-[#6B7280] dark:text-[#8BA3C1]">Include microphone audio</span>
              </label>

              <button
                onClick={() => startRecording({ includeMic })}
                className="w-full py-2.5 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Start recording
              </button>
            </>
          )}
        </div>
      )}

      {/* ── RECORDING / PAUSED ───────────────────────────────── */}
      {(state === 'recording' || state === 'paused') && (
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FEE2E2] dark:bg-[rgba(217,48,37,0.1)] border border-red-200 dark:border-red-900/30">
            <div className={`w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 ${state === 'recording' ? 'animate-pulse' : 'opacity-50'}`} />
            <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400 tabular-nums">
              {state === 'paused' ? 'PAUSED' : 'REC'}&nbsp;&nbsp;{fmt(duration)}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={togglePause}
                className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {state === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={stopRecording}
                className="px-3 py-1 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Stop
              </button>
            </div>
          </div>

          <div className="text-xs text-[#9CA3AF] space-y-0.5 px-1">
            {sourceName && <p className="truncate">Source: {sourceName}</p>}
            {fileSize > 0 && <p>~{fmtBytes(fileSize)}</p>}
          </div>
        </div>
      )}

      {/* ── STOPPED ──────────────────────────────────────────── */}
      {state === 'stopped' && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-[#D1FAE5] dark:bg-[rgba(29,158,117,0.1)] border border-green-200 dark:border-green-900/30">
            <p className="text-sm font-semibold text-[#1D9E75]">Recording complete</p>
            <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] mt-0.5">
              {fmt(duration)} · {fmtBytes(fileSize)}
            </p>
          </div>

          <button
            onClick={() => transcribeRecording(onTranscript)}
            className="w-full py-2.5 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            ✦ Transcribe →
          </button>

          <div className="flex gap-2">
            <button
              onClick={downloadRecording}
              className="flex-1 py-2 text-xs font-medium text-[#185FA5] border border-[#185FA5]/30 rounded-xl hover:bg-[#E6F1FB] dark:hover:bg-[rgba(24,95,165,0.1)] transition-colors"
            >
              ↓ Download WebM
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 text-xs font-medium text-[#9CA3AF] border border-[#D1DCE8] dark:border-white/10 rounded-xl hover:text-[#6B7280] transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ── TRANSCRIBING ─────────────────────────────────────── */}
      {state === 'transcribing' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">Transcribing…</p>
            <p className="text-xs text-[#9CA3AF] mt-1">This may take 30–60 seconds.</p>
          </div>
        </div>
      )}

      {/* ── DONE ─────────────────────────────────────────────── */}
      {state === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D1FAE5] dark:bg-[rgba(29,158,117,0.1)] flex items-center justify-center text-[#1D9E75] text-xl">✓</div>
          <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">Transcript ready</p>
          <button onClick={reset} className="text-xs text-[#185FA5] hover:underline">
            Start new recording
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
