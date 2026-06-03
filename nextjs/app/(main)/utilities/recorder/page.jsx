'use client';
import { useState } from 'react';
import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';
import { ScreenRecorder } from '@/components/recorder/ScreenRecorder';
import { FileUploader } from '@/components/recorder/FileUploader';
import { TranscriptOutput } from '@/components/recorder/TranscriptOutput';
import { ExtensionBanner } from '@/components/recorder/ExtensionBanner';

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
    </svg>
  );
}

export default function RecorderPage() {
  const [transcript, setTranscript] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');

  function handleTranscript(data, title = '') {
    setTranscript(data);
    setVideoTitle(title);
    // Scroll transcript into view on mobile
    setTimeout(() => {
      document.getElementById('transcript-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  return (
    <ToolPageLayout
      icon={<MicIcon />}
      title="Screen Recorder & Transcript"
      description="Record your screen, upload a video, or use our Chrome extension to transcribe any video playing in your browser."
    >
      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#111F35] p-5 flex flex-col min-h-[300px]">
          <ScreenRecorder onTranscript={handleTranscript} />
        </div>
        <div className="rounded-2xl border border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#111F35] p-5 flex flex-col min-h-[300px]">
          <FileUploader onTranscript={handleTranscript} />
        </div>
      </div>

      {/* Transcript output */}
      {transcript && (
        <div id="transcript-output">
          <TranscriptOutput
            transcript={transcript}
            videoTitle={videoTitle}
            onReset={() => { setTranscript(null); setVideoTitle(''); }}
          />
        </div>
      )}

      {/* Extension banner */}
      <ExtensionBanner />
    </ToolPageLayout>
  );
}
