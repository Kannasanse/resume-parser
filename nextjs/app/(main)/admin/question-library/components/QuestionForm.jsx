'use client';

import { useState, useEffect, useCallback } from 'react';
import QuestionTypeSelector from './QuestionTypeSelector';
import MCQOptions from './MCQOptions';
import TrueFalseSelector from './TrueFalseSelector';
import ShortAnswerFields from './ShortAnswerFields';
import MetadataRow from './MetadataRow';

// ─── Default MCQ options ──────────────────────────────────────────────────────

function defaultMCQOptions() {
  return [
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ];
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        border: '2px solid rgba(255,255,255,0.4)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'ql-spin 0.65s linear infinite',
        verticalAlign: 'middle',
        marginRight: 6,
      }}
    />
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--c-text-muted, #6B7280)',
        marginBottom: 10,
        marginTop: 0,
      }}
    >
      {children}
    </p>
  );
}

// ─── Textarea shared style ────────────────────────────────────────────────────

function textareaStyle(minHeight) {
  return {
    width: '100%',
    minHeight,
    border: '1.5px solid #D1DCE8',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 15,
    lineHeight: '1.6',
    resize: 'vertical',
    background: 'var(--ql-input-bg, white)',
    color: 'var(--c-text, #2C2C2A)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    display: 'block',
  };
}

const TEXTAREA_LABEL_STYLE = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6B7280',
  marginBottom: 8,
};

function applyTextareaFocus(el) {
  el.style.borderColor = '#185FA5';
  el.style.boxShadow = '0 0 0 3px rgba(24,95,165,0.10)';
}

function removeTextareaFocus(el) {
  el.style.borderColor = '#D1DCE8';
  el.style.boxShadow = 'none';
}

// ─── Inline error ─────────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ color: '#D93025', fontSize: 12, marginTop: 4, marginBottom: 0 }}>
      {msg}
    </p>
  );
}

// ─── Question placeholder by type ─────────────────────────────────────────────

function questionPlaceholder(type) {
  if (type === 'mcq') return 'Enter your multiple choice question...';
  if (type === 'true_false') return 'Enter a statement that is either true or false...';
  return 'Enter your short answer question...';
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(state) {
  const errs = {};

  if (!state.question_text.trim()) {
    errs.question_text = 'Question text is required.';
  }

  if (state.type === 'mcq') {
    const filled = state.options.filter((o) => o.option_text.trim());
    if (filled.length < 2) {
      errs.options = 'At least 2 options with text are required.';
    } else if (!state.options.some((o) => o.is_correct && o.option_text.trim())) {
      errs.options = 'Mark at least one option as the correct answer.';
    }
  }

  if (state.type === 'true_false') {
    if (state.correct_answer !== 'true' && state.correct_answer !== 'false') {
      errs.correct_answer = 'Select the correct answer.';
    }
  }

  if (state.type === 'short_answer') {
    if (!state.model_answer.trim()) {
      errs.model_answer = 'Model answer is required for short answer questions.';
    }
  }

  if (!state.skill_tag) {
    errs.skill_tag = 'Skill is required.';
  }

  if (!state.difficulty) {
    errs.difficulty = 'Difficulty is required.';
  }

  return errs;
}

// ─── QuestionForm ─────────────────────────────────────────────────────────────

export default function QuestionForm({
  initialData,
  onSave,
  onCancel,
  saving,
  error: externalError,
}) {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [type, setType] = useState(initialData?.type ?? 'mcq');
  const [questionText, setQuestionText] = useState(initialData?.question_text ?? '');
  const [points, setPoints] = useState(
    initialData?.points ?? (initialData?.type === 'short_answer' ? 2 : 1)
  );
  const [options, setOptions] = useState(
    initialData?.options?.length
      ? initialData.options.map((o) => ({ option_text: o.option_text ?? '', is_correct: !!o.is_correct }))
      : defaultMCQOptions()
  );
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correct_answer ?? 'true');
  const [modelAnswer, setModelAnswer] = useState(initialData?.model_answer ?? '');
  const [gradingRubric, setGradingRubric] = useState(initialData?.grading_rubric ?? '');
  const [answerKeywords, setAnswerKeywords] = useState(initialData?.answer_keywords ?? '');
  const [explanation, setExplanation] = useState(initialData?.explanation ?? '');
  const [skillTag, setSkillTag] = useState(initialData?.skill_tag ?? '');
  const [topic, setTopic] = useState(initialData?.topic ?? '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? '');

  // ── Facets ──────────────────────────────────────────────────────────────────
  const [facets, setFacets] = useState({ skills: [], topics: [] });
  const [facetsLoading, setFacetsLoading] = useState(false);

  // ── Validation errors ────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  // ── Dirty tracking ───────────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);

  // ── Load facets on mount ─────────────────────────────────────────────────────
  const loadFacets = useCallback(async (skill) => {
    setFacetsLoading(true);
    try {
      const url = skill
        ? `/api/v1/admin/question-library/facets?skill_tag=${encodeURIComponent(skill)}`
        : '/api/v1/admin/question-library/facets';
      const r = await fetch(url);
      if (!r.ok) throw new Error('Failed to load facets');
      const d = await r.json();
      setFacets({
        skills: d.skills ?? [],
        topics: d.topics ?? [],
      });
    } catch {
      // Non-fatal — facets stay empty
    } finally {
      setFacetsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacets(skillTag || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When skill changes, reload topics
  const handleMetadataChange = (patch) => {
    setIsDirty(true);
    if ('skill_tag' in patch) {
      setSkillTag(patch.skill_tag);
      setTopic(patch.topic ?? '');
      loadFacets(patch.skill_tag || null);
      // Clear skill/difficulty errors eagerly
      setErrors((prev) => {
        const next = { ...prev };
        delete next.skill_tag;
        return next;
      });
    }
    if ('topic' in patch) setTopic(patch.topic);
    if ('difficulty' in patch) {
      setDifficulty(patch.difficulty);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.difficulty;
        return next;
      });
    }
  };

  // When type changes, adjust default points
  const handleTypeChange = (newType) => {
    setType(newType);
    setIsDirty(true);
    if (newType === 'short_answer' && points === 1) setPoints(2);
    if (newType !== 'short_answer' && points === 2) setPoints(1);
    setErrors({});
  };

  // ── SA field handler ─────────────────────────────────────────────────────────
  const handleSAChange = (patch) => {
    setIsDirty(true);
    if ('model_answer' in patch) {
      setModelAnswer(patch.model_answer);
      if (patch.model_answer.trim()) {
        setErrors((prev) => { const n = { ...prev }; delete n.model_answer; return n; });
      }
    }
    if ('grading_rubric' in patch) setGradingRubric(patch.grading_rubric);
    if ('answer_keywords' in patch) setAnswerKeywords(patch.answer_keywords);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const state = {
      type,
      question_text: questionText,
      points,
      options,
      correct_answer: correctAnswer,
      model_answer: modelAnswer,
      grading_rubric: gradingRubric,
      answer_keywords: answerKeywords,
      explanation,
      skill_tag: skillTag,
      topic,
      difficulty,
    };

    const errs = validate(state);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});

    // Build the payload based on type
    const payload = {
      type,
      question_text: questionText.trim(),
      points: Number(points) || 1,
      explanation: explanation.trim() || null,
      skill_tag: skillTag || null,
      topic: topic || null,
      difficulty: difficulty || null,
    };

    if (type === 'mcq') {
      payload.options = options
        .filter((o) => o.option_text.trim())
        .map((o) => ({ option_text: o.option_text.trim(), is_correct: o.is_correct }));
    }

    if (type === 'true_false') {
      payload.correct_answer = correctAnswer;
    }

    if (type === 'short_answer') {
      payload.model_answer = modelAnswer.trim();
      payload.grading_rubric = gradingRubric.trim() || null;
      payload.answer_keywords = answerKeywords.trim() || null;
    }

    await onSave(payload);
  };

  // ── Metadata value object ────────────────────────────────────────────────────
  const metadataValue = { skill_tag: skillTag, topic, difficulty };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Keyframe for spinner (injected once via style tag) */}
      <style>{`@keyframes ql-spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{
          background: 'var(--ds-card, white)',
          border: '1px solid var(--c-border, #D1DCE8)',
          borderRadius: 16,
          padding: 28,
          maxWidth: 720,
          boxSizing: 'border-box',
        }}
      >
        {/* Global error banner */}
        {externalError && (
          <div
            style={{
              background: '#FEE2E2',
              border: '1px solid rgba(217,48,37,0.3)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 24,
              color: '#D93025',
              fontSize: 14,
            }}
          >
            {externalError}
          </div>
        )}

        {/* ── Section 1: Question Type ───────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <SectionHeading>Question Type</SectionHeading>
          <QuestionTypeSelector value={type} onChange={handleTypeChange} />
        </div>

        {/* ── Section 2: Question Text ───────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <SectionHeading>Question</SectionHeading>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={TEXTAREA_LABEL_STYLE} htmlFor="qf-question-text">
                Question Text <span style={{ color: '#D93025' }}>*</span>
              </label>
              <textarea
                id="qf-question-text"
                value={questionText}
                onChange={(e) => {
                  setQuestionText(e.target.value);
                  setIsDirty(true);
                  if (e.target.value.trim()) {
                    setErrors((prev) => { const n = { ...prev }; delete n.question_text; return n; });
                  }
                }}
                onFocus={(e) => applyTextareaFocus(e.target)}
                onBlur={(e) => removeTextareaFocus(e.target)}
                placeholder={questionPlaceholder(type)}
                style={textareaStyle(100)}
              />
              <FieldError msg={errors.question_text} />
            </div>

            {/* Points input */}
            <div style={{ flexShrink: 0, width: 80 }}>
              <label
                style={{ ...TEXTAREA_LABEL_STYLE, whiteSpace: 'nowrap' }}
                htmlFor="qf-points"
              >
                Points
              </label>
              <input
                id="qf-points"
                type="number"
                min={0}
                max={100}
                value={points}
                onChange={(e) => {
                  setPoints(e.target.value === '' ? '' : Number(e.target.value));
                  setIsDirty(true);
                }}
                onFocus={(e) => applyTextareaFocus(e.target)}
                onBlur={(e) => removeTextareaFocus(e.target)}
                style={{
                  width: '100%',
                  height: 42,
                  border: '1.5px solid #D1DCE8',
                  borderRadius: 10,
                  padding: '0 12px',
                  fontSize: 14,
                  background: 'var(--ql-input-bg, white)',
                  color: 'var(--c-text, #2C2C2A)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Answer ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <SectionHeading>
            {type === 'mcq' && 'Answer Options'}
            {type === 'true_false' && 'Correct Answer'}
            {type === 'short_answer' && 'Model Answer & Grading'}
          </SectionHeading>

          {type === 'mcq' && (
            <>
              <MCQOptions options={options} onChange={(opts) => { setOptions(opts); setIsDirty(true); }} />
              <FieldError msg={errors.options} />
            </>
          )}

          {type === 'true_false' && (
            <>
              <TrueFalseSelector
                value={correctAnswer}
                onChange={(v) => {
                  setCorrectAnswer(v);
                  setIsDirty(true);
                  setErrors((prev) => { const n = { ...prev }; delete n.correct_answer; return n; });
                }}
              />
              <FieldError msg={errors.correct_answer} />
            </>
          )}

          {type === 'short_answer' && (
            <>
              <ShortAnswerFields
                value={{ model_answer: modelAnswer, grading_rubric: gradingRubric, answer_keywords: answerKeywords }}
                onChange={handleSAChange}
              />
              <FieldError msg={errors.model_answer} />
            </>
          )}
        </div>

        {/* ── Section 4: Explanation ────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <label style={TEXTAREA_LABEL_STYLE} htmlFor="qf-explanation">
            Explanation (Optional)
          </label>
          <textarea
            id="qf-explanation"
            value={explanation}
            onChange={(e) => { setExplanation(e.target.value); setIsDirty(true); }}
            onFocus={(e) => applyTextareaFocus(e.target)}
            onBlur={(e) => removeTextareaFocus(e.target)}
            placeholder="Explain why the correct answer is right. Shown to the learner after submission."
            style={textareaStyle(80)}
          />
        </div>

        {/* ── Section 5: Metadata ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeading>Classification</SectionHeading>
          <MetadataRow
            value={metadataValue}
            onChange={handleMetadataChange}
            facets={facets}
          />
          {/* Metadata field errors rendered together */}
          {(errors.skill_tag || errors.difficulty) && (
            <div style={{ marginTop: 8, display: 'flex', gap: 24 }}>
              {errors.skill_tag && (
                <p style={{ color: '#D93025', fontSize: 12, margin: 0 }}>{errors.skill_tag}</p>
              )}
              {errors.difficulty && (
                <p style={{ color: '#D93025', fontSize: 12, margin: 0 }}>{errors.difficulty}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div
          style={{
            paddingTop: 24,
            borderTop: '1px solid var(--c-border, #D1DCE8)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <CancelButton onClick={onCancel} />
          <SaveButton onClick={handleSave} saving={saving} />
        </div>
      </div>
    </>
  );
}

// ─── Footer buttons ───────────────────────────────────────────────────────────

function CancelButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: '1.5px solid #D1DCE8',
        borderRadius: 10,
        padding: '8px 18px',
        fontSize: 14,
        fontWeight: 500,
        color: 'var(--c-text-muted, #6B7280)',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 150ms ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ds-bg, #F3F4F6)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      Cancel
    </button>
  );
}

function SaveButton({ onClick, saving }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      style={{
        background: '#185FA5',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        padding: '8px 20px',
        fontSize: 14,
        fontWeight: 700,
        cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.5 : 1,
        transition: 'background 150ms ease, opacity 150ms ease',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!saving) e.currentTarget.style.background = '#0C447C';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#185FA5';
      }}
    >
      {saving && <Spinner />}
      {saving ? 'Saving…' : 'Save Question'}
    </button>
  );
}
