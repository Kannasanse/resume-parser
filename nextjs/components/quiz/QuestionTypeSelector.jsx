'use client';
import { MixedRatioPicker } from './MixedRatioPicker';

const TYPES = [
  { id: 'mcq',          label: 'MCQ',           desc: '4-option multiple choice',     color: '#185FA5', darkColor: '#5B9FD4', activeBg: 'rgba(24,95,165,0.12)',   darkActiveBg: 'rgba(91,159,212,0.15)' },
  { id: 'true_false',   label: 'True / False',  desc: 'Binary True or False',         color: '#1D9E75', darkColor: '#34D399', activeBg: 'rgba(29,158,117,0.12)',  darkActiveBg: 'rgba(52,211,153,0.15)' },
  { id: 'short_answer', label: 'Short Answer',  desc: 'Type your answer · AI scored', color: '#B45309', darkColor: '#FBBF24', activeBg: 'rgba(245,158,11,0.12)',  darkActiveBg: 'rgba(251,191,36,0.15)' },
  { id: 'mixed',        label: 'Mixed',         desc: 'Your own combination',         color: '#7C3AED', darkColor: '#A78BFA', activeBg: 'rgba(124,58,237,0.12)',  darkActiveBg: 'rgba(167,139,250,0.15)' },
];

const DEFAULT_MIX = { mcq: 60, true_false: 20, short_answer: 20 };

export function QuestionTypeSelector({ value, onChange }) {
  function handleTypeClick(typeId) {
    if (typeId === 'mixed') {
      onChange({ type: 'mixed', mix: value?.mix ?? DEFAULT_MIX });
    } else {
      onChange({ type: typeId });
    }
  }

  return (
    <div className="mb-6">
      <div className="text-[11px] font-bold text-ds-textMuted dark:text-[rgba(255,255,255,0.50)] tracking-[0.09em] uppercase mb-3">
        Question Type
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TYPES.map(t => {
          const active = value?.type === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTypeClick(t.id)}
              className={`rounded-xl p-3.5 cursor-pointer text-left flex flex-col gap-2 transition-all border ${
                active
                  ? 'border-2'
                  : 'border border-ds-border hover:border-ds-inputBorder'
              }`}
              style={{
                background: active ? t.activeBg : 'transparent',
                borderColor: active ? t.color : undefined,
              }}
            >
              <div
                className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-[18px] leading-none"
                style={{ background: active ? `${t.color}25` : undefined }}
                // fallback bg via className when not active
              >
                <span className={!active ? 'opacity-60' : ''}>
                  {t.id === 'mcq'          ? '☑' :
                   t.id === 'true_false'   ? '⇄' :
                   t.id === 'short_answer' ? '≡' : '⇌'}
                </span>
              </div>
              <div
                className="text-[13px] font-bold"
                style={{ color: active ? t.color : undefined }}
              >
                <span className={!active ? 'text-ds-text' : ''}>{t.label}</span>
              </div>
              <div className="text-[11px] text-ds-textMuted leading-snug">
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
