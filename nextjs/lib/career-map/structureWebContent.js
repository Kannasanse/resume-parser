export async function structureWebContent({
  rawContent,
  sectionHeading,
  skill,
  currentLevel,
  sourceUrl,
  sourceTitle,
}) {
  const levelGuidance =
    currentLevel === 'beginner'     ? 'avoid jargon, explain fundamentals clearly' :
    currentLevel === 'intermediate' ? 'assume basic knowledge, focus on practical usage' :
                                      'assume solid foundation, focus on nuance and edge cases';

  const prompt = `You are structuring educational content for a ${currentLevel} learner studying ${skill}.

The section topic is: "${sectionHeading}"

The following is raw content scraped from: ${sourceTitle} (${sourceUrl})

--- RAW CONTENT START ---
${rawContent.slice(0, 6000)}
--- RAW CONTENT END ---

Your task:
1. Extract and organise the most relevant information for this section topic
2. Structure it clearly with ### sub-headings (2-4 sub-headings)
3. Keep it between 350-550 words — concise but complete
4. Include code examples if present and relevant (preserve them exactly)
5. Write in second person ("you will learn", "you can use")
6. Match the ${currentLevel} level — ${levelGuidance}
7. DO NOT mention the source website or article title
8. DO NOT include unrelated content from the source page

Output ONLY the structured markdown content. No preamble.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'llama-3.1-8b-instant',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  800,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}
