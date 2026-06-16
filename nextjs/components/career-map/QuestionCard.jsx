'use client';
import OptionsQuestion from './OptionsQuestion';
import FreeTextQuestion from './FreeTextQuestion';
import ConfidenceDots from './ConfidenceDots';

export default function QuestionCard({
  question,
  questionNumber,
  answerValue,
  onAnswer,
  onSkip,
  onBack,
  confidence,
  onNext,
  isLast,
}) {
  const { questionText, questionType, options, placeholder, maxLength } = question;


  const canProceed = questionType === 'free_text'
    ? (answerValue || '').trim().length >= 1
    : !!answerValue;

  return (
    <div className="card shadow-2xl p-8 space-y-6 animate-fade-in-scale">
      {/* Header row: back button */}
      <div className="flex items-center">
        {questionNumber > 1 ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-[#6B7280] dark:text-[#8BA3C1] hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
        ) : <span />}
      </div>

      {/* Segmented dot progress bar */}
      <div className="flex items-center gap-2 -mt-2">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < questionNumber - 1
                  ? 'flex-1 bg-[#185FA5]'
                  : i === questionNumber - 1
                  ? 'flex-1 bg-[#185FA5] opacity-60'
                  : 'w-3 flex-none bg-[#D1DCE8] dark:bg-[rgba(255,255,255,0.12)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question text */}
      <h3 className="text-[20px] font-bold text-[#2C2C2A] dark:text-[#E8EFF7] leading-[1.4]">
        {questionText}
      </h3>

      {/* Answer input */}
      {questionType === 'free_text' ? (
        <FreeTextQuestion
          value={answerValue}
          onChange={val => onAnswer(val, val)}
          placeholder={placeholder}
          maxLength={maxLength || 300}
          onSkip={onSkip}
        />
      ) : (
        <OptionsQuestion
          options={options || []}
          selected={answerValue}
          onSelect={val => {
            const opt = (options || []).find(o => o.value === val);
            onAnswer(val, opt?.label || val);
          }}
        />
      )}

      {/* Next / Submit button */}
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-40 btn-primary"
      >
        {isLast ? 'See my career paths →' : 'Next →'}
      </button>

      {/* Confidence dots */}
      <ConfidenceDots confidence={confidence || 0} />
    </div>
  );
}
