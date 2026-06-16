// Shared metadata instruction injected into every AI prompt for self-test question generation.
// Ensures every question carries skill + topic so it can be stored, retrieved, and grouped.
export const METADATA_INSTRUCTION = `For EVERY question, you MUST include two additional fields:
- "skill": The specific technology, framework, language, or discipline being tested (e.g., "React", "Python", "System Design"). Match exactly to one of the requested skills.
- "topic": The specific sub-topic or concept within that skill this question tests. Keep it 1–4 words, use title case. Examples: "Custom Hooks", "List Comprehensions", "JOIN Operations", "CAP Theorem", "Memory Management", "Error Boundaries".`;
