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
        const prompt = `You are an expert technical assessor grading a short answer question.
Your job is to evaluate whether the answer demonstrates correct understanding — NOT whether it uses the same words as the model answer.

Question: ${questionText}

Model answer (for reference only — other correct phrasings are equally valid):
${modelAnswer}
${gradingRubric ? `\nGrading rubric: ${gradingRubric}` : ''}
${answerKeywords.length > 0 ? `\nKey concepts expected (ideas, not exact words): ${answerKeywords.join(', ')}` : ''}

User's answer: ${userAnswer}

Grading instructions:
1. Evaluate MEANING, not word choice — a correct answer in different words is still correct
2. A longer, more detailed answer that covers the concept deserves FULL marks
3. Only reduce marks if core concepts are MISSING, WRONG, or show misunderstanding
4. Do NOT penalise for: different phrasing, additional correct details, bullet vs prose, formality level, minor grammar
5. DO penalise for: missing the core concept, factually incorrect statements, vague filler ("fast development", "nothing much"), off-topic responses, blank or "I don't know"

Score scale:
  1.0 = Fully correct — demonstrates complete understanding
  0.75 = Mostly correct — covers the main idea with minor gaps
  0.5 = Partially correct — shows some understanding but missing key aspects
  0.25 = Minimal — barely touches the concept, mostly vague or off-topic
  0.0 = Incorrect — wrong, irrelevant, blank, or shows no understanding

Return ONLY valid JSON, no preamble:
{"score": 0.0, "feedback": "2-3 sentences: what was correct, what was missing or wrong, and one specific improvement tip if score < 1.0"}

Important: Return the JSON with lowercase keys exactly as shown: {"score": 0.0, "feedback": "..."}
Do not use "Score", "SCORE", or any other capitalisation.`;

        const completion = await groq.chat.completions.create({
          model:           'llama-3.1-8b-instant',
          messages:        [{ role: 'user', content: prompt }],
          temperature:     0.1,
          max_tokens:      300,
          response_format: { type: 'json_object' },
        });

        const text = completion.choices?.[0]?.message?.content;
        console.log('=== GRADING DEBUG ===');
        console.log('Question:', questionText);
        console.log('User answer:', userAnswer);
        console.log('Raw Groq response:', text);
        if (!text || text.trim() === '') {
          console.log('=== END GRADING (empty response) ===');
          return { questionIndex, score: 0.5, feedback: 'Unable to grade automatically. Please review manually.' };
        }
        const parsed = JSON.parse(text);
        console.log('parsed.score:', parsed.score, '| parsed.Score:', parsed.Score);
        const rawScore = parsed.score ?? parsed.Score ?? parsed.grade ?? parsed.Grade ?? parsed.rating ?? parsed.Rating;
        const score = Math.max(0, Math.min(1, parseFloat(rawScore) || 0));
        console.log('Final score:', score);
        console.log('=== END GRADING ===');

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
