import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function synthesiseContent({
  sectionType = 'concept',
  sectionHeading,
  topicTitle,
  skill,
  currentLevel = 'intermediate',
  learningStyle,
  precedingSections = [],
  webContent = null,
  sourceTitle = null,
  sourceUrl = null,
}) {
  const levelGuidance = {
    beginner:     'explain all concepts from scratch, avoid jargon, use simple analogies',
    intermediate: 'assume basic knowledge, focus on practical use and common patterns',
    advanced:     'assume solid foundation, focus on nuance, edge cases, and internals',
  }[currentLevel] ?? 'write clearly for a learner new to the topic';

  const sourceBlock = webContent
    ? `\n\nReference material (from ${sourceTitle ?? sourceUrl ?? 'web'}):\n--- SOURCE START ---\n${webContent.slice(0, 5000)}\n--- SOURCE END ---`
    : '';

  const precedingBlock = precedingSections.length > 0
    ? `\nPreviously covered: ${precedingSections.join(', ')}`
    : '';

  let prompt;
  let maxTokens = 1100;

  switch (sectionType) {
    case 'concept':
      maxTokens = 1200;
      prompt = `You are a technical educator writing a concept explanation for a ${currentLevel} learner.

Topic: ${topicTitle}
Skill: ${skill}
Section: "${sectionHeading}"
Level: ${levelGuidance}${precedingBlock}${sourceBlock}

Write a concept explanation (600–800 words):
- 2–3 ### sub-headings
- Clear definition and why it matters
- Mental model or analogy to aid retention
- Short code snippet if relevant
- Do NOT repeat content already covered in previous sections
- Do NOT include a title line or preamble

Output clean markdown only.`;
      break;

    case 'practical':
      maxTokens = 1500;
      prompt = `You are a technical educator writing a hands-on practical guide for a ${currentLevel} learner.

Topic: ${topicTitle}
Skill: ${skill}
Section: "${sectionHeading}"
Level: ${levelGuidance}${precedingBlock}${sourceBlock}

Write a practical guide (800–1,000 words):
- Step-by-step walkthrough
- Full, runnable code example with inline comments
- Call out common mistakes or gotchas
- At least 2 ### sub-headings
- Do NOT include a title line or preamble

Output clean markdown only.`;
      break;

    case 'exercise':
      maxTokens = 1100;
      prompt = `You are a technical educator creating a hands-on exercise for a ${currentLevel} learner.

Topic: ${topicTitle}
Skill: ${skill}
Section: "${sectionHeading}"
Level: ${levelGuidance}${precedingBlock}

Write a structured exercise using exactly these headings:

### The Challenge
(1–2 sentence problem statement)

### What You'll Build
(bullet list of 3–5 requirements)

### Hints
(3 progressive numbered hints — each shorter than the last answer)

### Solution
(full working code with inline comments)

### Extend It
(2–3 optional extension ideas)

Do NOT include a title line or preamble. Output clean markdown only.`;
      break;

    case 'summary':
      maxTokens = 700;
      prompt = `You are a technical educator writing a topic summary for a ${currentLevel} learner.

Topic: ${topicTitle}
Skill: ${skill}
Section: "${sectionHeading}"
Level: ${levelGuidance}${precedingBlock}

Write a concise summary (250–350 words) using exactly these headings:

### Key Takeaways
(5–6 bullet points — what the learner now knows)

### Quick Reference
(table or bullet list of key commands/methods/concepts covered)

### What's Next
(1 sentence bridging to the next topic)

Do NOT include a title line or preamble. Output clean markdown only.`;
      break;

    default:
      maxTokens = 1000;
      prompt = `You are a technical educator writing study material for a ${currentLevel} learner.

Topic: ${topicTitle}
Skill: ${skill}
Section: "${sectionHeading}"
Level: ${levelGuidance}${precedingBlock}${sourceBlock}

Write educational content (400–600 words) with 2–3 ### sub-headings.
Do NOT include a title line or preamble. Output clean markdown only.`;
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.5,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0].message.content ?? '';
}
