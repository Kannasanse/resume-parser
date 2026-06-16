import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { callGemini } from '@/lib/gemini';
import { deductCredits, getBalance, CREDIT_COSTS } from '@/lib/credits.js';

function buildSourceContext(sources, maxChars = 48000) {
  let context = '';
  let total = 0;
  for (const src of sources) {
    const snippet = (src.extracted_text || '').slice(0, 3000);
    const entry = `\n\n=== ${src.title} (${src.type}) ===\n${snippet}`;
    if (total + entry.length > maxChars) break;
    context += entry;
    total += entry.length;
  }
  return context;
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const courseId = params.id;
    const { message, history = [], sourceIds = [] } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const balance = await getBalance(user.id);
    const COST = CREDIT_COSTS['course_chat'];
    if (balance < COST) {
      return NextResponse.json(
        { error: `Insufficient credits. This action costs ${COST} credit.`, code: 'insufficient_credits', balance },
        { status: 402 }
      );
    }

    // Fetch course to get skill name
    const { data: plan } = await supabase
      .from('study_plans')
      .select('target_role')
      .eq('id', courseId)
      .single();
    const skillName = plan?.target_role || 'this topic';

    // Fetch sources
    let sourcesQuery = supabase
      .from('course_sources')
      .select('title,type,extracted_text')
      .eq('course_id', courseId)
      .eq('user_id', user.id);

    if (sourceIds.length > 0) {
      sourcesQuery = sourcesQuery.in('id', sourceIds);
    }

    const { data: sources } = await sourcesQuery;
    const context = buildSourceContext(sources || []);

    const hasContext = context.trim().length > 0;
    const systemPrompt = hasContext
      ? `You are a study assistant helping the user learn ${skillName}. Answer questions using the provided source material as your primary reference.

If the answer is not clearly in the sources, say so and offer general guidance.
At the end of your answer, cite which source(s) you drew from: [Source: <title>]

SOURCES:${context}`
      : `You are a study assistant helping the user learn ${skillName}. No sources have been added to this course yet — answer based on your general knowledge, and suggest the user add relevant sources for grounded answers.`;

    const reply = await callGemini(message, { system: systemPrompt, json: false, temperature: 0.7 }) || 'Sorry, I could not generate a response.';

    // Persist to DB
    await supabase.from('course_chat_messages').insert([
      { course_id: courseId, user_id: user.id, role: 'user',      content: message },
      { course_id: courseId, user_id: user.id, role: 'assistant', content: reply  },
    ]);

    const { ok, balance: newBalance } = await deductCredits(user.id, 'course_chat');
    if (!ok) return NextResponse.json({ error: 'Insufficient credits.', code: 'insufficient_credits', balance: 0 }, { status: 402 });

    return NextResponse.json({ reply, credits_used: COST, credits_remaining: newBalance });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('course chat error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const courseId = params.id;

    const { data } = await supabase
      .from('course_chat_messages')
      .select('id,role,content,created_at')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100);

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
