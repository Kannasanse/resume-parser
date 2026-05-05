'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Icons ────────────────────────────────────────────────────────────────────
function DragIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ds-textMuted">
      <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function Toggle({ value, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      className={`rounded-full relative transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-ds-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ width: 40, height: 22 }}
    >
      <div
        className="absolute rounded-full bg-white shadow transition-transform"
        style={{ width: 18, height: 18, top: 2, transform: value ? 'translateX(20px)' : 'translateX(2px)' }}
      />
    </div>
  );
}

// ─── Integrity summary strip ──────────────────────────────────────────────────
function IntegritySummary({ test }) {
  const parts = [];
  parts.push(test.disable_copy_paste ? 'Copy-paste: Disabled' : 'Copy-paste: Allowed');
  if (test.tab_switch_monitoring) {
    parts.push(`Tab monitoring: On · Threshold: ${test.tab_switch_threshold} · Action: ${test.tab_switch_action === 'auto_submit' ? 'Auto-submit' : 'Flag for review'}`);
  } else {
    parts.push('Tab monitoring: Off');
  }
  return (
    <p className="text-xs text-ds-textMuted mt-0.5">
      {parts.join(' · ')}
    </p>
  );
}

// ─── Add Question Modal ───────────────────────────────────────────────────────
function AddQuestionModal({ testId, onAdd, onClose }) {
  const [type, setType] = useState('mcq');
  const [questionText, setQuestionText] = useState('');
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState([
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState('true');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => setOptions(prev => [...prev, { option_text: '', is_correct: false }]);
  const removeOption = (i) => setOptions(prev => prev.filter((_, idx) => idx !== i));
  const updateOption = (i, field, value) => setOptions(prev =>
    prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o)
  );
  const setCorrect = (i) => setOptions(prev => prev.map((o, idx) => ({ ...o, is_correct: idx === i })));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) { setError('Question text is required'); return; }
    if (type === 'mcq') {
      const filled = options.filter(o => o.option_text.trim());
      if (filled.length < 2) { setError('At least 2 options required'); return; }
      if (!options.some(o => o.is_correct && o.option_text.trim())) { setError('Mark at least one correct answer'); return; }
    }
    setSaving(true); setError('');
    try {
      const body = { type, question_text: questionText, points };
      if (type === 'mcq') body.options = options.filter(o => o.option_text.trim());
      if (type === 'true_false') body.correct_answer = correctAnswer;

      const r = await fetch(`/api/v1/admin/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to add question');
      onAdd(d.question);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-ds-card border-b border-ds-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-heading font-bold text-ds-text">Add Question</h2>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">Type</label>
            <div className="flex gap-2">
              {[['mcq', 'Multiple Choice'], ['true_false', 'True / False'], ['short_answer', 'Short Answer']].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setType(val)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${type === val ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-text mb-1.5">Question <span className="text-ds-danger">*</span></label>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Enter your question…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder-ds-textMuted"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-text mb-1.5">Points</label>
            <input
              type="number" min="0" max="100"
              value={points}
              onChange={e => setPoints(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-ds-text mb-2">Answer Options <span className="text-ds-textMuted text-xs font-normal">(click radio to mark correct)</span></label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button type="button" onClick={() => setCorrect(i)}
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${opt.is_correct ? 'border-primary bg-primary' : 'border-ds-border'}`} />
                    <input
                      value={opt.option_text}
                      onChange={e => updateOption(i, 'option_text', e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-1 focus:ring-primary placeholder-ds-textMuted"
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)}
                        className="text-ds-textMuted hover:text-ds-danger text-lg leading-none w-5 h-5 flex items-center justify-center">×</button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button type="button" onClick={addOption}
                  className="text-xs text-primary hover:underline mt-2 inline-block">+ Add option</button>
              )}
            </div>
          )}

          {type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-ds-text mb-2">Correct Answer</label>
              <div className="flex gap-3">
                {[['true', 'True'], ['false', 'False']].map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => setCorrectAnswer(val)}
                    className={`flex-1 py-2 text-sm rounded border transition-colors font-medium ${correctAnswer === val ? 'border-primary bg-primary/10 text-primary' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'short_answer' && (
            <div className="bg-ds-bg border border-ds-border rounded px-4 py-3 text-xs text-ds-textMuted">
              Short answer questions require manual grading after submission.
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? 'Adding…' : 'Add Question'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({ q, testId, onDelete, onUpdate, index, onDragStart, onDragOver, onDrop }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.question_text);
  const [points, setPoints] = useState(q.points);
  const [options, setOptions] = useState(q.test_options || []);
  const [correctAnswer, setCorrectAnswer] = useState(
    q.type === 'true_false'
      ? (q.test_options?.find(o => o.is_correct)?.option_text?.toLowerCase() || 'true')
      : 'true'
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setCorrect = (i) => setOptions(prev => prev.map((o, idx) => ({ ...o, is_correct: idx === i })));
  const updateOptText = (i, val) => setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, option_text: val } : o));
  const addOpt = () => setOptions(prev => [...prev, { option_text: '', is_correct: false }]);
  const removeOpt = (i) => setOptions(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const body = { question_text: text, points };
      if (q.type === 'mcq') body.options = options.filter(o => o.option_text.trim());
      if (q.type === 'true_false') body.correct_answer = correctAnswer;

      const r = await fetch(`/api/v1/admin/tests/${testId}/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUpdate(d.question);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm('Delete this question?')) return;
    setDeleting(true);
    await fetch(`/api/v1/admin/tests/${testId}/questions/${q.id}`, { method: 'DELETE' });
    onDelete(q.id);
  };

  const typeLabel = { mcq: 'MCQ', true_false: 'True/False', short_answer: 'Short Answer' }[q.type] || q.type;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      className="bg-ds-card border border-ds-border rounded-lg p-4 group hover:border-ds-borderStrong transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="cursor-grab active:cursor-grabbing pt-0.5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <DragIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {editing ? (
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              ) : (
                <p className="text-sm text-ds-text font-medium leading-snug">{q.question_text}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-ds-textMuted bg-ds-bg border border-ds-border px-1.5 py-0.5 rounded">{typeLabel}</span>
              <span className="text-xs text-ds-textMuted font-mono">{q.points}pt</span>
            </div>
          </div>

          {editing && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-ds-textMuted">Points:</label>
                <input type="number" min="0" max="100" value={points} onChange={e => setPoints(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-xs border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {q.type === 'mcq' && (
                <div className="space-y-1.5">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button type="button" onClick={() => setCorrect(i)}
                        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${opt.is_correct ? 'border-primary bg-primary' : 'border-ds-border'}`} />
                      <input value={opt.option_text} onChange={e => updateOptText(i, e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-1 focus:ring-primary" />
                      {options.length > 2 && (
                        <button onClick={() => removeOpt(i)} className="text-ds-textMuted hover:text-ds-danger text-base leading-none">×</button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <button type="button" onClick={addOpt} className="text-xs text-primary hover:underline">+ Add option</button>
                  )}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="flex gap-2">
                  {[['true', 'True'], ['false', 'False']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setCorrectAnswer(val)}
                      className={`px-4 py-1.5 text-xs rounded border transition-colors ${correctAnswer === val ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving}
                  className="text-xs bg-primary text-white px-4 py-1.5 rounded-btn font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setText(q.question_text); setPoints(q.points); setOptions(q.test_options || []); }}
                  className="text-xs px-4 py-1.5 rounded-btn text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!editing && q.type === 'mcq' && q.test_options?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {q.test_options.map(opt => (
                <span key={opt.id}
                  className={`text-xs px-2 py-0.5 rounded border ${opt.is_correct ? 'bg-ds-successLight text-ds-success border-ds-success/30' : 'bg-ds-bg text-ds-textMuted border-ds-border'}`}>
                  {opt.option_text}
                </span>
              ))}
            </div>
          )}
          {!editing && q.type === 'true_false' && (
            <p className="mt-1 text-xs text-ds-textMuted">
              Correct: <span className="font-medium text-ds-success">
                {q.test_options?.find(o => o.is_correct)?.option_text || '—'}
              </span>
            </p>
          )}
          {!editing && q.type === 'short_answer' && (
            <p className="mt-1 text-xs text-ds-textMuted italic">Manual grading required</p>
          )}
        </div>

        {!editing && (
          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>
            </button>
            <button onClick={del} disabled={deleting}
              className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ test, onClose, onSave }) {
  const isPublished = test.status === 'published';
  const [form, setForm] = useState({
    title: test.title || '',
    description: test.description || '',
    job_profile_id: test.job_profile_id || '',
    timer_enabled: test.timer_enabled || false,
    time_limit_minutes: test.time_limit_minutes || 30,
    disable_copy_paste: test.disable_copy_paste || false,
    tab_switch_monitoring: test.tab_switch_monitoring || false,
    tab_switch_threshold: test.tab_switch_threshold || 3,
    tab_switch_action: test.tab_switch_action || 'flag',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const threshold = parseInt(form.tab_switch_threshold);
    if (isNaN(threshold) || threshold < 1 || threshold > 10) {
      setError('Tab-switch threshold must be a whole number between 1 and 10');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const r = await fetch(`/api/v1/admin/tests/${test.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tab_switch_threshold: threshold }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save settings');
      onSave({ ...form, tab_switch_threshold: threshold });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-ds-card border-b border-ds-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-heading font-bold text-ds-text">Test Settings</h2>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ds-text mb-1.5">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-text mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          {/* Timer */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-ds-text">Timer</p>
            <div className="flex items-center gap-3">
              <Toggle value={form.timer_enabled} onChange={v => set('timer_enabled', v)} disabled={isPublished} />
              <span className="text-sm text-ds-text">{form.timer_enabled ? 'Timer enabled' : 'No timer'}</span>
            </div>
            {form.timer_enabled && !isPublished && (
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="480" value={form.time_limit_minutes}
                  onChange={e => set('time_limit_minutes', e.target.value)}
                  className="w-20 px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary" />
                <span className="text-sm text-ds-textMuted">minutes</span>
              </div>
            )}
          </div>

          {/* Integrity Controls */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-ds-text">Integrity Controls</p>
              {isPublished ? (
                <p className="text-xs text-ds-warning bg-ds-warningLight border border-ds-warning/30 rounded px-3 py-1.5 mt-1.5">
                  Integrity settings cannot be changed while the test is published.
                </p>
              ) : (
                <p className="text-xs text-ds-textMuted mt-0.5">Changes take effect for new attempts only.</p>
              )}
            </div>

            {/* Disable copy-paste */}
            <div className="flex items-start gap-3">
              <Toggle value={form.disable_copy_paste} onChange={v => set('disable_copy_paste', v)} disabled={isPublished} />
              <div>
                <p className="text-sm text-ds-text font-medium">Disable Copy-Paste</p>
                <p className="text-xs text-ds-textMuted mt-0.5">
                  {form.disable_copy_paste
                    ? 'Paste is blocked in all answer fields. Copy and right-click are blocked on question text.'
                    : 'Candidates can freely copy and paste.'}
                </p>
              </div>
            </div>

            {/* Tab-switch monitoring */}
            <div className="flex items-start gap-3">
              <Toggle value={form.tab_switch_monitoring} onChange={v => set('tab_switch_monitoring', v)} disabled={isPublished} />
              <div className="flex-1">
                <p className="text-sm text-ds-text font-medium">Tab-Switch Monitoring</p>
                <p className="text-xs text-ds-textMuted mt-0.5">
                  {form.tab_switch_monitoring
                    ? 'Each time the candidate leaves and returns, they see a full-screen warning.'
                    : 'Tab switches are not monitored.'}
                </p>

                {form.tab_switch_monitoring && !isPublished && (
                  <div className="mt-3 space-y-3 pl-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-ds-text font-medium whitespace-nowrap">Threshold (switches):</label>
                      <input
                        type="number" min="1" max="10"
                        value={form.tab_switch_threshold}
                        onChange={e => set('tab_switch_threshold', e.target.value)}
                        className="w-16 px-2 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-xs text-ds-textMuted">(1–10)</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-ds-text font-medium">Action when threshold reached:</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tab_action" value="flag"
                          checked={form.tab_switch_action === 'flag'}
                          onChange={() => set('tab_switch_action', 'flag')}
                          className="accent-primary" />
                        <span className="text-xs text-ds-text">Flag for review — test continues, attempt is marked flagged</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tab_action" value="auto_submit"
                          checked={form.tab_switch_action === 'auto_submit'}
                          onChange={() => set('tab_switch_action', 'auto_submit')}
                          className="accent-primary" />
                        <span className="text-xs text-ds-text">Auto-submit — test is immediately submitted</span>
                      </label>
                    </div>
                  </div>
                )}

                {form.tab_switch_monitoring && isPublished && (
                  <p className="mt-1.5 text-xs text-ds-textMuted font-mono">
                    Threshold: {form.tab_switch_threshold} · Action: {form.tab_switch_action === 'auto_submit' ? 'Auto-submit' : 'Flag for review'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TestDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [statusSaving, setStatusSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dragIdx = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/admin/tests/${id}`);
      const d = await r.json();
      if (!r.ok) { router.push('/admin/tests'); return; }
      setTest(d.test);
      setQuestions(d.test.test_questions || []);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (newStatus) => {
    if (newStatus === 'published' && questions.length === 0) {
      alert('Add at least one question before publishing.');
      return;
    }
    setStatusSaving(true);
    await fetch(`/api/v1/admin/tests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setTest(t => ({ ...t, status: newStatus }));
    setStatusSaving(false);
  };

  const handleDragStart = (idx) => { dragIdx.current = idx; };
  const handleDragOver  = () => {};
  const handleDrop = async (dropIdx) => {
    if (dragIdx.current === null || dragIdx.current === dropIdx) return;
    const newOrder = [...questions];
    const [moved] = newOrder.splice(dragIdx.current, 1);
    newOrder.splice(dropIdx, 0, moved);
    const reordered = newOrder.map((q, i) => ({ ...q, position: i }));
    setQuestions(reordered);
    dragIdx.current = null;
    await fetch(`/api/v1/admin/tests/${id}/questions/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map(q => ({ id: q.id, position: q.position })) }),
    });
  };

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-ds-border/60 rounded w-80" />
        <div className="h-4 bg-ds-border/40 rounded w-48" />
        <div className="h-px bg-ds-border" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-ds-card border border-ds-border rounded-lg p-4 space-y-2">
            <div className="h-4 bg-ds-border/60 rounded w-3/4" />
            <div className="h-3 bg-ds-border/40 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!test) return null;

  const isPublished = test.status === 'published';
  const isArchived  = test.status === 'archived';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/tests" className="text-ds-textMuted hover:text-ds-text transition-colors mt-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ds-text font-heading">{test.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${
                test.status === 'published' ? 'bg-ds-successLight text-ds-success border-ds-success/30' :
                test.status === 'archived'  ? 'bg-ds-warningLight text-ds-warning border-ds-warning/30' :
                'bg-ds-bg text-ds-textMuted border-ds-border'
              }`}>{test.status}</span>
              {test.timer_enabled && (
                <span className="text-xs text-ds-textMuted">⏱ {test.time_limit_minutes}m</span>
              )}
              {test.job_profiles?.title && (
                <span className="text-xs text-ds-textSecondary">{test.job_profiles.title}</span>
              )}
              <span className="text-xs text-ds-textMuted font-mono">{totalPoints} pts total</span>
            </div>
            <IntegritySummary test={test} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setSettingsOpen(true)}
            className="text-sm border border-ds-border text-ds-textMuted px-3 py-1.5 rounded-btn hover:bg-ds-bg hover:text-ds-text transition-colors">
            Settings
          </button>
          <Link href={`/admin/tests/${id}/links`}
            className="text-sm border border-ds-border text-ds-textMuted px-3 py-1.5 rounded-btn hover:bg-ds-bg hover:text-ds-text transition-colors">
            Links
          </Link>
          <Link href={`/admin/tests/${id}/results`}
            className="text-sm border border-ds-border text-ds-textMuted px-3 py-1.5 rounded-btn hover:bg-ds-bg hover:text-ds-text transition-colors">
            Results
          </Link>
          {!isArchived && (
            <button
              disabled={statusSaving}
              onClick={() => changeStatus(isPublished ? 'archived' : 'published')}
              className={`text-sm px-4 py-1.5 rounded-btn font-medium disabled:opacity-50 transition-colors ${
                isPublished
                  ? 'bg-ds-warning/10 text-ds-warning border border-ds-warning/30 hover:bg-ds-warning/20'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}>
              {statusSaving ? '…' : isPublished ? 'Archive' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ds-textMuted uppercase tracking-wide">
            Questions ({questions.length})
          </h2>
          {!isArchived && (
            <button onClick={() => setShowAdd(true)}
              className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
              + Add Question
            </button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-16 bg-ds-card border border-dashed border-ds-border rounded-lg">
            <p className="text-ds-textMuted text-sm">No questions yet.</p>
            {!isArchived && (
              <button onClick={() => setShowAdd(true)} className="text-primary hover:underline text-sm mt-2 inline-block">
                Add your first question →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                q={q}
                testId={id}
                index={idx}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDelete={(qid) => setQuestions(prev => prev.filter(x => x.id !== qid))}
                onUpdate={(updated) => setQuestions(prev => prev.map(x => x.id === updated.id ? updated : x))}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddQuestionModal
          testId={id}
          onAdd={(q) => setQuestions(prev => [...prev, q])}
          onClose={() => setShowAdd(false)}
        />
      )}

      {settingsOpen && test && (
        <SettingsModal
          test={test}
          onClose={() => setSettingsOpen(false)}
          onSave={(updated) => {
            setTest(t => ({ ...t, ...updated }));
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
