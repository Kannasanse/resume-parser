// Wrapper around Anthropic Claude API for portfolio AI features
// Uses fetch directly — no SDK dependency

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(prompt, maxTokens = 512) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

export async function checkAiUsage(userId, supabase) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('used_at', monthStart.toISOString());
  return count ?? 0;
}

export async function recordAiUsage(userId, feature, supabase) {
  await supabase.from('ai_usage').insert({ user_id: userId, feature });
}
