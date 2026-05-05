'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sk } from '@/components/Skeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_LABELS = { mcq: 'MCQ', true_false: 'True/False', short_answer: 'Short Answer' };
const TYPE_COLORS = {
  mcq:          'bg-blue-50   text-blue-700   border-blue-200',
  true_false:   'bg-purple-50 text-purple-700 border-purple-200',
  short_answer: 'bg-teal-50   text-teal-700   border-teal-200',
};

function TypeBadge({ type }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TYPE_COLORS[type] || 'bg-ds-bg text-ds-textMuted border-ds-border'}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────
function PreviewModal({ question, onClose, onDelete }) {
  const [usages, setUsages]       = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [deleteWarn, setDeleteWarn] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/admin/question-library/${question.id}`)
      .then(r => r.json())
      .then(d => setUsages(d.usages || []))
      .catch(() => setUsages([]));
  }, [question.id]);

  const handleDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/v1/admin/question-library/${question.id}`, { method: 'DELETE' });
    const d = await r.json();
    if (!r.ok && d.error === 'USED_IN_PUBLISHED') {
      setDeleteWarn(d);
      setDeleting(false);
      return;
    }
    if (r.ok) { onDelete(question.id); onClose(); }
    setDeleting(false);
  };

  const handleForceDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/v1/admin/question-library/${question.id}?force=true`, { method: 'DELETE' });
    if (r.ok) { onDelete(question.id); onClose(); }
    setDeleting(false);
  };

  const correctOpt = question.question_library_options?.find(o => o.is_correct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-ds-card border-b border-ds-border px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeBadge type={question.type} />
            {question.ai_generated && (
              <span className="text-xs px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 font-medium">AI</span>
            )}
            <span className="text-xs text-ds-textMuted font-mono">{question.points}pt</span>
          </div>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm font-medium text-ds-text leading-relaxed">{question.question_text}</p>

          {question.type === 'mcq' && (
            <div className="space-y-1.5">
              {(question.question_library_options || []).map(opt => (
                <div key={opt.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded border ${
                  opt.is_correct ? 'bg-ds-successLight text-ds-success border-ds-success/30' : 'bg-ds-bg text-ds-textMuted border-ds-border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.is_correct ? 'bg-ds-success' : 'bg-ds-border'}`} />
                  {opt.option_text}
                </div>
              ))}
            </div>
          )}

          {question.type === 'true_false' && correctOpt && (
            <p className="text-sm text-ds-textMuted">
              Correct answer: <span className="font-semibold text-ds-success">{correctOpt.option_text}</span>
            </p>
          )}

          {question.type === 'short_answer' && (
            <p className="text-xs text-ds-textMuted italic bg-ds-bg border border-ds-border rounded px-3 py-2">
              Manual grading required
            </p>
          )}

          {question.skill_tag && (
            <p className="text-xs text-ds-textMuted">Skill: <span className="font-medium text-ds-text">{question.skill_tag}</span></p>
          )}

          {/* Usage */}
          <div className="border-t border-ds-border pt-3">
            <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">Used in tests</p>
            {usages === null ? (
              <Sk className="h-4 w-40" />
            ) : usages.length === 0 ? (
              <p className="text-xs text-ds-textMuted">Not used in any test yet.</p>
            ) : (
              <ul className="space-y-1">
                {usages.map(u => (
                  <li key={u.test_id} className="text-xs flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded border text-xs ${
                      u.tests?.status === 'published' ? 'bg-ds-successLight text-ds-success border-ds-success/30' : 'bg-ds-bg text-ds-textMuted border-ds-border'
                    }`}>{u.tests?.status}</span>
                    <span className="text-ds-text">{u.tests?.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Delete warning */}
          {deleteWarn && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 rounded px-4 py-3 space-y-2">
              <p className="text-sm text-ds-danger font-medium">{deleteWarn.message}</p>
              <div className="flex gap-2">
                <button onClick={handleForceDelete} disabled={deleting}
                  className="text-xs bg-ds-danger text-white px-3 py-1.5 rounded-btn font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                  Delete Anyway
                </button>
                <button onClick={() => setDeleteWarn(null)}
                  className="text-xs px-3 py-1.5 rounded-btn text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!deleteWarn && (
            <div className="flex justify-end pt-1">
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs text-ds-danger hover:underline disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete question'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create question modal ────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [type, setType]   = useState('mcq');
  const [form, setForm]   = useState({ question_text: '', points: 1, skill_tag: '', topic: '' });
  const [options, setOptions] = useState([
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState('true');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCorrect = (i) => setOptions(p => p.map((o, idx) => ({ ...o, is_correct: idx === i })));
  const updateOpt  = (i, v) => setOptions(p => p.map((o, idx) => idx === i ? { ...o, option_text: v } : o));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question_text.trim()) { setError('Question text is required'); return; }
    if (type === 'mcq') {
      if (options.filter(o => o.option_text.trim()).length < 2) { setError('At least 2 options required'); return; }
      if (!options.some(o => o.is_correct && o.option_text.trim())) { setError('Mark at least one correct answer'); return; }
    }
    setSaving(true); setError('');
    try {
      const body = { ...form, type, points: parseInt(form.points) || 1 };
      if (type === 'mcq') body.options = options.filter(o => o.option_text.trim());
      if (type === 'true_false') body.correct_answer = correctAnswer;

      const r = await fetch('/api/v1/admin/question-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to create');
      onCreate(d.question);
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
          <h2 className="font-heading font-bold text-ds-text">New Library Question</h2>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">Type</label>
            <div className="flex gap-2">
              {[['mcq','MCQ'],['true_false','True/False'],['short_answer','Short Answer']].map(([v,l]) => (
                <button key={v} type="button" onClick={() => setType(v)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${type === v ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ds-text mb-1.5">Question <span className="text-ds-danger">*</span></label>
            <textarea value={form.question_text} onChange={e => set('question_text', e.target.value)}
              rows={3} placeholder="Enter question text…"
              className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder-ds-textMuted" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">Points</label>
              <input type="number" min="0" max="100" value={form.points} onChange={e => set('points', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">Skill Tag</label>
              <input value={form.skill_tag} onChange={e => set('skill_tag', e.target.value)} placeholder="e.g. React"
                className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">Topic</label>
              <input value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. Hooks"
                className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted" />
            </div>
          </div>

          {type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium text-ds-text mb-2">Options <span className="text-ds-textMuted text-xs">(click circle = correct)</span></label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button type="button" onClick={() => setCorrect(i)}
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${opt.is_correct ? 'border-primary bg-primary' : 'border-ds-border'}`} />
                    <input value={opt.option_text} onChange={e => updateOpt(i, e.target.value)} placeholder={`Option ${i+1}`}
                      className="flex-1 px-3 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-1 focus:ring-primary placeholder-ds-textMuted" />
                    {options.length > 2 && (
                      <button type="button" onClick={() => setOptions(p => p.filter((_,idx) => idx !== i))}
                        className="text-ds-textMuted hover:text-ds-danger text-base leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button type="button" onClick={() => setOptions(p => [...p, { option_text: '', is_correct: false }])}
                  className="text-xs text-primary hover:underline mt-2 inline-block">+ Add option</button>
              )}
            </div>
          )}

          {type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-ds-text mb-2">Correct Answer</label>
              <div className="flex gap-3">
                {[['true','True'],['false','False']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setCorrectAnswer(v)}
                    className={`flex-1 py-2 text-sm rounded border transition-colors font-medium ${correctAnswer === v ? 'border-primary bg-primary/10 text-primary' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'short_answer' && (
            <div className="bg-ds-bg border border-ds-border rounded px-4 py-3 text-xs text-ds-textMuted">
              Short answer questions require manual grading.
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save to Library'}
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

// ─── AI Generate modal ────────────────────────────────────────────────────────
function AIGenerateModal({ onClose, onSaved }) {
  const [step, setStep]       = useState('input'); // input | generating | review | saving
  const [inputType, setInputType] = useState('skills');
  const [input, setInput]     = useState('');
  const [count, setCount]     = useState(10);
  const [types, setTypes]     = useState(['mcq', 'true_false']);
  const [questions, setQuestions] = useState([]);
  const [accepted, setAccepted]   = useState(new Set());
  const [edited, setEdited]       = useState({}); // id(index) → edited question
  const [error, setError]     = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [genInfo, setGenInfo] = useState(null);

  const toggleType = (t) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const generate = async () => {
    if (!input.trim()) { setError('Please enter skills or paste content.'); return; }
    if (!types.length) { setError('Select at least one question type.'); return; }
    setError(''); setStep('generating');
    try {
      const r = await fetch('/api/v1/admin/question-library/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_type: inputType, input, count, types }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setStep('input'); return; }
      setQuestions(d.questions);
      setAccepted(new Set(d.questions.map((_, i) => i)));
      setEdited({});
      setGenInfo({ requested: d.requested, generated: d.generated });
      setStep('review');
    } catch {
      setError('Question generation failed. Please try again.');
      setStep('input');
    }
  };

  const save = async () => {
    const toSave = questions
      .map((q, i) => edited[i] ? { ...q, ...edited[i] } : q)
      .filter((_, i) => accepted.has(i))
      .map(q => ({ ...q, ai_generated: true }));

    if (!toSave.length) { setError('No questions selected. Please select at least one question to save.'); return; }

    setStep('saving');
    try {
      const r = await fetch('/api/v1/admin/question-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: toSave }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to save questions.'); setStep('review'); return; }
      setSaveMsg(`${d.questions.length} question${d.questions.length !== 1 ? 's' : ''} added to the Question Library.`);
      onSaved(d.questions);
      onClose();
    } catch {
      setError('Failed to save questions to the library. Please try again.');
      setStep('review');
    }
  };

  const toggleAccept = (i) => setAccepted(prev => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ds-border flex-shrink-0">
          <h2 className="font-heading font-bold text-ds-text">
            {step === 'review' ? `Review Generated Questions` : 'AI Generate Questions'}
          </h2>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text text-xl leading-none">×</button>
        </div>

        {/* Input step */}
        {step === 'input' && (
          <div className="p-5 space-y-5 overflow-y-auto">
            {error && <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-ds-text mb-2">Input Method</label>
              <div className="flex gap-2">
                {[['skills','Enter Skills'],['content','Paste Content']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setInputType(v)}
                    className={`text-sm px-4 py-2 rounded border transition-colors ${inputType === v ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {inputType === 'skills' ? (
              <div>
                <label className="block text-sm font-medium text-ds-text mb-1.5">Skills / Keywords</label>
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="e.g. React, useEffect, state management, hooks"
                  className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted" />
                <p className="text-xs text-ds-textMuted mt-1">Separate multiple skills with commas</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-ds-text mb-1.5">Paste Content</label>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  rows={6} placeholder="Paste notes, documentation, or article text here…"
                  maxLength={10000}
                  className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted resize-none" />
                <p className="text-xs text-ds-textMuted mt-1">{input.length}/10,000 characters</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ds-text mb-1.5">Number of Questions</label>
                <input type="number" min="1" max="50" value={count} onChange={e => setCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-xs text-ds-textMuted mt-1">1–50 questions</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-text mb-1.5">Question Types</label>
                <div className="space-y-1.5">
                  {[['mcq','Multiple Choice'],['true_false','True/False'],['short_answer','Short Answer']].map(([v,l]) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={types.includes(v)} onChange={() => toggleType(v)} className="accent-primary" />
                      <span className="text-sm text-ds-text">{l}</span>
                    </label>
                  ))}
                </div>
                {!types.length && <p className="text-xs text-ds-danger mt-1">Select at least one type</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={generate} disabled={!types.length || !input.trim()}
                className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
                Generate →
              </button>
              <button onClick={onClose}
                className="px-5 py-2 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Generating step */}
        {step === 'generating' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ds-textMuted">Generating {count} question{count !== 1 ? 's' : ''}…</p>
          </div>
        )}

        {/* Saving step */}
        {step === 'saving' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ds-textMuted">Saving to library…</p>
          </div>
        )}

        {/* Review step */}
        {step === 'review' && (
          <>
            <div className="px-5 py-3 border-b border-ds-border flex items-center justify-between flex-shrink-0 bg-ds-bg/50">
              <div className="flex items-center gap-3">
                <span className="text-sm text-ds-text">
                  <span className="font-semibold">{accepted.size}</span> of {questions.length} selected
                </span>
                {genInfo && genInfo.generated < genInfo.requested && (
                  <span className="text-xs text-ds-warning bg-ds-warningLight border border-ds-warning/30 px-2 py-0.5 rounded">
                    Generated {genInfo.generated} of {genInfo.requested} requested
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAccepted(new Set(questions.map((_,i)=>i)))}
                  className="text-xs text-primary hover:underline">Select all</button>
                <span className="text-ds-textMuted">·</span>
                <button onClick={() => setAccepted(new Set())}
                  className="text-xs text-primary hover:underline">Deselect all</button>
              </div>
            </div>

            {error && (
              <div className="mx-5 mt-3 bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2">{error}</div>
            )}

            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {questions.map((q, i) => {
                const current = edited[i] ? { ...q, ...edited[i] } : q;
                const isOn = accepted.has(i);
                return (
                  <ReviewCard
                    key={i}
                    question={current}
                    accepted={isOn}
                    onToggle={() => toggleAccept(i)}
                    onEdit={(patch) => setEdited(prev => ({ ...prev, [i]: { ...(prev[i] || {}), ...patch } }))}
                  />
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-ds-border flex items-center justify-between flex-shrink-0">
              <button onClick={() => { setStep('input'); setError(''); }}
                className="text-sm text-ds-textMuted hover:text-ds-text transition-colors">← Back</button>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="px-4 py-2 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
                  Cancel
                </button>
                <button onClick={save} disabled={!accepted.size}
                  className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
                  Save {accepted.size} to Library
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ question, accepted, onToggle, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(null);

  const startEdit = () => {
    setDraft({
      question_text: question.question_text,
      options: question.options ? question.options.map(o => ({ ...o })) : [],
      correct_answer: question.correct_answer,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    onEdit(draft);
    setEditing(false);
  };

  const setCorrect = (i) => setDraft(d => ({ ...d, options: d.options.map((o, idx) => ({ ...o, is_correct: idx === i })) }));

  const correctOpt = question.options?.find(o => o.is_correct);

  return (
    <div className={`border rounded-lg p-4 transition-colors ${accepted ? 'border-ds-border bg-ds-card' : 'border-ds-border bg-ds-bg opacity-50'}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={accepted} onChange={onToggle} className="mt-0.5 accent-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeBadge type={question.type} />
            <span className="text-xs text-ds-textMuted font-mono">{question.points || 1}pt</span>
            {!editing && (
              <button onClick={startEdit} className="ml-auto text-xs text-primary hover:underline flex-shrink-0">Edit</button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea value={draft.question_text} onChange={e => setDraft(d => ({ ...d, question_text: e.target.value }))}
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" />

              {question.type === 'mcq' && (
                <div className="space-y-1.5">
                  {(draft.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button type="button" onClick={() => setCorrect(i)}
                        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${opt.is_correct ? 'border-primary bg-primary' : 'border-ds-border'}`} />
                      <input value={opt.option_text} onChange={e => setDraft(d => ({ ...d, options: d.options.map((o,idx) => idx===i?{...o,option_text:e.target.value}:o) }))}
                        className="flex-1 px-2 py-1 text-xs border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'true_false' && (
                <div className="flex gap-2">
                  {[['true','True'],['false','False']].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => setDraft(d => ({ ...d, correct_answer: v }))}
                      className={`px-4 py-1 text-xs rounded border transition-colors ${draft.correct_answer === v ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={saveEdit} className="text-xs bg-primary text-white px-3 py-1 rounded-btn font-medium">Save</button>
                <button onClick={() => setEditing(false)} className="text-xs text-ds-textMuted border border-ds-border px-3 py-1 rounded-btn">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-ds-text">{question.question_text}</p>
              {question.type === 'mcq' && (
                <div className="flex flex-wrap gap-1.5">
                  {(question.options || []).map((opt, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded border ${opt.is_correct ? 'bg-ds-successLight text-ds-success border-ds-success/30' : 'bg-ds-bg text-ds-textMuted border-ds-border'}`}>
                      {opt.option_text}
                    </span>
                  ))}
                </div>
              )}
              {question.type === 'true_false' && (
                <p className="text-xs text-ds-textMuted">
                  Correct: <span className="font-medium text-ds-success capitalize">{question.correct_answer}</span>
                </p>
              )}
              {question.type === 'short_answer' && question.expected_answer && (
                <p className="text-xs text-ds-textMuted italic">Expected: {question.expected_answer}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function QuestionLibrary() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterAI, setFilterAI]       = useState('');
  const [skillTags, setSkillTags] = useState([]);
  const [preview, setPreview]     = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [toast, setToast]         = useState('');
  const limit = 50;
  const searchTimeout = useRef(null);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: p, limit });
      if (search)      params.set('search', search);
      if (filterType)  params.set('type', filterType);
      if (filterSkill) params.set('skill_tag', filterSkill);
      if (filterAI)    params.set('ai_generated', filterAI);

      const r = await fetch(`/api/v1/admin/question-library?${params}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setQuestions(d.questions);
      setTotal(d.total);
      setSkillTags(d.skillTags || []);
    } catch {
      setLoadError('Unable to load the question library. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterSkill, filterAI]);

  useEffect(() => { load(page); }, [page, filterType, filterSkill, filterAI]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); load(1); }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ds-success text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ds-text font-heading">Question Library</h1>
          <p className="text-sm text-ds-textMuted mt-0.5">
            {loading ? 'Loading…' : `${total} question${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGenerate(true)}
            className="text-sm border border-primary text-primary px-3 py-1.5 rounded-btn font-medium hover:bg-primary/5 transition-colors flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
            AI Generate
          </button>
          <button onClick={() => setShowCreate(true)}
            className="text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
            + New Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search questions…"
          className="flex-1 min-w-52 px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted"
        />
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All types</option>
          <option value="mcq">MCQ</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
        </select>
        {skillTags.length > 0 && (
          <select value={filterSkill} onChange={e => { setFilterSkill(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All skills</option>
            {skillTags.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select value={filterAI} onChange={e => { setFilterAI(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All sources</option>
          <option value="true">AI-generated</option>
          <option value="false">Manual</option>
        </select>
      </div>

      {/* Error */}
      {loadError && (
        <div className="bg-ds-dangerLight border border-ds-danger/30 rounded-lg px-4 py-4 flex items-center justify-between">
          <p className="text-sm text-ds-danger">{loadError}</p>
          <button onClick={() => load(page)} className="text-sm text-ds-danger font-medium hover:underline">Retry</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg px-4 py-3.5 flex items-center gap-3">
              <Sk className="h-4 w-14 rounded" />
              <Sk className="flex-1 h-4" />
              <Sk className="h-4 w-20 rounded" />
              <Sk className="h-7 w-16 rounded-btn" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 bg-ds-card border border-dashed border-ds-border rounded-lg">
          {search || filterType || filterSkill || filterAI ? (
            <p className="text-ds-textMuted text-sm">No questions found matching your search.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-ds-textMuted text-sm">No questions in the library yet. Create your first question to get started.</p>
              <button onClick={() => setShowCreate(true)} className="text-primary hover:underline text-sm">
                Create your first question →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id}
              className="bg-ds-card border border-ds-border rounded-lg px-4 py-3.5 hover:border-ds-borderStrong transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  <TypeBadge type={q.type} />
                  {q.ai_generated && (
                    <span className="text-xs px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">AI</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ds-text leading-snug line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {q.skill_tag && (
                      <span className="text-xs text-ds-textMuted bg-ds-bg border border-ds-border px-1.5 py-0.5 rounded">{q.skill_tag}</span>
                    )}
                    <span className="text-xs text-ds-textMuted font-mono">{q.points}pt</span>
                  </div>
                </div>
                <button onClick={() => setPreview(q)}
                  className="text-xs px-3 py-1.5 border border-ds-border text-ds-textMuted rounded-btn hover:bg-ds-bg hover:text-ds-text transition-colors flex-shrink-0">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-ds-textMuted">{total} question{total !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
              ← Prev
            </button>
            <span className="text-xs px-3 py-1.5 text-ds-textMuted">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {preview && (
        <PreviewModal
          question={preview}
          onClose={() => setPreview(null)}
          onDelete={(id) => { setQuestions(prev => prev.filter(q => q.id !== id)); setTotal(t => t - 1); }}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(q) => { setQuestions(prev => [q, ...prev]); setTotal(t => t + 1); showToast('Question added to library.'); }}
        />
      )}
      {showGenerate && (
        <AIGenerateModal
          onClose={() => setShowGenerate(false)}
          onSaved={(qs) => {
            setQuestions(prev => [...qs, ...prev]);
            setTotal(t => t + qs.length);
            showToast(`${qs.length} question${qs.length !== 1 ? 's' : ''} added to the Question Library.`);
          }}
        />
      )}
    </div>
  );
}
