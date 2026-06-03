'use client';
import { useState } from 'react';
import { sendTranscriptToNotes } from '@/lib/recorder/sendToNotes';

function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}
function pad(n) { return String(n).padStart(2, '0'); }

export function TranscriptOutput({ transcript, videoTitle, onReset }) {
  const [tab, setTab]                   = useState('timestamped');
  const [copied, setCopied]             = useState(false);
  const [sendingNotes, setSendingNotes] = useState(false);
  const [notesDone, setNotesDone]       = useState(false);
  const [notesError, setNotesError]     = useState('');

  const { text = '', segments = [], language, srt, wordCount = 0 } = transcript;

  function copyText() {
    const content =
      tab === 'plain'
        ? text
        : segments.map(s => `${fmtTime(s.start)}  ${s.text.trim()}`).join('\n');
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTxt() {
    const header = [
      videoTitle || 'Video Transcript',
      `Transcribed: ${new Date().toLocaleDateString()} · ${wordCount} words · Language: ${language || 'unknown'}`,
      '',
    ].join('\n');
    download(header + text, 'transcript.txt');
  }

  function downloadSrt() {
    download(srt || '', 'transcript.srt');
  }

  async function handleSendToNotes() {
    setSendingNotes(true);
    setNotesError('');
    try {
      const note = await sendTranscriptToNotes(transcript, videoTitle);
      setNotesDone(true);
      if (note?.id) window.open(`/notes/${note.id}`, '_blank');
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setSendingNotes(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#111F35] overflow-hidden">
      {/* Header row */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#D1DCE8] dark:border-white/10">
        <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Transcript</p>
        <div className="flex items-center gap-2">
          <button
            onClick={copyText}
            className="px-3 py-1.5 text-xs font-medium text-[#185FA5] border border-[#185FA5]/30 rounded-lg hover:bg-[#E6F1FB] dark:hover:bg-[rgba(24,95,165,0.1)] transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs font-medium text-[#9CA3AF] border border-[#D1DCE8] dark:border-white/10 rounded-lg hover:text-[#6B7280] transition-colors"
            >
              New transcript
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-5 pt-3 flex gap-1 border-b border-[#D1DCE8] dark:border-white/10">
        {[
          { id: 'timestamped', label: 'Timestamped' },
          { id: 'plain',       label: 'Plain text' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 mb-0 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'text-[#185FA5] border-b-2 border-[#185FA5]'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transcript body */}
      <div className="px-5 py-4 max-h-80 overflow-y-auto space-y-2">
        {tab === 'timestamped' ? (
          segments.length > 0 ? (
            segments.map((seg, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[#9CA3AF] font-mono text-xs shrink-0 mt-0.5 w-14 tabular-nums">
                  {fmtTime(seg.start)}
                </span>
                <span className="text-[13px] text-[#2C2C2A] dark:text-[#E8EFF7] leading-relaxed">
                  {seg.text.trim()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-[#9CA3AF]">{text || 'No transcript available.'}</p>
          )
        ) : (
          <p className="text-[13px] text-[#2C2C2A] dark:text-[#E8EFF7] leading-relaxed whitespace-pre-wrap">
            {text || 'No transcript available.'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#D1DCE8] dark:border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadTxt}
            className="px-3 py-1.5 text-xs font-medium text-[#6B7280] border border-[#D1DCE8] dark:border-white/10 rounded-lg hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
          >
            ↓ .txt
          </button>
          <button
            onClick={downloadSrt}
            disabled={!srt}
            className="px-3 py-1.5 text-xs font-medium text-[#6B7280] border border-[#D1DCE8] dark:border-white/10 rounded-lg hover:border-[#185FA5] hover:text-[#185FA5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↓ .srt
          </button>
          <button
            onClick={handleSendToNotes}
            disabled={sendingNotes || notesDone}
            className="px-3 py-1.5 text-xs font-semibold bg-[#185FA5] hover:bg-[#0C447C] disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {notesDone ? '✓ Saved to Notes' : sendingNotes ? 'Saving…' : '📓 Send to Notes'}
          </button>
        </div>
        <p className="text-xs text-[#9CA3AF] sm:ml-auto shrink-0">
          {wordCount} words · {segments.length} segments · {language || 'unknown'}
        </p>
      </div>

      {notesError && (
        <p className="px-5 pb-4 text-xs text-red-500 dark:text-red-400">{notesError}</p>
      )}
    </div>
  );
}
