'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getBuilderResume } from '@/lib/builderApi';
import { resolveDesign } from '@/components/builder/templates.js';
import ResumePreview from '@/components/builder/ResumePreview.jsx';
import '@/styles/resume-print.css';

export default function PrintPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBuilderResume(id)
      .then(res => {
        setResume(res.data);
        const pi = res.data?.personal_info || {};
        const parts = (pi.name || '').trim().split(/\s+/).filter(Boolean);
        document.title = parts.length >= 2
          ? `${parts[0]}_${parts[parts.length - 1]}_Resume`
          : (parts[0] ? `${parts[0]}_Resume` : 'Resume');
      })
      .catch(err => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!resume) return;
    const t = setTimeout(() => window.print(), 900);
    return () => clearTimeout(t);
  }, [resume]);

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#c00' }}>
      Could not load resume: {error}
    </div>
  );

  if (!resume) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#666', textAlign: 'center' }}>
      Preparing your PDF…
    </div>
  );

  const design = resolveDesign(resume.design_settings || {});
  const page = design.page;
  const isLetter = page.id === 'letter';

  // Match @page margins to the resume's own spacing so page 2+ have top/bottom breathing room
  const ss = resume.spacing_settings || {};
  const clamp = (n, lo, hi, d) => (typeof n === 'number' && !isNaN(n) ? Math.max(lo, Math.min(hi, n)) : d);
  const padX = clamp(ss.leftRightMargin, 5, 30, 15);
  const padY = clamp(ss.topBottomMargin, 5, 30, 15);

  return (
    <>
      {/* Resume fonts — must load before Puppeteer measures/prints */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Roboto:wght@400;500;700&family=Lato:wght@400;700&family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600;700&family=Raleway:wght@400;600;700&family=Nunito:wght@400;600;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Page setup ── */
        @page {
          size: ${isLetter ? '8.5in 11in' : 'A4'};
          /*
            Vertical margins only — the template wrapper already has paddingLeft/Right
            equal to padX mm, so horizontal @page margins would double the spacing and
            cause Chrome to scale the content down to fit (794px body in a narrower
            printable area), making the PDF paginate differently from the live preview.
            Page 1 top/bottom are suppressed via @page :first; the template's own
            paddingTop/Bottom handle page 1 spacing.
          */
          margin: ${padY}mm 0;
        }
        @page :first {
          margin-top: 0;
          margin-bottom: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: ${page.width}px;
          background: #fff;
        }

        .resume-print-root {
          width: ${page.width}px;
          background: #fff;
        }

        /* ── Screen chrome ── */
        .no-print {
          display: flex;
          position: fixed;
          top: 0; left: 0; right: 0;
          background: #1f2937;
          color: #fff;
          padding: 10px 16px;
          font: 13px/1 system-ui, sans-serif;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          z-index: 9999;
        }
        .no-print-hint {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }

        @media screen {
          body { background: #e5e7eb; padding-top: 56px; }
          .resume-print-root {
            margin: 24px auto;
            box-shadow: 0 2px 20px rgba(0,0,0,0.18);
          }
        }

        /* ── Print rules — static rules live in styles/resume-print.css ── */
        /* (imported at top of file; only dynamic overrides remain here)  */

        @media print {
          html, body {
            width: ${page.width}px;
            margin: 0;
            padding: 0;
          }

          .resume-print-root {
            width: ${page.width}px;
          }

          /* Suppress browser link colour overrides */
          a { text-decoration: none !important; color: inherit !important; }
        }
      `}</style>

      <div className="no-print">
        <div>
          <div>Print dialog opening… Select <strong>&ldquo;Save as PDF&rdquo;</strong> to download.</div>
          <div className="no-print-hint">
            Tip: In the print dialog, uncheck <strong>&ldquo;Headers and footers&rdquo;</strong> to remove the browser URL from your PDF.
          </div>
        </div>
        <button
          onClick={() => window.print()}
          style={{ background: '#FF7814', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
        >
          Print / Save PDF
        </button>
      </div>

      <div className="resume-print-root">
        <ResumePreview resume={resume} designSettings={resume.design_settings || {}} scale={1} printMode />
      </div>
    </>
  );
}
