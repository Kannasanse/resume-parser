import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

function buildSourceContext(sources, maxChars = 56000) {
  let context = '';
  let total = 0;
  for (const src of sources) {
    const snippet = (src.extracted_text || '').slice(0, 4000);
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
    const { sourceIds = [] } = await request.json();

    // Fetch course
    const { data: plan } = await supabase
      .from('study_plans')
      .select('target_role')
      .eq('id', courseId)
      .single();
    const skillName = plan?.target_role || 'this topic';

    // Fetch sources
    let sourcesQuery = supabase
      .from('course_sources')
      .select('id,title,type,extracted_text')
      .eq('course_id', courseId)
      .eq('user_id', user.id);

    if (sourceIds.length > 0) {
      sourcesQuery = sourcesQuery.in('id', sourceIds);
    }

    const { data: sources } = await sourcesQuery;
    const usedSources = sources || [];
    const context = buildSourceContext(usedSources);

    const prompt = `You are creating a comprehensive study guide for a learner studying ${skillName}.

${context.trim()
  ? `Generate the study guide based on the provided sources. Structure it exactly as follows:\n\n## Key Concepts\n[Bullet list of the most important concepts with 1–2 sentence explanations each]\n\n## Key Differences\n[Compare any similar concepts learners commonly confuse; skip this section if none apply]\n\n## Common Patterns\n[Practical patterns and when to use them]\n\n## Quick Quiz\n[5–7 Q&A pairs that test understanding. Format each as:\nQ: ...\nA: ...]\n\n## Sources Used\n[List the source titles referenced]\n\nKeep the guide concise — a student should review it in under 5 minutes. Use plain language.\n\nSOURCES:\n${context}`
  : `No sources have been added yet. Generate a general study guide for ${skillName} covering:\n\n## Key Concepts\n## Common Patterns\n## Quick Quiz\n\nKeep it concise and practical.`
}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq error: ${errText}`);
    }

    const groqData = await groqRes.json();
    const guide = groqData.choices?.[0]?.message?.content || '';

    // Cache in DB (upsert by course_id)
    await supabase.from('course_study_guides').upsert({
      course_id:    courseId,
      user_id:      user.id,
      content:      guide,
      source_ids:   usedSources.map(s => s.id),
      generated_at: new Date().toISOString(),
    }, { onConflict: 'course_id' });

    return NextResponse.json({
      guide,
      source_count: usedSources.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('study guide generate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const courseId = params.id;

    const { data } = await supabase
      .from('course_study_guides')
      .select('content,source_ids,generated_at')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();

    if (!data) return NextResponse.json({ guide: null });
    return NextResponse.json({ guide: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
