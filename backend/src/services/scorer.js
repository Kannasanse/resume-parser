// ── Skill synonym dictionary ──────────────────────────────────────────────────

const SKILL_SYNONYMS = {
  // Languages
  javascript: ['js', 'ecmascript', 'vanilla js', 'vanilla javascript'],
  typescript: ['ts'],
  python: ['py', 'python3', 'python2'],
  golang: ['go lang', 'go programming'],
  ruby: ['ruby on rails', 'ror'],
  csharp: ['c#', 'c sharp'],
  cplusplus: ['c++', 'cpp'],
  // Databases
  postgresql: ['postgres', 'pg', 'psql'],
  mysql: ['my sql'],
  mongodb: ['mongo', 'mongo db'],
  redis: ['redis cache'],
  elasticsearch: ['elastic', 'elastic search'],
  sql: ['structured query language', 'plsql', 'pl/sql', 't-sql', 'tsql'],
  sqlite: ['sqlite3'],
  // Frontend
  react: ['react.js', 'reactjs', 'react js'],
  vue: ['vue.js', 'vuejs', 'vue js'],
  angular: ['angular.js', 'angularjs', 'angular js'],
  svelte: ['svelte.js', 'sveltejs'],
  // Backend
  node: ['node.js', 'nodejs', 'node js'],
  express: ['express.js', 'expressjs'],
  django: ['django rest framework', 'drf'],
  flask: [],
  fastapi: ['fast api'],
  spring: ['spring boot', 'spring framework', 'spring mvc'],
  dotnet: ['.net', 'asp.net', 'dotnet core', '.net core', 'asp.net core'],
  laravel: [],
  rails: ['ruby on rails', 'ror'],
  // Cloud
  aws: ['amazon web services', 'amazon aws'],
  gcp: ['google cloud', 'google cloud platform', 'google cloud provider'],
  azure: ['microsoft azure', 'ms azure'],
  // DevOps / Infra
  kubernetes: ['k8s', 'kube'],
  docker: ['containerization', 'container'],
  terraform: ['tf'],
  ansible: [],
  jenkins: [],
  'ci/cd': ['cicd', 'continuous integration', 'continuous deployment', 'continuous delivery', 'github actions', 'gitlab ci', 'circle ci', 'circleci'],
  // ML / AI
  'machine learning': ['ml'],
  'deep learning': ['dl'],
  tensorflow: ['tf'],
  pytorch: ['torch'],
  // Soft skills
  communication: ['verbal communication', 'written communication', 'interpersonal communication', 'interpersonal skills', 'communication skills'],
  leadership: ['team leadership', 'people leadership', 'lead teams', 'leading teams', 'staff leadership'],
  documentation: ['technical writing', 'technical documentation', 'document writing', 'writing documentation', 'report writing', 'specification writing', 'docs'],
  teamwork: ['collaboration', 'team collaboration', 'cross-functional collaboration', 'team player'],
  'problem solving': ['problem-solving', 'analytical thinking', 'critical thinking', 'troubleshooting'],
  presentation: ['public speaking', 'presenting', 'stakeholder presentations'],
  mentoring: ['coaching', 'mentorship', 'team mentoring'],
  'time management': ['prioritization', 'task prioritization', 'deadline management'],
  // Other
  graphql: ['graph ql', 'graph api'],
  rest: ['restful', 'rest api', 'restful api', 'rest apis'],
  git: ['github', 'gitlab', 'bitbucket', 'version control'],
  linux: ['unix', 'bash scripting', 'shell scripting'],
  agile: ['scrum', 'kanban', 'agile methodology'],
};

// Build reverse lookup: alias → canonical
const SYNONYM_MAP = {};
for (const [canonical, aliases] of Object.entries(SKILL_SYNONYMS)) {
  SYNONYM_MAP[canonical] = canonical;
  for (const alias of aliases) {
    SYNONYM_MAP[alias.toLowerCase()] = canonical;
  }
}

function normalizeSkill(skill) {
  const lower = (skill || '').toLowerCase().trim();
  return SYNONYM_MAP[lower] || lower;
}

// Proficiency hierarchy — used for gap-penalty scoring
const PROF_LEVEL = { Expert: 4, Advanced: 3, Intermediate: 2, Beginner: 1 };

// Returns a multiplier (0.40–1.0) based on how far below the job's required level the candidate is.
// No penalty when candidate meets or exceeds, or when either side is unknown.
function proficiencyMultiplier(candidateProf, jobProf) {
  if (!candidateProf || !jobProf || jobProf === 'Nice-to-have') return 1.0;
  const reqLevel  = PROF_LEVEL[jobProf];
  const candLevel = PROF_LEVEL[candidateProf];
  if (!reqLevel || !candLevel) return 1.0;
  const gap = reqLevel - candLevel;
  if (gap <= 0) return 1.0;
  if (gap === 1) return 0.85;
  if (gap === 2) return 0.65;
  return 0.40;
}

// Returns 0 (no match), 0.7 (semantic), 0.9 (synonym/partial), 1.0 (exact/canonical)
function skillMatchWeight(resumeSkill, jobSkill) {
  const rNorm = normalizeSkill(resumeSkill);
  const jNorm = normalizeSkill(jobSkill);
  if (!rNorm || !jNorm) return 0;
  if (rNorm === jNorm) return 1.0;
  // Substring containment
  if (rNorm.includes(jNorm) || jNorm.includes(rNorm)) return 0.9;
  // Word-overlap cosine similarity as semantic proxy
  const rWords = new Set(rNorm.split(/\s+/).filter(w => w.length > 2));
  const jWords = new Set(jNorm.split(/\s+/).filter(w => w.length > 2));
  if (rWords.size === 0 || jWords.size === 0) return 0;
  const intersection = [...rWords].filter(w => jWords.has(w)).length;
  const union = new Set([...rWords, ...jWords]).size;
  const jaccard = intersection / union;
  if (jaccard >= 0.5) return 0.7;
  return 0;
}

// ── Skills score ──────────────────────────────────────────────────────────────

// skillProfMap: { normalizedSkillName → proficiency } built from raw_json.skills objects
// Returns { score, detail } where detail is a per-skill proficiency breakdown
function computeSkillsScore(resumeSkills, workExperience, jobSkills, skillProfMap = {}) {
  if (!jobSkills || jobSkills.length === 0) return { score: 1.0, detail: [] };

  const requiredSkills = jobSkills.filter(s => s.is_required);
  const preferredSkills = jobSkills.filter(s => !s.is_required);

  // Build experience text for context multiplier
  const experienceText = (workExperience || [])
    .map(w => `${w.title || ''} ${w.description || ''}`)
    .join(' ')
    .toLowerCase();

  const detail = [];

  function scoreSkillList(skills) {
    if (!skills.length) return 1.0;
    let totalWeight = 0;
    let matchedWeight = 0;
    for (const jobSkill of skills) {
      let bestMatch = 0;
      let bestMatchResumeSkill = null;
      let inExperience = false;
      for (const resumeSkill of resumeSkills || []) {
        const w = skillMatchWeight(resumeSkill, jobSkill.skill);
        if (w > bestMatch) {
          bestMatch = w;
          bestMatchResumeSkill = resumeSkill;
          const sNorm = normalizeSkill(jobSkill.skill);
          inExperience =
            experienceText.includes(sNorm) ||
            experienceText.includes(jobSkill.skill.toLowerCase());
        }
      }
      const contextMultiplier = inExperience ? 1.0 : 0.7;
      const candProf = bestMatchResumeSkill ? skillProfMap[normalizeSkill(bestMatchResumeSkill)] : null;
      const profMult = proficiencyMultiplier(candProf, jobSkill.proficiency);
      const finalScore = bestMatch * contextMultiplier * profMult;
      totalWeight += 1;
      matchedWeight += finalScore;

      const reqLevel  = PROF_LEVEL[jobSkill.proficiency];
      const candLevel = PROF_LEVEL[candProf];
      detail.push({
        skill:                jobSkill.skill,
        isRequired:           !!jobSkill.is_required,
        jobProficiency:       jobSkill.proficiency || null,
        candidateProficiency: candProf || null,
        matched:              bestMatch > 0,
        proficiencyGap:       (reqLevel && candLevel) ? reqLevel - candLevel : null,
        score:                Math.round(finalScore * 100) / 100,
      });
    }
    return totalWeight > 0 ? matchedWeight / totalWeight : 1.0;
  }

  const requiredScore = scoreSkillList(requiredSkills);
  const preferredScore = preferredSkills.length > 0 ? scoreSkillList(preferredSkills) : 1.0;
  return { score: 0.75 * requiredScore + 0.25 * preferredScore, detail };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const MONTH_MAP = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };

function parseYear(dateStr) {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase();
  if (lower.includes('present') || lower.includes('current') || lower.includes('now')) {
    return new Date().getFullYear();
  }
  const m = dateStr.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0]) : null;
}

function parseMonth(dateStr) {
  if (!dateStr) return 6;
  const lower = dateStr.toLowerCase();
  for (const [abbr, num] of Object.entries(MONTH_MAP)) {
    if (lower.includes(abbr)) return num;
  }
  return 6;
}

function isCurrentRole(endDate) {
  if (!endDate) return true;
  const lower = endDate.toLowerCase();
  return lower.includes('present') || lower.includes('current') || lower.includes('now');
}

// Education institutions should not count toward employment years
const EDUCATION_INSTITUTION_RE = /\b(university|college|school|institute|academy|polytechnic|conservatory)\b/i;
const EDUCATION_TITLE_RE = /\b(student|bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|graduate|undergraduate|coursework|diploma)\b/i;

function isEducationalEntry(job) {
  const company = (job.company || '').toLowerCase();
  const title   = (job.title   || '').toLowerCase();
  return EDUCATION_INSTITUTION_RE.test(company) && EDUCATION_TITLE_RE.test(title);
}

function calcTotalYearsExperience(workExperience) {
  let totalMonths = 0;
  for (const job of (workExperience || []).filter(j => !isEducationalEntry(j))) {
    const startYear = parseYear(job.start_date);
    const endYear = parseYear(job.end_date || 'present');
    if (!startYear || !endYear) continue;
    const months = (endYear - startYear) * 12 + (parseMonth(job.end_date || 'present') - parseMonth(job.start_date));
    if (months > 0) totalMonths += months;
  }
  return totalMonths / 12;
}

// ── Experience score ──────────────────────────────────────────────────────────

function wordVector(text) {
  const freq = {};
  for (const w of (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)) {
    if (w.length > 2) freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

function cosineSimilarity(a, b) {
  const keysA = Object.keys(a);
  if (!keysA.length || !Object.keys(b).length) return 0;
  let dot = 0;
  for (const k of keysA) if (b[k]) dot += a[k] * b[k];
  const magA = Math.sqrt(keysA.reduce((s, k) => s + a[k] ** 2, 0));
  const magB = Math.sqrt(Object.values(b).reduce((s, v) => s + v ** 2, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

function computeYearsScore(candidateYears, requiredYears) {
  if (!requiredYears || requiredYears === 0) return 1.0;
  if (candidateYears >= requiredYears) {
    return Math.min(1.0, 0.8 + 0.2 * (candidateYears - requiredYears) / requiredYears);
  }
  return Math.pow(candidateYears / requiredYears, 1.5);
}

function computeDomainScore(workExperience, jobDescription, jobTitle) {
  if (!workExperience || workExperience.length === 0) return 0;
  const jdVec = wordVector(`${jobTitle || ''} ${jobDescription || ''}`);
  let max = 0;
  for (const role of workExperience) {
    const sim = cosineSimilarity(jdVec, wordVector(`${role.title || ''} ${role.company || ''} ${role.description || ''}`));
    if (sim > max) max = sim;
  }
  return Math.min(1.0, max * 2); // scale up since raw cosine on short texts is low
}

function computeRecencyScore(workExperience) {
  if (!workExperience || workExperience.length === 0) return 0.3;
  const currentYear = new Date().getFullYear();
  const sorted = [...workExperience].sort((a, b) => (parseYear(b.end_date) || 0) - (parseYear(a.end_date) || 0));
  const top = sorted[0];
  if (isCurrentRole(top.end_date)) return 1.0;
  const yearsAgo = currentYear - (parseYear(top.end_date) || currentYear);
  if (yearsAgo <= 2) return 0.8;
  if (yearsAgo <= 5) return 0.5;
  return 0.3;
}

function computeExperienceScore(workExperience, jobProfile) {
  const candidateYears = calcTotalYearsExperience(workExperience);
  const yearsScore   = computeYearsScore(candidateYears, jobProfile.required_years_experience || 0);
  const domainScore  = computeDomainScore(workExperience, jobProfile.description, jobProfile.title);
  const recencyScore = computeRecencyScore(workExperience);
  return { score: 0.4 * yearsScore + 0.4 * domainScore + 0.2 * recencyScore, candidateYears };
}

// ── Education score ───────────────────────────────────────────────────────────

const DEGREE_LEVELS = {
  phd: 4, doctorate: 4, 'ph.d': 4,
  masters: 3, master: 3, ms: 3, 'm.s': 3, mba: 3, ma: 3, 'm.a': 3, 'master of': 3,
  bachelors: 2, bachelor: 2, bs: 2, 'b.s': 2, ba: 2, 'b.a': 2, be: 2, 'b.e': 2, bsc: 2, 'b.sc': 2, 'bachelor of': 2,
  associates: 1, associate: 1,
  'high school': 0, hs: 0,
};

const REQUIRED_DEGREE_MAP = { PhD: 4, Masters: 3, Bachelors: 2, Associates: 1, HS: 0, None: null };

function getDegreeLevel(degreeStr) {
  if (!degreeStr) return null;
  const lower = degreeStr.toLowerCase();
  for (const [key, level] of Object.entries(DEGREE_LEVELS)) {
    if (lower.includes(key)) return level;
  }
  return null;
}

const TECH_FIELD_WORDS = ['computer', 'software', 'engineering', 'information', 'data', 'math', 'science', 'technology', 'computing'];

function computeEducationScore(education, requiredDegree, requiredField) {
  if (!requiredDegree || requiredDegree === 'None') return 1.0;
  const requiredLevel = REQUIRED_DEGREE_MAP[requiredDegree];
  if (requiredLevel === null || requiredLevel === undefined) return 1.0;

  let bestLevel = 0;
  let bestField = null;
  for (const edu of education || []) {
    const level = getDegreeLevel(edu.degree);
    if (level !== null && level >= bestLevel) {
      bestLevel = level;
      bestField = edu.field;
    }
  }

  let score = bestLevel >= requiredLevel
    ? 1.0
    : Math.max(0, 1.0 - (requiredLevel - bestLevel) * 0.3);

  if (requiredField && bestField) {
    const rF = requiredField.toLowerCase();
    const cF = bestField.toLowerCase();
    if (!cF.includes(rF) && !rF.includes(cF)) {
      const rTech = TECH_FIELD_WORDS.some(w => rF.includes(w));
      const cTech = TECH_FIELD_WORDS.some(w => cF.includes(w));
      score *= (rTech && cTech) ? 0.9 : 0.75;
    }
  }
  return score;
}

// ── Title similarity ──────────────────────────────────────────────────────────

function computeTitleScore(workExperience, jobTitle) {
  if (!workExperience || workExperience.length === 0 || !jobTitle) return 0;
  const jdVec = wordVector(jobTitle);
  const sorted = [...workExperience].sort((a, b) => (parseYear(b.end_date) || 0) - (parseYear(a.end_date) || 0));
  const currentSim = cosineSimilarity(jdVec, wordVector(sorted[0]?.title || ''));
  let maxHistorical = 0;
  for (const role of sorted.slice(1)) {
    const sim = cosineSimilarity(jdVec, wordVector(role.title || ''));
    if (sim > maxHistorical) maxHistorical = sim;
  }
  // Scale up since cosine on short title strings is low; cap at 1
  const raw = 0.6 * currentSim + 0.4 * maxHistorical;
  return Math.min(1.0, raw * 3);
}

// ── Certifications score ──────────────────────────────────────────────────────

function computeCertScore(resumeSkills, rawText, requiredCerts) {
  if (!requiredCerts || requiredCerts.length === 0) return 1.0;
  const allSkillsText = (resumeSkills || []).map(s => s.toLowerCase()).join(' ');
  const rawLower = (rawText || '').toLowerCase();
  let matched = 0;
  for (const cert of requiredCerts) {
    const certLower = cert.toLowerCase();
    if (allSkillsText.includes(certLower) || rawLower.includes(certLower)) matched++;
  }
  return Math.min(1.0, matched / requiredCerts.length);
}

// ── Project/Portfolio score ───────────────────────────────────────────────────

function computeProjectScore(summary, workExperience, rawText) {
  const allText = [summary || '', ...(workExperience || []).map(w => w.description || ''), rawText || ''].join(' ').toLowerCase();
  let score = 0;
  if (/github\.com|gitlab\.com|portfolio|bitbucket|behance|dribbble/.test(allText)) score += 0.3;
  if (allText.length > 500) score += 0.4; // substantial descriptions imply project depth
  if (/\d+\s*%|\bincreased\b|\bdecreased\b|\bimproved\b|\breduced\b|\bsaved\b|\$\d+|\d+x\b|\bmillion\b|\bthousand\b/.test(allText)) score += 0.3;
  return Math.min(1.0, score);
}

// ── Resume quality score ──────────────────────────────────────────────────────

function computeQualityScore(parsedData, workExperience) {
  let score = 0;
  if (parsedData.candidate_name && parsedData.email && workExperience?.length > 0 && parsedData.skills?.length > 0) score += 0.3;
  const allDesc = (workExperience || []).map(w => w.description || '').join(' ');
  if (/\d+\s*%|\bincreased\b|\bdecreased\b|\bimproved\b|\$\d+|\d+x\b|\bmillion\b/.test(allDesc)) score += 0.3;
  if (workExperience?.length >= 1) score += 0.2;
  if (parsedData.skills?.length > 0) score += 0.2;
  return Math.min(1.0, score);
}

// ── Weights by role type and seniority ────────────────────────────────────────

const WEIGHTS = {
  technical: {
    senior: { skills: 0.30, experience: 0.30, title: 0.15, projects: 0.10, education: 0.05, certs: 0.05, quality: 0.05 },
    mid:    { skills: 0.30, experience: 0.25, title: 0.15, projects: 0.10, education: 0.10, certs: 0.05, quality: 0.05 },
    junior: { skills: 0.25, experience: 0.20, education: 0.20, projects: 0.15, quality: 0.10, title: 0.05, certs: 0.05 },
    entry:  { skills: 0.25, education: 0.25, projects: 0.20, experience: 0.10, quality: 0.10, title: 0.05, certs: 0.05 },
  },
  specialized: {
    senior: { skills: 0.25, certs: 0.20, experience: 0.25, education: 0.10, title: 0.10, projects: 0.05, quality: 0.05 },
    mid:    { skills: 0.25, certs: 0.20, experience: 0.20, education: 0.10, title: 0.10, projects: 0.10, quality: 0.05 },
    junior: { skills: 0.25, certs: 0.15, experience: 0.15, education: 0.15, title: 0.10, projects: 0.10, quality: 0.10 },
    entry:  { skills: 0.25, education: 0.20, certs: 0.15, projects: 0.15, experience: 0.10, quality: 0.10, title: 0.05 },
  },
  'entry-level': {
    entry:  { skills: 0.25, education: 0.25, projects: 0.20, experience: 0.10, quality: 0.10, title: 0.05, certs: 0.05 },
    junior: { skills: 0.25, education: 0.20, projects: 0.20, experience: 0.15, quality: 0.10, title: 0.05, certs: 0.05 },
    mid:    { skills: 0.30, experience: 0.20, education: 0.15, projects: 0.15, title: 0.10, quality: 0.05, certs: 0.05 },
    senior: { skills: 0.30, experience: 0.30, title: 0.15, projects: 0.10, education: 0.05, certs: 0.05, quality: 0.05 },
  },
};

function getWeights(roleType, seniority, customWeights) {
  if (customWeights && typeof customWeights === 'object') {
    // Normalise to fractions if stored as percentages (e.g. 30 → 0.30)
    const vals = Object.values(customWeights);
    const isPercent = vals.some(v => v > 1);
    return Object.fromEntries(
      Object.entries(customWeights).map(([k, v]) => [k, isPercent ? v / 100 : v])
    );
  }
  const roleWeights = WEIGHTS[roleType] || WEIGHTS.technical;
  return roleWeights[seniority] || roleWeights.mid || roleWeights.senior;
}

function interpretScore(score) {
  if (score >= 0.80) return 'Strong Match';
  if (score >= 0.65) return 'Good Match';
  if (score >= 0.50) return 'Moderate Match';
  return 'Weak Match';
}

// ── Hard filters ──────────────────────────────────────────────────────────────
// Extend this function as more hard-filter fields are added to job_profiles.
function passesHardFilters(/* jobProfile */) {
  return true;
}

// ── Main scorer ───────────────────────────────────────────────────────────────

async function scoreResume(resumeId, jobProfileId, supabase) {
  const [{ data: resume }, { data: jobProfile }] = await Promise.all([
    supabase
      .from('resumes')
      .select('raw_text, parsed_data(candidate_name, email, skills, summary, raw_json, work_experience(*), education(*))')
      .eq('id', resumeId)
      .single(),
    supabase
      .from('job_profiles')
      .select('*, job_skills(*)')
      .eq('id', jobProfileId)
      .single(),
  ]);

  if (!resume || !jobProfile) return null;

  if (!passesHardFilters(jobProfile)) {
    return { overall: 0, band: 'Rejected', breakdown: {}, weights_used: {}, candidateYears: 0 };
  }

  const pd = resume.parsed_data?.[0] || {};
  const workExperience = pd.work_experience || [];
  const education = pd.education || [];

  // Build proficiency map from raw_json.skills when the AI returned objects { skill, proficiency }
  const rawJsonSkills = pd.raw_json?.skills || [];
  const skillProfMap = {};
  for (const s of rawJsonSkills) {
    if (s && typeof s === 'object' && s.skill && s.proficiency) {
      skillProfMap[normalizeSkill(s.skill)] = s.proficiency;
    }
  }

  const { score: experienceScore, candidateYears } = computeExperienceScore(workExperience, jobProfile);
  const { score: skillsScore, detail: skillsDetail } = computeSkillsScore(pd.skills, workExperience, jobProfile.job_skills, skillProfMap);

  const scores = {
    skills:     skillsScore,
    experience: experienceScore,
    education:  computeEducationScore(education, jobProfile.required_degree, jobProfile.required_field),
    title:      computeTitleScore(workExperience, jobProfile.title),
    certs:      computeCertScore(pd.skills, resume.raw_text, jobProfile.required_certs),
    projects:   computeProjectScore(pd.summary, workExperience, resume.raw_text),
    quality:    computeQualityScore(pd, workExperience),
  };

  const weights = getWeights(jobProfile.role_type || 'technical', jobProfile.seniority || 'mid', jobProfile.custom_weights);
  const overall = Math.round(Object.keys(scores).reduce((sum, k) => sum + scores[k] * (weights[k] || 0), 0) * 100) / 100;

  return {
    overall,
    band: interpretScore(overall),
    breakdown: { ...scores, skillsDetail },
    weights_used: weights,
    candidateYears,
  };
}

async function upsertScore(resumeId, jobProfileId, supabase) {
  const result = await scoreResume(resumeId, jobProfileId, supabase);
  if (!result) return null;

  const { overall, band, breakdown, weights_used, candidateYears } = result;

  await supabase.from('resume_scores').upsert({
    resume_id: resumeId,
    job_profile_id: jobProfileId,
    overall_score: overall,
    band,
    skills_score:     breakdown.skills,
    experience_score: breakdown.experience,
    education_score:  breakdown.education,
    title_score:      breakdown.title,
    certs_score:      breakdown.certs,
    projects_score:   breakdown.projects,
    quality_score:    breakdown.quality,
    candidate_years:  candidateYears,
    weights_used,
    breakdown,
  }, { onConflict: 'resume_id,job_profile_id' });

  return result;
}

module.exports = { scoreResume, upsertScore, getWeights, interpretScore };
