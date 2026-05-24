'use client';

// ─── Constants ────────────────────────────────────────────────────────────────

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

// ─── Trash icon ───────────────────────────────────────────────────────────────

function IconTrash() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── Radio circle ─────────────────────────────────────────────────────────────

function RadioCircle({ selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={selected ? 'Correct answer (selected)' : 'Mark as correct answer'}
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: selected ? 'none' : '1.5px solid #D1DCE8',
        background: selected ? '#1D9E75' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
        padding: 0,
        transition: 'all 150ms ease',
        outline: 'none',
      }}
    >
      {selected && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'white',
            display: 'block',
          }}
        />
      )}
    </button>
  );
}

// ─── Single option row ────────────────────────────────────────────────────────

function OptionRow({ index, option, canDelete, onMarkCorrect, onTextChange, onDelete }) {
  const { option_text, is_correct } = option;
  const letter = LETTERS[index] ?? String(index + 1);

  const inputStyle = {
    flex: 1,
    border: is_correct ? '1.5px solid #1D9E75' : '1.5px solid #D1DCE8',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    background: is_correct
      ? 'linear-gradient(135deg, #D1FAE5, #F0FDF4)'
      : 'white',
    color: '#2C2C2A',
    outline: 'none',
    transition: 'border-color 150ms ease, background 150ms ease, box-shadow 150ms ease',
    width: '100%',
    boxSizing: 'border-box',
  };

  const handleFocus = (e) => {
    e.target.style.boxShadow = is_correct
      ? '0 0 0 3px rgba(29,158,117,0.12)'
      : '0 0 0 3px rgba(24,95,165,0.10)';
    e.target.style.borderColor = is_correct ? '#1D9E75' : '#185FA5';
  };

  const handleBlur = (e) => {
    e.target.style.boxShadow = 'none';
    e.target.style.borderColor = is_correct ? '#1D9E75' : '#D1DCE8';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Letter badge */}
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: is_correct ? '#D1FAE5' : '#F3F4F6',
          color: is_correct ? '#1D9E75' : '#6B7280',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 150ms ease',
        }}
      >
        {letter}
      </span>

      {/* Radio */}
      <RadioCircle selected={is_correct} onClick={() => onMarkCorrect(index)} />

      {/* Text input */}
      <input
        type="text"
        value={option_text}
        onChange={(e) => onTextChange(index, e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Option text..."
        style={inputStyle}
      />

      {/* Delete button */}
      {canDelete ? (
        <button
          type="button"
          onClick={() => onDelete(index)}
          aria-label={`Remove option ${letter}`}
          style={{
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#9CA3AF',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 150ms ease, background 150ms ease',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#D93025';
            e.currentTarget.style.background = '#FEE2E2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <IconTrash />
        </button>
      ) : (
        // Spacer so alignment stays consistent
        <span style={{ width: 30, flexShrink: 0 }} />
      )}
    </div>
  );
}

// ─── MCQOptions ───────────────────────────────────────────────────────────────

export default function MCQOptions({ options, onChange }) {
  const canDelete = options.length > MIN_OPTIONS;
  const canAdd = options.length < MAX_OPTIONS;

  const handleMarkCorrect = (index) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      is_correct: i === index,
    }));
    onChange(updated);
  };

  const handleTextChange = (index, text) => {
    const updated = options.map((opt, i) =>
      i === index ? { ...opt, option_text: text } : opt
    );
    onChange(updated);
  };

  const handleDelete = (index) => {
    const updated = options.filter((_, i) => i !== index);
    // If the deleted option was correct and there are remaining options,
    // do not auto-select — let user choose.
    onChange(updated);
  };

  const handleAddOption = () => {
    if (!canAdd) return;
    onChange([...options, { option_text: '', is_correct: false }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt, index) => (
        <OptionRow
          key={index}
          index={index}
          option={opt}
          canDelete={canDelete}
          onMarkCorrect={handleMarkCorrect}
          onTextChange={handleTextChange}
          onDelete={handleDelete}
        />
      ))}

      {canAdd && (
        <button
          type="button"
          onClick={handleAddOption}
          style={{
            alignSelf: 'flex-start',
            marginLeft: 34 + 10 + 20 + 10, // letter badge + gap + radio + gap
            background: 'none',
            border: 'none',
            padding: '4px 0',
            fontSize: 13,
            fontWeight: 500,
            color: '#185FA5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          + Add option
        </button>
      )}
    </div>
  );
}
