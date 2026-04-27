const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const Groq     = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Text extraction ───────────────────────────────────────────────────────────

async function extractText(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

// ── AI extraction ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL information from the resume and return a single JSON object with exactly these keys:

personal_info: { name, email, phone, linkedin, github, location, website, other_links[] }
summary: string or null
skills: [{ skill, proficiency }]  — proficiency: "Expert"|"Advanced"|"Intermediate"|"Beginner"|null
experience: [{ title, company, location, start_date, end_date, description }]
projects: [{ name, github_url, description, technologies[] }]
education: [{ institution, degree, field, grade, start_date, end_date }]
certifications: [{ name, issuer, date }]
other: { languages[], awards[], publications[], volunteer[], interests[], misc[] }

Rules (follow every one):
1. personal_info.linkedin — look for any of: "linkedin.com/in/...", "LinkedIn:", "li:", "/in/username", a profile URL. Extract the full URL or path. Never skip if present.
2. personal_info.github — look for any of: "github.com/...", "GitHub:", "gh:", a GitHub URL or username after a GitHub icon or label. Never skip if present.
3. personal_info.name — the candidate's full name, usually the first prominent line.
4. skills — array of objects: { skill: string, proficiency: "Expert"|"Advanced"|"Intermediate"|"Beginner"|null }. Extract VERBATIM from the Skills/Technical Skills/Technologies section first, then supplement with tools found in experience/projects not already listed. No duplicate skill names. Infer proficiency: "Expert" = explicitly stated expert/specialist OR used in lead/architect/principal role; "Advanced" = primary tool across multiple roles or years; "Intermediate" = regularly used but not primary; "Beginner" = brief mention, familiar/exposure/learning; null = cannot determine.
5. experience.description — format using markdown: start each responsibility/achievement with "- " (dash space). Use **bold** for key achievements or metrics. Preserve all bullet points from the source.
6. education.grade — capture GPA (e.g. "3.8/4.0"), percentage, First Class, Distinction, cum laude, Honours if mentioned.
7. education.start_date and end_date — always populate both when a date range is present (e.g. "2018 - 2022" → start_date:"2018", end_date:"2022").
8. Dates — preserve exactly as written ("Jan 2020", "2020", "March 2019"); use "Present" for current roles.
9. projects — extract every project, side project, or portfolio item with its name, GitHub link (if any), description, and technologies used.
10. certifications — include all credentials, licences, and professional certificates.
11. other.languages — spoken/written human languages only (NOT programming languages).
12. Empty sections → [] for arrays, null for strings.
13. Return ONLY valid JSON — no markdown fences, no explanation.`;

function unwrapResult(raw) {
  if (!raw.personal_info && !raw.skills && !raw.experience) {
    for (const val of Object.values(raw)) {
      if (val && typeof val === 'object' && !Array.isArray(val) &&
          (val.personal_info || val.skills || val.experience)) {
        return val;
      }
    }
  }
  return raw;
}

function isRateLimit(err) {
  return err?.status === 429 ||
    err?.message?.toLowerCase().includes('429') ||
    err?.message?.toLowerCase().includes('quota') ||
    err?.message?.toLowerCase().includes('rate limit') ||
    err?.message?.toLowerCase().includes('too many requests');
}

async function parseWithOpenRouter(rawText) {
  const DELAYS = [5000, 15000];

  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: `Resume:\n\n${rawText.slice(0, 60000)}` },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!resp.ok) {
        const body = await resp.text();
        const err = new Error(`OpenRouter ${resp.status}: ${body}`);
        err.status = resp.status;
        throw err;
      }

      const data = await resp.json();
      return unwrapResult(JSON.parse(data.choices[0].message.content));

    } catch (err) {
      if (!isRateLimit(err) || attempt >= DELAYS.length) throw err;
      const waitMs = DELAYS[attempt];
      console.warn(`[parser] OpenRouter quota hit — retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${DELAYS.length})`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

async function parseWithGroq(rawText) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Resume:\n\n${rawText.slice(0, 14000)}` },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
    max_tokens: 8192,
  });
  return unwrapResult(JSON.parse(response.choices[0].message.content));
}

async function parseWithAI(rawText) {
  try {
    return await parseWithOpenRouter(rawText);
  } catch (err) {
    console.warn('[parser] OpenRouter failed, falling back to Groq:', err.message);
    return await parseWithGroq(rawText);
  }
}

// ── Regex fallback ────────────────────────────────────────────────────────────

const SECTION_HEADERS = {
  summary:    /^(summary|objective|profile|about me|professional summary)/i,
  skills:     /^(skills|technical skills|core competencies|technologies|expertise|competencies)/i,
  experience: /^(experience|work experience|work history|employment|professional experience|career)/i,
  projects:   /^(projects?|personal projects?|side projects?|portfolio)/i,
  education:  /^(education|academic|qualifications|degrees?)/i,
  certs:      /^(certifications?|certificates?|licen[cs]es?|credentials?)/i,
};

function splitSections(lines) {
  const sections = { header: [], summary: [], skills: [], experience: [], projects: [], education: [], certs: [], other: [] };
  let current = 'header';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let matched = false;
    for (const [key, re] of Object.entries(SECTION_HEADERS)) {
      if (re.test(trimmed)) { current = key; matched = true; break; }
    }
    if (!matched) sections[current].push(trimmed);
  }
  return sections;
}

function extractEmail(text) { const m = text.match(/[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/); return m ? m[0].toLowerCase() : null; }
function extractPhone(text) { const m = text.match(/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/); return m ? m[0].trim() : null; }
function extractLinkedIn(t) {
  // Match full URL, short URL, /in/user, or label-prefixed username
  const m = t.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w\-]+)/i)
          || t.match(/linkedin[\s:\/]+([a-zA-Z0-9][\w\-]{2,})/i);
  if (!m) return null;
  return `linkedin.com/in/${m[1]}`;
}
function extractGitHub(t) {
  const m = t.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([\w\-]+)/i)
          || t.match(/github[\s:\/]+([a-zA-Z0-9][\w\-]{1,})/i);
  if (!m) return null;
  return `github.com/${m[1]}`;
}

function extractName(headerLines, text) {
  for (const line of headerLines) {
    if (!line.includes('@') && !/\d{5,}/.test(line) && /^[A-Za-z\s'\-\.]{3,40}$/.test(line.trim())) return line.trim();
  }
  const first = text.split('\n').find(l => l.trim().length > 2 && l.trim().length < 50);
  return first ? first.trim() : null;
}

function extractSkills(skillLines) {
  return skillLines.join(' ').split(/[,|•·▪■◆\n;]+/)
    .map(s => s.replace(/^[\s\-–*]+/, '').trim())
    .filter(s => s.length > 1 && s.length < 60 && !/^\d+$/.test(s));
}

const DATE_RE = /((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)/gi;

function parseDateRange(line) {
  const dates = line.match(DATE_RE) || [];
  return { start_date: dates[0] || null, end_date: dates[1] || (dates[0] ? 'Present' : null) };
}

function extractExperience(expLines) {
  const jobs = []; let current = null; const descLines = [];
  const isJobLine = l => DATE_RE.test(l) || /\b(19|20)\d{2}\b/.test(l);
  for (const line of expLines) {
    if (isJobLine(line)) {
      if (current) { current.description = descLines.join(' ').trim(); jobs.push(current); descLines.length = 0; }
      const { start_date, end_date } = parseDateRange(line);
      const label = line.replace(DATE_RE, '').replace(/[-–|,]+/g, ' ').trim();
      const parts = label.split(/\s{2,}|[|–\-]\s+/);
      current = { title: parts[0] || null, company: parts[1] || null, start_date, end_date, description: '' };
    } else if (current) { descLines.push(line); }
  }
  if (current) { current.description = descLines.join(' ').trim(); jobs.push(current); }
  return jobs;
}

function extractEducation(eduLines) {
  const entries = []; let current = null;
  const DEGREE_RE = /\b(bachelor|master|phd|doctorate|associate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?b\.?a\.?|b\.?e\.?|m\.?e\.?)\b/i;
  for (const line of eduLines) {
    if (DEGREE_RE.test(line) || /university|college|institute|school/i.test(line)) {
      if (current) entries.push(current);
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      current = { institution: line.replace(DATE_RE, '').replace(DEGREE_RE, '').trim() || line, degree: (line.match(DEGREE_RE) || [])[0] || null, field: null, graduation_year: yearMatch ? yearMatch[0] : null, grade: null, start_date: null, end_date: yearMatch ? yearMatch[0] : null };
    } else if (current && !current.field) { current.field = line.trim(); }
  }
  if (current) entries.push(current);
  return entries;
}

function parseStructuredFallback(rawText) {
  const lines = rawText.split('\n');
  const sections = splitSections(lines);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const linkedin = extractLinkedIn(rawText);
  const github = extractGitHub(rawText);
  const name = extractName(sections.header, rawText);
  const skills = extractSkills(sections.skills);
  const summary = sections.summary.join(' ').trim() || null;
  const experience = extractExperience(sections.experience);
  const education = extractEducation(sections.education);

  const personal_info = { name, email, phone, linkedin, github, location: null, website: null, other_links: [] };

  return {
    candidate_name: name,
    email, phone, summary, skills,
    work_experience: experience,
    education: education.map(e => ({ institution: e.institution, degree: e.degree, field: e.field, graduation_year: e.graduation_year })),
    personal_info,
    projects: [],
    certifications: [],
    other: { languages: [], awards: [], publications: [], volunteer: [], interests: [], misc: [] },
    full_education: education,
    raw_json: { personal_info, summary, skills, experience, projects: [], education, certifications: [], other: {} },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function buildStructured(aiResult) {
  const pi = aiResult.personal_info || {};
  const education = aiResult.education || [];
  const experience = aiResult.experience || [];

  return {
    candidate_name: pi.name || null,
    email:          pi.email || null,
    phone:          pi.phone || null,
    summary:        aiResult.summary || null,
    // Skills may be string[] (old) or { skill, proficiency }[] (new) — always store strings in DB column
    skills: (aiResult.skills || []).map(s => (typeof s === 'string' ? s : s?.skill) || '').filter(Boolean),
    // Mapped to DB table columns only
    work_experience: experience.map(e => ({
      title:       e.title || null,
      company:     e.company || null,
      start_date:  e.start_date || null,
      end_date:    e.end_date || null,
      description: e.description || null,
    })),
    education: education.map(e => ({
      institution:     e.institution || null,
      degree:          e.degree || null,
      field:           e.field || null,
      graduation_year: e.end_date || null,
    })),
    // Rich data — stored as raw_json in the DB
    raw_json: aiResult,
  };
}

async function parseResume(buffer, mimeType) {
  const rawText = await extractText(buffer, mimeType);
  let structured;
  try {
    const aiResult = await parseWithAI(rawText);
    structured = buildStructured(aiResult);
  } catch (err) {
    console.error('AI parse failed, falling back to regex:', err.message);
    structured = parseStructuredFallback(rawText);
  }
  return { rawText, structured };
}

module.exports = { parseResume };
