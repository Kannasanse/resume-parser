'use client';

function getMessage(questionNumber) {
  if (questionNumber <= 1) return 'Analysing your background…';
  if (questionNumber <= 4) return 'Learning more about you…';
  return 'Refining your career picture…';
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
      <p className="text-[13px] text-[#6B7280] dark:text-[#8BA3C1]">
        {getMessage(questionNumber)}
      </p>
    </div>
  );
}
