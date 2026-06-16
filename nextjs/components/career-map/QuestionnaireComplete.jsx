'use client';
import { useEffect, useState } from 'react';

export default function QuestionnaireComplete({ questionCount, confidenceScore, onContinue }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2000;
    const frame = () => {
      const pct = Math.min(1, (Date.now() - start) / duration);
      setProgress(pct);
      if (pct < 1) requestAnimationFrame(frame);
      else setTimeout(onContinue, 200);
    };
    requestAnimationFrame(frame);
  }, [onContinue]);

  const confPct = Math.round((confidenceScore || 0) * 100);

  return (
    <div className="rounded-[20px] p-10 text-center space-y-5"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <style>{`
        @keyframes cq-scale { from { opacity:0; transform:scale(0.5) } to { opacity:1; transform:scale(1) } }
      `}</style>

      <div className="flex justify-center">
        <svg
          width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'cq-scale 400ms ease forwards' }}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>

      <div>
        <h2 className="text-[22px] font-bold text-white">Great — I have what I need</h2>
        <p className="text-[15px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Based on your background and answers, I'm mapping out your personalised career paths now.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {[
          `${questionCount} question${questionCount !== 1 ? 's' : ''} answered`,
          confPct > 0 ? `${confPct}% profile match` : 'Profile analysed',
        ].map(label => (
          <span key={label}
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
            {label}
          </span>
        ))}
      </div>

      <div className="space-y-2 pt-2">
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Generating your career paths…
        </p>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            className="h-full rounded-full transition-none"
            style={{ width: `${progress * 100}%`, background: 'white' }}
          />
        </div>
      </div>
    </div>
  );
}
