# Resume Parser — Requirements

## Overview

A full-stack web application that allows users to upload resumes (PDF/DOCX) against job profiles, automatically extracts structured information using AI-powered parsing (Groq llama-3.3-70b-versatile), and scores each candidate using a 7-factor weighted scoring engine. Job profiles drive the scoring workflow — resumes can be uploaded standalone or linked to a job, scored automatically on upload, and ranked so recruiters can compare candidates side-by-side. Job skill requirements and resume sections are both extracted via AI. All data is stored in Supabase (PostgreSQL) and exposed via a REST API consumed by a React frontend.

---

## Tech Stack

| Layer      | Technology                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | React 18.3, Vite 6.3, TailwindCSS 3.4, TanStack Query 5.7, React Router v6, Axios 1.8 |
| Backend    | Node.js, Express 4.21, Multer 2.1, Morgan 1.10, Nodemon 3.1 (dev)         |
| Database   | Supabase (PostgreSQL)                                                      |
| Storage    | Supabase Storage (bucket: `resumes`)                                       |
| Auth       | None (open access)                                                         |
| Parsing    | pdf-parse 1.1 (PDF), mammoth 1.9 (DOCX), Groq AI (primary), regex (fallback) |
| AI         | Groq SDK 1.1 — llama-3.3-70b-versatile (resume parsing + job skill extraction) |
| Scoring    | Custom 7-factor engine (rule-based + TF-IDF cosine similarity)            |
| Deployment | Vercel (backend + frontend as separate projects)                           |

---

## Functional Requirements

### FR-01 — Resume Upload
- Job profile selection is **optional** at upload time
- Upload page pre-selects job profile when accessed via `?jobId=` query param
- Job Profile Detail page has an "Upload Resume" button linking directly to upload for that job
- Supported formats: PDF, DOC, DOCX; maximum 10 MB
- MIME type validated server-side; file stored in Supabase Storage
- Resume record stores `job_id` FK when a job is selected (nullable; SET NULL on job delete)
- On successful upload, resume is automatically scored if linked to a job profile
- Upload response includes initial `overall` score and `band` when scored
- Bulk upload supported — multiple files selectable in one operation with per-file status tracking

### FR-02 — Resume Parsing
- Raw text extracted from uploaded file (pdf-parse for PDF, mammoth for DOCX)
- Raw text persisted to database for future reparsing
- **Primary**: Groq AI (`llama-3.3-70b-versatile`, `temperature: 0.1`, `max_tokens: 8192`) extracts structured JSON with a 13-rule system prompt covering:
  - **Personal information** — name, email, phone, LinkedIn (URL, label, or `/in/username`), GitHub (URL or label), location, website, other links
  - **Summary** — professional summary or objective
  - **Skills** — extracted verbatim from the Skills section first, then supplemented from experience/projects; no duplicates
  - **Experience** — title, company, location, start/end date, description formatted as markdown bullets (`- item`) with `**bold**` for key achievements
  - **Projects** — name, GitHub URL, description, technologies list
  - **Education** — institution, degree, field, grade (GPA/percentage/honours), start date, end date
  - **Certifications** — name, issuer, date
  - **Other** — languages, awards, publications, volunteer, interests, misc
- **Fallback**: Regex-based section splitter if AI call fails; extracts name, email, phone, LinkedIn, GitHub, skills, experience, education
- Full AI output stored as `raw_json` (JSONB) for lossless retrieval and future reparsing
- Resume status transitions: `pending` → `processing` → `completed` / `failed`

### FR-03 — Resume Scoring Engine
Scores a resume against a job profile across 7 factors, each normalized to 0–1:

#### Factor 1 — Skills Match (skills_score)
- Job skills split into required (`is_required = true`) and preferred (`is_required = false`)
- `skills_score = 0.75 × required_score + 0.25 × preferred_score`
- Three-tier skill matching:
  - Exact / canonical synonym match → weight **1.0**
  - Substring containment or alias match → weight **0.9**
  - Word-overlap Jaccard similarity ≥ 0.5 → weight **0.7**
- Context multiplier: **1.0** if skill appears in work experience descriptions, **0.7** if only in skills list
- Synonym dictionary covers 40+ canonical tech terms (JavaScript↔JS, PostgreSQL↔Postgres, K8s↔Kubernetes, etc.)

#### Factor 2 — Experience (experience_score)
- `experience_score = 0.4 × years_score + 0.4 × domain_score + 0.2 × recency_score`
- **years_score**: piecewise — over-qualified capped at 1.0 with slight bonus; under-qualified penalised with exponent 1.5 (`(Y/X)^1.5`)
- **domain_score**: TF-IDF word-vector cosine similarity between job description+title and each candidate role; best match taken; scaled to [0, 1]
- **recency_score**: 1.0 if current role, 0.8 if left ≤ 2 years ago, 0.5 if ≤ 5 years, 0.3 otherwise

#### Factor 3 — Education (education_score)
- Degree hierarchy: PhD=4, Masters=3, Bachelors=2, Associates=1, HS=0
- Full score if candidate meets or exceeds required degree; deducted 0.3 per level below
- Field-of-study multiplier: exact match=1.0, related STEM field=0.9, unrelated=0.75

#### Factor 4 — Title Similarity (title_score)
- TF-IDF cosine similarity between job title and each candidate title in history
- `title_score = 0.6 × current_title_sim + 0.4 × max_historical_sim`

#### Factor 5 — Certifications (certs_score)
- Full score if no certifications required
- Otherwise: `matched_required_certs / total_required_certs`
- Cert presence checked across skills list and raw resume text

#### Factor 6 — Projects / Portfolio (projects_score)
- +0.3 if GitHub/GitLab/portfolio URL detected in resume text
- +0.4 if resume contains substantial project descriptions (>500 chars)
- +0.3 if descriptions include quantified impact (numbers, %, $, ×)

#### Factor 7 — Resume Quality (quality_score)
- +0.3 if all key sections present (name, email, experience, skills)
- +0.3 if experience descriptions contain metrics
- +0.2 if at least one work experience entry exists
- +0.2 if skills list is populated

#### Weighted Overall Score
- `overall = Σ (factor_score × weight)` for all 7 factors
- Weights are dynamically selected by **role type × seniority**:

| Role Type    | Seniority | Skills | Experience | Title | Projects | Education | Certs | Quality |
|--------------|-----------|--------|------------|-------|----------|-----------|-------|---------|
| Technical    | Senior    | 0.30   | 0.30       | 0.15  | 0.10     | 0.05      | 0.05  | 0.05    |
| Technical    | Mid       | 0.30   | 0.25       | 0.15  | 0.10     | 0.10      | 0.05  | 0.05    |
| Technical    | Junior    | 0.25   | 0.20       | 0.05  | 0.15     | 0.20      | 0.05  | 0.10    |
| Technical    | Entry     | 0.25   | 0.10       | 0.05  | 0.20     | 0.25      | 0.05  | 0.10    |
| Specialized  | Senior    | 0.25   | 0.25       | 0.10  | 0.05     | 0.10      | 0.20  | 0.05    |
| Entry-level  | Entry     | 0.25   | 0.10       | 0.05  | 0.20     | 0.25      | 0.05  | 0.10    |

#### Score Bands
| Score      | Band           |
|------------|----------------|
| 0.80–1.00  | Strong Match   |
| 0.65–0.79  | Good Match     |
| 0.50–0.64  | Moderate Match |
| Below 0.50 | Weak Match     |

- Scores stored in `resume_scores` table; upserted on upload and reparse
- Manual rescore available via API and UI "Rescore" button

### FR-04 — Resume List View
- Paginated grid of resume cards (10 per page, 3-column responsive layout)
- Each card displays: candidate name, email, status badge, top 5 skills (with "+X more" if overflow)
- Actions per card: View, Delete

### FR-05 — Resume Detail View
- **Personal information** panel: name, email, phone, clickable LinkedIn and GitHub links, location, website
- Professional summary
- Skills list (chips)
- Work experience — each entry shows title, company, date range, description rendered as rich text (markdown bullets, bold, italic)
- Projects — name, clickable GitHub link, description, technology chips
- Education — institution, degree, field, grade badge (GPA/honours), start and end dates
- Certifications — name, issuer, date
- Other — languages, awards, interests, misc
- Score breakdown panel (if linked to a job): circular gauge + per-factor bar chart with weights; shows all scores across all job profiles the candidate has been evaluated against
- Actions: Export JSON, Export CSV, Re-parse, Delete
- **Re-parse button** re-runs AI parsing on stored raw text and refreshes all sections without re-upload
- Data sourcing handles both old (pre-AI) and new `raw_json` formats for backward compatibility

### FR-06 — Delete Resume
- Deletes database record, Supabase Storage file, and all related records
- `parsed_data`, `work_experience`, `education`, and `resume_scores` cascade delete

### FR-07 — Export
- **JSON** — full structured resume object including all relations
- **CSV** — flat summary: name, email, phone, skills (semicolon-separated)
- Both trigger a browser file download

### FR-08 — Reparse
- Re-runs AI parsing on stored `raw_text` without re-uploading the file
- Deletes old `parsed_data` (cascades to `work_experience` and `education`)
- Reinserts all parsed sections from the new AI output
- Re-scores against linked job profile automatically after reparse

### FR-09 — Job Profile Management
- Create a job profile with title, description (rich text editor), scoring parameters, and a skills list
- Scoring parameters captured at creation: role type, seniority, required years of experience, minimum degree, required field of study, required certifications
- List view shows job profile **cards** with: title, candidate count badge, top 3 skill chips (+N overflow), View / Edit / Delete buttons
- Edit button navigates to the detail page in edit mode (`?edit=1` URL param)
- Delete opens a confirmation modal with **hold-to-delete** (5-second press-and-hold) to prevent accidental deletion
- Update replaces title, description, scoring parameters, and full skills list atomically

### FR-10 — AI-Powered Job Skill Extraction
- User pastes a job description and clicks "Generate Skills"
- Backend sends description to Groq (llama-3.3-70b-versatile, temperature 0.1)
- Returns structured skill array with `skill`, `proficiency`, and `is_required`
- Skills editable before saving: add, remove, change proficiency and required flag

### FR-11 — Job Profile Detail View
- Header: title, role type badge, seniority badge, creation date
- Scoring parameters summary: required years, minimum degree, required field, required certs
- Full job description (rich text display)
- Required skills and nice-to-have skills sections (color-coded by proficiency)
- Edit inline (auto-activated via `?edit=1`); hold-to-delete for the profile itself
- "Upload Resume" button linking to upload pre-scoped to this job
- **Candidates tab** — lists all resumes scored against this job, sorted by overall score descending:
  - Compact score gauge (circular) + band badge per candidate
  - Candidate name, email, top skills chips
  - Filter by score band; sort by score or name
  - Expandable score breakdown: per-factor bar chart with weight annotations
  - "Rescore" button to recompute score on demand
  - "View" button linking to full resume detail
  - **"Add Existing"** button — opens a modal to search and select resumes already in the system (not yet linked to this job); scores and adds selected resumes; candidate list refreshes immediately

### FR-12 — Post-Upload Job Profile Mapping
- Resumes uploaded without a job profile appear as unlinked
- From any Job Profile Detail page, "Add Existing" discovers unlinked (or differently-linked) resumes by email match and candidate name search
- Scoring is triggered immediately when a resume is added to a job profile via "Add Existing"

### FR-13 — Dark Theme
- Full dark/light theme toggle available globally
- Respects OS/system preference on first load
- Theme persists across sessions (localStorage)

---

## Non-Functional Requirements

### NFR-01 — Performance
- Upload + parse + score response time < 10 seconds for files under 2 MB (AI parsing adds latency vs. regex)
- Resume list page loads in < 2 seconds
- Scoring is synchronous and in-process (no queue); adds < 1 second to upload time

### NFR-02 — Reliability
- Resume status reflects processing state at all times
- Failed AI parses fall back to regex extractor — parse never leaves a resume in `processing` state
- Score upsert uses `ON CONFLICT (resume_id, job_profile_id)` to prevent duplicate rows
- Scoring errors are non-fatal — upload succeeds even if scoring fails
- AI token budget (`max_tokens: 8192`) sized to handle complex multi-page resumes without truncation

### NFR-03 — Security
- Supabase service role key used only server-side (never exposed to frontend)
- File uploads restricted to PDF/DOCX MIME types server-side
- File size capped at 10 MB via multer
- `.env` files excluded from git via `.gitignore`

### NFR-04 — Usability
- Responsive layout (mobile + desktop)
- Drag-and-drop upload with visual feedback; per-file status in bulk upload
- Loading and error states on all async operations
- React Query handles caching and background refetching
- Hold-to-delete on destructive actions prevents accidental data loss

---

## Database Schema

```
resumes          id (UUID PK), file_name, file_url, raw_text, status, job_id* (SET NULL), created_at, updated_at
parsed_data      id (UUID PK), resume_id* (CASCADE), candidate_name, email, phone, summary, skills (TEXT[]), raw_json (JSONB), created_at
                 raw_json stores full AI output: { personal_info, summary, skills, experience, projects, education, certifications, other }
work_experience  id (UUID PK), parsed_data_id* (CASCADE), company, title, start_date, end_date, description
education        id (UUID PK), parsed_data_id* (CASCADE), institution, degree, field, graduation_year
job_profiles     id (UUID PK), title, description, role_type, seniority, required_years_experience, required_degree, required_field, required_certs (TEXT[]), created_at, updated_at
job_skills       id (UUID PK), job_profile_id* (CASCADE), skill, proficiency (Expert|Advanced|Intermediate|Beginner|Nice-to-have), is_required (BOOLEAN)
resume_scores    id (UUID PK), resume_id* (CASCADE), job_profile_id* (CASCADE), overall_score, band, skills_score, experience_score, education_score, title_score, certs_score, projects_score, quality_score, candidate_years, weights_used (JSONB), breakdown (JSONB), created_at — UNIQUE(resume_id, job_profile_id)
```
`*` = foreign key; CASCADE or SET NULL as noted  
Auto-update triggers on `resumes.updated_at` and `job_profiles.updated_at`

---

## REST API Endpoints

### Resumes

| Method | Endpoint                        | Description                                               |
|--------|---------------------------------|-----------------------------------------------------------|
| POST   | /api/v1/resumes/upload          | Upload file with optional `job_id`; auto-scores if linked |
| GET    | /api/v1/resumes                 | List resumes with linked job profile info                 |
| GET    | /api/v1/resumes/:id             | Get resume with parsed data and all scores across jobs    |
| DELETE | /api/v1/resumes/:id             | Delete resume and storage file                            |
| GET    | /api/v1/resumes/:id/export      | Export as JSON or CSV                                     |
| POST   | /api/v1/resumes/:id/reparse     | Re-run AI parsing; re-scores if linked to a job           |
| POST   | /api/v1/resumes/:id/score       | Manually score resume against a given `job_id`            |

### Jobs

| Method | Endpoint                        | Description                                               |
|--------|---------------------------------|-----------------------------------------------------------|
| POST   | /api/v1/jobs/parse-skills       | AI-extract skills from job description (no DB write)      |
| POST   | /api/v1/jobs                    | Create job profile with skills and scoring parameters     |
| GET    | /api/v1/jobs                    | List all job profiles with skill data and candidate counts |
| GET    | /api/v1/jobs/:id                | Get job profile with skills                               |
| PUT    | /api/v1/jobs/:id                | Update job profile, scoring params, and skills            |
| DELETE | /api/v1/jobs/:id                | Delete job profile                                        |
| GET    | /api/v1/jobs/:id/candidates     | List scored candidates for this job (3-query approach)    |
| POST   | /api/v1/jobs/:id/score/:resumeId| Trigger or refresh scoring for a specific resume          |
| GET    | /health                         | Backend health check                                      |

---

## Project Structure

```
resume-parser/
├── database/
│   ├── schema.sql                  Base PostgreSQL schema
│   └── migrations.sql              Additive migrations (scoring columns + resume_scores table)
├── backend/
│   ├── src/
│   │   ├── index.js                Express entry point (port 3000)
│   │   ├── routes/
│   │   │   ├── resumes.js          Resume API routes
│   │   │   └── jobs.js             Job profile API routes + candidates + scoring
│   │   └── services/
│   │       ├── supabase.js         Supabase client (service role)
│   │       ├── storage.js          Supabase Storage upload/delete
│   │       ├── parser.js           Text extraction + Groq AI parser (regex fallback)
│   │       ├── jobParser.js        Groq AI job skill extractor
│   │       └── scorer.js           7-factor scoring engine
│   ├── .env                        Environment variables (not committed)
│   ├── vercel.json                 Vercel serverless config
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                 Router setup
    │   ├── main.jsx                React entry point
    │   ├── index.css               Tailwind directives + dark theme variables
    │   ├── lib/
    │   │   └── api.js              Axios API client
    │   ├── pages/
    │   │   ├── Upload.jsx          Bulk upload page with optional job profile selector
    │   │   ├── ResumeList.jsx      Paginated resume grid
    │   │   ├── ResumeDetail.jsx    Full parsed resume view with rich text + score panel
    │   │   ├── JobProfiles.jsx     Job profiles card grid with candidate counts
    │   │   ├── JobProfileCreate.jsx  Create job with AI skills + scoring params
    │   │   └── JobProfileDetail.jsx  Job detail with Candidates tab, Add Existing, rankings
    │   └── components/
    │       ├── Navbar.jsx          Navigation (Profiles, Job Profiles)
    │       ├── ResumeCard.jsx      Resume list card
    │       ├── HoldToDelete.jsx    Shared hold-to-delete button component (5s press)
    │       └── ScoreBreakdown.jsx  Circular gauge + per-factor bar chart
    ├── .env                        Frontend environment variables (not committed)
    ├── vercel.json                 Vercel SPA rewrite config
    └── package.json
```

---

## Deployment

| App      | Platform | URL                                          |
|----------|----------|----------------------------------------------|
| Backend  | Vercel   | https://backend-delta-mauve-50.vercel.app    |
| Frontend | Vercel   | https://frontend-sepia-five-92.vercel.app    |

Environment variables are configured directly in Vercel project settings (not committed to git).  
Frontend auto-deploys from GitHub on push to `main`. Backend requires manual `npx vercel --prod` from the `backend/` directory.

---

## Known Limitations

- AI parsing adds ~3–6 seconds of latency per resume vs. instant regex
- Name detection may fail on non-standard resume layouts (AI mitigates but doesn't eliminate this)
- Experience year calculation requires date patterns to be present in text
- Semantic similarity uses TF-IDF word overlap rather than neural embeddings — cosine scores on short texts are low and are linearly scaled up as a workaround
- No authentication — all data accessible to anyone with the URL
- CSV export is a flat summary only (excludes work experience and education rows)
- Old resumes (parsed before AI upgrade) show fewer sections until Re-parsed through the new AI pipeline

---

## Future Enhancements

- Authentication (Supabase Auth)
- Neural embedding-based semantic matching (replace TF-IDF with sentence embeddings)
- Hard filters before scoring (work authorisation, location, mandatory certs)
- Resume search and filter by skills, name, date range, or score band
- Resume comparison view (side-by-side two candidates)
- Email notifications when a strong match is found
