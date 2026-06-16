'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function extractTiptapText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) return node.content.map(extractTiptapText).join(' ');
  return '';
}

function buildTopicContent(topic) {
  const lines = [`Topic: ${topic.title}`, `Skill: ${topic.skill}`, ''];
  for (const s of topic.sections || []) {
    if (s.heading) lines.push(`## ${s.heading}`);
    const content = s.content;
    if (typeof content === 'string' && content.trim()) {
      lines.push(content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    } else if (content && typeof content === 'object') {
      const text = extractTiptapText(content);
      if (text.trim()) lines.push(text.trim());
    }
    lines.push('');
  }
  return lines.join('\n');
}

export default function TestConfigModal({ topic, onClose }) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('mcq');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const content = buildTopicContent(topic);
      const isMixed = questionType === 'mixed';
      const mcqCount = isMixed ? Math.round(questionCount * 0.7) : questionCount;
      const saCount = isMixed ? questionCount - mcqCount : 0;
      const timerMinutes = Math.max(10, questionCount * 2);
      const qtypes = isMixed ? ['mcq', 'true_false', 'short_answer']
                   : questionType === 'true_false' ? ['true_false']
                   : ['mcq'];

      const res = await fetch('/api/v1/self-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: 'content',
          input_data: content,
          difficulty,
          timer_minutes: timerMinutes,
          question_types: qtypes,
          mcq_count: mcqCount,
          short_answer_count: saCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate test');
      router.push(`/interview-prep/${data.session.id}`);
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-[#1A2C45] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1DCE8] dark:border-white/10">
          <h2 className="text-base font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Test Yourself</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[rgba(24,95,165,0.06)] hover:text-[#185FA5] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Topic info */}
          <div className="flex items-start gap-3 p-3 bg-[#F4F8FC] dark:bg-[#0D1830] rounded-xl">
            <div className="w-9 h-9 flex items-center justify-center bg-[rgba(24,95,165,0.12)] rounded-lg flex-shrink-0 text-[#185FA5]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] line-clamp-1">{topic.title}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] mt-0.5">
                {topic.skill} · {(topic.sections || []).length} sections
              </p>
            </div>
          </div>

          {/* Question count */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] dark:text-[#8BA3C1] uppercase tracking-wider mb-2">Questions</p>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    questionCount === n
                      ? 'bg-[rgba(24,95,165,0.10)] border-[#185FA5] text-[#185FA5] dark:text-[#5B9FD4]'
                      : 'border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:border-[#185FA5]/50 hover:text-[#185FA5]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] dark:text-[#8BA3C1] uppercase tracking-wider mb-2">Difficulty</p>
            <div className="flex gap-2">
              {[
                { value: 'easy',   label: 'Easy',   sel: 'text-[#1D9E75]' },
                { value: 'medium', label: 'Medium', sel: 'text-[#F59E0B]' },
                { value: 'hard',   label: 'Hard',   sel: 'text-[#EF4444]' },
              ].map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    difficulty === d.value
                      ? `bg-[rgba(24,95,165,0.10)] border-[#185FA5] ${d.sel}`
                      : 'border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:border-[#185FA5]/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question type */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] dark:text-[#8BA3C1] uppercase tracking-wider mb-2">Question Type</p>
            <div className="flex flex-col gap-2">
              {[
                { value: 'mcq',        label: 'Multiple Choice', desc: 'MCQ + True/False questions' },
                { value: 'true_false', label: 'True / False',    desc: 'Binary True or False only' },
                { value: 'mixed',      label: 'Mixed',           desc: 'MCQ/True-False + Short Answer' },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setQuestionType(t.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    questionType === t.value
                      ? 'bg-[rgba(24,95,165,0.08)] border-[#185FA5]'
                      : 'border-[#D1DCE8] dark:border-white/10 hover:border-[#185FA5]/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    questionType === t.value ? 'border-[#185FA5]' : 'border-[#D1DCE8] dark:border-white/20'
                  }`}>
                    {questionType === t.value && <div className="w-2 h-2 rounded-full bg-[#185FA5]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">{t.label}</p>
                    <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1]">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#185FA5] hover:bg-[#14559a] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                </svg>
                Generating…
              </>
            ) : (
              <>
                Generate Test
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
