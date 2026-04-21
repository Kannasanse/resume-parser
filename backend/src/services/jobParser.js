const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert technical recruiter. Analyse the job description and extract every technical skill, tool, technology, and methodology mentioned.

Return a JSON array where each element has exactly these fields:
- "skill": canonical name of the skill (e.g. "React", "PostgreSQL", "Docker")
- "proficiency": one of "Expert" | "Advanced" | "Intermediate" | "Beginner" | "Nice-to-have"
  - Expert: "expert", "mastery", "deep knowledge", 8-10+ years mentioned
  - Advanced: "strong", "proficient", "senior", "lead", 5-7 years mentioned
  - Intermediate: "experience with", "solid", "working knowledge", 3-4 years mentioned
  - Beginner: "familiar", "basic", "exposure", "understanding of", 1-2 years mentioned
  - Nice-to-have: "nice to have", "preferred", "bonus", "optional", "desirable"
- "is_required": true if mandatory, false if optional/preferred

Include both hard skills (languages, frameworks, tools) and process skills (Agile, CI/CD) if mentioned.
Do not duplicate skills. Return only the JSON array, no explanation or markdown.`;

async function parseJobSkills(description) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Job Description:\n${description}` },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  // Groq json_object wraps in an object — extract array from whatever key it uses
  return Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
}

module.exports = { parseJobSkills };
