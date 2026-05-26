'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeading } from '@/components/admin/PageHeading';

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY   = '#185FA5';
const TEXT      = '#2C2C2A';
const MUTED     = '#6B7280';
const BORDER    = '#D1DCE8';
const BG        = '#F4F8FC';
const DANGER    = '#D93025';
const SUCCESS   = '#1D9E75';

// ─── Type chip styles ─────────────────────────────────────────────────────────
const TYPE_CHIP = {
  mcq:          { bg:'#E6F1FB', color:'#185FA5', border:'rgba(24,95,165,0.20)',  label:'MCQ'   },
  true_false:   { bg:'#D1FAE5', color:'#1D9E75', border:'rgba(29,158,117,0.20)', label:'T/F'   },
  short_answer: { bg:'#EDE9FE', color:'#7C3AED', border:'rgba(139,92,246,0.20)', label:'Short' },
};

const DIFFICULTY_CHIP = {
  easy:   { bg:'#D1FAE5', color:'#1D9E75', border:'rgba(29,158,117,0.20)',   label:'Easy'   },
  medium: { bg:'#FEF3C7', color:'#B45309', border:'rgba(245,158,11,0.20)',   label:'Medium' },
  hard:   { bg:'#FEE2E2', color:'#D93025', border:'rgba(217,48,37,0.20)',    label:'Hard'   },
};

const SOURCE_CHIPS = {
  skill:  { label:'Skill',  icon:'◎', bg:'#E6F1FB', color:'#185FA5', border:'rgba(24,95,165,0.20)'  },
  manual: { label:'Manual', icon:'✎', bg:'#F3F4F6', color:'#6B7280', border:'#D1DCE8'               },
  ai:     { label:'AI',     icon:'✦', bg:'#EDE9FE', color:'#7C3AED', border:'rgba(139,92,246,0.20)' },
  jd:     { label:'JD',     icon:'◉', bg:'#FEF3C7', color:'#B45309', border:'rgba(245,158,11,0.20)' },
};

const SKILL_STYLE_MAP = {
  'React':         { bg:'#FEF3C7', color:'#B45309' },
  'JavaScript':    { bg:'#FEF3C7', color:'#B45309' },
  'TypeScript':    { bg:'#E6F1FB', color:'#185FA5' },
  'Python':        { bg:'#D1FAE5', color:'#1D9E75' },
  'SQL':           { bg:'#F3F4F6', color:'#6B7280' },
  'System Design': { bg:'#E0E7FF', color:'#4338CA' },
};

function getSkillStyle(skill) {
  return SKILL_STYLE_MAP[skill] || { bg:'#F4F8FC', color:'#6B7280' };
}

function deriveSource(q) {
  if (!q.ai_generated && q.source !== 'ai-generated') return 'manual';
  if (q.generated_for === 'skills') return 'skill';
  if (q.generated_for === 'jd')     return 'jd';
  return 'ai';
}

// ─── Shared pill chip ─────────────────────────────────────────────────────────
function Chip({ bg, color, border, children, style }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      borderRadius:9999, padding:'3px 10px',
      fontSize:11, fontWeight:600, whiteSpace:'nowrap',
      background:bg, color, border:`1px solid ${border}`,
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─── DIFFICULTY LABELS helper ─────────────────────────────────────────────────
const DIFFICULTY_LABELS = { easy:'Easy', medium:'Medium', hard:'Hard' };

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ question, onClose, onDelete, onSuppressToggle }) {
  const [usages, setUsages]           = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [suppressing, setSuppressing] = useState(false);
  const [deleteWarn, setDeleteWarn]   = useState(null);
  const [localApproved, setLocalApproved] = useState(question.is_approved !== false);

  useEffect(() => {
    fetch(`/api/v1/admin/question-library/${question.id}`)
      .then(r => r.json())
      .then(d => setUsages(d.usages || []))
      .catch(() => setUsages([]));
  }, [question.id]);

  const handleDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/v1/admin/question-library/${question.id}`, { method:'DELETE' });
    const d = await r.json();
    if (!r.ok && d.error === 'USED_IN_PUBLISHED') { setDeleteWarn(d); setDeleting(false); return; }
    if (r.ok) { onDelete(question.id); onClose(); }
    setDeleting(false);
  };

  const handleForceDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/v1/admin/question-library/${question.id}?force=true`, { method:'DELETE' });
    if (r.ok) { onDelete(question.id); onClose(); }
    setDeleting(false);
  };

  const handleSuppressToggle = async () => {
    setSuppressing(true);
    const action = localApproved ? 'suppress' : 'approve';
    const r = await fetch(`/api/v1/admin/question-library/${question.id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ action }),
    });
    if (r.ok) {
      const next = !localApproved;
      setLocalApproved(next);
      onSuppressToggle?.(question.id, next);
    }
    setSuppressing(false);
  };

  const correctOpt = question.question_library_options?.find(o => o.is_correct);
  const tc = TYPE_CHIP[question.type] || { bg:BG, color:MUTED, border:BORDER, label: question.type };
  const dc = DIFFICULTY_CHIP[question.difficulty];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.50)' }} onClick={onClose} />
      <div style={{ position:'relative', background:'white', border:`1px solid ${BORDER}`, borderRadius:12, boxShadow:'0 20px 60px rgba(0,0,0,0.20)', width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ position:'sticky', top:0, background:'white', borderBottom:`1px solid ${BORDER}`, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <Chip bg={tc.bg} color={tc.color} border={tc.border}>{tc.label}</Chip>
            {dc && <Chip bg={dc.bg} color={dc.color} border={dc.border}>{dc.label}</Chip>}
            {!localApproved && <Chip bg='#F3F4F6' color='#6B7280' border='#D1DCE8'>Suppressed</Chip>}
            <span style={{ fontSize:12, color:MUTED, fontFamily:'monospace' }}>{question.points}pt</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, lineHeight:1, color:MUTED, cursor:'pointer', padding:'0 2px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          <p style={{ fontSize:14, fontWeight:500, color:TEXT, lineHeight:'1.6', margin:0 }}>{question.question_text}</p>

          {question.type === 'mcq' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {(question.question_library_options || []).map(opt => (
                <div key={opt.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  fontSize:13, padding:'8px 12px', borderRadius:8,
                  background: opt.is_correct ? '#D1FAE5' : BG,
                  color: opt.is_correct ? SUCCESS : MUTED,
                  border: `1px solid ${opt.is_correct ? 'rgba(29,158,117,0.30)' : BORDER}`,
                }}>
                  <span style={{ width:6, height:6, borderRadius:9999, flexShrink:0, background: opt.is_correct ? SUCCESS : BORDER }} />
                  {opt.option_text}
                </div>
              ))}
            </div>
          )}

          {question.type === 'true_false' && correctOpt && (
            <p style={{ fontSize:13, color:MUTED, margin:0 }}>
              Correct answer: <span style={{ fontWeight:600, color:SUCCESS }}>{correctOpt.option_text}</span>
            </p>
          )}

          {question.type === 'short_answer' && (
            <p style={{ fontSize:12, color:MUTED, fontStyle:'italic', background:BG, border:`1px solid ${BORDER}`, borderRadius:8, padding:'8px 12px', margin:0 }}>
              Manual grading required
            </p>
          )}

          {question.skill_tag && (
            <p style={{ fontSize:12, color:MUTED, margin:0 }}>
              Skill: <span style={{ fontWeight:600, color:TEXT }}>{question.skill_tag}</span>
            </p>
          )}

          {/* Suppress toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={handleSuppressToggle} disabled={suppressing} style={{
              fontSize:12, padding:'6px 12px', borderRadius:8,
              border: localApproved ? `1px solid ${BORDER}` : `1px solid ${SUCCESS}`,
              color: localApproved ? MUTED : SUCCESS,
              background: 'transparent', cursor:'pointer', opacity: suppressing ? 0.5 : 1,
            }}>
              {suppressing ? '…' : localApproved ? 'Suppress' : 'Re-approve'}
            </button>
          </div>

          {/* Used in tests */}
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:12 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:MUTED, marginBottom:8, marginTop:0 }}>Used in tests</p>
            {usages === null ? (
              <div style={{ height:14, width:160, borderRadius:6, background:'#E5E7EB' }} />
            ) : usages.length === 0 ? (
              <p style={{ fontSize:12, color:MUTED, margin:0 }}>Not used in any test yet.</p>
            ) : (
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:4 }}>
                {usages.map(u => (
                  <li key={u.test_id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                    <span style={{
                      padding:'2px 6px', borderRadius:6, fontSize:11,
                      background: u.tests?.status === 'published' ? '#D1FAE5' : BG,
                      color:      u.tests?.status === 'published' ? SUCCESS  : MUTED,
                      border:`1px solid ${u.tests?.status === 'published' ? 'rgba(29,158,117,0.30)' : BORDER}`,
                    }}>{u.tests?.status}</span>
                    <span style={{ color:TEXT }}>{u.tests?.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Delete warning */}
          {deleteWarn && (
            <div style={{ background:'#FEE2E2', border:`1px solid rgba(217,48,37,0.30)`, borderRadius:8, padding:'12px 16px' }}>
              <p style={{ fontSize:13, color:DANGER, fontWeight:500, marginBottom:10 }}>{deleteWarn.message}</p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleForceDelete} disabled={deleting} style={{ fontSize:12, background:DANGER, color:'white', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', opacity:deleting?0.5:1 }}>
                  Delete Anyway
                </button>
                <button onClick={()=>setDeleteWarn(null)} style={{ fontSize:12, background:'transparent', border:`1px solid ${BORDER}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', color:MUTED }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!deleteWarn && (
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button onClick={handleDelete} disabled={deleting} style={{ fontSize:12, color:DANGER, background:'none', border:'none', cursor:'pointer', opacity:deleting?0.5:1, textDecoration:'underline' }}>
                {deleting ? 'Deleting…' : 'Delete question'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI Generate Modal (preserved from original) ──────────────────────────────
function AIGenerateModal({ onClose, onSaved }) {
  const [step, setStep]           = useState('input');
  const [inputType, setInputType] = useState('skills');
  const [input, setInput]         = useState('');
  const [count, setCount]         = useState(10);
  const [types, setTypes]         = useState(['mcq', 'true_false']);
  const [difficultyMode, setDifficultyMode] = useState('single');
  const [difficulty, setDifficulty]         = useState(null);
  const [distribution, setDistribution]     = useState({ easy:0, medium:0, hard:0 });
  const [questions, setQuestions] = useState([]);
  const [accepted, setAccepted]   = useState(new Set());
  const [edited, setEdited]       = useState({});
  const [error, setError]         = useState('');
  const [genInfo, setGenInfo]     = useState(null);

  const toggleType = (t) => setTypes(prev => prev.includes(t) ? prev.filter(x => x!==t) : [...prev, t]);

  const switchMode = (mode) => {
    if (mode === difficultyMode) return;
    const hasValues = difficultyMode === 'single' ? !!difficulty : Object.values(distribution).some(v => v > 0);
    if (hasValues && !window.confirm('Switch difficulty mode? Your current selections will be cleared.')) return;
    setDifficultyMode(mode); setDifficulty(null); setDistribution({ easy:0, medium:0, hard:0 });
  };

  const distTotal   = Object.values(distribution).reduce((s,v) => s + (parseInt(v)||0), 0);
  const mixedValid  = distTotal === count && distTotal > 0;
  const mixedError  = distTotal > 0 && distTotal !== count
    ? `Total (${distTotal}) must equal the requested count (${count})`
    : distTotal === 0 && difficultyMode === 'mixed' ? 'Enter at least one difficulty count' : '';

  const canGenerate = types.length > 0 && !!input.trim() && (difficultyMode === 'single' ? !!difficulty : mixedValid);

  const generate = async () => {
    if (!input.trim()) { setError('Please enter skills or paste content.'); return; }
    if (!types.length) { setError('Select at least one question type.'); return; }
    if (difficultyMode === 'single' && !difficulty) { setError('Select a difficulty level.'); return; }
    if (difficultyMode === 'mixed' && !mixedValid) { setError(mixedError || 'Distribution total must equal requested count.'); return; }
    setError(''); setStep('generating');
    try {
      const body = { input_type:inputType, input, count, types, difficulty_mode:difficultyMode };
      if (difficultyMode === 'single') body.difficulty = difficulty;
      else body.distribution = distribution;
      const r = await fetch('/api/v1/admin/question-library/generate', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setStep('input'); return; }
      setQuestions(d.questions);
      setAccepted(new Set(d.questions.map((_,i) => i)));
      setEdited({});
      setGenInfo({ requested:d.requested, generated:d.generated, difficultyMode, difficulty, actualDistribution:d.actualDistribution, shortfalls:d.shortfalls });
      setStep('review');
    } catch {
      setError('Question generation failed. Please try again.'); setStep('input');
    }
  };

  const save = async () => {
    const toSave = questions.map((q,i) => edited[i] ? {...q,...edited[i]} : q).filter((_,i) => accepted.has(i)).map(q => ({...q, ai_generated:true}));
    if (!toSave.length) { setError('No questions selected. Please select at least one question to save.'); return; }
    setStep('saving');
    try {
      const r = await fetch('/api/v1/admin/question-library', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ questions:toSave }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to save questions.'); setStep('review'); return; }
      onSaved(d.questions); onClose();
    } catch {
      setError('Failed to save questions to the library. Please try again.'); setStep('review');
    }
  };

  const toggleAccept = (i) => setAccepted(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const inputBtnStyle = (active) => ({
    fontSize:13, padding:'8px 16px', borderRadius:8, cursor:'pointer',
    border: active ? `1px solid ${PRIMARY}` : `1px solid ${BORDER}`,
    background: active ? 'rgba(24,95,165,0.08)' : 'white',
    color: active ? PRIMARY : MUTED, fontWeight: active ? 600 : 400,
    transition:'all 150ms ease',
  });

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.50)' }} onClick={onClose} />
      <div style={{ position:'relative', background:'white', border:`1px solid ${BORDER}`, borderRadius:12, boxShadow:'0 20px 60px rgba(0,0,0,0.20)', width:'100%', maxWidth:640, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'18px 20px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:TEXT }}>
            {step === 'review' ? 'Review Generated Questions' : 'AI Generate Questions'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:MUTED, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Input step */}
        {step === 'input' && (
          <div style={{ overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:18 }}>
            {error && <div style={{ background:'#FEE2E2', border:`1px solid rgba(217,48,37,0.30)`, borderRadius:8, padding:'10px 14px', color:DANGER, fontSize:13 }}>{error}</div>}

            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:TEXT, marginBottom:8 }}>Input Method</label>
              <div style={{ display:'flex', gap:8 }}>
                {[['skills','Enter Skills'],['content','Paste Content']].map(([v,l]) => (
                  <button key={v} type="button" onClick={()=>setInputType(v)} style={inputBtnStyle(inputType===v)}>{l}</button>
                ))}
              </div>
            </div>

            {inputType === 'skills' ? (
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:TEXT, marginBottom:6 }}>Skills / Keywords</label>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  placeholder="e.g. React, useEffect, state management, hooks"
                  style={{ width:'100%', height:38, border:`1px solid ${BORDER}`, borderRadius:10, padding:'0 12px', fontSize:14, outline:'none', boxSizing:'border-box' }} />
                <p style={{ fontSize:12, color:MUTED, marginTop:4 }}>Separate multiple skills with commas</p>
              </div>
            ) : (
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:TEXT, marginBottom:6 }}>Paste Content</label>
                <textarea value={input} onChange={e=>setInput(e.target.value)} rows={6}
                  placeholder="Paste notes, documentation, or article text here…" maxLength={10000}
                  style={{ width:'100%', border:`1px solid ${BORDER}`, borderRadius:10, padding:'10px 12px', fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
                <p style={{ fontSize:12, color:MUTED, marginTop:4 }}>{input.length}/10,000 characters</p>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:TEXT, marginBottom:6 }}>Number of Questions</label>
                <input type="number" min="1" max="50" value={count} onChange={e=>setCount(parseInt(e.target.value)||1)}
                  style={{ width:'100%', height:38, border:`1px solid ${BORDER}`, borderRadius:10, padding:'0 12px', fontSize:14, outline:'none', boxSizing:'border-box' }} />
                <p style={{ fontSize:12, color:MUTED, marginTop:4 }}>1–50 questions</p>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:TEXT, marginBottom:8 }}>Question Types</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[['mcq','Multiple Choice'],['true_false','True/False'],['short_answer','Short Answer']].map(([v,l]) => (
                    <label key={v} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:TEXT }}>
                      <input type="checkbox" checked={types.includes(v)} onChange={()=>toggleType(v)} style={{ accentColor:PRIMARY }} />
                      {l}
                    </label>
                  ))}
                </div>
                {!types.length && <p style={{ fontSize:12, color:DANGER, marginTop:4 }}>Select at least one type</p>}
              </div>
            </div>

            {/* Difficulty */}
            <div style={{ border:`1px solid ${BORDER}`, borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <label style={{ fontSize:13, fontWeight:600, color:TEXT }}>Difficulty <span style={{ color:DANGER }}>*</span></label>
                <div style={{ display:'flex', border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden', fontSize:12 }}>
                  {[['single','Single'],['mixed','Mixed']].map(([v,l]) => (
                    <button key={v} type="button" onClick={()=>switchMode(v)} style={{
                      padding:'4px 12px', border:'none', cursor:'pointer', transition:'all 150ms ease',
                      background: difficultyMode===v ? PRIMARY : 'white',
                      color:      difficultyMode===v ? 'white' : MUTED,
                      fontWeight: difficultyMode===v ? 600 : 400,
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              {difficultyMode === 'single' ? (
                <div style={{ display:'flex', gap:8 }}>
                  {[['easy','Easy'],['medium','Medium'],['hard','Hard']].map(([v,l]) => {
                    const chip = DIFFICULTY_CHIP[v];
                    const active = difficulty === v;
                    return (
                      <button key={v} type="button" onClick={()=>setDifficulty(v)} style={{
                        flex:1, padding:'8px 0', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500,
                        border: active ? `1px solid ${chip.color}` : `1px solid ${BORDER}`,
                        background: active ? chip.bg : 'white',
                        color: active ? chip.color : MUTED,
                        transition:'all 150ms ease',
                      }}>{l}</button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[['easy','Easy','#1D9E75'],['medium','Medium','#B45309'],['hard','Hard','#D93025']].map(([v,l,c]) => (
                    <div key={v} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:c, width:60 }}>{l}</span>
                      <input type="number" min="0" max="50" value={distribution[v]}
                        onChange={e=>setDistribution(d=>({...d,[v]:parseInt(e.target.value)||0}))}
                        style={{ width:72, height:34, border:`1px solid ${BORDER}`, borderRadius:8, padding:'0 10px', fontSize:13, outline:'none' }} />
                    </div>
                  ))}
                  <p style={{ fontSize:12, color: mixedValid ? SUCCESS : distTotal>0 ? DANGER : MUTED, marginTop:4 }}>
                    Total: {distTotal} / {count} {mixedValid && '✓'} {mixedError}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={generate} disabled={!canGenerate} style={{
                background: PRIMARY, color:'white', border:'none', borderRadius:10, padding:'10px 20px',
                fontSize:13, fontWeight:600, cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.5,
              }}>Generate →</button>
              <button onClick={onClose} style={{ border:`1px solid ${BORDER}`, borderRadius:10, padding:'10px 18px', fontSize:13, color:MUTED, background:'white', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Generating / Saving spinner */}
        {(step === 'generating' || step === 'saving') && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:40 }}>
            <div style={{ width:40, height:40, border:`2px solid ${PRIMARY}`, borderTopColor:'transparent', borderRadius:9999, animation:'ql-spin 0.7s linear infinite' }} />
            <p style={{ fontSize:13, color:MUTED }}>
              {step === 'generating' ? `Generating ${count} question${count!==1?'s':''}…` : 'Saving to library…'}
            </p>
          </div>
        )}

        {/* Review step */}
        {step === 'review' && (
          <>
            <div style={{ padding:'10px 20px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'rgba(244,248,252,0.6)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:13, color:TEXT }}>
                  <strong>{accepted.size}</strong> of {questions.length} selected
                </span>
                {genInfo?.generated < genInfo?.requested && (
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:9999, background:'#FEF3C7', color:'#B45309', border:'1px solid rgba(245,158,11,0.30)' }}>
                    Generated {genInfo.generated} of {genInfo.requested} requested
                  </span>
                )}
              </div>
              <div style={{ display:'flex', gap:8, fontSize:12 }}>
                <button onClick={()=>setAccepted(new Set(questions.map((_,i)=>i)))} style={{ color:PRIMARY, background:'none', border:'none', cursor:'pointer', fontSize:12 }}>Select all</button>
                <span style={{ color:BORDER }}>·</span>
                <button onClick={()=>setAccepted(new Set())} style={{ color:PRIMARY, background:'none', border:'none', cursor:'pointer', fontSize:12 }}>Deselect all</button>
              </div>
            </div>

            {genInfo?.shortfalls && Object.keys(genInfo.shortfalls).length > 0 && (
              <div style={{ margin:'12px 20px 0', background:'#FEF3C7', border:'1px solid rgba(245,158,11,0.30)', borderRadius:8, padding:'10px 14px' }}>
                {genInfo.difficultyMode === 'single' ? (
                  <p style={{ fontSize:12, color:'#B45309', margin:0, fontWeight:500 }}>
                    We could only generate {genInfo.generated} of {genInfo.requested} {DIFFICULTY_LABELS[genInfo.difficulty]} questions.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize:12, color:'#B45309', margin:'0 0 4px', fontWeight:500 }}>Some difficulty slots could not be fully filled:</p>
                    {Object.entries(genInfo.shortfalls).map(([diff, { requested, generated }]) => (
                      <p key={diff} style={{ fontSize:12, color:'#B45309', margin:0 }}>{DIFFICULTY_LABELS[diff]}: {generated} generated (requested {requested})</p>
                    ))}
                  </>
                )}
              </div>
            )}

            {error && <div style={{ margin:'12px 20px 0', background:'#FEE2E2', border:`1px solid rgba(217,48,37,0.30)`, borderRadius:8, padding:'10px 14px', color:DANGER, fontSize:13 }}>{error}</div>}

            <div style={{ overflowY:'auto', flex:1, padding:20, display:'flex', flexDirection:'column', gap:10 }}>
              {questions.map((q,i) => {
                const current = edited[i] ? {...q,...edited[i]} : q;
                const isOn    = accepted.has(i);
                return (
                  <AIReviewCard key={i} question={current} accepted={isOn}
                    onToggle={()=>toggleAccept(i)}
                    onEdit={(patch)=>setEdited(prev=>({...prev,[i]:{...(prev[i]||{}),...patch}}))} />
                );
              })}
            </div>

            <div style={{ padding:'14px 20px', borderTop:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <button onClick={()=>{ setStep('input'); setError(''); }} style={{ fontSize:13, color:MUTED, background:'none', border:'none', cursor:'pointer' }}>← Back</button>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={onClose} style={{ border:`1px solid ${BORDER}`, borderRadius:10, padding:'8px 16px', fontSize:13, color:MUTED, background:'white', cursor:'pointer' }}>Cancel</button>
                <button onClick={save} disabled={!accepted.size} style={{
                  background:PRIMARY, color:'white', border:'none', borderRadius:10, padding:'8px 18px',
                  fontSize:13, fontWeight:600, cursor: accepted.size ? 'pointer' : 'not-allowed', opacity: accepted.size ? 1 : 0.5,
                }}>Save {accepted.size} to Library</button>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes ql-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AIReviewCard({ question, accepted, onToggle, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(null);

  const startEdit = () => {
    setDraft({ question_text:question.question_text, options: question.options ? question.options.map(o=>({...o})) : [], correct_answer:question.correct_answer });
    setEditing(true);
  };
  const saveEdit  = () => { onEdit(draft); setEditing(false); };
  const tc = TYPE_CHIP[question.type] || { bg:BG, color:MUTED, border:BORDER, label:question.type };
  const dc = DIFFICULTY_CHIP[question.difficulty];

  return (
    <div style={{ border:`1px solid ${BORDER}`, borderRadius:10, padding:14, opacity: accepted ? 1 : 0.45, transition:'opacity 150ms ease' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <input type="checkbox" checked={accepted} onChange={onToggle} style={{ marginTop:2, accentColor:PRIMARY, flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <Chip bg={tc.bg} color={tc.color} border={tc.border}>{tc.label}</Chip>
            {dc && <Chip bg={dc.bg} color={dc.color} border={dc.border}>{dc.label}</Chip>}
            <span style={{ fontSize:12, color:MUTED, fontFamily:'monospace' }}>{question.points||1}pt</span>
            <select value={question.difficulty||''} onChange={e=>onEdit({difficulty:e.target.value||null})} onClick={e=>e.stopPropagation()}
              style={{ marginLeft:'auto', fontSize:12, border:`1px solid ${BORDER}`, borderRadius:6, padding:'2px 6px', color:MUTED, background:'white', outline:'none' }}>
              <option value="">No difficulty</option>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
            {!editing && <button onClick={startEdit} style={{ fontSize:12, color:PRIMARY, background:'none', border:'none', cursor:'pointer' }}>Edit</button>}
          </div>

          {editing ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <textarea value={draft.question_text} onChange={e=>setDraft(d=>({...d,question_text:e.target.value}))} rows={2}
                style={{ width:'100%', border:`1px solid ${BORDER}`, borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
              {question.type === 'mcq' && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {(draft.options||[]).map((opt,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <button type="button" onClick={()=>setDraft(d=>({...d,options:d.options.map((o,idx)=>({...o,is_correct:idx===i}))}))}
                        style={{ width:14, height:14, borderRadius:9999, border:`2px solid ${opt.is_correct?PRIMARY:BORDER}`, background: opt.is_correct?PRIMARY:'white', flexShrink:0, cursor:'pointer', padding:0 }} />
                      <input value={opt.option_text} onChange={e=>setDraft(d=>({...d,options:d.options.map((o,idx)=>idx===i?{...o,option_text:e.target.value}:o)}))}
                        style={{ flex:1, border:`1px solid ${BORDER}`, borderRadius:6, padding:'4px 8px', fontSize:12, outline:'none' }} />
                    </div>
                  ))}
                </div>
              )}
              {question.type === 'true_false' && (
                <div style={{ display:'flex', gap:8 }}>
                  {[['true','True'],['false','False']].map(([v,l]) => (
                    <button key={v} type="button" onClick={()=>setDraft(d=>({...d,correct_answer:v}))} style={{
                      padding:'5px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                      border: draft.correct_answer===v ? `1px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                      background: draft.correct_answer===v ? 'rgba(24,95,165,0.08)' : 'white',
                      color: draft.correct_answer===v ? PRIMARY : MUTED,
                    }}>{l}</button>
                  ))}
                </div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={saveEdit} style={{ fontSize:12, background:PRIMARY, color:'white', border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer' }}>Save</button>
                <button onClick={()=>setEditing(false)} style={{ fontSize:12, border:`1px solid ${BORDER}`, borderRadius:8, padding:'5px 12px', background:'white', color:MUTED, cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <p style={{ fontSize:13, color:TEXT, margin:0 }}>{question.question_text}</p>
              {question.type === 'mcq' && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(question.options||[]).map((opt,i) => (
                    <span key={i} style={{
                      fontSize:11, padding:'2px 8px', borderRadius:9999,
                      background: opt.is_correct ? '#D1FAE5' : BG,
                      color:      opt.is_correct ? SUCCESS : MUTED,
                      border:`1px solid ${opt.is_correct ? 'rgba(29,158,117,0.30)' : BORDER}`,
                    }}>{opt.option_text}</span>
                  ))}
                </div>
              )}
              {question.type === 'true_false' && (
                <p style={{ fontSize:12, color:MUTED, margin:0 }}>Correct: <span style={{ fontWeight:600, color:SUCCESS, textTransform:'capitalize' }}>{question.correct_answer}</span></p>
              )}
              {question.type === 'short_answer' && question.expected_answer && (
                <p style={{ fontSize:12, color:MUTED, fontStyle:'italic', margin:0 }}>Expected: {question.expected_answer}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }) {
  const [tab, setTab]           = useState('csv');
  const [csvRows, setCsvRows]   = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonRows, setJsonRows] = useState(null);
  const [jsonError, setJsonError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef(null);

  const CSV_COLS = ['question_text','question_type','option_a','option_b','option_c','option_d','correct_answer','explanation','skill','topic','difficulty'];

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const header = parseLine(lines[0]);
    return lines.slice(1).map(line => {
      const vals = parseLine(line);
      const row = {};
      header.forEach((h, i) => { row[h.trim().toLowerCase()] = (vals[i] || '').trim(); });
      return row;
    }).filter(r => r.question_text);
  }

  function parseLine(line) {
    const result = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result;
  }

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { const rows = parseCSV(e.target.result); setCsvRows(rows); };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const validateJSON = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) { setJsonError('Must be a JSON array.'); return; }
      setJsonRows(parsed.filter(r => r.question_text));
    } catch {
      setJsonError('Invalid JSON.');
    }
  };

  const rows = tab === 'csv' ? csvRows : jsonRows;

  const handleImport = async () => {
    if (!rows || rows.length === 0) return;
    setImporting(true); setImportError('');
    try {
      const r = await fetch('/api/v1/admin/question-library/import', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ questions:rows }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Import failed');
      onImported(d.questions || [], rows.length);
      onClose();
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const tabStyle = (active) => ({
    fontSize:13, fontWeight: active ? 600 : 400, padding:'8px 16px', cursor:'pointer',
    border:'none', background:'none',
    color: active ? PRIMARY : MUTED,
    borderBottom: active ? `2px solid ${PRIMARY}` : '2px solid transparent',
    marginBottom:-1,
  });

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.50)' }} onClick={onClose} />
      <div style={{ position:'relative', background:'white', border:`1px solid ${BORDER}`, borderRadius:12, boxShadow:'0 20px 60px rgba(0,0,0,0.20)', width:'100%', maxWidth:560, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:TEXT }}>Import Questions</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, color:MUTED, cursor:'pointer' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:`1px solid ${BORDER}`, padding:'0 20px', gap:0 }}>
          <button style={tabStyle(tab==='csv')}  onClick={()=>setTab('csv')}>Upload CSV</button>
          <button style={tabStyle(tab==='json')} onClick={()=>setTab('json')}>Paste JSON</button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          {tab === 'csv' && (
            <>
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={handleDrop}
                onClick={()=>fileRef.current?.click()}
                style={{
                  border:`2px dashed ${dragOver ? PRIMARY : BORDER}`,
                  borderRadius:12, padding:'32px 20px',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:10, cursor:'pointer', background: dragOver ? 'rgba(24,95,165,0.04)' : BG,
                  transition:'all 150ms ease',
                }}>
                <span style={{ fontSize:36 }}>☁</span>
                <p style={{ fontSize:14, color:MUTED, margin:0, textAlign:'center' }}>Drag a CSV file here or click to browse</p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])} />
              </div>
              <p style={{ fontSize:12, color:PRIMARY, margin:0, cursor:'pointer', textDecoration:'underline' }}>
                Download CSV template →
              </p>
              <p style={{ fontSize:11, color:MUTED, margin:0 }}>
                Expected columns: {CSV_COLS.join(', ')}
              </p>
            </>
          )}

          {tab === 'json' && (
            <>
              <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} rows={8}
                placeholder='[{"question_text":"…","question_type":"mcq",…}]'
                style={{ width:'100%', border:`1px solid ${BORDER}`, borderRadius:10, padding:'10px 12px', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
              {jsonError && <p style={{ fontSize:12, color:DANGER, margin:0 }}>{jsonError}</p>}
              <button onClick={validateJSON} style={{ alignSelf:'flex-start', border:`1px solid ${BORDER}`, borderRadius:8, padding:'7px 16px', fontSize:13, color:TEXT, background:'white', cursor:'pointer' }}>
                Validate JSON
              </button>
            </>
          )}

          {/* Preview */}
          {rows && rows.length > 0 && (
            <div style={{ border:`1px solid ${BORDER}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'8px 14px', background:BG, borderBottom:`1px solid ${BORDER}`, fontSize:12, fontWeight:600, color:MUTED }}>
                Preview — first {Math.min(5,rows.length)} of {rows.length} questions
              </div>
              <div style={{ display:'flex', flexDirection:'column', divide:'y', gap:0 }}>
                {rows.slice(0,5).map((r,i) => (
                  <div key={i} style={{ padding:'8px 14px', borderBottom: i<4 ? `1px solid ${BORDER}` : 'none', fontSize:13, color:TEXT }}>
                    {r.question_text || r.text || '(no text)'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {importError && <div style={{ background:'#FEE2E2', border:`1px solid rgba(217,48,37,0.30)`, borderRadius:8, padding:'10px 14px', color:DANGER, fontSize:13 }}>{importError}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ border:`1px solid ${BORDER}`, borderRadius:10, padding:'8px 18px', fontSize:13, color:MUTED, background:'white', cursor:'pointer' }}>Cancel</button>
          <button onClick={handleImport} disabled={!rows || rows.length === 0 || importing} style={{
            background: PRIMARY, color:'white', border:'none', borderRadius:10, padding:'8px 20px',
            fontSize:13, fontWeight:600, cursor: rows?.length && !importing ? 'pointer' : 'not-allowed',
            opacity: rows?.length && !importing ? 1 : 0.5,
          }}>
            {importing ? 'Importing…' : rows ? `Import ${rows.length} Question${rows.length!==1?'s':''}` : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination helpers ───────────────────────────────────────────────────────
function paginate(current, total) {
  if (total <= 7) return Array.from({ length:total }, (_,i) => i+1);
  if (current <= 4) return [1,2,3,4,5,'…',total];
  if (current >= total-3) return [1,'…',total-4,total-3,total-2,total-1,total];
  return [1,'…',current-1,current,current+1,'…',total];
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuestionLibrary() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [questions, setQuestions]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [tab, setTab]               = useState('all');
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSource, setFilterSource]       = useState('');
  const [filterSkill, setFilterSkill]         = useState('');
  const [filterTopic, setFilterTopic]         = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sort, setSort]             = useState('created_at');
  const [order, setOrder]           = useState('desc');
  const [facets, setFacets]         = useState({ skills:[], topics:[] });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showImport, setShowImport] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [preview, setPreview]       = useState(null);
  const [toast, setToast]           = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const limit = 20;
  const searchTimeout = useRef(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async (p = page) => {
    setLoading(true); setLoadError('');
    try {
      const params = new URLSearchParams({ page:p, limit, sort, order });
      if (search)           params.set('search', search);
      if (filterType)       params.set('type', filterType);
      if (filterSkill)      params.set('skill_tag', filterSkill);
      if (filterTopic)      params.set('topic', filterTopic);
      if (filterSource)     params.set('source', filterSource);
      if (filterDifficulty) params.set('difficulty', filterDifficulty);
      if (tab === 'needs_review') params.set('needs_review', 'true');

      const r = await fetch(`/api/v1/admin/question-library?${params}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load');
      setQuestions(d.questions || []);
      setTotal(d.total || 0);
      setPage(d.page || p);
      setPages(d.pages || 1);
      setFacets({ skills: d.facets?.skills || d.skillTags || [], topics: d.facets?.topics || [] });
    } catch {
      setLoadError('Unable to load the question library. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, tab, filterType, filterSource, filterSkill, filterTopic, filterDifficulty, sort, order, search]);

  // Trigger on filter/tab/sort changes (not search — that's debounced)
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterType, filterSource, filterSkill, filterTopic, filterDifficulty, sort, order]);

  // Reset topic when skill changes
  useEffect(() => { setFilterTopic(''); }, [filterSkill]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); load(1); }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  // Check ?saved=1 on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('saved') === '1') {
      showToast('Question saved to library.');
      url.searchParams.delete('saved');
      window.history.replaceState({}, '', url.toString());
      load(1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSuppressToggle = (id, newApproved) => {
    setQuestions(prev => prev.map(q => q.id === id ? {...q, is_approved:newApproved} : q));
    showToast(newApproved ? 'Question re-approved.' : 'Question suppressed.');
  };

  const handleDelete = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    setTotal(t => t - 1);
  };

  const handleDuplicate = async (q) => {
    try {
      const body = {
        type: q.type, question_text: q.question_text, points: q.points,
        explanation: q.explanation, skill_tag: q.skill_tag, topic: q.topic, difficulty: q.difficulty,
        options: q.question_library_options?.map(o => ({ option_text:o.option_text, is_correct:o.is_correct })),
      };
      const r = await fetch('/api/v1/admin/question-library', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      });
      if (r.ok) { showToast('Question duplicated.'); load(page); }
    } catch {}
    setOpenMenuId(null);
  };

  const handleRowSuppress = async (q) => {
    const r = await fetch(`/api/v1/admin/question-library/${q.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'suppress' }),
    });
    if (r.ok) { handleSuppressToggle(q.id, false); }
    setOpenMenuId(null);
  };

  const handleRowDelete = async (q) => {
    if (!window.confirm(`Delete "${q.question_text.slice(0,60)}…"? This cannot be undone.`)) return;
    const r = await fetch(`/api/v1/admin/question-library/${q.id}`, { method:'DELETE' });
    if (r.ok) { handleDelete(q.id); showToast('Question deleted.'); }
    setOpenMenuId(null);
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    const r = await fetch('/api/v1/admin/question-library/bulk', {
      method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ids }),
    });
    if (r.status === 409) {
      const d = await r.json();
      if (d.code === 'SOME_IN_PUBLISHED') {
        if (!window.confirm('Some questions are in published tests. Delete anyway?')) return;
        const r2 = await fetch('/api/v1/admin/question-library/bulk?force=true', {
          method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ids }),
        });
        if (!r2.ok) return;
      }
    }
    setQuestions(prev => prev.filter(q => !selectedIds.has(q.id)));
    setTotal(t => t - ids.length);
    setSelectedIds(new Set());
    showToast(`${ids.length} question${ids.length!==1?'s':''} deleted.`);
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const allSelected = questions.length > 0 && questions.every(q => selectedIds.has(q.id));
  const toggleAll   = () => {
    if (allSelected) setSelectedIds(prev => { const s = new Set(prev); questions.forEach(q => s.delete(q.id)); return s; });
    else setSelectedIds(prev => { const s = new Set(prev); questions.forEach(q => s.add(q.id)); return s; });
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const filterSelectStyle = {
    flex: '1 1 140px', minWidth: 140, maxWidth: 200,
    height:36, border:`1px solid ${BORDER}`, borderRadius:10, fontSize:13, padding:'0 10px',
    background:'var(--ql-input-bg, white)', color:'var(--ql-input-text, #2C2C2A)', outline:'none', cursor:'pointer',
  };

  const pageChipStyle = (active) => ({
    width:32, height:32, borderRadius:9999, display:'inline-flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight: active ? 700 : 400, cursor:'pointer', border:'none',
    background: active ? PRIMARY : 'var(--ql-input-bg, white)',
    color:      active ? 'white' : MUTED,
    outline: `1px solid ${active ? PRIMARY : BORDER}`,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, padding:'32px 32px 24px', paddingBottom: selectedIds.size > 0 ? 68 : 24 }}>
      <style>{`
        @keyframes ql-spin { to { transform: rotate(360deg); } }
        .ql-row:hover { background: rgba(24,95,165,0.025) !important; }
        .ql-btn-edit:hover { text-decoration: underline; }
        .ql-menu-item:hover { background: #F4F8FC; }
        .ql-menu-item-danger:hover { background: #FEE2E2; color: #D93025; }
        .ql-page-chip:hover { outline-color: #185FA5 !important; color: #185FA5 !important; }

        /* Dark mode — CSS custom properties */
        .dark { --ql-input-bg: #1A2C45; --ql-input-text: #E8EFF7; --ql-border: rgba(255,255,255,0.1); }

        /* Inputs & selects */
        .dark select, .dark input[type="text"] {
          border-color: rgba(255,255,255,0.1) !important;
          color: #E8EFF7 !important;
          background: #1A2C45 !important;
        }

        /* Table wrapper */
        .dark .ql-table-wrap {
          background: #111F35 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }

        /* Table header */
        .dark .ql-thead-row {
          background: #0D1830 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .dark .ql-thead-row th { color: #8BA3C1 !important; }

        /* Data rows */
        .dark .ql-row { background: #111F35 !important; }
        .dark .ql-row:hover { background: rgba(24,95,165,0.12) !important; }
        .dark .ql-row td { border-color: rgba(255,255,255,0.06) !important; }
        .dark .ql-row td p { color: #E8EFF7 !important; }

        /* Empty state */
        .dark .ql-empty {
          background: #111F35 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .dark .ql-empty p { color: #8BA3C1 !important; }
        .dark .ql-empty button { color: #5B9FD4 !important; }

        /* Context menu */
        .dark .ql-context-menu {
          background: #111F35 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .dark .ql-menu-item { color: #E8EFF7 !important; }
        .dark .ql-menu-item:hover { background: #0D1830 !important; }
        .dark .ql-menu-item-danger { color: #F87171 !important; }
        .dark .ql-menu-item-danger:hover { background: rgba(217,48,37,0.12) !important; color: #F87171 !important; }

        /* Tabs */
        .dark .ql-tabs-border { border-color: rgba(255,255,255,0.1) !important; }
        .dark .ql-tab { color: #8BA3C1 !important; }
        .dark .ql-tab-active { color: #5B9FD4 !important; border-bottom-color: #5B9FD4 !important; }
        .dark .ql-badge-needs-review { background: rgba(245,158,11,0.20) !important; color: #F5A623 !important; }
        .dark .ql-needs-review-alert { background: rgba(245,158,11,0.10) !important; border-color: rgba(245,158,11,0.20) !important; color: #F5A623 !important; }

        /* Pagination chips */
        .dark .ql-page-chip { background: #1A2C45 !important; outline-color: rgba(255,255,255,0.1) !important; color: #8BA3C1 !important; }
        .dark .ql-page-chip:hover { outline-color: #5B9FD4 !important; color: #5B9FD4 !important; }

        /* Dots button */
        .dark .ql-dots-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:60,
          background:'#1D9E75', color:'white', fontSize:13, fontWeight:500,
          padding:'10px 22px', borderRadius:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.16)',
          pointerEvents:'none',
        }}>{toast}</div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <PageHeading
          title="Question Library"
          subtitle="Reusable questions tagged by type, skill, topic, and difficulty."
        />
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <button
            onClick={()=>setShowGenerate(true)}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg,#7C3AED 0%,#185FA5 50%,#1D9E75 100%)',
              boxShadow: '0 0 12px rgba(124,58,237,0.30),0 2px 8px rgba(24,95,165,0.20)',
              cursor: 'pointer', border: 'none',
            }}
          >
            <span
              className="absolute inset-0 rounded-[10px] opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%)', backgroundSize:'200% 100%' }}
            />
            <span className="relative z-10 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/>
                <path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/>
              </svg>
              AI Generate
            </span>
          </button>
          <button onClick={()=>setShowImport(true)}
            style={{ border:`1px solid ${BORDER}`, borderRadius:10, padding:'8px 18px', background:'white', fontSize:13, fontWeight:600, color:PRIMARY, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            ↑ Import
          </button>
          <button onClick={()=>router.push('/admin/question-library/new')}
            style={{ borderRadius:10, padding:'8px 20px', background:PRIMARY, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', border:'none' }}>
            + New Question
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="ql-tabs-border" style={{ display:'flex', borderBottom:`1px solid ${BORDER}`, gap:0 }}>
        {[['all','All Questions'],['needs_review','Needs Review']].map(([v,l]) => (
          <button key={v} onClick={()=>{ setTab(v); setPage(1); }}
            className={`ql-tab ${tab===v ? 'ql-tab-active' : ''}`}
            style={{
              fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', background:'none', border:'none',
              color:      tab===v ? PRIMARY : MUTED,
              borderBottom: tab===v ? `2px solid ${PRIMARY}` : '2px solid transparent',
              marginBottom:-1, display:'flex', alignItems:'center', gap:6,
            }}>
            {l}
            {v === 'needs_review' && (
              <span className="ql-badge-needs-review" style={{ fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:9999, background:'#FEF3C7', color:'#B45309' }}>!</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'needs_review' && (
        <div className="ql-needs-review-alert" style={{ background:'#FFFBEB', border:'1px solid rgba(245,158,11,0.30)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#B45309' }}>
          Questions answered 10+ times with under 40% correct rate. Review and suppress or edit as needed.
        </div>
      )}

      {/* ── Filter Bar ───────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:'2 1 200px', minWidth:200 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions…"
            style={{ width:'100%', height:36, border:`1px solid ${BORDER}`, borderRadius:10, paddingLeft:32, paddingRight:10, fontSize:13, outline:'none', boxSizing:'border-box',
              background:'var(--ql-input-bg,white)', color:'var(--ql-input-text,#2C2C2A)' }} />
        </div>
        {/* Type */}
        <select value={filterType} onChange={e=>{ setFilterType(e.target.value); setPage(1); }} style={filterSelectStyle}>
          <option value="">All types</option>
          <option value="mcq">MCQ</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
        </select>
        {/* Source */}
        <select value={filterSource} onChange={e=>{ setFilterSource(e.target.value); setPage(1); }} style={filterSelectStyle}>
          <option value="">All sources</option>
          <option value="skill">Skill</option>
          <option value="manual">Manual</option>
          <option value="ai">AI</option>
          <option value="jd">JD</option>
        </select>
        {/* Skill */}
        <select value={filterSkill} onChange={e=>{ setFilterSkill(e.target.value); setPage(1); }} style={filterSelectStyle}>
          <option value="">All skills</option>
          {facets.skills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Topic */}
        <select value={filterTopic} onChange={e=>{ setFilterTopic(e.target.value); setPage(1); }}
          disabled={!filterSkill && facets.topics.length === 0}
          style={{ ...filterSelectStyle, opacity:(!filterSkill && facets.topics.length===0)?0.5:1 }}>
          <option value="">All topics</option>
          {facets.topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {/* Difficulty */}
        <select value={filterDifficulty} onChange={e=>{ setFilterDifficulty(e.target.value); setPage(1); }} style={filterSelectStyle}>
          <option value="">All difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {loadError && (
        <div style={{ background:'#FEE2E2', border:`1px solid rgba(217,48,37,0.30)`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontSize:13, color:DANGER, margin:0 }}>{loadError}</p>
          <button onClick={()=>load(page)} style={{ fontSize:13, color:DANGER, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Retry</button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="ql-table-wrap" style={{ background:'white', border:`1px solid ${BORDER}`, borderRadius:16, overflow:'hidden' }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:'14px 16px', borderBottom: i<5 ? `1px solid rgba(209,220,232,0.5)` : 'none', alignItems:'center' }}>
              <div style={{ width:16, height:16, borderRadius:4, background:'#E5E7EB', flexShrink:0 }} />
              <div style={{ flex:1, height:14, borderRadius:6, background:'#E5E7EB' }} />
              <div style={{ width:60, height:22, borderRadius:9999, background:'#E5E7EB' }} />
              <div style={{ width:80, height:22, borderRadius:9999, background:'#E5E7EB' }} />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="ql-empty" style={{ background:'white', border:`1px dashed ${BORDER}`, borderRadius:16, padding:'60px 20px', textAlign:'center' }}>
          {tab === 'needs_review' ? (
            <p style={{ fontSize:14, color:MUTED, margin:0 }}>No questions need review right now.</p>
          ) : search || filterType || filterSkill || filterSource || filterDifficulty || filterTopic ? (
            <p style={{ fontSize:14, color:MUTED, margin:0 }}>No questions found matching your filters.</p>
          ) : (
            <div>
              <p style={{ fontSize:14, color:MUTED, margin:'0 0 12px' }}>No questions in the library yet.</p>
              <button onClick={()=>router.push('/admin/question-library/new')}
                style={{ color:PRIMARY, background:'none', border:'none', fontSize:14, cursor:'pointer', textDecoration:'underline' }}>
                Create your first question →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="ql-table-wrap" style={{ background:'white', border:`1px solid ${BORDER}`, borderRadius:16, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:40 }} />
              <col />
              <col style={{ width:90 }} />
              <col style={{ width:120 }} />
              <col style={{ width:140 }} />
              <col style={{ width:100 }} />
              <col style={{ width:110 }} />
              <col style={{ width:100 }} />
            </colgroup>
            <thead>
              <tr className="ql-thead-row" style={{ background:'linear-gradient(180deg,#F4F8FC,#EEF3F9)', borderBottom:`1px solid ${BORDER}`, height:44 }}>
                <th style={{ padding:'0 0 0 14px', textAlign:'center' }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor:PRIMARY, width:16, height:16 }} />
                </th>
                {['QUESTION','TYPE','SKILL','TOPIC','DIFFICULTY','SOURCE',''].map((h,i) => (
                  <th key={i} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:MUTED, textAlign:'left', padding: h ? '0 16px' : '0 8px', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map(q => {
                const src = deriveSource(q);
                const srcChip = SOURCE_CHIPS[src] || SOURCE_CHIPS.manual;
                const tc  = TYPE_CHIP[q.type] || { bg:BG, color:MUTED, border:BORDER, label:q.type };
                const dc  = DIFFICULTY_CHIP[q.difficulty];
                const sk  = getSkillStyle(q.skill_tag);
                const isSelected = selectedIds.has(q.id);
                return (
                  <tr key={q.id} className="ql-row" style={{
                    borderBottom:`1px solid rgba(209,220,232,0.5)`,
                    background: isSelected ? 'rgba(24,95,165,0.04)' : 'white',
                    transition:'background 150ms ease',
                  }}>
                    {/* Checkbox */}
                    <td style={{ padding:'0 0 0 14px', textAlign:'center', verticalAlign:'middle' }}>
                      <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(q.id)} style={{ accentColor:PRIMARY, width:16, height:16 }} />
                    </td>
                    {/* Question */}
                    <td style={{ padding:'12px 16px', verticalAlign:'top' }}>
                      <p style={{ fontSize:14, color: q.is_approved===false ? MUTED : TEXT, margin:0, lineHeight:'1.5',
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
                        opacity: q.is_approved===false ? 0.6 : 1,
                      }}>
                        {q.question_text}
                      </p>
                      {q.is_approved === false && (
                        <span style={{ fontSize:11, color:'#9CA3AF', fontStyle:'italic' }}>suppressed</span>
                      )}
                    </td>
                    {/* Type */}
                    <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
                      <Chip bg={tc.bg} color={tc.color} border={tc.border}>{tc.label}</Chip>
                    </td>
                    {/* Skill */}
                    <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
                      {q.skill_tag ? (
                        <span style={{
                          display:'inline-block', borderRadius:9999, padding:'3px 10px',
                          fontSize:12, fontWeight:500, whiteSpace:'nowrap',
                          background:sk.bg, color:sk.color, border:'1px solid rgba(0,0,0,0.08)',
                        }}>{q.skill_tag}</span>
                      ) : <span style={{ fontSize:12, color:'#D1DCE8' }}>—</span>}
                    </td>
                    {/* Topic */}
                    <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
                      <span style={{ fontSize:13, color:MUTED,
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
                      }}>
                        {q.topic || <span style={{ color:'#D1DCE8' }}>—</span>}
                      </span>
                    </td>
                    {/* Difficulty */}
                    <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
                      {dc ? <Chip bg={dc.bg} color={dc.color} border={dc.border}>{dc.label}</Chip>
                           : <span style={{ fontSize:12, color:'#D1DCE8' }}>—</span>}
                    </td>
                    {/* Source */}
                    <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
                      <Chip bg={srcChip.bg} color={srcChip.color} border={srcChip.border}>
                        <span style={{ fontSize:11 }}>{srcChip.icon}</span>{srcChip.label}
                      </Chip>
                    </td>
                    {/* Actions */}
                    <td style={{ padding:'0 8px', verticalAlign:'middle' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button className="ql-btn-edit"
                          onClick={()=>router.push(`/admin/question-library/${q.id}/edit`)}
                          style={{ fontSize:13, fontWeight:600, color:PRIMARY, background:'none', border:'none', cursor:'pointer', padding:'4px 2px' }}>
                          Edit
                        </button>
                        {/* ⋮ menu */}
                        <div style={{ position:'relative' }}>
                          <button
                            className="ql-dots-btn"
                            onClick={e=>{ e.stopPropagation(); setOpenMenuId(openMenuId===q.id?null:q.id); }}
                            style={{
                              width:32, height:32, borderRadius:9999, border:'none', background:'none',
                              cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                              transition:'background 150ms ease',
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(24,95,165,0.06)'}
                            onMouseLeave={e=>e.currentTarget.style.background='none'}
                          >⋮</button>
                          {openMenuId === q.id && (
                            <div className="ql-context-menu" onClick={e=>e.stopPropagation()} style={{
                              position:'absolute', right:0, top:'calc(100% + 4px)', zIndex:50,
                              background:'white', border:`1px solid ${BORDER}`, borderRadius:10,
                              boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:160,
                            }}>
                              <button className="ql-menu-item" onClick={()=>{ setPreview(q); setOpenMenuId(null); }}
                                style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px', fontSize:13, color:TEXT, background:'none', border:'none', cursor:'pointer' }}>
                                View details
                              </button>
                              <button className="ql-menu-item" onClick={()=>handleDuplicate(q)}
                                style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px', fontSize:13, color:TEXT, background:'none', border:'none', cursor:'pointer' }}>
                                Duplicate
                              </button>
                              <hr style={{ margin:'4px 0', border:'none', borderTop:`1px solid ${BORDER}` }} />
                              {src !== 'manual' && (
                                <button className="ql-menu-item" onClick={()=>handleRowSuppress(q)}
                                  style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px', fontSize:13, color:TEXT, background:'none', border:'none', cursor:'pointer' }}>
                                  Suppress
                                </button>
                              )}
                              <button className="ql-menu-item-danger ql-menu-item" onClick={()=>handleRowDelete(q)}
                                style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px', fontSize:13, color:DANGER, background:'none', border:'none', cursor:'pointer' }}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {!loading && pages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontSize:13, color:MUTED }}>
            Showing {(page-1)*limit+1}–{Math.min(page*limit, total)} of {total} question{total!==1?'s':''}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={()=>{ setPage(p=>p-1); load(page-1); }} disabled={page<=1}
              className="ql-page-chip"
              style={{ ...pageChipStyle(false), opacity:page<=1?0.35:1, cursor:page<=1?'not-allowed':'pointer', width:'auto', padding:'0 12px' }}>
              ← Prev
            </button>
            {paginate(page, pages).map((p,i) =>
              p === '…' ? (
                <span key={`e${i}`} style={{ fontSize:13, color:MUTED, padding:'0 4px' }}>…</span>
              ) : (
                <button key={p} className={p!==page?'ql-page-chip':''} onClick={()=>{ setPage(p); load(p); }}
                  style={pageChipStyle(p===page)}>
                  {p}
                </button>
              )
            )}
            <button onClick={()=>{ setPage(p=>p+1); load(page+1); }} disabled={page>=pages}
              className="ql-page-chip"
              style={{ ...pageChipStyle(false), opacity:page>=pages?0.35:1, cursor:page>=pages?'not-allowed':'pointer', width:'auto', padding:'0 12px' }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk Action Bar ──────────────────────────────────────────────────── */}
      <div style={{
        position:'fixed', bottom:0, left:240, right:0,
        background:PRIMARY, color:'white', height:52, padding:'0 24px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 -4px 16px rgba(12,68,124,0.20)', zIndex:40,
        transform: selectedIds.size > 0 ? 'translateY(0)' : 'translateY(100%)',
        transition:'transform 200ms ease',
      }}>
        <span style={{ fontSize:14, fontWeight:600 }}>{selectedIds.size} question{selectedIds.size!==1?'s':''} selected</span>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button onClick={handleBulkDelete} style={{ border:'1px solid rgba(255,255,255,0.40)', borderRadius:8, padding:'6px 14px', background:'transparent', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Delete selected
          </button>
          <button onClick={()=>setSelectedIds(new Set())} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.70)', fontSize:13, cursor:'pointer' }}>
            Clear selection
          </button>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {preview && (
        <PreviewModal
          question={preview}
          onClose={()=>setPreview(null)}
          onDelete={handleDelete}
          onSuppressToggle={handleSuppressToggle}
        />
      )}
      {showGenerate && (
        <AIGenerateModal
          onClose={()=>setShowGenerate(false)}
          onSaved={(qs)=>{ setQuestions(prev=>[...qs,...prev]); setTotal(t=>t+qs.length); showToast(`${qs.length} question${qs.length!==1?'s':''} added to the Question Library.`); }}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={()=>setShowImport(false)}
          onImported={(qs, count)=>{ if (qs.length>0) setQuestions(prev=>[...qs,...prev]); setTotal(t=>t+count); showToast(`${count} question${count!==1?'s':''} imported.`); load(1); }}
        />
      )}
    </div>
  );
}
