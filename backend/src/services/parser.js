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

const SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL information from the resume text and return it as a single JSON object.

The JSON must have exactly these top-level keys:

{
  "personal_info": {
    "name": string or null,
    "email": string or null,
    "phone": string or null,
    "linkedin": string or null,
    "github": string or null,
    "location": string or null,
    "website": string or null,
    "other_links": [string]
  },
  "summary": string or null,
  "skills": [string],
  "experience": [
    {
      "title": string or null,
      "company": string or null,
      "location": string or null,
      "start_date": string or null,
      "end_date": string or null,
      "description": string or null
    }
  ],
  "projects": [
    {
      "name": string or null,
      "github_url": string or null,
      "description": string or null,
      "technologies": [string]
    }
  ],
  "education": [
    {
      "institution": string or null,
      "degree": string or null,
      "field": string or null,
      "grade": string or null,
      "start_date": string or null,
      "end_date": string or null
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string or null,
      "date": string or null
    }
  ],
  "other": {
    "languages": [string],
    "awards": [string],
    "publications": [string],
    "volunteer": [string],
    "interests": [string],
    "misc": [string]
  }
}

Extraction rules:
1. skills: extract verbatim from the Skills/Technical Skills/Technologies section FIRST. Then add any additional tools or technologies found in experience and projects that are not already listed. Never duplicate.
2. experience.description: include the COMPLETE text of all responsibilities and achievements — preserve all bullet points.
3. education.grade: capture GPA (e.g. "3.8 / 4.0"), percentage, First Class, Distinction, Honours, or any other grade notation if present.
4. Dates: preserve exactly as written in the resume (e.g. "Jan 2020", "2020", "March 2019 – Present"). Use "Present" for current roles.
5. LinkedIn and GitHub: extract from URLs, labels ("LinkedIn: …"), or username patterns.
6. personal_info.other_links: capture any other URLs or social handles not already captured.
7. certifications: capture all credentials, licences, and professional certifications.
8. other.languages: spoken/written human languages only (not programming languages).
9. If a section does not exist in the resume return [] for arrays or null for strings.
10. Return ONLY the raw JSON object — no markdown fences, no commentary.`;

async function parseWithAI(rawText) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Resume:\n\n${rawText.slice(0, 14000)}` },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  });

  const raw = JSON.parse(response.choices[0].message.content);

  // If the model wrapped the result in a key, unwrap it
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

function extractEmail(text)  { const m = text.match(/[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/); return m ? m[0].toLowerCase() : null; }
function extractPhone(text)  { const m = text.match(/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/); return m ? m[0].trim() : null; }
function extractLinkedIn(t)  { const m = t.match(/linkedin\.com\/in\/[\w\-]+/i); return m ? m[0] : null; }
function extractGitHub(t)    { const m = t.match(/github\.com\/[\w\-]+/i); return m ? m[0] : null; }

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
    skills:         aiResult.skills || [],
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
