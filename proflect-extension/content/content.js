// Tell the Proflect web app that the extension is installed
window.__proflectExt = true;
window.dispatchEvent(new CustomEvent('proflect-ext-ready'));

// Detect video elements playing on the page
function detectVideo() {
  const videos   = Array.from(document.querySelectorAll('video'));
  const hasVideo = videos.some(v => v.readyState > 0 && (v.currentTime > 0 || !v.paused));
  chrome.runtime.sendMessage({ type: 'VIDEO_STATUS', hasVideo }).catch(() => {});
}

detectVideo();

// Re-check when DOM changes (videos may be injected dynamically)
const observer = new MutationObserver(detectVideo);
observer.observe(document.body, { childList: true, subtree: true });

// Re-check on play events bubbled up to document
document.addEventListener('play', detectVideo, true);
