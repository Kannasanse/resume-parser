# Resume Parser — Requirements

## Overview

A full-stack web application that allows users to upload resumes (PDF/DOCX) against job profiles, automatically extracts structured information using rule-based parsing, and scores each candidate using a 7-factor weighted scoring engine. Job profiles drive the entire workflow — resumes are uploaded under a specific job, scored automatically on upload, and ranked so recruiters can compare candidates side-by-side. Job skill requirements are extracted via AI. All data is stored in Supabase (PostgreSQL) and exposed via a REST API consumed by a React frontend.

---

## Tech Stack

| Layer      | Technology                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | React 18.3, Vite 6.3, TailwindCSS 3.4, TanStack Query 5.7, React Router v6, Axios 1.8 |
| Backend    | Node.js, Express 4.21, Multer 2.1, Morgan 1.10, Nodemon 3.1 (dev)         |
| Database   | Supabase (PostgreSQL)                                                      |
| Storage    | Supabase Storage (bucket: `resumes`)                                       |
| Auth       | None (open access)                                                         |
| Parsing    | pdf-parse 1.1 (PDF), mammoth 1.9 (DOCX), rule-based extractor             |
| AI         | Groq SDK 1.1 — llama-3.3-70b-versatile (job skill extraction)             |
| Scoring    | Custom 7-factor engine (rule-based + TF-IDF cosine similarity)            |
| Deployment | Vercel (backend + frontend as separate projects)                           |

---

## Functional Requirements

### FR-01 — Resume Upload Under Job Profile
- User selects a job profile (required) before uploading
- Upload page pre-selects job profile when accessed via `?jobId=` query param
- Job Profile Detail page has an "Upload Resume" button linking directly to upload for that job
- Supported formats: PDF, DOC, DOCX; maximum 10 MB
- MIME type validated server-side; file stored in Supabase Storage
- Resume record stores `job_id` FK linking it to the selected job profile
- On successful upload, resume is automatically scored against the linked job profile
- Upload response includes initial `overall` score and `band` for immediate feedback

### FR-02 — Resume Parsing
- Raw text extracted from uploaded file (pdf-parse for PDF, mammoth for DOCX)
- Raw text persisted to database for future reparsing
- Rule-based extractor identifies:
  - **Name** — first non-contact, non-numeric line in resume header
  - **Email** — standard email regex
  - **Phone** — US/international format
  - **Professional summary** — text under summary/objective/profile/about me sections
  - **Skills** — comma/bullet/pipe/semicolon-separated list from skills section (2–59 char values, non-numeric)
  - **Work experience** — company, title, start date, end date, description (date patterns trigger entry detection)
  - **Education** — institution, degree, field, graduation year (degree keywords + school name patterns)
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
- Full parsed data: name, email, phone, file name, linked job profile
- Professional summary, all skills, work experience timeline, education history
- Score breakdown panel (if linked to a job): circular gauge + per-factor bar chart with weights
- Actions: Export JSON, Export CSV, Reparse, Delete

### FR-06 — Delete Resume
- Deletes database record, Supabase Storage file, and all related records
- `parsed_data`, `work_experience`, `education`, and `resume_scores` cascade delete

### FR-07 — Export
- **JSON** — full structured resume object including all relations
- **CSV** — flat summary: name, email, phone, skills (semicolon-separated)
- Both trigger a browser file download

### FR-08 — Reparse
- Re-runs parsing on stored `raw_text` without re-uploading the file
- Deletes old parsed data (cascades to child tables)
- Re-scores against linked job profile automatically after reparse

### FR-09 — Job Profile Management
- Create a job profile with title, description, scoring parameters, and a skills list
- Scoring parameters captured at creation: role type, seniority, required years of experience, minimum degree, required field of study, required certifications
- List, view, update, and delete job profiles
- Update replaces title, description, scoring parameters, and full skills list atomically

### FR-10 — AI-Powered Job Skill Extraction
- User pastes a job description and clicks "Generate Skills"
- Backend sends description to Groq (llama-3.3-70b-versatile, temperature 0.1)
- Returns structured skill array with `skill`, `proficiency`, and `is_required`
- Skills editable before saving: add, remove, change proficiency and required flag

### FR-11 — Job Profile Detail View
- Header: title, role type badge, seniority badge, creation date
- Scoring parameters summary: required years, minimum degree, required field, required certs
- Full job description
- Required skills and nice-to-have skills sections (color-coded by proficiency)
- "Upload Resume" button linking to upload pre-scoped to this job
- **Candidates tab** — lists all resumes submitted for this job, sorted by overall score descending:
  - Compact score gauge (circular) + band badge per candidate
  - Candidate name, email, top skills chips
  - Expandable score breakdown: per-factor bar chart with weight annotations
  - "Rescore" button to recompute score on demand
  - "View" button linking to full resume detail

---

## Non-Functional Requirements

### NFR-01 — Performance
- Upload + parse + score response time < 6 seconds for files under 2 MB
- Resume list page loads in < 2 seconds
- Scoring is synchronous and in-process (no queue); adds < 1 second to upload time

### NFR-02 — Reliability
- Resume status reflects processing state at all times
- Failed parses do not leave orphaned or partial records
- Score upsert uses `ON CONFLICT (resume_id, job_profile_id)` to prevent duplicate rows
- Scoring errors are non-fatal — upload succeeds even if scoring fails

### NFR-03 — Security
- Supabase service role key used only server-side (never exposed to frontend)
- File uploads restricted to PDF/DOCX MIME types server-side
- File size capped at 10 MB via multer
- `.env` files excluded from git via `.gitignore`

### NFR-04 — Usability
- Responsive layout (mobile + desktop)
- Drag-and-drop upload with visual feedback
- Loading and error states on all async operations
- React Query handles caching and background refetching

---

## Database Schema

```
resumes          id (UUID PK), file_name, file_url, raw_text, status, job_id* (SET NULL), created_at, updated_at
parsed_data      id (UUID PK), resume_id* (CASCADE), candidate_name, email, phone, summary, skills (TEXT[]), raw_json (JSONB), created_at
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
| GET    | /api/v1/resumes/:id             | Get resume with parsed data and score (if linked)         |
| DELETE | /api/v1/resumes/:id             | Delete resume and storage file                            |
| GET    | /api/v1/resumes/:id/export      | Export as JSON or CSV                                     |
| POST   | /api/v1/resumes/:id/reparse     | Re-run parsing; re-scores if linked to a job              |
| POST   | /api/v1/resumes/:id/score       | Manually score resume against a given `job_id`            |

### Jobs

| Method | Endpoint                        | Description                                               |
|--------|---------------------------------|-----------------------------------------------------------|
| POST   | /api/v1/jobs/parse-skills       | AI-extract skills from job description (no DB write)      |
| POST   | /api/v1/jobs                    | Create job profile with skills and scoring parameters     |
| GET    | /api/v1/jobs                    | List all job profiles                                     |
| GET    | /api/v1/jobs/:id                | Get job profile with skills                               |
| PUT    | /api/v1/jobs/:id                | Update job profile, scoring params, and skills            |
| DELETE | /api/v1/jobs/:id                | Delete job profile                                        |
| GET    | /api/v1/jobs/:id/candidates     | List resumes submitted for this job, sorted by score      |
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
│   │       ├── parser.js           Text extraction + rule-based parser
│   │       ├── jobParser.js        Groq AI job skill extractor
│   │       └── scorer.js           7-factor scoring engine
│   ├── .env                        Environment variables (not committed)
│   ├── vercel.json                 Vercel serverless config
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                 Router setup
    │   ├── main.jsx                React entry point
    │   ├── index.css               Tailwind directives
    │   ├── lib/
    │   │   └── api.js              Axios API client
    │   ├── pages/
    │   │   ├── Upload.jsx          Upload page with job profile selector
    │   │   ├── ResumeList.jsx      Paginated resume grid
    │   │   ├── ResumeDetail.jsx    Full parsed resume view with score panel
    │   │   ├── JobProfiles.jsx     Job profiles list
    │   │   ├── JobProfileCreate.jsx  Create job with AI skills + scoring params
    │   │   └── JobProfileDetail.jsx  Job detail with Candidates tab and rankings
    │   └── components/
    │       ├── Navbar.jsx
    │       ├── ResumeCard.jsx
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

---

## Known Limitations

- Rule-based parser accuracy depends on resume formatting conventions
- Name detection may fail on non-standard resume layouts
- Experience year calculation requires date patterns to be present in text
- Semantic similarity uses TF-IDF word overlap rather than neural embeddings — cosine scores on short texts are low and are linearly scaled up as a workaround
- No authentication — all data accessible to anyone with the URL
- CSV export is a flat summary only (excludes work experience and education rows)

---

## Future Enhancements

- Authentication (Supabase Auth)
- Neural embedding-based semantic matching (replace TF-IDF with sentence embeddings)
- Hard filters before scoring (work authorisation, location, mandatory certs)
- Resume search and filter by skills, name, date range, or score band
- Bulk resume upload
- Resume comparison view (side-by-side two candidates)
- Proficiency-aware scoring (resume skill level vs. job required level)
- Email notifications when a strong match is found
