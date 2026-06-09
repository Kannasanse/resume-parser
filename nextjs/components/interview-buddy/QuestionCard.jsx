'use client';
import { useState } from 'react';

const DIFFICULTY_STYLE = {
  core:       { label: 'Core',     bg: 'rgba(24,95,165,0.15)',  color: '#5B9FD4' },
  probing:    { label: 'Probing',  bg: 'rgba(245,158,11,0.15)', color: '#F5A623' },
  'red-flag': { label: 'Red Flag', bg: 'rgba(217,48,37,0.15)',  color: '#F87171' },
};

function formatAnswerGuide(text) {
  if (!text) return null;
  const parts = text.split(/(Strong answer:|Weak answer:)/);
  return parts.map((part, i) => {
    if (part === 'Strong answer:') {
      return <span key={i} style={{ fontWeight: 700, color: '#1D9E75' }}>{part} </span>;
    }
    if (part === 'Weak answer:') {
      return <span key={i} style={{ fontWeight: 700, color: '#F87171' }}>{part} </span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function QuestionCard({ question, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const d = DIFFICULTY_STYLE[question.difficulty] || DIFFICULTY_STYLE.core;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${open ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      marginBottom: 8,
      overflow: 'hidden',
      transition: 'border-color 200ms',
    }}>
      {/* Question row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'flex-start',
          gap: 14, padding: '16px 18px', cursor: 'pointer',
        }}
      >
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#1D9E75',
          letterSpacing: '0.02em', flexShrink: 0, paddingTop: 2, minWidth: 28,
        }}>
          Q{question.number}
        </div>

        <div style={{ flex: 1, fontSize: 15, color: '#E8EFF7', lineHeight: 1.5, fontWeight: 500 }}>
          {question.question}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            background: d.bg, color: d.color,
            borderRadius: 9999, padding: '2px 8px',
            fontSize: 10, fontWeight: 600,
          }}>{d.label}</span>
          <span style={{
            fontSize: 16, color: 'rgba(255,255,255,0.40)',
            transform: open ? 'rotate(45deg)' : 'none',
            transition: 'transform 200ms', display: 'block', lineHeight: 1,
          }}>
            {open ? '×' : '›'}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 18px 16px 60px',
        }}>
          <div style={{ marginBottom: question.followUps?.length ? 16 : 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.30)',
              letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 10,
            }}>
              What a strong answer looks like
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', lineHeight: 1.7 }}>
              {formatAnswerGuide(question.answerGuide)}
            </div>
          </div>

          {question.followUps?.length > 0 && (
            <div style={{ marginBottom: question.jdSignal ? 14 : 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.30)',
                letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8,
              }}>
                Follow-up probes
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {question.followUps.map((fu, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: 8, marginBottom: 5,
                    fontSize: 13, color: 'rgba(255,255,255,0.55)',
                  }}>
                    <span style={{ color: '#5B9FD4', flexShrink: 0 }}>›</span>
                    {fu}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {question.jdSignal && (
            <div style={{
              marginTop: 14, padding: '8px 12px',
              background: 'rgba(24,95,165,0.08)',
              border: '1px solid rgba(24,95,165,0.20)',
              borderRadius: 8, fontSize: 11,
              color: 'rgba(255,255,255,0.40)',
            }}>
              <span style={{ color: '#5B9FD4', fontWeight: 600 }}>Tests: </span>
              {question.jdSignal}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
