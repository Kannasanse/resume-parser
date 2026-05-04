'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getBuilderResume } from '@/lib/builderApi';
import { resolveDesign, PAGE_SIZES } from '@/components/builder/templates.js';

// Inline template rendering (same logic as ResumePreview but full-size, no scale)
import ResumePreview from '@/components/builder/ResumePreview.jsx';

export default function PrintPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBuilderResume(id)
      .then(res => {
        setResume(res.data);
        // Set document title for suggested PDF filename
        const pi = res.data?.personal_info || {};
        const nameParts = (pi.name || '').trim().split(/\s+/).filter(Boolean);
        document.title = nameParts.length >= 2
          ? `${nameParts[0]}_${nameParts[nameParts.length - 1]}_Resume`
          : (nameParts[0] ? `${nameParts[0]}_Resume` : 'Resume');
      })
      .catch(err => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!resume) return;
    // Brief delay to ensure fonts / images load, then trigger print
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [resume]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#c00' }}>
        Could not load resume: {error}
      </div>
    );
  }

  if (!resume) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#666', textAlign: 'center' }}>
        Preparing your PDF…
      </div>
    );
  }

  const design = resolveDesign(resume.design_settings || {});
  const page = design.page;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: ${page.id === 'letter' ? 'letter' : 'A4'};
            margin: 0;
          }
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        @media screen {
          body { background: #e5e7eb; }
          .resume-wrapper { box-shadow: 0 2px 16px rgba(0,0,0,0.15); }
        }
      `}</style>

      {/* Screen-only hint */}
      <div className="no-print" style={{ background: '#1f2937', color: '#fff', padding: '10px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Print dialog opening… Use &ldquo;Save as PDF&rdquo; to download your resume.</span>
        <button onClick={() => window.print()} style={{ background: '#FF7814', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Print / Save PDF
        </button>
      </div>

      {/* Resume document — rendered at actual page size */}
      <div className="resume-wrapper" style={{ width: page.width, minHeight: page.height, margin: '0 auto', background: '#fff' }}>
        <ResumePreview resume={resume} designSettings={resume.design_settings || {}} scale={1} />
      </div>
    </>
  );
}
