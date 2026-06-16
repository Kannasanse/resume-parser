'use client';
import { useState, useRef } from 'react';

export function useScreenRecorder() {
  const [state, setState] = useState('idle'); // idle | recording | paused | stopped | transcribing | done
  const [duration, setDuration] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [sourceName, setSourceName] = useState('');
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedDurationRef = useRef(0);

  async function startRecording(options = {}) {
    setError('');
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      setSourceName(videoTrack?.label || 'Screen');

      let tracks = [...screenStream.getTracks()];

      if (options.includeMic !== false) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tracks = [...tracks, ...micStream.getAudioTracks()];
        } catch {
          // Mic denied — proceed without it
        }
      }

      const combined = new MediaStream(tracks);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combined, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          setFileSize(chunksRef.current.reduce((acc, c) => acc + c.size, 0));
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setState('stopped');
        clearInterval(timerRef.current);
        combined.getTracks().forEach(t => t.stop());
      };

      // User stops share via browser's built-in stop button
      screenStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };

      recorder.start(5000);
      recorderRef.current = recorder;
      setState('recording');

      pausedDurationRef.current = 0;
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000) + pausedDurationRef.current);
      }, 1000);

    } catch (err) {
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        setError("Couldn't start recording. Make sure you're using Chrome or Edge.");
      }
      setState('idle');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }

  function togglePause() {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      clearInterval(timerRef.current);
      pausedDurationRef.current = duration;
      setState('paused');
    } else if (rec.state === 'paused') {
      rec.resume();
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000) + pausedDurationRef.current);
      }, 1000);
      setState('recording');
    }
  }

  function downloadRecording() {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function transcribeRecording(onTranscript) {
    if (!videoBlob) return;
    setState('transcribing');
    setError('');
    try {
      const form = new FormData();
      form.append('file', videoBlob, 'recording.webm');

      const res = await fetch('/api/v1/recorder/transcribe', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Transcription failed.');
      }

      const data = await res.json();
      setState('done');
      onTranscript?.(data);
    } catch (err) {
      setError(err.message);
      setState('stopped');
    }
  }

  function reset() {
    clearInterval(timerRef.current);
    setVideoBlob(null);
    setDuration(0);
    setFileSize(0);
    setSourceName('');
    setError('');
    setState('idle');
    pausedDurationRef.current = 0;
  }

  return {
    state, duration, fileSize, videoBlob, sourceName, error,
    startRecording, stopRecording, togglePause, downloadRecording, transcribeRecording, reset,
  };
}
