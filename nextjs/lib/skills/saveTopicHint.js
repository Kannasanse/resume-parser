import supabase from '@/lib/supabase.js';

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Upsert a topic hint into skill_topics and increment usage_count.
 * Non-fatal — errors are caught and logged.
 */
export async function saveTopicHint(skillId, topicHint, source = 'user_hint') {
  if (!skillId || !topicHint?.trim()) return null;

  const name = topicHint.trim();
  const slug = toSlug(name);

  try {
    const { data, error } = await supabase
      .from('skill_topics')
      .upsert({ skill_id: skillId, name, slug, source }, { onConflict: 'skill_id,slug' })
      .select('id, usage_count')
      .single();

    if (error) {
      console.error('[saveTopicHint] upsert error:', error.message);
      return null;
    }

    // Increment usage_count
    await supabase
      .from('skill_topics')
      .update({ usage_count: (data.usage_count || 0) + 1 })
      .eq('id', data.id);

    return data;
  } catch (err) {
    console.error('[saveTopicHint] exception:', err.message);
    return null;
  }
}

/**
 * Save AI-inferred topics from generated questions.
 * Called fire-and-forget after session creation.
 */
export async function saveAIInferredTopics(questions) {
  const seen = new Set();
  for (const q of questions) {
    if (!q.skill_id || !q.topic) continue;
    const slug = toSlug(q.topic);
    const key = `${q.skill_id}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await saveTopicHint(q.skill_id, q.topic, 'ai_inferred').catch(() => {});
  }
}
