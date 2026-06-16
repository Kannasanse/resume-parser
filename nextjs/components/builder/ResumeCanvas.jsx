'use client';
import { useRef, useEffect, useState } from 'react';
import '@/styles/resume-print.css';

// A4 at 96 dpi
const A4_WIDTH_PX = 794;

/**
 * Auto-scaling wrapper for the live resume preview.
 *
 * Observes its own container width via ResizeObserver and computes the
 * largest scale factor that fits the A4 canvas without clipping.
 * Passes the computed scale to children via render prop:
 *
 *   <ResumeCanvas className="flex-1">
 *     {scale => <ResumePreview resume={...} scale={scale} />}
 *   </ResumeCanvas>
 *
 * Importing this component also ensures resume-print.css (page breaks,
 * @media print rules) is bundled into any page that renders the preview.
 */
export default function ResumeCanvas({ children, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.72);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new ResizeObserver(([entry]) => {
      // 32px = 16px left + 16px right breathing room
      const available = entry.contentRect.width - 32;
      const next = Math.min(Math.max(available / A4_WIDTH_PX, 0.3), 1.0);
      setScale(parseFloat(next.toFixed(3)));
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {typeof children === 'function' ? children(scale) : children}
    </div>
  );
}
