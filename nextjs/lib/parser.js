import pdfParse from 'pdf-parse';
import mammoth  from 'mammoth';
import Groq     from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

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

async function parseWithAI(rawText) {
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

  const raw = JSON.parse(response.choices[0].message.content);
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

function extractName(headerLines, text) {
  for (const line of headerLines) {
    if (!line.includes('@') && !/\d{5,}/.test(line) && /^[A-Za-z\s'\-\.]{3,40}$/.test(line.trim())) return line.trim();
  }
  return null;
}

function fallbackParse(rawText) {
  const lines = rawText.split('\n');
  const sections = splitSections(lines);
  const allText = rawText;
  return {
    candidate_name: extractName(sections.header, allText),
    email:          extractEmail(allText),
    phone:          extractPhone(allText),
    summary:        sections.summary.join(' ') || null,
    skills:         sections.skills.flatMap(l => l.split(/[,;|•·]/)).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40),
    work_experience: [],
    education:      [],
    raw_json:       null,
  };
}

export async function parseResume(buffer, mimeType) {
  const rawText = await extractText(buffer, mimeType);

  try {
    const ai = await parseWithAI(rawText);
    const pi = ai.personal_info || {};

    const skillsArr = (ai.skills || []).map(s => (typeof s === 'string' ? s : s?.skill) || '').filter(Boolean);

    const structured = {
      candidate_name: pi.name || ai.candidate_name || null,
      email:          pi.email || ai.email || null,
      phone:          pi.phone || ai.phone || null,
      summary:        ai.summary || null,
      skills:         skillsArr,
      work_experience: (ai.experience || []).map(e => ({
        title:       e.title,
        company:     e.company,
        location:    e.location,
        start_date:  e.start_date,
        end_date:    e.end_date,
        description: e.description,
      })),
      education: (ai.education || []).map(e => ({
        institution:     e.institution,
        degree:          e.degree,
        field:           e.field,
        grade:           e.grade,
        start_date:      e.start_date,
        end_date:        e.end_date,
        graduation_year: e.end_date || e.graduation_year,
      })),
      raw_json: ai,
    };

    return { rawText, structured };
  } catch {
    return { rawText, structured: fallbackParse(rawText) };
  }
}
