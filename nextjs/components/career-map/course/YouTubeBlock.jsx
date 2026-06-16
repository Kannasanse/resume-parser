'use client';
import { useState } from 'react';

export default function YouTubeBlock({ videoId, title, channelName, youtubeQuery }) {
  const [loaded, setLoaded] = useState(false);
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  if (!videoId && youtubeQuery) {
    return (
      <div className="bg-[#F4F8FC] border border-dashed border-[var(--c-border)] rounded-xl p-5 text-center space-y-3 mt-4">
        <svg className="mx-auto" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4M10 17l4-4-4-4"/>
        </svg>
        <p className="text-sm text-[var(--c-text-muted)]">Find a video tutorial for this topic</p>
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border border-[var(--c-border)] text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.1 2.7 12 2.7 12 2.7s-4.1 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.2.3 4.3.3 4.3s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.8 12 21.8 12 21.8s4.1 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.3v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.2l8.1 3.7-8.1 3.6z"/></svg>
          Search on YouTube
        </a>
      </div>
    );
  }

  if (!videoId) return null;

  return (
    <div className="mt-6 space-y-2">
      <p className="text-xs uppercase tracking-widest text-[var(--c-text-muted)] font-medium">🎬 Recommended video</p>
      <div className="rounded-xl overflow-hidden border border-[var(--c-border)]">
        {loaded ? (
          <iframe
            width="100%" height="360"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title || 'Video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div onClick={() => setLoaded(true)} className="relative cursor-pointer">
            <img src={thumbnail} alt={title} className="w-full object-cover" style={{ aspectRatio: '16/9' }} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="white" opacity="0.9">
                <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.6)"/>
                <polygon points="10,8 16,12 10,16" fill="white"/>
              </svg>
            </div>
          </div>
        )}
      </div>
      {(title || channelName) && (
        <div className="flex items-start justify-between px-1">
          <div>
            {title && <p className="text-sm font-semibold text-[var(--c-text)] line-clamp-1">{title}</p>}
            {channelName && <p className="text-xs text-[var(--c-text-muted)]">{channelName}</p>}
          </div>
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[var(--c-primary)] hover:underline flex-shrink-0 ml-2">
            Open ↗
          </a>
        </div>
      )}
    </div>
  );
}
