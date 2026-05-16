# Proflect — Requirements Document

**Version:** 2.0  
**Last Updated:** 2026-05-15  
**Platform:** https://proflect-neo.vercel.app

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Deployment](#3-deployment)
4. [User Roles & Access](#4-user-roles--access)
5. [Authentication](#5-authentication)
6. [Design System Summary](#6-design-system-summary)
7. [Admin Features](#7-admin-features)
8. [Resume Upload & Parsing (Admin)](#8-resume-upload--parsing-admin)
9. [Job Profile Management (Admin)](#9-job-profile-management-admin)
10. [Resume Builder (User)](#10-resume-builder-user)
11. [Portfolio Builder (User)](#11-portfolio-builder-user)
12. [Interview Prep (User)](#12-interview-prep-user)
13. [Database Schema](#13-database-schema)
14. [API Endpoints](#14-api-endpoints)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Known Limitations](#16-known-limitations)

---

## 1. Overview

Proflect is a career platform built with Next.js 15 providing:

- **Resume parsing and scoring** for admins managing candidate pipelines
- **Resume builder** with 20 templates and live preview
- **Portfolio builder** with AI-assisted content and public pages
- **Interview prep** (self-test) with multiple assessment modes

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React, TailwindCSS 3.4 |
| API | Next.js API Routes at `/app/api/v1/...` |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth (`@supabase/ssr`) — email/password + Google OAuth |
| AI — Resume parsing | OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`) → Groq (`meta-llama/llama-4-scout-17b-16e-instruct`) → regex fallback |
| AI — Portfolio features | Anthropic Claude (`claude-sonnet-4-6`) — bio, tagline, project description, skills gap, SEO suggestions |
| Email | Resend (transactional) |
| Scoring | Custom 7-factor engine (Skills, Experience, Education, Title, Certifications, Projects, Quality) + TF-IDF cosine similarity |
| Export | SheetJS (XLSX, client-side), Puppeteer (PDF — portfolio, planned) |

---

## 3. Deployment

| App | Platform | URL |
|-----|----------|-----|
| Next.js (frontend + API) | Vercel | https://proflect-neo.vercel.app |
| Express backend (file processing) | Vercel | Separate Vercel project |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side) |
| `SUPABASE_SECRET_KEY` | Supabase service-role key (server-side) |
| `OPENROUTER_API_KEY` | OpenRouter AI (resume parsing primary) |
| `GROQ_API_KEY` | Groq AI (resume parsing fallback) |
| `ANTHROPIC_API_KEY` | Anthropic Claude (portfolio AI features) |
| `RESEND_API_KEY` | Resend transactional email |
| `RESEND_FROM_EMAIL` | Sender address for transactional email |
| `NEXT_PUBLIC_APP_URL` | Public app base URL |

---

## 4. User Roles & Access

| Role | Access |
|------|--------|
| Admin | Profiles, Job Profiles, Resume Builder, Tests, Question Library, Templates, Admin Dashboard, Admin CMS, Admin Credits |
| User | Resume Builder, Portfolio Builder, Interview Prep |

---

## 5. Authentication

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Email/password signup with email verification |
| FR-AUTH-02 | Google SSO |
| FR-AUTH-03 | Login with rate limiting — 5 failed attempts triggers 15-minute lockout |
| FR-AUTH-04 | Forgot password / reset password flow |
| FR-AUTH-05 | Email verification resend (max 3 per hour) |
| FR-AUTH-06 | Invite acceptance flow |
| FR-AUTH-07 | Role-based routing middleware |
| FR-AUTH-08 | Session timeout — 25-minute inactivity warning, 30-minute auto sign-out |

### 5.1 Token-Based Authentication (JWT)

All API routes use **JWT Bearer token** authentication backed by Supabase Auth.

**Flow:**

1. Client calls `POST /api/v1/auth/login` with email + password
2. Server returns `{ access_token, refresh_token, expires_in, isAdmin }` in the response body
3. Client stores `access_token` in `localStorage` via `lib/authToken.js`
4. Every subsequent API request includes `Authorization: Bearer <access_token>`
5. Server resolves the user by calling `supabase.auth.getUser(token)` against the JWT
6. On sign-out, token is cleared from `localStorage`

**Dual-mode support:** Page navigation (SSR) still uses Supabase session cookies via middleware. API routes accept either a Bearer token (preferred) or the cookie session as a fallback — so browser-driven page loads and direct API calls both work.

**Token storage:** `lib/authToken.js`

| Function | Purpose |
|----------|---------|
| `setAuthToken(token)` | Persist token to `localStorage` |
| `getAuthToken()` | Read token from `localStorage` |
| `clearAuthToken()` | Remove on sign-out |
| `authHeaders()` | Returns `{ Authorization: 'Bearer …', 'Content-Type': 'application/json' }` |
| `authHeadersFormData()` | Returns `{ Authorization: 'Bearer …' }` without Content-Type (for `FormData` uploads) |

**Where tokens are attached:**

- `lib/api.js` — all resume, job, builder, and admin API calls
- `lib/portfolioApi.js` — all portfolio CRUD and AI feature calls
- `hooks/useAuth.js` — persists token on `onAuthStateChange`, clears on sign-out
- `app/login/page.jsx` — saves token immediately on successful login response

**Server-side auth guard (`lib/auth-helpers.js`):**

```js
// Reads Authorization: Bearer <token> first; falls back to cookie session
export async function requireUser(request) { … }
export async function requireAdmin(request) { … }
```

Resolution order:
1. Extract `Authorization: Bearer <token>` from request headers
2. If found → `supabase.auth.getUser(token)` (JWT validation)
3. If not found → build SSR Supabase client from request cookies

**Swagger / API Docs:**

The Swagger UI at `/admin/api-docs` uses `bearerAuth` (HTTP Bearer / JWT). To authenticate:
1. Call `POST /api/v1/auth/login` in Swagger → copy `access_token` from response
2. Click **Authorize** → paste token → all subsequent requests are authenticated

---

## 6. Design System Summary

> Full specification is in `design-system.md`. This section is a quick-reference for developers.

**System:** Proflect Design System v2.0 · Tailwind CSS 3.4

### Color Tokens

| Token | Value / Usage |
|-------|--------------|
| `bg-ds-bg` | Page background (#F4F8FC-equivalent) |
| `bg-ds-card` | Card background (white / dark mode variant) |
| `border-ds-border` | Dividers and card borders (#D1DCE8) |
| `text-ds-text` | Primary text (#2C2C2A) |
| `text-ds-textMuted` | Secondary / muted text (#6B7280) |
| `bg-primary` | Proflect Blue (#185FA5) |
| `bg-primary-light` | Sky Mist (#E6F1FB) |
| `text-primary` | #185FA5 |
| `bg-ds-successLight` | Success background |
| `text-ds-success` | Success text (#1D9E75) |
| `bg-ds-dangerLight` | Error background |
| `text-ds-danger` | Error text (#D93025) |
| `font-heading` | Heading font (Inter 600/700) |

### Responsive Breakpoints (mobile-first)

| Prefix | Breakpoint |
|--------|-----------|
| _(default)_ | Mobile |
| `sm:` | 640px (mobile landscape) |
| `md:` | 768px (tablet) |
| `lg:` | 1024px (desktop) |
| `xl:` | 1280px (wide) |

### Component Patterns

**Primary button:**
```
bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors
```

**Card:**
```
bg-ds-card border border-ds-border rounded-lg
```

**Input:**
```
bg-ds-bg border border-ds-border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary
```

**Skeleton loader:**
```js
import { Sk } from '@/components/Skeleton'
<Sk className="h-5 w-32" />
```

**API auth guard (Bearer token + cookie fallback):**
```js
import { requireUser, requireAdmin } from '@/lib/auth-helpers.js'

// In any API route handler:
const { user, profile } = await requireUser(request);   // throws 401/403 on failure
const { user, profile } = await requireAdmin(request);  // additionally enforces role === 'admin'
```

**Attaching auth headers in client-side fetches:**
```js
import { authHeaders, authHeadersFormData } from '@/lib/authToken.js'

// JSON request
fetch('/api/v1/...', { headers: authHeaders() })

// File upload (FormData)
fetch('/api/v1/...', { method: 'POST', headers: authHeadersFormData(), body: formData })
```

**Supabase client (API routes, service-role):**
```js
import supabase from '@/lib/supabase.js'
```

**Dark mode:** `dark:` Tailwind prefix; toggled via `useTheme` hook, persisted in `localStorage`.

---

## 7. Admin Features

### 7.1 Admin Dashboard

- Summary stats: total users, pending invitations
- Quick action links to major admin sections

### 7.2 User Management

- List all users with search and filter
- Edit user profile and role
- Delete user
- Audit log: tracks admin actions with performed_by, action, target, IP, timestamp

### 7.3 Invite Users

- Send batch email invitations
- View pending invitations list
- Cancel pending invitations

### 7.4 Bulk Import

- CSV upload (maximum 500 rows)
- Client-side validation before submission
- Preview rows before import
- Per-row success / error results after import

### 7.5 Tests

- Create, edit, and publish multiple-choice tests
- Tests draw from the Question Library
- Configurable difficulty and question count

### 7.6 Question Library

- Manage reusable questions tagged by skill and category
- Questions referenced by Tests and Interview Prep

### 7.7 Templates

- Manage resume template availability

### 7.8 Admin CMS (Homepage)

- Manage homepage content sections
- Publish sections to live homepage

### 7.9 Admin Credits

- View and manage user credit allocations (AI usage and other metered features)

---

## 8. Resume Upload & Parsing (Admin)

### 8.1 Upload

- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10 MB
- Bulk upload with per-file status tracking

### 8.2 AI Parsing Chain

1. **Primary:** OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`)
2. **Fallback:** Groq (`meta-llama/llama-4-scout-17b-16e-instruct`)
3. **Final fallback:** Regex extraction

Extracted fields: personal info, summary, skills, work experience, projects, education, certifications.

### 8.3 Scoring

**7-factor scoring engine:**

| Factor | Description |
|--------|-------------|
| Skills | Match against job profile required and preferred skills |
| Experience | Years and relevance of work experience |
| Education | Degree level and field match |
| Title | Job title alignment |
| Certifications | Matching certifications |
| Projects | Relevant project work |
| Quality | Resume completeness and quality signals |

- TF-IDF cosine similarity applied across factors
- Custom per-job-profile factor weights supported
- Result stored as overall score (0–100), band, and per-factor breakdown
- Unique constraint: one score record per (resume, job profile) pair; rescoring updates existing record

### 8.4 Other Features

- AI score summary: narrative strengths/gaps paragraph per scored resume
- Reparse: re-run AI parsing on stored `raw_text` without re-uploading
- Export: XLSX download of candidate scores for a job profile

---

## 9. Job Profile Management (Admin)

### 9.1 Create / Edit Job Profiles

Fields: title, rich text description, role type, seniority, required years of experience, required degree, required certifications, custom factor weights, organization.

### 9.2 AI Skill Extraction

- POST job description text → returns extracted skill list
- Skills stored in `job_skills` with proficiency and required flag

### 9.3 Candidates Tab

- Lists all resumes scored against the job profile
- Search by candidate name
- Filter by score band
- Sort by score, name, or date
- Pagination
- Rescore individual candidates
- Export all candidates to XLSX
- "Add Existing" — discovers resumes not yet linked to this job profile

---

## 10. Resume Builder (User)

### 10.1 Templates

20 templates available:

| # | Template Name |
|---|--------------|
| 1 | Classic Professional |
| 2 | Modern Slate |
| 3 | Minimal White |
| 4 | ATS Clean |
| 5 | Heritage |
| 6 | Beacon |
| 7 | Banded |
| 8 | Foundry |
| 9 | Corporate |
| 10 | Silver Banner |
| 11 | Teal Sidebar |
| 12 | Timeline |
| 13 | Photo Sidebar |
| 14 | Creative Edge |
| 15 | Executive Navy |
| 16 | Tech Stack |
| 17 | Soft Gradient |
| 18 | Bold Impact |
| 19 | Elegant Script |
| 20 | Beacon Dark |

Template selector shows 8 at a time; all 20 are accessible.

### 10.2 Sections

Personal Info, Summary, Skills, Work Experience, Education, Certifications, Projects, Languages, Awards, Interests, Other.

### 10.3 Editor Features

| Feature | Details |
|---------|---------|
| Live preview pane | Split-pane: editor left, rendered resume right |
| Auto-save | Debounced |
| Layout | One Column / Two Column / Mix; per-section column assignment |
| Page breaks | Insert or remove between sections |
| Section title size | Small / Medium / Large |
| Subtitle size | Small / Medium / Large |
| List style | Bullet or Hyphen |
| Heading icon | None / Outline / Filled |
| Font size | 9–14 pt (slider + number input) |
| Line height | 1.0–1.16 |
| Margins | Left / Right / Top / Bottom — 10–25 mm |
| Entry spacing | 1–10 lines |
| Footer | Page Numbers / Email / Name (independent toggles) |
| Skills layout | Rows / Grid / Compact / Bubble / Level |
| Education order | School→Degree or Degree→School |
| Work Experience order | Job Title→Employer or Employer→Job Title |

### 10.4 Actions

- Import content from a parsed resume
- Duplicate resume
- Public share link at `/r/:token`
- PDF export via browser print

### 10.5 Pagination Engine

- Smart page-break detection with minimum-space orphan prevention
- `data-entry-heading` markers on section entries
- Direct bullet-id querying for precise element positioning
- DPR change listener with debounced re-measurement
- Rounded measurements for cross-DPR stability

---

## 11. Portfolio Builder (User)

### 11.1 Routes

| Route | Purpose |
|-------|---------|
| `/portfolios` | Dashboard — list all portfolios as cards |
| `/portfolios/[id]/edit` | Split-pane editor (Content / Design / Settings tabs) |
| `/portfolios/[id]/analytics` | Analytics view (page views, summary cards) |
| `/portfolios/[id]/projects` | Manage portfolio projects |
| `/portfolios/[id]/projects/[projectId]/edit` | Project editor (7 accordion panels) |
| `/portfolios/[id]` | Public portfolio page (SSG/ISR, revalidate 60s) |
| `/portfolios/[id]/unlock` | Password-protected portfolio unlock (stub — not yet implemented) |

### 11.2 Portfolio Core Features

| Feature | Details |
|---------|---------|
| Multiple portfolios | Each user can have multiple portfolios |
| Status | Draft / Published / Archived |
| Template selection | Minimal, Creative, Developer, Corporate, Freelancer |
| Design | Primary color picker (8 swatches), font pair selector (4 options) |
| Custom slug | Custom URL (`proflect-neo.vercel.app/portfolios/[slug]`), real-time availability check |
| Sections | Drag-and-drop reorder: About, Experience, Education, Skills, Projects, Certifications, Testimonials, Services, Contact, Custom, Embed |
| Share panel | Copy URL, LinkedIn/Twitter/Email share, embed code |
| Analytics | View count tracking per portfolio |
| ISR revalidation | Triggered on publish |

### 11.3 Portfolio Projects

| Field | Details |
|-------|---------|
| Title | Text |
| Tagline | Short descriptor |
| Description | Rich text |
| Cover image | URL |
| Project URL | External link |
| Source code URL | Repository link |
| Tech stack | Array of tags |
| Role | Role type dropdown + free text |
| Timeline | Start date / End date, or "Ongoing" toggle |
| Category | Web App / Mobile App / Design / Research / Writing / Other |
| Status | Completed / In Progress / Concept |
| Visibility | Public / Private / Unlisted |
| Featured | Toggle |
| Case study mode | Problem, Process, Solution, Results panels |
| Outcomes | Metric name + value pairs |

Auto-save: 1-second debounce. New project flow replaces URL after creation (no duplicate creates on refresh).

### 11.4 AI Features (Portfolio)

All AI features are powered by Anthropic Claude (`claude-sonnet-4-6`), auth-gated, and usage-tracked.

| Feature | Description |
|---------|-------------|
| Bio/About generator | Generates a 2–4 sentence first-person bio |
| Tagline generator | Returns 5 options with tone selector (Professional / Creative / Technical / Friendly) |
| Project description enhancer | Results-focused rewrite of project description |
| Skills gap analysis | Identifies missing skills for a target role with importance ratings |
| SEO suggestions | Generates optimised meta title and meta description |

**Usage limit:** 5 AI generations per month (free plan). Usage tracked in `ai_usage` table.

**Status:** Bio and tagline generators are wired into the editor. Skills gap and SEO features have UI components but are not yet wired into the editor.

### 11.5 PDF Export (Planned)

- Route: `POST /api/v1/portfolios/export-pdf`
- Engine: Puppeteer (server-side)
- Config options: include cover page, include table of contents, page size (A4 / Letter), colour or B&W
- Output: ATS-compliant PDF (tagged, selectable text, embedded fonts)
- Status: route exists; Puppeteer implementation pending

---

## 12. Interview Prep (User)

**Route:** `/self-test`

### 12.1 Assessment Modes

| Mode | Description |
|------|-------------|
| Assess by Skill | Select a skill to be tested on |
| Assess by Content | Upload or paste content; questions generated from it |
| Assess by JD | Paste a job description; questions target that role's requirements |

### 12.2 Configuration

- Difficulty: Easy / Medium / Hard
- Question count: configurable
- Timer: configurable duration in minutes

### 12.3 Quiz Behaviour

- Timed multiple-choice quiz
- Auto-submit when timer expires

### 12.4 Results

| Output | Details |
|--------|---------|
| Score | Percentage correct |
| Per-skill breakdown | Available in JD mode |
| Readiness badge | Strong Match / Partial Match / Needs Improvement |

### 12.5 Session History

- User view: list of past sessions with scores and dates
- Admin view: `/admin/users/[id]/self-tests/[sessionId]` — full session detail for any user

---

## 13. Database Schema

### 13.1 Core (Admin / Parsing)

```sql
organizations
  id, name, created_at

resumes
  id, file_name, file_url, raw_text, status, job_id, created_at, updated_at

parsed_data
  id, resume_id, candidate_name, email, phone, summary, skills[], raw_json

work_experience
  id, parsed_data_id, company, title, start_date, end_date, description

education
  id, parsed_data_id, institution, degree, field, graduation_year

job_profiles
  id, title, description, role_type, seniority, required_years, required_degree,
  required_certs[], custom_weights, organization_id, created_at, updated_at

job_skills
  id, job_profile_id, skill, proficiency, is_required

resume_scores
  id, resume_id, job_profile_id, overall_score, band,
  [7 factor score columns], score_summary, scored_at
  UNIQUE(resume_id, job_profile_id)
```

### 13.2 Resume Builder

```sql
builder_resumes
  id, user_id, title, template_id, design_settings, personal_info,
  footer_settings, spacing_settings, layout_settings,
  share_token, share_enabled, created_at, updated_at

builder_sections
  id, resume_id, type, title, position, enabled, content, display_settings
```

### 13.3 RBAC

```sql
profiles
  id, email, first_name, last_name, role, status,
  failed_login_attempts, locked_until, last_login_at, created_at, updated_at

invite_tokens
  id, email, role, token, invited_by, accepted_by, expires_at, used_at, status

audit_log
  id, performed_by, action, target_user_id, details, ip_address, created_at

email_resend_limits
  email, resend_count, window_start, updated_at
```

### 13.4 Portfolio

```sql
portfolios
  id, user_id, resume_id (nullable), name, slug (unique), status,
  template_id, customisation, is_linked_to_resume, meta_title,
  meta_description, og_image_url, password_hash, is_indexed,
  view_count, created_at, updated_at, published_at

portfolio_sections
  id, portfolio_id, section_type, sort_order, is_visible,
  content (JSONB), created_at, updated_at

portfolio_projects
  id, portfolio_id, title, tagline, description, cover_image_url,
  project_url, source_url, tech_stack[], my_role, role_type,
  start_date, end_date, is_ongoing, category, is_featured,
  is_case_study, visibility, status, media_gallery, outcomes,
  team_size, sort_order, created_at, updated_at

portfolio_analytics
  id, portfolio_id, event_type, referrer, project_id,
  country_code, created_at

user_integrations
  id, user_id, provider, provider_uid, access_token, refresh_token,
  scopes[], connected_at, last_synced
  UNIQUE(user_id, provider)

ai_usage
  id, user_id, feature, used_at
```

### 13.5 Interview Prep (Self-Test)

```sql
self_test_sessions
  id, user_id, input_type, difficulty, question_count, timer_minutes, status, created_at

self_test_attempts
  id, session_id, score, max_score, pct, submitted_at, auto_submitted

self_test_answers
  id, attempt_id, question_id, selected_option, is_correct
```

---

## 14. API Endpoints

### 14.1 Auth (public)

| Method | Path |
|--------|------|
| POST | `/api/v1/auth/signup` |
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/resend-verification` |
| GET, POST | `/api/v1/auth/invite` |
| GET, POST | `/api/v1/auth/accept-invite` |
| GET | `/auth/callback` |

### 14.2 Admin — User Management

| Method | Path |
|--------|------|
| GET, PATCH, DELETE | `/api/v1/admin/users` |
| GET, PATCH, DELETE | `/api/v1/admin/users/:id` |
| POST, GET, DELETE | `/api/v1/admin/invite` |
| GET, POST | `/api/v1/admin/import` |

### 14.3 Admin — Tests & Questions

| Method | Path |
|--------|------|
| GET, POST, PATCH, DELETE | `/api/v1/admin/tests` |
| GET, PATCH, DELETE | `/api/v1/admin/tests/:id` |
| GET, POST, PATCH, DELETE | `/api/v1/admin/question-library` |

### 14.4 Admin — CMS & Credits

| Method | Path |
|--------|------|
| GET, PATCH | `/api/v1/admin/homepage` |
| POST | `/api/v1/admin/homepage/publish` |
| GET, POST, PATCH | `/api/v1/admin/credits` |

### 14.5 Resume (Admin)

| Method | Path |
|--------|------|
| POST | `/api/v1/resumes/upload` |
| GET, DELETE | `/api/v1/resumes` |
| GET, DELETE | `/api/v1/resumes/:id` |
| GET | `/api/v1/resumes/:id/export` |
| POST | `/api/v1/resumes/:id/reparse` |
| POST | `/api/v1/resumes/:id/score` |

### 14.6 Jobs (Admin)

| Method | Path |
|--------|------|
| POST | `/api/v1/jobs/parse-skills` |
| GET, POST, PUT, DELETE | `/api/v1/jobs` |
| GET, PUT, DELETE | `/api/v1/jobs/:id` |
| GET | `/api/v1/jobs/:id/candidates` |
| POST | `/api/v1/jobs/:id/score/:resumeId` |

### 14.7 Resume Builder (User)

| Method | Path |
|--------|------|
| GET, POST | `/api/v1/builder` |
| GET, PATCH, DELETE | `/api/v1/builder/:id` |
| GET, POST, PATCH, DELETE | `/api/v1/builder/:id/sections` |
| PATCH, DELETE | `/api/v1/builder/:id/sections/:sectionId` |
| POST | `/api/v1/builder/:id/duplicate` |
| POST | `/api/v1/builder/:id/import` |
| GET, POST | `/api/v1/builder/:id/share` |

### 14.8 Portfolio (User)

| Method | Path | Notes |
|--------|------|-------|
| GET, POST | `/api/v1/portfolios` | |
| GET, PATCH, DELETE | `/api/v1/portfolios/:id` | |
| GET | `/api/v1/portfolios/check-slug?slug=` | Availability check |
| GET, POST | `/api/v1/portfolios/:id/sections` | |
| PATCH, DELETE | `/api/v1/portfolios/:id/sections/:sectionId` | |
| POST | `/api/v1/portfolios/:id/sections/reorder` | |
| GET, POST | `/api/v1/portfolios/:id/projects` | |
| GET, PATCH, DELETE | `/api/v1/portfolios/:id/projects/:projectId` | |
| POST | `/api/v1/portfolios/:id/publish` | Triggers ISR revalidation |
| GET | `/api/v1/portfolios/public/:slug` | No auth required |
| POST | `/api/v1/portfolios/analytics` | Record page view events |
| POST | `/api/v1/portfolios/revalidate` | Manual ISR revalidation |
| POST | `/api/v1/portfolios/ai/bio` | Claude — bio generator |
| POST | `/api/v1/portfolios/ai/tagline` | Claude — tagline generator |
| POST | `/api/v1/portfolios/ai/project-description` | Claude — description enhancer |
| POST | `/api/v1/portfolios/ai/skills-gap` | Claude — skills gap analysis |
| POST | `/api/v1/portfolios/ai/seo` | Claude — SEO suggestions |
| POST | `/api/v1/portfolios/export-pdf` | Puppeteer PDF — planned |

### 14.9 Interview Prep (User)

| Method | Path |
|--------|------|
| GET, POST | `/api/v1/self-tests/sessions` |
| GET | `/api/v1/self-tests/sessions/:id` |
| POST | `/api/v1/self-tests/sessions/:id/submit` |
| GET | `/api/v1/admin/users/:id/self-tests` |
| GET | `/api/v1/admin/users/:id/self-tests/:sessionId` |

---

## 15. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Resume upload + parse + score | < 15 seconds for files under 2 MB |
| Page load | < 2 seconds |
| Search debounce | 300 ms |
| Responsiveness | Fully responsive (mobile and desktop) |
| Loading states | All async operations use skeleton loaders |
| Theme | Dark and light mode supported |
| Navigation | Role-aware navbar |
| AI usage limit | 5 AI generations per month (free plan) |
| Portfolio public pages | SSG/ISR, revalidate every 60 seconds for SEO performance |
| PDF export | ATS-compliant: tagged PDF, selectable text, embedded fonts |

---

## 16. Known Limitations

| Area | Limitation |
|------|-----------|
| AI parsing latency | ~3–8 seconds per resume (OpenRouter free tier) |
| AI score summary latency | ~2–5 seconds per score |
| Portfolio preview pane | Placeholder only — "coming soon" |
| Portfolio PDF export | Route exists; Puppeteer implementation pending |
| Portfolio password unlock | UI stub — "coming soon" |
| Portfolio analytics | Page view count only; referrer and geographic breakdown planned |
| Skills gap AI feature | UI component exists; not yet wired into the portfolio editor |
| SEO suggestions AI feature | UI component exists; not yet wired into the portfolio editor |
