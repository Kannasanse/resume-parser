'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ResumePreview from '@/components/builder/ResumePreview.jsx';

export default function PublicResumePage() {
  const { token } = useParams();
  const [resume, setResume] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/resume/${token}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(res => {
        if (res?.data) {
          setResume(res.data);
          const pi = res.data?.personal_info || {};
          if (pi.name) document.title = `${pi.name} — Resume`;
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#666' }}>Loading resume…</p>
      </div>
    );
  }

  if (notFound || !resume) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontFamily: 'sans-serif', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>This resume is no longer available.</h1>
        <p style={{ color: '#666', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
          The owner may have disabled sharing for this resume.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#e5e7eb' }}>
      {/* Minimal branded header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#888' }}>
          {resume.personal_info?.name || 'Resume'} &mdash; shared via resume.parse
        </span>
      </div>

      {/* Preview — scrollable, responsive width */}
      <div style={{ maxWidth: 860, margin: '24px auto', padding: '0 12px' }}>
        <ResumePreview
          resume={resume}
          designSettings={resume.design_settings || {}}
          className="rounded shadow-lg overflow-hidden"
        />
      </div>
    </div>
  );
}
