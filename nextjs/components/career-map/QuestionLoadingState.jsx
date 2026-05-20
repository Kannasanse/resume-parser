'use client';

const MESSAGES = {
  1:  'Analysing your background…',
  2:  'Learning more about you…',
  3:  'Learning more about you…',
  4:  'Learning more about you…',
  final: 'Building your career map…',
};

function getMessage(questionNumber) {
  if (questionNumber <= 1) return MESSAGES[1];
  if (questionNumber >= 5) return MESSAGES.final;
  return MESSAGES[questionNumber] || 'Personalising your next question…';
}

export default function QuestionLoadingState({ questionNumber = 1 }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <style>{`
        @keyframes cm-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
      <div className="flex items-center gap-2">
        {[0, 150, 300].map((delay, i) => (
          <span
            key={i}
            className="inline-block w-2 h-2 rounded-full bg-[#185FA5]"
            style={{ animation: `cm-bounce 600ms ${delay}ms infinite` }}
          />
        ))}
      </div>
      <p className="text-[13px] text-[#6B7280]">{getMessage(questionNumber)}</p>
    </div>
  );
}
