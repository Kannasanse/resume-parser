'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QuestionForm from '../../components/QuestionForm';

export default function EditQuestion() {
  const router      = useRouter();
  const { id }      = useParams();
  const [question, setQuestion]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');

  useEffect(() => {
    fetch(`/api/v1/admin/question-library/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        const q    = d.question;
        const opts = (q.question_library_options || []).sort((a, b) => a.position - b.position);
        setQuestion({
          type:           q.type,
          question_text:  q.question_text,
          points:         q.points,
          explanation:    q.explanation   || '',
          skill_tag:      q.skill_tag     || '',
          topic:          q.topic         || '',
          difficulty:     q.difficulty    || '',
          // MCQ
          options: opts.map(o => ({ option_text: o.option_text, is_correct: o.is_correct })),
          // T/F — derive from options
          correct_answer: opts.find(o => o.is_correct)?.option_text?.toLowerCase() === 'false' ? 'false' : 'true',
          // Short answer
          model_answer:    q.model_answer    || '',
          grading_rubric:  q.grading_rubric  || '',
          answer_keywords: Array.isArray(q.answer_keywords)
            ? q.answer_keywords.join(', ')
            : (q.answer_keywords || ''),
        });
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (formData) => {
    setSaving(true); setSaveError('');
    try {
      const r = await fetch(`/api/v1/admin/question-library/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save');
      router.push('/admin/question-library?saved=1');
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
        Loading question…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#D93025', fontSize: 14 }}>
        {fetchError}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div>
        <nav style={{ fontSize: 13, color: '#9CA3AF' }}>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/admin/question-library')}
          >
            Question Library
          </span>
          {' › '}
          <span style={{ color: '#2C2C2A' }}>Edit question</span>
        </nav>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', marginTop: 4, marginBottom: 0 }}>
          Edit Question
        </h1>
      </div>

      {saveError && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid rgba(217,48,37,0.20)',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#D93025',
          fontSize: 13,
        }}>
          {saveError}
        </div>
      )}

      <QuestionForm
        initialData={question}
        onSave={handleSave}
        onCancel={() => router.push('/admin/question-library')}
        saving={saving}
      />
    </div>
  );
}
