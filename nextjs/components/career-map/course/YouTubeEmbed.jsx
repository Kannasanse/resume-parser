'use client';
import { useState } from 'react';

function formatViewCount(n) {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

function formatDuration(min) {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  const s = Math.round((min % 1) * 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function YouTubeEmbed({ videoId, title, channelName, thumbnail, duration, viewCount, searchUrl, isFallback }) {
  const [playing, setPlaying] = useState(false);

  if (isFallback || !videoId) {
    return (
      <div className="bg-[#F4F8FC] border border-dashed border-[var(--c-border)] rounded-xl p-5 text-center space-y-3">
        <svg className="mx-auto" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2"/><polygon points="10 10 15 13.5 10 17"/>
        </svg>
        <p className="text-sm text-[var(--c-text-muted)]">Find a video tutorial for this topic</p>
        <a
          href={searchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(title || '')}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border border-[var(--c-border)] text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.1 2.7 12 2.7 12 2.7s-4.1 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.2.3 4.3.3 4.3s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.8 12 21.8 12 21.8s4.1 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.3v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.2l8.1 3.7-8.1 3.6z"/></svg>
          Search on YouTube
        </a>
      </div>
    );
  }

  const thumb = thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <div className="space-y-2.5">
      <div className="shadow-xl rounded-2xl overflow-hidden border border-[var(--c-border)] bg-black" style={{ aspectRatio: '16/9' }}>
        {playing ? (
          <iframe
            width="100%" height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        ) : (
          <div onClick={() => setPlaying(true)} className="relative cursor-pointer w-full h-full">
            <img src={thumb} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
              <div className="w-16 h-11 bg-[#FF0000] rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21"/></svg>
              </div>
            </div>
            {duration > 0 && (
              <div className="absolute bottom-2 right-2 bg-[rgba(0,0,0,0.85)] text-white text-xs font-semibold font-mono px-1.5 py-0.5 rounded">
                {formatDuration(duration)}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="px-0.5">
        {title && <p className="text-sm font-semibold text-[var(--c-text)] line-clamp-2">{title}</p>}
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {channelName && <span className="text-xs text-[var(--c-text-muted)]">{channelName}</span>}
          {viewCount > 0 && (
            <><span className="text-xs text-[var(--c-text-muted)]">·</span>
            <span className="text-xs text-[var(--c-text-muted)]">{formatViewCount(viewCount)} views</span></>
          )}
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[var(--c-primary)] hover:underline ml-auto">Open in YouTube ↗</a>
        </div>
      </div>
    </div>
  );
}
