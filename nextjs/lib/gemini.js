import { GoogleGenAI } from '@google/genai';
import { jsonrepair } from 'jsonrepair';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Call Gemini 3.5 Flash and return the text response.
 * @param {string|Array} contents - Prompt string, or array of {role, parts} turns.
 * @param {object} opts
 * @param {string}  opts.system      - Optional system instruction text.
 * @param {boolean} opts.json        - If true, request JSON output and parse it.
 * @param {number}  opts.temperature - Defaults to 0.7.
 * @param {number}  opts.maxTokens   - Defaults to 2048.
 */
export async function callGemini(contents, opts = {}) {
  const { system, json = false, temperature = 0.7, maxTokens = 8192 } = opts;

  const config = {
    temperature,
    maxOutputTokens: maxTokens,
    ...(json ? { responseMimeType: 'application/json' } : {}),
    ...(system ? { systemInstruction: system } : {}),
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: typeof contents === 'string' ? contents : contents,
    config,
  });

  const text = response.text;

  if (json) {
    try {
      return JSON.parse(text);
    } catch {
      // Strip markdown fences if model wrapped the JSON
      const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      try {
        return JSON.parse(stripped);
      } catch {
        // Last resort: use jsonrepair to fix unescaped newlines, trailing commas, etc.
        try {
          return JSON.parse(jsonrepair(stripped));
        } catch (e) {
          console.error('[callGemini] JSON parse failed after repair. Raw output (last 200 chars):', text.slice(-200));
          throw e;
        }
      }
    }
  }

  return text;
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
