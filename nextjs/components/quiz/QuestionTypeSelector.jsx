'use client';
import { MixedRatioPicker } from './MixedRatioPicker';

const TYPES = [
  { id: 'mcq',          label: 'MCQ',           desc: '4-option multiple choice',     color: '#185FA5', icon: '☑' },
  { id: 'true_false',   label: 'True / False',  desc: 'Binary True or False',         color: '#1D9E75', icon: '⇄' },
  { id: 'short_answer', label: 'Short Answer',  desc: 'Type your answer · AI scored', color: '#F59E0B', icon: '≡' },
  { id: 'mixed',        label: 'Mixed',         desc: 'Your own combination',         color: '#7C3AED', icon: '⇌' },
];

const DEFAULT_MIX = { mcq: 60, true_false: 20, short_answer: 20 };

export function QuestionTypeSelector({ value, onChange }) {
  // value: { type: 'mcq' | 'true_false' | 'short_answer' | 'mixed', mix?: { mcq, true_false, short_answer } }

  function handleTypeClick(typeId) {
    if (typeId === 'mixed') {
      onChange({ type: 'mixed', mix: value?.mix ?? DEFAULT_MIX });
    } else {
      onChange({ type: typeId });
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.50)',
        letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 12,
      }}>
        Question Type
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {TYPES.map(t => {
          const active = value?.type === t.id;
          return (
            <button key={t.id} onClick={() => handleTypeClick(t.id)} style={{
              background:    active ? `${t.color}18` : 'rgba(255,255,255,0.04)',
              border:        `${active ? 2 : 1}px solid ${active ? t.color : 'rgba(255,255,255,0.10)'}`,
              borderRadius:  12, padding: '14px 12px', cursor: 'pointer',
              textAlign:     'left', display: 'flex', flexDirection: 'column', gap: 8,
              transition:    'all 160ms',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: active ? `${t.color}25` : 'rgba(255,255,255,0.08)',
                display: 'grid', placeItems: 'center',
                fontSize: 18, lineHeight: 1,
              }}>
                {t.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'white' : 'rgba(255,255,255,0.75)' }}>
                {t.label}
              </div>
              <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                {t.desc}
              </div>
            </button>
          );
        })}
      </div>

      {value?.type === 'mixed' && (
        <MixedRatioPicker
          mix={value.mix ?? DEFAULT_MIX}
          onChange={mix => onChange({ type: 'mixed', mix })}
        />
      )}
    </div>
  );
}
