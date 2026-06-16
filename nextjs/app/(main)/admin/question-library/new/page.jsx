'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionForm from '../components/QuestionForm';

export default function NewQuestion() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async (formData) => {
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/v1/admin/question-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save');
      router.push('/admin/question-library?saved=1');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div>
        <nav style={{ fontSize: 13, color: '#9CA3AF' }}>
          <span
            style={{ cursor: 'pointer', color: '#9CA3AF' }}
            onClick={() => router.push('/admin/question-library')}
          >
            Question Library
          </span>
          {' › '}
          <span style={{ color: '#2C2C2A' }}>New question</span>
        </nav>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', marginTop: 4, marginBottom: 0 }}>
          New Question
        </h1>
      </div>

      {error && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid rgba(217,48,37,0.20)',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#D93025',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <QuestionForm
        onSave={handleSave}
        onCancel={() => router.push('/admin/question-library')}
        saving={saving}
      />
    </div>
  );
}
