import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';
import { Groq } from 'groq-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    // Verify ownership
    const { data: session } = await supabase
      .from('self_test_sessions')
      .select('user_id, questions')
      .eq('id', id)
      .single();
    if (!session || session.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { answers } = await request.json();
    // answers: [{ questionIndex, questionText, modelAnswer, gradingRubric, answerKeywords, userAnswer }]

    if (!Array.isArray(answers) || answers.length === 0) {
      return Response.json({ grades: [] });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Grade all short answers in parallel
    const grades = await Promise.all(answers.map(async a => {
      const { questionIndex, questionText, modelAnswer, gradingRubric, answerKeywords = [], userAnswer } = a;

      if (!userAnswer?.trim()) {
        return {
          questionIndex,
          score:    0,
          feedback: 'No answer provided.',
        };
      }

      try {
        const prompt = `You are grading a short answer question for a professional skills assessment.

Question: ${questionText}
Model answer: ${modelAnswer}
${gradingRubric ? `Grading rubric: ${gradingRubric}` : ''}
${answerKeywords.length > 0 ? `Key terms expected: ${answerKeywords.join(', ')}` : ''}

User's answer: ${userAnswer}

Grade this answer on a scale of 0.0 to 1.0:
  1.0 = Complete, accurate, demonstrates full understanding
  0.75 = Mostly correct with minor gaps
  0.5 = Partially correct, shows some understanding
  0.25 = Minimal understanding, major gaps
  0.0 = Incorrect, irrelevant, or blank

Return ONLY a JSON object:
{"score": 0.0-1.0, "feedback": "2-3 sentences: what was good, what was missing or incorrect"}`;

        const completion = await groq.chat.completions.create({
          model:           'llama-3.3-70b-versatile',
          messages:        [{ role: 'user', content: prompt }],
          temperature:     0.2,
          response_format: { type: 'json_object' },
        });

        const text = completion.choices?.[0]?.message?.content;
        const parsed = JSON.parse(text || '{}');
        const score = Math.max(0, Math.min(1, parseFloat(parsed.score) || 0));

        return {
          questionIndex,
          score,
          feedback: parsed.feedback || 'Answer graded.',
        };
      } catch {
        return {
          questionIndex,
          score:    0.5,
          feedback: 'Unable to grade automatically. Please review manually.',
        };
      }
    }));

    // Update the attempt results with AI grades
    const { data: attempt } = await supabase
      .from('self_test_attempts')
      .select('id, results, score, max_score, short_answer_count')
      .eq('session_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (attempt) {
      const updatedResults = [...(attempt.results || [])];
      let shortAnswerScoreSum = 0;
      let shortAnswerTotal = 0;

      for (const grade of grades) {
        const { questionIndex, score, feedback } = grade;
        if (updatedResults[questionIndex]) {
          updatedResults[questionIndex] = {
            ...updatedResults[questionIndex],
            ai_score:      score,
            ai_feedback:   feedback,
            grading_method:'ai',
            correct:       score >= 0.7,
            pending_grade: false,
          };
        }
      }

      // Recalculate combined score
      const questions = session.questions || [];
      const mcqCorrect = updatedResults.filter((r, i) => questions[i]?.type !== 'short_answer' && r.correct).length;
      const mcqTotal   = questions.filter(q => q.type !== 'short_answer').length;
      const saResults  = updatedResults.filter((r, i) => questions[i]?.type === 'short_answer');
      saResults.forEach(r => {
        if (r.ai_score != null) { shortAnswerScoreSum += r.ai_score; shortAnswerTotal++; }
      });

      const mcqPct = mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 0;
      const saPct  = shortAnswerTotal > 0 ? (shortAnswerScoreSum / shortAnswerTotal) * 100 : 0;
      const saCount = attempt.short_answer_count || saResults.length;

      let combinedPct;
      if (mcqTotal > 0 && saCount > 0) {
        combinedPct = Math.round(mcqPct * 0.6 + saPct * 0.4);
      } else if (saCount > 0) {
        combinedPct = Math.round(saPct);
      } else {
        combinedPct = Math.round(mcqPct);
      }

      await supabase
        .from('self_test_attempts')
        .update({
          results:             updatedResults,
          short_answer_score:  Math.round(saPct * 100) / 100,
          combined_score:      combinedPct,
          combined_pct:        combinedPct,
        })
        .eq('id', attempt.id)
        .catch(() => {}); // non-fatal if migration not run
    }

    return Response.json({ grades });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}
