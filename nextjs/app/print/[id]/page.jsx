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
    // Wait for fonts + template to render, then print
    const t = setTimeout(() => window.print(), 800);
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

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @page {
          size: ${isLetter ? '8.5in 11in' : 'A4'};
          margin: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: ${page.width}px;
          background: #fff;
        }

        /* The resume content — fills exactly one page width, flows naturally */
        .resume-print-root {
          width: ${page.width}px;
          background: #fff;
        }

        /* Prevent orphaned headings / short blocks at bottom of page */
        .resume-print-root h1,
        .resume-print-root h2,
        .resume-print-root h3 {
          page-break-after: avoid;
        }

        /* Screen-only bar */
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
          z-index: 9999;
        }

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

          /* Allow natural page breaks inside the resume */
          .resume-print-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        @media screen {
          body { background: #e5e7eb; padding-top: 44px; }
          .resume-print-root {
            margin: 24px auto;
            box-shadow: 0 2px 20px rgba(0,0,0,0.18);
          }
        }
      `}</style>

      <div className="no-print">
        <span>Print dialog opening… Select &ldquo;Save as PDF&rdquo; to download your resume.</span>
        <button
          onClick={() => window.print()}
          style={{ background: '#FF7814', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
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
