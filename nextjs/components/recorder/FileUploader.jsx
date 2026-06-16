'use client';
import { useState, useRef } from 'react';

const LANGUAGES = [
  { code: 'auto', label: 'Detect automatically' },
  { code: 'en',   label: 'English' },
  { code: 'hi',   label: 'Hindi' },
  { code: 'ta',   label: 'Tamil' },
  { code: 'es',   label: 'Spanish' },
  { code: 'fr',   label: 'French' },
  { code: 'de',   label: 'German' },
  { code: 'zh',   label: 'Chinese' },
  { code: 'ja',   label: 'Japanese' },
  { code: 'ko',   label: 'Korean' },
  { code: 'pt',   label: 'Portuguese' },
  { code: 'ar',   label: 'Arabic' },
  { code: 'ru',   label: 'Russian' },
  { code: 'it',   label: 'Italian' },
];

const ACCEPT = '.mp4,.webm,.mov,.mkv,.mp3,.m4a,.wav,.ogg,.mpeg';
const VALID_EXTS = /\.(mp4|webm|mov|mkv|mp3|m4a|wav|ogg|mpeg)$/i;
const MAX_MB = 25;

export function FileUploader({ onTranscript }) {
  const [file, setFile]         = useState(null);
  const [language, setLanguage] = useState('auto');
  const [dragging, setDragging] = useState(false);
  const [stage, setStage]       = useState('idle');   // idle | transcribing
  const [progress, setProgress] = useState('');
  const [error, setError]       = useState('');
  const inputRef                = useRef(null);

  function pickFile(f) {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB} MB.`);
      return;
    }
    if (!VALID_EXTS.test(f.name)) {
      setError('Unsupported format. Use MP4, WebM, MOV, MKV, MP3, M4A, or WAV.');
      return;
    }
    setError('');
    setFile(f);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  }

  async function transcribe() {
    if (!file) return;
    setStage('transcribing');
    setError('');
    setProgress('Uploading…');
    try {
      const form = new FormData();
      form.append('file', file);
      if (language !== 'auto') form.append('language', language);

      setProgress('Transcribing…');
      const res = await fetch('/api/v1/recorder/transcribe', { method: 'POST', body: form });

      setProgress('Processing…');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Transcription failed.');
      }
      const data = await res.json();
      const title = file.name.replace(/\.[^.]+$/, '');
      onTranscript?.(data, title);
      // Reset so user can upload another file
      setFile(null);
      setStage('idle');
    } catch (err) {
      setError(err.message);
      setStage('idle');
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Card header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] flex items-center justify-center text-amber-600 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5-5-5 5M12 4v12"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Upload Video / Audio</p>
          <p className="text-xs text-[#9CA3AF]">MP4 · WebM · MP3 · M4A · up to {MAX_MB} MB</p>
        </div>
      </div>

      {/* ── DROP ZONE ────────────────────────────────────────── */}
      {stage === 'idle' && !file && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
            dragging
              ? 'border-[#185FA5] bg-[rgba(24,95,165,0.04)]'
              : 'border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5] hover:bg-[rgba(24,95,165,0.02)]'
          }`}
        >
          <svg className="text-[#9CA3AF] mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5-5-5 5M12 4v12"/>
          </svg>
          <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] text-center">
            Drop a video or audio file here
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={e => pickFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* ── FILE SELECTED ────────────────────────────────────── */}
      {stage === 'idle' && file && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F8FC] dark:bg-white/4 border border-[#D1DCE8] dark:border-white/10">
            <svg className="text-[#185FA5] flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{file.name}</p>
              <p className="text-xs text-[#9CA3AF]">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B7280] dark:text-[#8BA3C1] mb-1.5 block">Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full text-sm border border-[#D1DCE8] dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#1A2E4A] text-[#2C2C2A] dark:text-[#E8EFF7] focus:outline-none focus:border-[#185FA5] transition-colors"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={transcribe}
            className="w-full py-2.5 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-semibold rounded-xl transition-colors mt-auto"
          >
            Transcribe →
          </button>
        </div>
      )}

      {/* ── TRANSCRIBING ─────────────────────────────────────── */}
      {stage === 'transcribing' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">{progress}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Large files may take 30–60 seconds.</p>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
