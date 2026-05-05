# Resume Parser & Builder — Requirements

## Overview

A full-stack web application with two personas:

- **Admin** — uploads resumes, manages job profiles, scores candidates, and administers platform users
- **User** — builds and manages personal resumes using an AI-assisted resume builder with multiple templates

Authentication supports email/password and Google SSO. Role-based access control (RBAC) gates all routes and API endpoints. All data is stored in Supabase (PostgreSQL) and exposed via Next.js API routes consumed by the same Next.js frontend.

---

## Tech Stack

| Layer        | Technology                                                                                  |
|--------------|---------------------------------------------------------------------------------------------|
| Frontend     | Next.js 15 (App Router), React 18.3, TailwindCSS 3.4, TanStack Query 5.74                 |
| API          | Next.js API Routes (`/app/api/v1/...`) — same deployment as the frontend                   |
| Backend      | Node.js, Express 4.x (handles file upload, parsing, storage; separate Vercel deployment)   |
| Database     | Supabase (PostgreSQL)                                                                       |
| Storage      | Supabase Storage (bucket: `resumes`)                                                        |
| Auth         | Supabase Auth (`@supabase/ssr`) — email/password + Google OAuth                            |
| Email        | Resend (transactional email); console fallback in development                               |
| Parsing      | pdf-parse 1.1 (PDF), mammoth 1.9 (DOCX), pdfjs-dist 5.6 (PDF fallback)                    |
| AI — Parse   | OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`) → Groq (`meta-llama/llama-4-scout-17b-16e-instruct`) → regex fallback |
| AI — Score Summary | OpenRouter → Groq fallback — generates strengths/gaps JSON after each score        |
| Scoring      | Custom 7-factor engine (rule-based + TF-IDF cosine similarity)                             |
| Export       | SheetJS (`xlsx`) — client-side Excel export for candidates list                            |
| Deployment   | Vercel — Next.js app; Express backend as separate project                                   |

---

## User Roles

| Role  | Access                                                                                      |
|-------|---------------------------------------------------------------------------------------------|
| Admin | Profiles, Job Profiles, Builder, Dashboard (user management, invites, import)              |
| User  | Builder only                                                                                |

---

## Functional Requirements

---

### Authentication & Access Control

#### FR-AUTH-01 — User Sign-Up (Email/Password)
- Sign-up form collects First Name, Last Name, Email, Password, Confirm Password
- Password strength meter (4-segment bar: Weak / Fair / Good / Strong) — requires 8+ chars, uppercase, number, special character
- Show/hide password toggle
- Inline validation for all fields; `EMAIL_EXISTS` code returns field-level error
- On success: verification email sent via Resend; "Check your inbox" confirmation screen shown
- Resend verification link available from confirmation screen (rate-limited: 3 per hour)

#### FR-AUTH-02 — Google SSO
- "Continue with Google" button on both Login and Sign-Up pages
- Uses Supabase OAuth with Google provider; no password required
- Google users are auto-confirmed (no email verification step)
- First name / last name parsed from Google's `given_name` / `family_name` / `full_name` metadata
- After OAuth callback, routed by role: admin → `/resumes`, user → `/builder`

#### FR-AUTH-03 — Login
- Email + password login via `/api/v1/auth/login`
- Show/hide password toggle
- "Forgot password?" link
- **Rate limiting**: 5 failed attempts → 15-minute account lockout; lockout message shows minutes remaining
- **Unverified account**: shows inline prompt with "Resend verification email" link
- On success: admin routed to `/resumes`, user routed to `/builder` (or original `?redirect=` destination)

#### FR-AUTH-04 — Forgot / Reset Password
- Forgot Password page: email field, sends Supabase reset link (expires 1 hour)
- Reset Password page: validates recovery token via `PASSWORD_RECOVERY` auth event; new password + confirm with strength meter; redirects to login on success

#### FR-AUTH-05 — Email Verification
- Verify Email page shows holding screen with resend button
- Resend rate-limited to 3 per hour (per email) via `email_resend_limits` table
- Countdown timer after each resend

#### FR-AUTH-06 — Invite Acceptance
- `/join?token=` page validates invite token (expired / used / invalid states shown)
- Pre-fills email (read-only) and role badge from token
- Collects First Name, Last Name, Password, Confirm Password
- Invited users are auto-confirmed (no verification step)
- Token marked `used_at` after acceptance

#### FR-AUTH-07 — Role-Based Routing (Middleware)
- Unauthenticated users redirected to `/login` with `?redirect=` param
- Unconfirmed email users redirected to `/verify-email`
- Non-admin users redirected from admin-only pages (`/resumes`, `/jobs`, `/upload`, `/admin`) to `/builder`
- Root `/` redirects: admin → `/resumes`, user → `/builder`
- `/access-denied` page with role-appropriate dashboard link

#### FR-AUTH-08 — Session Timeout
- 25-minute idle warning modal ("Session expiring soon") with "Stay signed in" / "Sign out" buttons
- 30-minute idle auto sign-out
- Activity events (mouse, keyboard, scroll, click) reset the timer

---

### Admin — User Management

#### FR-ADMIN-01 — Dashboard
- Stats: Total Users (links to user list), Pending Invitations (links to invite page)
- Quick Actions: Manage Users tile; Invite Users tile with "Invite" and "Bulk Import CSV" CTAs

#### FR-ADMIN-02 — User List
- Searchable, filterable, sortable, paginated table (20 per page)
- Search: name or email (debounced 300 ms)
- Filter by role (All / User / Admin) and status (All / Active / Pending / Deactivated)
- Sort by: First Name, Email, Joined date (toggle asc/desc)
- Columns: Name, Email, Role, Status badge (color-coded), Joined date, Edit link
- Pagination with page indicator ("Showing X–Y of Z")

#### FR-ADMIN-03 — User Detail & Edit
- Shows account info: email, joined date, last login, failed login count
- Locked account indicator with "Unlock" button (clears `locked_until` and `failed_login_attempts`)
- Edit role (User / Admin) and status (Active / Pending / Deactivated)
- Admin cannot change their own role or deactivate themselves
- Role change syncs to Supabase auth `user_metadata` and triggers role-changed email
- Danger zone: permanent delete with two-step confirmation (cannot delete own account)
- All actions logged to `audit_log`

#### FR-ADMIN-04 — Invite Users
- Email chip input — type email and press Enter / comma / Tab / Space to add; paste multiple emails at once
- Role selector (User / Admin) applies to all emails in the batch
- Per-email result list (success / warning / error) after send
- Pending invitations list: email, role, expiry, Cancel button
- Invitations expire after 7 days; tokens stored in `invite_tokens` table

#### FR-ADMIN-05 — Bulk Import (CSV)
- Drag-and-drop or click-to-browse CSV upload (max 500 rows)
- Required columns: `first_name`, `last_name`, `email`; optional: `role` (default: `user`)
- Client-side CSV parsing with preview table (first 20 rows + overflow count)
- Server-side validation returns per-row errors (line number, email, error list) before any rows are created
- On confirmation: creates invite tokens and sends invite emails for valid rows
- Skips rows where account already exists
- Results summary: Invited / Skipped / Errors counts with per-row status table
- CSV template download available

---

### Resume Builder (User Persona)

#### FR-BUILDER-01 — Resume List
- Personal resume library for the logged-in user
- Cards show: resume name, template name, last updated date, preview thumbnail (template color swatch), Edit / Duplicate / Delete / Share actions
- "New Resume" button; "New from Upload" imports parsed data from an uploaded resume

#### FR-BUILDER-02 — Resume Editor
- Sections: Personal Info, Summary, Skills, Work Experience, Education, Certifications, Projects, Languages, Awards, Interests, Other
- Each section is a collapsible card; sections can be added/removed
- Rich form fields per section type; multi-entry sections (experience, education, etc.) support add/remove/reorder
- Live preview pane updates in real time as user types
- Template selector: choose from 8 templates; preview updates immediately
- Auto-save on every change (debounced)

#### FR-BUILDER-03 — Resume Templates
Eight templates available to all users:

| Template             | Style   | Description                                                            |
|----------------------|---------|------------------------------------------------------------------------|
| Classic Professional | Classic | Traditional layout with clear section hierarchy                        |
| Modern Slate         | Modern  | Clean two-column layout with slate header                              |
| Minimal White        | Minimal | Ultra-clean single-column, maximum whitespace                          |
| ATS Clean            | ATS     | Plain formatting optimised for applicant tracking systems              |
| Heritage             | Serif   | Centered serif name (Playfair Display), full-width hairline rules, right-aligned dates |
| Beacon               | Modern  | Dark navy sidebar with initials avatar + contact, white main column    |
| Banded               | Modern  | Gray rounded header card, gray title bands, left-rail date column      |
| Foundry              | Modern  | Bordered header card with initials circle, pill section bands, multi-column skills |

#### FR-BUILDER-04 — Review & Export
- Review page shows full resume preview in selected template
- Print / Download PDF via browser print dialog

#### FR-BUILDER-05 — Public Share Link
- Generate a shareable public URL (`/r/:token`) for a resume
- Public page renders the resume in its template with no authentication required
- Share link can be revoked (token deleted)

---

### Resume Upload & Parsing (Admin)

#### FR-01 — Resume Upload
- Job profile selection is **optional** at upload time
- Upload page pre-selects job profile when accessed via `?jobId=` query param
- Job Profile Detail page has an "Upload Resume" button linking directly to upload for that job
- Supported formats: PDF, DOC, DOCX; maximum 10 MB
- MIME type validated server-side; file stored in Supabase Storage
- Resume record stores `job_id` FK when a job is selected (nullable; SET NULL on job delete)
- On successful upload, resume is automatically scored if linked to a job profile
- Bulk upload supported — multiple files selectable in one operation with per-file status tracking

#### FR-02 — Resume Parsing
- Raw text extracted from uploaded file (pdf-parse / pdfjs-dist for PDF, mammoth for DOCX)
- Raw text persisted to database for future reparsing
- **Primary parser**: OpenRouter API (`meta-llama/llama-3.3-70b-instruct:free`) extracts structured JSON with a 13-rule system prompt
- **Fallback 1**: Groq SDK (`meta-llama/llama-4-scout-17b-16e-instruct`)
- **Fallback 2**: Regex-based section splitter
- Extracts: personal info, summary, skills, experience, projects, education, certifications, other
- Full AI output stored as `raw_json` (JSONB)
- Resume status transitions: `pending` → `processing` → `completed` / `failed`

#### FR-03 — Resume Scoring Engine
Scores a resume against a job profile across 7 factors (Skills, Experience, Education, Title, Certifications, Projects, Quality). Weighted overall score with role-type × seniority weight matrix; per-job custom weights supported.

Score bands: **Strong Match** (0.80–1.00), **Good Match** (0.65–0.79), **Moderate Match** (0.50–0.64), **Weak Match** (<0.50)

#### FR-03b — AI Score Summary
- After every score/rescore, generates `{ summary, strengths[], gaps[] }` via OpenRouter → Groq fallback
- Displayed in candidate details panel; non-blocking (score saved even if summary fails)

#### FR-04 — Profiles List View
- Search, paginate (50/100/150/200), grid/table toggle (localStorage preference)
- Bulk delete with hold-to-delete confirmation

#### FR-05 — Resume Detail View
- All parsed sections; score breakdown panel; Export JSON/CSV; Re-parse; Delete

#### FR-06 — Delete Resume
- Cascades to `parsed_data`, `work_experience`, `education`, `resume_scores` and Supabase Storage

#### FR-07 — Export
- JSON, CSV (per resume); XLSX (candidates list from job profile)

#### FR-08 — Reparse
- Re-runs AI parsing on stored `raw_text`; re-scores automatically if linked to a job

---

### Job Profile Management (Admin)

#### FR-09 — Job Profile Management
- Create/edit: title, organization, rich text description, role type, seniority, required experience, degree, certifications, custom weight sliders
- List view: tiles with candidate count, top skills, org name; search and paginate
- Delete with hold-to-delete confirmation

#### FR-10 — AI Skill Extraction
- Paste job description → AI returns structured skill array with proficiency and required flag

#### FR-11 — Job Profile Detail / Candidates
- Candidates tab: search, filter by band, sort, paginate; expandable AI assessment panel per candidate; Rescore; Export XLSX; Add Existing

#### FR-12 — Post-Upload Mapping
- "Add Existing" on any job profile discovers unlinked resumes and scores them immediately

---

### General UI

#### FR-13 — Dark / Light Theme
- Toggle in navbar; persists via localStorage; respects OS preference on first load

#### FR-14 — Organizations
- Global lookup; job profiles optionally linked; inline creation via combobox

#### FR-15 — Skeleton Loaders
- All async loading states replaced with layout-matching animated skeleton UIs across: Profiles list, Profile detail, Jobs list, Job detail, Builder list, Builder editor, Builder review

---

## Non-Functional Requirements

### NFR-01 — Performance
- Upload + parse + score < 15 seconds for files under 2 MB
- Page loads < 2 seconds; search debounced at 300 ms

### NFR-02 — Reliability
- Parse never leaves a resume in `processing` state (OpenRouter → Groq → regex fallback)
- Score upsert uses `ON CONFLICT (resume_id, job_profile_id)`

### NFR-03 — Security
- Supabase service role key used only server-side; never exposed to browser
- All admin API routes protected by `requireAdmin()` (checks `profiles.role` via service role)
- All authenticated API routes protected by `requireUser()`
- Login rate limiting: 5 attempts → 15-minute lockout (`profiles.failed_login_attempts`, `locked_until`)
- Email resend rate limiting: 3 per hour per email (`email_resend_limits` table)
- Admin actions logged to `audit_log` (action, performer, target, IP)
- File uploads restricted to PDF/DOCX; capped at 10 MB
- `Secret.md` and `.env` files excluded from git

### NFR-04 — Usability
- Fully responsive (mobile + desktop)
- Skeleton loaders on all async states
- Hold-to-delete on all destructive actions
- Role-aware navbar (admins: Profiles / Job Profiles / Builder / Dashboard; users: Builder only)

---

## Database Schema

```
-- Core (existing)
organizations    id (UUID PK), name (TEXT UNIQUE), created_at
resumes          id, file_name, file_url, raw_text, status, job_id* (SET NULL), created_at, updated_at
parsed_data      id, resume_id* (CASCADE), candidate_name, email, phone, summary, skills (TEXT[]), raw_json (JSONB)
work_experience  id, parsed_data_id* (CASCADE), company, title, start_date, end_date, description
education        id, parsed_data_id* (CASCADE), institution, degree, field, graduation_year
job_profiles     id, title, description, role_type, seniority, required_years_experience,
                 required_degree, required_field, required_certs (TEXT[]), custom_weights (JSONB),
                 organization_id* (SET NULL), created_at, updated_at
job_skills       id, job_profile_id* (CASCADE), skill, proficiency, is_required (BOOLEAN)
resume_scores    id, resume_id* (CASCADE), job_profile_id* (CASCADE), overall_score, band,
                 skills_score, experience_score, education_score, title_score, certs_score,
                 projects_score, quality_score, score_summary (JSONB), scored_at, created_at
                 UNIQUE(resume_id, job_profile_id)

-- Builder
builder_resumes  id (UUID PK), user_id* (CASCADE → auth.users), title, template_id,
                 created_at, updated_at
builder_sections id, resume_id* (CASCADE), type, title, order_index, content (JSONB), created_at, updated_at

-- RBAC
profiles         id (UUID PK, → auth.users CASCADE), email, first_name, last_name,
                 role (user|admin), status (pending|active|deactivated),
                 failed_login_attempts, locked_until, last_login_at,
                 email_verified_at, created_at, updated_at
invite_tokens    id, email, role, token (UNIQUE), invited_by* (SET NULL), accepted_by* (SET NULL),
                 expires_at, used_at, cancelled_at, status, created_at
audit_log        id, performed_by* (SET NULL), action, target_user_id, target_email,
                 details (JSONB), ip_address, created_at
email_resend_limits  email (PK), resend_count, window_start, updated_at
```

Triggers: `on_auth_user_created` auto-creates `profiles` row on signup (handles both email and Google OAuth metadata). `on_auth_user_updated` activates profile when email is confirmed.

---

## REST API Endpoints

### Auth (public)
| Method | Endpoint                             | Description                                      |
|--------|--------------------------------------|--------------------------------------------------|
| POST   | /api/v1/auth/signup                  | Create account; send verification email          |
| POST   | /api/v1/auth/login                   | Sign in with rate limiting and lockout           |
| POST   | /api/v1/auth/resend-verification     | Resend verification email (3/hr limit)           |
| GET    | /api/v1/auth/invite?token=           | Validate invite token                            |
| POST   | /api/v1/auth/accept-invite           | Accept invite, set password, activate account    |
| GET    | /auth/callback                       | Supabase OAuth callback (Google SSO + magic link)|

### Admin (admin role required)
| Method | Endpoint                             | Description                                      |
|--------|--------------------------------------|--------------------------------------------------|
| GET    | /api/v1/admin/users                  | List users (search, filter, sort, paginate)      |
| GET    | /api/v1/admin/users/:id              | Get user detail                                  |
| PATCH  | /api/v1/admin/users/:id              | Update role, status, unlock account              |
| DELETE | /api/v1/admin/users/:id              | Delete user                                      |
| POST   | /api/v1/admin/invite                 | Send invitations (batch emails)                  |
| GET    | /api/v1/admin/invite                 | List invite tokens                               |
| DELETE | /api/v1/admin/invite?id=             | Cancel pending invitation                        |
| GET    | /api/v1/admin/import                 | Download CSV template                            |
| POST   | /api/v1/admin/import                 | Validate + bulk create users from CSV            |

### Resumes (admin)
| Method | Endpoint                          | Description                                           |
|--------|-----------------------------------|-------------------------------------------------------|
| POST   | /api/v1/resumes/upload            | Upload file; auto-scores if linked to a job           |
| GET    | /api/v1/resumes                   | List with search and pagination                       |
| GET    | /api/v1/resumes/:id               | Get with parsed data and all scores                   |
| DELETE | /api/v1/resumes/:id               | Delete record and storage file                        |
| GET    | /api/v1/resumes/:id/export        | Export as JSON or CSV                                 |
| POST   | /api/v1/resumes/:id/reparse       | Re-run AI parsing; re-scores if linked                |
| POST   | /api/v1/resumes/:id/score         | Manually score against a job; generates summary       |

### Jobs (admin)
| Method | Endpoint                          | Description                                           |
|--------|-----------------------------------|-------------------------------------------------------|
| POST   | /api/v1/jobs/parse-skills         | AI-extract skills from job description                |
| POST   | /api/v1/jobs                      | Create job profile                                    |
| GET    | /api/v1/jobs                      | List all job profiles                                 |
| GET    | /api/v1/jobs/:id                  | Get job profile with skills                           |
| PUT    | /api/v1/jobs/:id                  | Update job profile                                    |
| DELETE | /api/v1/jobs/:id                  | Delete job profile                                    |
| GET    | /api/v1/jobs/:id/candidates       | List candidates with scores and AI summaries          |
| POST   | /api/v1/jobs/:id/score/:resumeId  | Trigger or refresh scoring + summary                  |

### Builder (authenticated user)
| Method | Endpoint                                    | Description                              |
|--------|---------------------------------------------|------------------------------------------|
| GET    | /api/v1/builder                             | List user's resumes                      |
| POST   | /api/v1/builder                             | Create new resume                        |
| GET    | /api/v1/builder/:id                         | Get resume with sections                 |
| PATCH  | /api/v1/builder/:id                         | Update resume (title, template)          |
| DELETE | /api/v1/builder/:id                         | Delete resume                            |
| GET    | /api/v1/builder/:id/sections                | List sections                            |
| POST   | /api/v1/builder/:id/sections                | Add section                              |
| PATCH  | /api/v1/builder/:id/sections/:sectionId     | Update section content                   |
| DELETE | /api/v1/builder/:id/sections/:sectionId     | Remove section                           |
| POST   | /api/v1/builder/:id/duplicate               | Duplicate resume                         |
| POST   | /api/v1/builder/:id/import                  | Import from parsed resume                |
| GET/POST | /api/v1/builder/:id/share                 | Get or create public share token         |

### Organizations (admin)
| Method | Endpoint                | Description                    |
|--------|-------------------------|--------------------------------|
| GET    | /api/v1/organizations   | List all organizations         |
| POST   | /api/v1/organizations   | Create organization            |

---

## Deployment

| App                | Platform | URL                                        |
|--------------------|----------|--------------------------------------------|
| Next.js (full app) | Vercel   | https://profile-stream-evo.vercel.app      |
| Express backend    | Vercel   | Separate project (file processing)         |

Environment variables (Vercel project settings):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
`OPENROUTER_API_KEY`, `GROQ_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`

Auto-deploys from GitHub `main` branch on every push.

---

## Known Limitations

- AI parsing adds ~3–8 seconds of latency per resume (OpenRouter free tier)
- AI summary generation adds ~2–5 seconds per score; existing candidates need a manual Rescore
- Name detection may fail on non-standard resume layouts
- Experience year calculation requires date patterns in text
- Semantic similarity uses TF-IDF word overlap rather than neural embeddings
- CSV export is a flat summary only (excludes work experience and education rows)
- Google SSO users assigned `user` role by default; admin must promote via Dashboard

---

## Future Enhancements

- Neural embedding-based semantic matching (replace TF-IDF)
- Hard filters before scoring (work authorisation, location, mandatory certs)
- Resume comparison view (side-by-side)
- Email notifications on strong match
- Candidate pipeline stages (shortlisted, interviewed, offered, rejected)
- Multi-tenant support — isolate data by organization
- AI resume improvement suggestions in the builder
