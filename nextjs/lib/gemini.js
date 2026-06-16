import { GoogleGenAI } from '@google/genai';
import { jsonrepair } from 'jsonrepair';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_STATUSES = new Set([429, 503, 500, 502, 504]);

// ── Groq fallback ─────────────────────────────────────────────────────────────

async function callGroqFallback(contents, opts = {}) {
  const { system, json = false, temperature = 0.7, maxTokens = 8192 } = opts;

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });

  if (typeof contents === 'string') {
    messages.push({ role: 'user', content: contents });
  } else {
    for (const turn of contents) {
      const role = turn.role === 'model' ? 'assistant' : (turn.role || 'user');
      const text = Array.isArray(turn.parts)
        ? turn.parts.map(p => (typeof p === 'string' ? p : p.text || '')).join('')
        : (turn.parts?.text || String(turn.parts || ''));
      messages.push({ role, content: text });
    }
  }

  if (json) {
    messages.push({ role: 'user', content: 'Respond with valid JSON only, no markdown fences.' });
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq fallback failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  if (json) {
    return parseJson(text);
  }
  return text;
}

// ── JSON parse helper ─────────────────────────────────────────────────────────

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(stripped);
    } catch {
      try {
        return JSON.parse(jsonrepair(stripped));
      } catch (e) {
        console.error('[AI] JSON parse failed after repair. Raw (last 200):', text.slice(-200));
        throw e;
      }
    }
  }
}

// ── Primary: Gemini 3.5 Flash ─────────────────────────────────────────────────

/**
 * Call Gemini 3.5 Flash. On 429/503/5xx automatically retries with Groq llama-3.3-70b.
 *
 * @param {string|Array} contents - Prompt string, or array of {role, parts} turns.
 * @param {object} opts
 * @param {string}  opts.system      - Optional system instruction text.
 * @param {boolean} opts.json        - If true, request JSON output and parse it.
 * @param {number}  opts.temperature - Defaults to 0.7.
 * @param {number}  opts.maxTokens   - Defaults to 8192.
 */
export async function callGemini(contents, opts = {}) {
  const { system, json = false, temperature = 0.7, maxTokens = 8192 } = opts;

  try {
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
      return parseJson(text);
    }
    return text;

  } catch (err) {
    // Check for rate-limit / overload / server error — fall back to Groq
    const status = err?.status ?? err?.httpStatus ?? err?.response?.status;
    const isRetryable =
      FALLBACK_STATUSES.has(status) ||
      /503|429|overloaded|rate.?limit|quota|unavailable/i.test(err?.message || '');

    if (isRetryable) {
      console.warn(`[callGemini] Gemini error (${status ?? err?.message}), falling back to Groq llama-3.3-70b`);
      return callGroqFallback(contents, opts);
    }

    throw err;
  }
}

// ── Usage tracking (unchanged) ────────────────────────────────────────────────

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
