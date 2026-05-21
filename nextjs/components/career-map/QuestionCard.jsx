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

  // Estimated total: known only >= 5
  const estTotal = questionNumber < 5
    ? null
    : Math.min(10, questionNumber + 2);

  const progressLabel = questionNumber < 5
    ? `${questionNumber} question${questionNumber !== 1 ? 's' : ''} so far`
    : `Question ${questionNumber} of ~${estTotal}`;

  const canProceed = questionType === 'free_text'
    ? (answerValue || '').trim().length >= 1
    : !!answerValue;

  const progressPct = estTotal ? Math.round((questionNumber / estTotal) * 100) : null;

  return (
    <div className="card shadow-2xl p-8 space-y-6 animate-fade-in-scale">
      {/* Header row */}
      <div className="flex items-center justify-between">
        {questionNumber > 1 ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#2C2C2A] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
        ) : <span />}
        <p className="text-xs text-[#9CA3AF] font-medium">{progressLabel}</p>
      </div>

      {/* Progress bar */}
      {progressPct !== null && (
        <div className="h-1 bg-[#E6F1FB] rounded-full overflow-hidden -mt-3">
          <div className="progress-fill-gradient h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {/* Question text */}
      <h3 className="text-[20px] font-bold text-[#2C2C2A] leading-[1.4]">
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

      {/* Next button */}
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
