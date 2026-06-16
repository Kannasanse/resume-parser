'use client';

// ─── Shared field styles ──────────────────────────────────────────────────────

const LABEL_STYLE = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6B7280',
  marginBottom: 6,
};

const INPUT_BASE = {
  width: '100%',
  border: '1.5px solid #D1DCE8',
  borderRadius: 12,
  padding: '14px 16px',
  fontSize: 14,
  lineHeight: '1.6',
  background: 'var(--ql-input-bg, white)',
  color: '#2C2C2A',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  fontFamily: 'inherit',
};

const HELPER_STYLE = {
  fontSize: 12,
  color: '#9CA3AF',
  marginTop: 5,
  marginBottom: 0,
};

// ─── Focusable field helpers ──────────────────────────────────────────────────

function applyFocus(el) {
  el.style.borderColor = '#185FA5';
  el.style.boxShadow = '0 0 0 3px rgba(24,95,165,0.10)';
}

function removeFocus(el) {
  el.style.borderColor = '#D1DCE8';
  el.style.boxShadow = 'none';
}

// ─── ShortAnswerFields ────────────────────────────────────────────────────────

export default function ShortAnswerFields({ value = {}, onChange }) {
  const { model_answer = '', grading_rubric = '', answer_keywords = '' } = value;

  const patch = (key, val) => onChange({ [key]: val });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Model Answer */}
      <div>
        <label style={LABEL_STYLE}>
          Model Answer <span style={{ color: '#D93025' }}>*</span>
        </label>
        <textarea
          value={model_answer}
          onChange={(e) => patch('model_answer', e.target.value)}
          onFocus={(e) => applyFocus(e.target)}
          onBlur={(e) => removeFocus(e.target)}
          placeholder="Enter the ideal answer that will be shown after submission..."
          style={{
            ...INPUT_BASE,
            minHeight: 80,
            resize: 'vertical',
            display: 'block',
          }}
        />
      </div>

      {/* Grading Rubric */}
      <div>
        <label style={LABEL_STYLE}>Grading Rubric (Optional)</label>
        <textarea
          value={grading_rubric}
          onChange={(e) => patch('grading_rubric', e.target.value)}
          onFocus={(e) => applyFocus(e.target)}
          onBlur={(e) => removeFocus(e.target)}
          placeholder="Describe what makes a good answer. Used for AI grading if enabled."
          style={{
            ...INPUT_BASE,
            minHeight: 60,
            resize: 'vertical',
            display: 'block',
          }}
        />
      </div>

      {/* Key Terms */}
      <div>
        <label style={LABEL_STYLE}>Key Terms (Optional)</label>
        <input
          type="text"
          value={answer_keywords}
          onChange={(e) => patch('answer_keywords', e.target.value)}
          onFocus={(e) => applyFocus(e.target)}
          onBlur={(e) => removeFocus(e.target)}
          placeholder="e.g. closure, scope, hoisting (comma separated)"
          style={{
            ...INPUT_BASE,
            display: 'block',
          }}
        />
        <p style={HELPER_STYLE}>Key concepts that should appear in a good answer</p>
      </div>
    </div>
  );
}
