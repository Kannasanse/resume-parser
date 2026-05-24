'use client';

// ─── Shared styles ────────────────────────────────────────────────────────────

const LABEL_STYLE = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#6B7280',
  marginBottom: 6,
};

const SELECT_BASE = {
  width: '100%',
  height: 42,
  border: '1.5px solid #D1DCE8',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 14,
  background: 'var(--ql-input-bg, white)',
  color: '#2C2C2A',
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
};

const SELECT_DISABLED = {
  ...SELECT_BASE,
  opacity: 0.55,
  cursor: 'not-allowed',
};

function applyFocus(el) {
  el.style.borderColor = '#185FA5';
  el.style.boxShadow = '0 0 0 3px rgba(24,95,165,0.10)';
}

function removeFocus(el) {
  el.style.borderColor = '#D1DCE8';
  el.style.boxShadow = 'none';
}

// ─── MetadataRow ──────────────────────────────────────────────────────────────

export default function MetadataRow({ value = {}, onChange, facets = {} }) {
  const { skill_tag = '', topic = '', difficulty = '' } = value;
  const skills = facets.skills ?? [];
  const topics = facets.topics ?? [];

  const hasSkill = Boolean(skill_tag);
  const topicsDisabled = !hasSkill && topics.length === 0;

  const patch = (key, val) => onChange({ [key]: val });

  const handleSkillChange = (e) => {
    const newSkill = e.target.value;
    // Clear topic when skill changes so parent can reload filtered topics
    onChange({ skill_tag: newSkill, topic: '' });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}
    >
      {/* Skill */}
      <div>
        <label style={LABEL_STYLE}>Skill</label>
        <select
          value={skill_tag}
          onChange={handleSkillChange}
          onFocus={(e) => applyFocus(e.target)}
          onBlur={(e) => removeFocus(e.target)}
          style={SELECT_BASE}
        >
          <option value="">Select skill</option>
          <option value="">-- No skill --</option>
          {skills.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Topic */}
      <div>
        <label style={LABEL_STYLE}>Topic</label>
        <select
          value={topic}
          onChange={(e) => patch('topic', e.target.value)}
          onFocus={(e) => { if (!topicsDisabled) applyFocus(e.target); }}
          onBlur={(e) => removeFocus(e.target)}
          disabled={topicsDisabled}
          style={topicsDisabled ? SELECT_DISABLED : SELECT_BASE}
        >
          <option value="">
            {topicsDisabled ? 'Select a skill first' : 'Select topic'}
          </option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty */}
      <div>
        <label style={LABEL_STYLE}>Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => patch('difficulty', e.target.value)}
          onFocus={(e) => applyFocus(e.target)}
          onBlur={(e) => removeFocus(e.target)}
          style={SELECT_BASE}
        >
          <option value="">Select difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
    </div>
  );
}
