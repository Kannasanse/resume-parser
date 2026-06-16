'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/interview-buddy/QuestionCard';

export default function KitPage() {
  const { kitId } = useParams();
  const router = useRouter();
  const [kit, setKit]                   = useState(null);
  const [error, setError]               = useState('');
  const [activeCategory, setCategory]   = useState('All');
  const [expandAll, setExpandAll]       = useState(false);

  useEffect(() => {
    fetch(`/api/v1/interview-buddy/${kitId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setKit(d.kit);
      })
      .catch(() => setError('Failed to load kit'));
  }, [kitId]);

  const visibleQuestions = useMemo(() => {
    if (!kit) return [];
    if (activeCategory === 'All') return kit.questions;
    return kit.questions.filter(q => q.category === activeCategory);
  }, [activeCategory, kit]);

  if (error) return (
    <div style={{ padding: 40, color: '#F87171', fontFamily: 'inherit' }}>{error}</div>
  );

  if (!kit) return (
    <div style={{ padding: 40, color: 'rgba(232,239,247,0.40)', fontFamily: 'inherit', textAlign: 'center' }}>
      Loading your interview kit…
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 80px' }}>
      {/* Back link */}
      <a
        href="/interview-buddy"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'rgba(232,239,247,0.40)',
          textDecoration: 'none', paddingTop: 24, marginBottom: 28,
        }}
      >
        ← Back to Interview Buddy
      </a>

      {/* Kit header */}
      <div style={{ paddingBottom: 24 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'rgba(232,239,247,0.40)',
          letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          {kit.company ? `${kit.company.toUpperCase()} · ` : ''}INTERVIEW KIT
        </div>

        <h1 style={{
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 800, color: '#E8EFF7',
          lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 10, marginTop: 0,
        }}>
          {kit.title}
        </h1>

        <div style={{ fontSize: 13, color: 'rgba(232,239,247,0.45)', marginBottom: 20 }}>
          {kit.question_count} questions · {kit.categories.length} categories
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['All', ...(kit.categories || [])].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '6px 16px', borderRadius: 9999,
                fontSize: 13, fontWeight: activeCategory === cat ? 600 : 400,
                background: activeCategory === cat ? '#E8EFF7' : 'transparent',
                color: activeCategory === cat ? '#0A0A0A' : '#E8EFF7',
                border: `1px solid ${activeCategory === cat ? '#E8EFF7' : 'rgba(255,255,255,0.20)'}`,
                cursor: 'pointer', transition: 'all 160ms', whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12,
      }}>
        <span style={{ fontSize: 12, color: 'rgba(232,239,247,0.35)' }}>
          {visibleQuestions.length} question{visibleQuestions.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setExpandAll(e => !e)}
          style={{
            fontSize: 12, color: '#5B9FD4', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          {expandAll ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Question cards */}
      <div>
        {visibleQuestions.map(q => (
          <QuestionCard key={q.id} question={q} defaultOpen={expandAll} />
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 32,
        paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={() => router.push('/interview-prep')}
          style={{
            flex: 1, background: '#185FA5', border: 'none',
            borderRadius: 10, padding: '11px 0',
            fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer',
          }}
        >
          🎤 Practice with self-test
        </button>
        <button
          onClick={() => window.print()}
          style={{
            flex: 1, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, padding: '11px 0',
            fontSize: 13, color: 'rgba(232,239,247,0.70)', cursor: 'pointer',
          }}
        >
          ↓ Print / Save PDF
        </button>
      </div>
    </div>
  );
}
