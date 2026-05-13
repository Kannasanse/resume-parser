'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getBuilderResume } from '@/lib/builderApi';
import { resolveDesign } from '@/components/builder/templates.js';
import ResumePreview from '@/components/builder/ResumePreview.jsx';

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
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Page setup ── */
        @page {
          size: ${isLetter ? '8.5in 11in' : 'A4'};
          /*
            Match the resume's own padding so page 2+ have correct top/bottom space.
            Page 1 top padding is already inside the template wrapper div,
            so we only need the margin for subsequent pages.
            Using @page :first to suppress the top margin on page 1 avoids doubling.
          */
          margin: ${padY}mm ${padX}mm;
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

        /* ── Print rules ── */
        @media print {
          .no-print { display: none !important; }

          html, body {
            width: ${page.width}px;
            margin: 0;
            padding: 0;
          }

          .resume-print-root {
            width: ${page.width}px;
          }

          /* Preserve all colors exactly */
          .resume-print-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* ── Section-aware page break rules ── */

          /* 1. Section headers glue to their content — never orphaned at page bottom.
                Covers both native h-tags and template heading divs (first child of section block). */
          .resume-print-root h1,
          .resume-print-root h2,
          .resume-print-root h3,
          .resume-print-root h4,
          .resume-print-root h5,
          .resume-print-root h6,
          .resume-print-root .resume-section-block > *:first-child {
            break-after: avoid;
            page-break-after: avoid;
          }

          /* 2. Keep each full section together if it's reasonably sized.
                Browsers honour this for blocks that fit within one page. */
          .resume-section-block {
            break-inside: auto;
            page-break-inside: auto;
          }

          /* 3. Individual experience / education entries stay intact */
          .resume-entry-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* 4. Prevent a lone section heading at the bottom of a page.
                margin-bottom: 0 + the next sibling having break-before pulls
                the heading along with its first child. */
          .resume-section-block + .resume-section-block {
            break-before: auto;
          }

          /* 5. Skills, certifications, languages, projects — compact blocks
                that should stay together if they fit on one page */
          .resume-section-block[data-type="skills"],
          .resume-section-block[data-type="certifications"],
          .resume-section-block[data-type="languages"],
          .resume-section-block[data-type="summary"] {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* 6. If a table spans pages, repeat the header row */
          thead {
            display: table-header-group;
          }

          /* 7. Suppress browser-injected link underlines & colors in print */
          a { text-decoration: none !important; color: inherit !important; }

          /* 8. Rich text body rendered from TipTap HTML */
          .resume-rich-body p  { margin: 0; }
          .resume-rich-body p + p { margin-top: 0.2em; }
          .resume-rich-body ul { list-style-type: disc !important; padding-left: 1.2em; margin: 0.2em 0; }
          .resume-rich-body ol { list-style-type: decimal !important; padding-left: 1.2em; margin: 0.2em 0; }
          .resume-rich-body li { display: list-item !important; margin: 0; }
          .resume-rich-body strong { font-weight: 700; }
          .resume-rich-body em     { font-style: italic; }
          .resume-rich-body u      { text-decoration: underline; }
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
