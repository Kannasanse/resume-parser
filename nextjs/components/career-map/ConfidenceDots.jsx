'use client';

const LABELS = [
  [0,    0.3,  'Learning about you…'],
  [0.3,  0.6,  'Getting clearer…'],
  [0.6,  0.85, 'Almost there!'],
  [0.85, 1.01, 'Ready to map your career'],
];

export default function ConfidenceDots({ confidence = 0 }) {
  const filled = Math.round(confidence * 5);
  const label  = LABELS.find(([lo, hi]) => confidence >= lo && confidence < hi)?.[2] || 'Learning about you…';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="inline-block w-2 h-2 rounded-full transition-colors duration-500"
            style={{ background: i < filled ? '#185FA5' : '#D1DCE8' }}
          />
        ))}
      </div>
      <p className="text-[11px] text-[#9CA3AF] text-center">{label}</p>
    </div>
  );
}
