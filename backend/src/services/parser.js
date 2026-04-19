const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractText(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

// ── Section splitter ──────────────────────────────────────────────────────────

const SECTION_HEADERS = {
  summary:    /^(summary|objective|profile|about me|professional summary)/i,
  skills:     /^(skills|technical skills|core competencies|technologies|expertise|competencies)/i,
  experience: /^(experience|work experience|work history|employment|professional experience|career)/i,
  education:  /^(education|academic|qualifications|degrees?)/i,
};

function splitSections(lines) {
  const sections = { header: [], summary: [], skills: [], experience: [], education: [], other: [] };
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

// ── Field extractors ──────────────────────────────────────────────────────────

function extractEmail(text) {
  const m = text.match(/[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : null;
}

function extractPhone(text) {
  const m = text.match(/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
  return m ? m[0].trim() : null;
}

function extractName(headerLines, text) {
  // Try first non-contact line (no @, no digits heavy)
  for (const line of headerLines) {
    if (!line.includes('@') && !/\d{5,}/.test(line) && /^[A-Za-z\s'\-\.]{3,40}$/.test(line.trim())) {
      return line.trim();
    }
  }
  // Fallback: first line of full text
  const first = text.split('\n').find(l => l.trim().length > 2 && l.trim().length < 50);
  return first ? first.trim() : null;
}

function extractSkills(skillLines) {
  const raw = skillLines.join(' ');
  // Split on common delimiters: comma, bullet, pipe, semicolon, newline
  return raw
    .split(/[,|•·▪■◆\n;]+/)
    .map(s => s.replace(/^[\s\-–*]+/, '').trim())
    .filter(s => s.length > 1 && s.length < 60 && !/^\d+$/.test(s));
}

// Date pattern: Jan 2020, 2020, 01/2020, Present, Current
const DATE_RE = /((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)/gi;

function parseDateRange(line) {
  const dates = line.match(DATE_RE) || [];
  return {
    start_date: dates[0] || null,
    end_date: dates[1] || (dates[0] ? 'Present' : null),
  };
}

function extractExperience(expLines) {
  const jobs = [];
  let current = null;
  const descLines = [];

  // Common job-line signals: line has a year or a dash between two short phrases
  const isJobLine = l => DATE_RE.test(l) || /\b(19|20)\d{2}\b/.test(l);

  for (const line of expLines) {
    if (isJobLine(line)) {
      if (current) { current.description = descLines.join(' ').trim(); jobs.push(current); descLines.length = 0; }
      const { start_date, end_date } = parseDateRange(line);
      // Remove date part to get company/title fragment
      const label = line.replace(DATE_RE, '').replace(/[-–|,]+/g, ' ').trim();
      const parts = label.split(/\s{2,}|[|–\-]\s+/);
      current = { title: parts[0] || null, company: parts[1] || null, start_date, end_date, description: '' };
    } else if (current) {
      descLines.push(line);
    }
  }
  if (current) { current.description = descLines.join(' ').trim(); jobs.push(current); }
  return jobs;
}

function extractEducation(eduLines) {
  const entries = [];
  let current = null;

  const DEGREE_RE = /\b(bachelor|master|phd|doctorate|associate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?b\.?a\.?|b\.?e\.?|m\.?e\.?)\b/i;

  for (const line of eduLines) {
    if (DEGREE_RE.test(line) || /university|college|institute|school/i.test(line)) {
      if (current) entries.push(current);
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      current = {
        institution: line.replace(DATE_RE, '').replace(DEGREE_RE, '').trim() || line,
        degree: (line.match(DEGREE_RE) || [])[0] || null,
        field: null,
        graduation_year: yearMatch ? yearMatch[0] : null,
      };
    } else if (current && !current.field) {
      current.field = line.trim();
    }
  }
  if (current) entries.push(current);
  return entries;
}

// ── Main parse function ───────────────────────────────────────────────────────

function parseStructured(rawText) {
  const lines = rawText.split('\n');
  const sections = splitSections(lines);

  const allText = rawText;
  const email = extractEmail(allText);
  const phone = extractPhone(allText);
  const candidate_name = extractName(sections.header, rawText);
  const skills = extractSkills(sections.skills);
  const summary = sections.summary.join(' ').trim() || null;
  const work_experience = extractExperience(sections.experience);
  const education = extractEducation(sections.education);

  return { candidate_name, email, phone, summary, skills, work_experience, education };
}

async function parseResume(buffer, mimeType) {
  const rawText = await extractText(buffer, mimeType);
  const structured = parseStructured(rawText);
  return { rawText, structured };
}

module.exports = { parseResume };
