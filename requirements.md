# Resume Parser — Requirements

## Overview

A full-stack web application that allows users to upload resumes (PDF/DOCX), automatically extracts structured information using rule-based parsing, and manages job profiles with AI-powered skill extraction. The system stores all data in Supabase (PostgreSQL) and exposes a REST API consumed by a React frontend.

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

---

## Functional Requirements

### FR-01 — Resume Upload
- User uploads a resume via drag-and-drop or file browser
- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10 MB (enforced by multer server-side)
- MIME type validated server-side before processing
- File stored in Supabase Storage with timestamped filename
- Public file URL saved to database

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

### FR-03 — Resume List View
- Paginated grid of resume cards (10 per page, 3-column responsive layout)
- Each card displays: candidate name, email, status badge, top 5 skills (with "+X more" if overflow)
- Actions per card: View, Delete
- Header shows total resume count and Upload button

### FR-04 — Resume Detail View
- Full parsed data: name, email, phone, file name
- Professional summary (if extracted)
- All skills as color-coded badges
- Work experience timeline: title, company, dates, description
- Education history: institution, degree, field, graduation year
- Actions: Export JSON, Export CSV, Reparse, Delete

### FR-05 — Delete Resume
- Deletes database record, Supabase Storage file, and all related records
- `parsed_data`, `work_experience`, and `education` cascade delete via foreign keys

### FR-06 — Export
- **JSON** — full structured resume object including all relations
- **CSV** — flat summary: name, email, phone, skills (semicolon-separated)
- Both trigger a browser file download

### FR-07 — Reparse
- Re-runs parsing on stored `raw_text` without re-uploading the file
- Deletes old `parsed_data` (cascades to `work_experience`, `education`)
- Inserts new parsed result and updates resume status

### FR-08 — Job Profile Management
- Create a job profile with title, description, and a skills list
- List all job profiles (shows title, description, creation date, skill count)
- View a job profile with required and nice-to-have skills grouped separately
- Update a job profile (replaces title, description, and full skills list)
- Delete a job profile (cascades to `job_skills`)

### FR-09 — AI-Powered Job Skill Extraction
- User pastes a job description and clicks "Generate Skills"
- Backend sends description to Groq (llama-3.3-70b-versatile, temperature 0.1)
- Returns structured skill array — no duplicates — with:
  - `skill`: canonical name (e.g., "React", "PostgreSQL", "Docker")
  - `proficiency`: Expert | Advanced | Intermediate | Beginner | Nice-to-have
  - `is_required`: boolean (true = mandatory, false = preferred/optional)
- Returned skills are editable before saving: add, remove, change proficiency/required flag

### FR-10 — Job Profile Detail View
- Displays title, description, and creation date
- Required skills section (is_required = true)
- Nice-to-have skills section (is_required = false)
- Each skill shows name and proficiency badge (color-coded by level)
- Delete button

---

## Non-Functional Requirements

### NFR-01 — Performance
- Upload + parse response time < 5 seconds for files under 2 MB
- Resume list page loads in < 2 seconds

### NFR-02 — Reliability
- Resume status reflects processing state at all times
- Failed parses do not leave orphaned or partial records
- Reparse deletes old data before inserting new

### NFR-03 — Security
- Supabase service role key used only server-side (never exposed to frontend)
- Supabase publishable key used client-side only
- File uploads restricted to PDF/DOCX MIME types server-side
- File size capped at 10 MB via multer

### NFR-04 — Usability
- Responsive layout (mobile + desktop)
- Drag-and-drop upload with visual feedback
- Loading and error states on all async operations
- React Query handles caching and background refetching

---

## Database Schema

```
resumes          id (UUID PK), file_name, file_url, raw_text, status (pending|processing|completed|failed), created_at, updated_at
parsed_data      id (UUID PK), resume_id* (CASCADE), candidate_name, email, phone, summary, skills (TEXT[]), raw_json (JSONB), created_at
work_experience  id (UUID PK), parsed_data_id* (CASCADE), company, title, start_date, end_date, description
education        id (UUID PK), parsed_data_id* (CASCADE), institution, degree, field, graduation_year
job_profiles     id (UUID PK), title, description, created_at, updated_at
job_skills       id (UUID PK), job_profile_id* (CASCADE), skill, proficiency (Expert|Advanced|Intermediate|Beginner|Nice-to-have), is_required (BOOLEAN DEFAULT true)
```
`*` = foreign key with ON DELETE CASCADE  
Auto-update triggers on `resumes.updated_at` and `job_profiles.updated_at`

---

## REST API Endpoints

### Resumes

| Method | Endpoint                        | Description                              |
|--------|---------------------------------|------------------------------------------|
| POST   | /api/v1/resumes/upload          | Upload file, parse, store                |
| GET    | /api/v1/resumes                 | List resumes (page, limit query params)  |
| GET    | /api/v1/resumes/:id             | Get resume with parsed data              |
| DELETE | /api/v1/resumes/:id             | Delete resume and storage file           |
| GET    | /api/v1/resumes/:id/export      | Export as JSON or CSV (format param)     |
| POST   | /api/v1/resumes/:id/reparse     | Re-run parsing on stored raw text        |

### Jobs

| Method | Endpoint                        | Description                              |
|--------|---------------------------------|------------------------------------------|
| POST   | /api/v1/jobs/parse-skills       | AI-extract skills from job description   |
| POST   | /api/v1/jobs                    | Create job profile with skills           |
| GET    | /api/v1/jobs                    | List all job profiles                    |
| GET    | /api/v1/jobs/:id                | Get job profile with skills              |
| PUT    | /api/v1/jobs/:id                | Update job profile and skills            |
| DELETE | /api/v1/jobs/:id                | Delete job profile                       |
| GET    | /health                         | Backend health check                     |

---

## Project Structure

```
Resume Grader/
├── database/
│   └── schema.sql                  PostgreSQL schema for Supabase
├── backend/
│   ├── src/
│   │   ├── index.js                Express entry point (port 3000)
│   │   ├── routes/
│   │   │   ├── resumes.js          Resume API routes
│   │   │   └── jobs.js             Job profile API routes
│   │   └── services/
│   │       ├── supabase.js         Supabase client (service role)
│   │       ├── storage.js          Supabase Storage upload/delete
│   │       ├── parser.js           Text extraction + rule-based parser
│   │       └── jobParser.js        Groq AI job skill extractor
│   ├── .env                        Environment variables (not committed)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                 Router setup
    │   ├── main.jsx                React entry point
    │   ├── index.css               Tailwind directives
    │   ├── lib/
    │   │   └── api.js              Axios API client
    │   ├── pages/
    │   │   ├── Upload.jsx          File upload page
    │   │   ├── ResumeList.jsx      Paginated resume grid
    │   │   ├── ResumeDetail.jsx    Full parsed resume view
    │   │   ├── JobProfiles.jsx     Job profiles list
    │   │   ├── JobProfileCreate.jsx  Create job profile with AI skill parsing
    │   │   └── JobProfileDetail.jsx  Job profile detail view
    │   └── components/
    │       ├── Navbar.jsx
    │       └── ResumeCard.jsx
    ├── .env                        Frontend environment variables (not committed)
    └── package.json
```

---

## Known Limitations

- Rule-based parser accuracy depends on resume formatting conventions
- Name detection may fail on non-standard resume layouts
- Experience parsing relies on date patterns being present in the text
- No authentication — all data accessible to anyone with the URL
- CSV export is a flat summary only (excludes work experience and education rows)
- No resume-to-job matching or scoring implemented yet

---

## Future Enhancements

- Resume-to-job matching with skill overlap scoring
- Authentication (Supabase Auth)
- Resume search and filter by skills, name, or date range
- Bulk upload support
- Resume comparison view
- Proficiency-aware scoring (resume skill level vs. job required level)
