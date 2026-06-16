// ── State ─────────────────────────────────────────────────────────────────────
let mediaRecorder  = null;
let captureStream  = null;
let chunkIndex     = 0;
let sessionId      = null;
let timerInterval  = null;
let startTime      = null;
let transcriptText = '';
let totalWords     = 0;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const states = {
  auth:      document.getElementById('state-auth'),
  idle:      document.getElementById('state-idle'),
  recording: document.getElementById('state-recording'),
  done:      document.getElementById('state-done'),
};
const videoBadge   = document.getElementById('video-badge');
const noVideoBadge = document.getElementById('no-video-badge');
const langSelect   = document.getElementById('lang-select');
const startBtn     = document.getElementById('start-btn');
const stopBtn      = document.getElementById('stop-btn');
const timerEl      = document.getElementById('timer');
const linesEl      = document.getElementById('transcript-lines');
const dotsEl       = document.getElementById('processing-dots');
const doneStats    = document.getElementById('done-stats');
const copyBtn      = document.getElementById('copy-btn');

// ── Show a specific state ─────────────────────────────────────────────────────
function showState(name) {
  Object.entries(states).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== name);
  });
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const s   = Math.floor((Date.now() - startTime) / 1000);
    const min = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    timerEl.textContent = `${min}:${sec}`;
  }, 1000);
}

// ── Append transcript line ────────────────────────────────────────────────────
function appendLine(text) {
  dotsEl.classList.add('hidden');
  const p = document.createElement('p');
  p.textContent = text;
  linesEl.appendChild(p);
  // Auto-scroll
  const area = document.getElementById('transcript-scroll');
  area.scrollTop = area.scrollHeight;
  // Accumulate
  transcriptText += (transcriptText ? ' ' : '') + text;
  totalWords += text.split(/\s+/).filter(Boolean).length;
}

// ── Detect video on current tab ───────────────────────────────────────────────
function checkForVideo() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]) return;
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          const vids = Array.from(document.querySelectorAll('video'));
          return vids.some(v => v.readyState > 0 && (v.currentTime > 0 || !v.paused));
        },
      },
      results => {
        const hasVideo = results?.[0]?.result === true;
        videoBadge.classList.toggle('hidden', !hasVideo);
        noVideoBadge.classList.toggle('hidden', hasVideo);
      }
    );
  });
}

// ── Start capture (runs in popup — user gesture required for tabCapture) ───────
startBtn.addEventListener('click', async () => {
  const language = langSelect.value;
  sessionId      = `session_${Date.now()}`;
  chunkIndex     = 0;
  transcriptText = '';
  totalWords     = 0;
  linesEl.innerHTML = '';

  try {
    // tabCapture must be called from the popup context, not the service worker
    captureStream = await new Promise((resolve, reject) => {
      chrome.tabCapture.capture({ audio: true, video: false }, stream => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!stream) reject(new Error('Tab capture failed.'));
        else resolve(stream);
      });
    });

    mediaRecorder = new MediaRecorder(captureStream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorder.ondataavailable = async e => {
      if (e.data.size < 1000) return; // skip nearly empty chunks
      dotsEl.classList.remove('hidden');

      // Convert Blob → ArrayBuffer → plain array for message passing
      const arrayBuffer = await e.data.arrayBuffer();
      const audioData   = Array.from(new Uint8Array(arrayBuffer));

      const response = await chrome.runtime.sendMessage({
        type:      'TRANSCRIBE_CHUNK',
        audioData,
        index:     chunkIndex++,
        sessionId,
        language,
      });

      if (response?.ok && response.text?.trim()) {
        appendLine(response.text.trim());
      } else {
        dotsEl.classList.add('hidden');
      }
    };

    mediaRecorder.onstop = () => {
      clearInterval(timerInterval);
      captureStream.getTracks().forEach(t => t.stop());

      const dur = timerEl.textContent;
      doneStats.textContent = `${dur} · ${totalWords} words`;
      showState('done');
    };

    mediaRecorder.start(10000); // 10-second chunks
    showState('recording');
    startTimer();

  } catch (err) {
    console.error('[Proflect Extension]', err);
    // Show idle again with brief error hint
    showState('idle');
  }
});

// ── Stop ──────────────────────────────────────────────────────────────────────
stopBtn.addEventListener('click', () => {
  if (mediaRecorder?.state !== 'inactive') mediaRecorder.stop();
});

// ── Copy transcript ───────────────────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(transcriptText).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy transcript'; }, 2000);
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  // Check if the user is logged in by pinging the Proflect API
  try {
    const res = await fetch('https://proflect-neo.vercel.app/api/v1/notes?limit=1', {
      credentials: 'include',
    });
    if (res.status === 401) {
      showState('auth');
      return;
    }
  } catch {
    // Network error — show idle anyway; the transcribe call will fail gracefully
  }

  showState('idle');
  checkForVideo();
})();
