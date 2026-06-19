# Proflect — Requirements & Implementation Reference

> **Status:** Living document. Reflects implementation as of 2026-06-19.
> **Stack:** Next.js 15 App Router · Tailwind CSS · Tiptap v3 · Supabase · Gemini 3.5 Flash + Groq Fallback
> **Platform:** https://proflect-neo.vercel.app
> **Repository:** https://github.com/Kannasanse/resume-parser

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [Folder & File Structure](#4-folder--file-structure)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Credit System](#6-credit-system)
7. [AI Model Usage](#7-ai-model-usage)
8. [External Integrations](#8-external-integrations)
9. [Feature Inventory](#9-feature-inventory)
10. [Page Inventory](#10-page-inventory)
11. [API Route Inventory](#11-api-route-inventory)
12. [Component Directory](#12-component-directory)
13. [Library Directory](#13-library-directory)
14. [Database Schema](#14-database-schema)
15. [Environment Variables](#15-environment-variables)

---

## 1. Product Overview

Proflect is an AI-powered career intelligence platform for job seekers and professionals. It combines:

- **Resume Builder** — template-driven, AI-assisted resume creation with ATS scoring
- **Career Map** — AI questionnaire + study plan generator with topic-level learning content
- **Self-Test / Interview Prep** — AI-generated MCQ, T/F, and short-answer tests from skills or JDs
- **Interview Buddy** — AI-generated interview question kits from job descriptions
- **Job Recommendations** — AI-powered job search via JSearch API
- **Notes** — Notion-style block editor with backlinks, tags, and sharing
- **Utilities Suite** — 35+ PDF, document, and image tools + code playground + screen recorder
- **My Courses** — Enroll and track study plan progress
- **Admin Dashboard** — Full user management, credit administration, question library, impersonation

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, React Server Components) |
| Styling | Tailwind CSS v3 with custom design tokens (`ds-*`) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password + OAuth) |
| Rich Text | Tiptap v3 with custom extensions |
| AI — Primary | Google Gemini 3.5 Flash (`gemini-3.5-flash`) |
| AI — Fallback | Groq `llama-3.3-70b-versatile` (auto-switch on 429/503/5xx) |
| AI — Resume Parsing | OpenRouter `meta-llama/llama-3.3-70b-instruct:free` |
| AI — Transcription | Groq Whisper |
| Job Search | JSearch API (RapidAPI, 200 calls/month free tier) |
| Web Search | Tavily + Exa (for career content generation) |
| Video | YouTube Data API v3 |
| Email | Resend |
| File Storage | Supabase Storage |
| Hosting | Vercel |
| State / Fetching | TanStack Query v5 |
| PDF Rendering | PDF.js |
| Canvas | Fabric.js v6 |

---

## 3. Design System

Tailwind CSS with a custom token layer exposed as CSS variables:

| Token | Purpose |
|-------|---------|
| `ds-bg` | Page background |
| `ds-card` | Card / panel background |
| `ds-border` | Default border |
| `ds-text` | Primary text |
| `ds-textMuted` | Secondary / muted text |
| `ds-textSecondary` | Tertiary text |
| `ds-primary` | Brand primary (blue) |
| `ds-success` / `ds-successLight` | Success states |
| `ds-danger` / `ds-dangerLight` | Error / danger states |
| `ds-inputBorder` | Input field borders |
| `rounded-btn` | Button border-radius token |

Dark mode is supported via Tailwind's `dark:` prefix. Theme toggle is in the Navbar.

---

## 4. Folder & File Structure

```
nextjs/
├── app/
│   ├── (main)/                    # Protected authenticated routes (see §10)
│   │   ├── admin/                 # Admin dashboard pages
│   │   ├── builder/               # Resume builder
│   │   ├── career-map/            # Career development & study plans
│   │   ├── credits/               # Credit balance & history
│   │   ├── interview-buddy/       # Interview kit pages
│   │   ├── interview-prep/        # Self-test pages
│   │   ├── job-recommendations/   # AI job search pages
│   │   ├── jobs/                  # Admin job management
│   │   ├── my-courses/            # Enrolled courses
│   │   ├── notes/                 # Block editor notes
│   │   ├── profile/               # User profile settings
│   │   ├── resumes/               # Admin resume management
│   │   ├── review/                # Resume review
│   │   ├── upload/                # Resume upload
│   │   └── utilities/             # 35+ utility tools
│   │       ├── documents/         # 10 document converters
│   │       ├── images/            # 4 image tools
│   │       ├── pdf/               # 19 PDF tools
│   │       ├── playground/        # Code execution sandbox
│   │       ├── recorder/          # Screen & audio recorder
│   │       └── security/          # PDF protect/sign/unlock
│   ├── (marketing)/               # Public marketing / landing pages
│   ├── api/
│   │   ├── v1/                    # All API routes (155+)
│   │   │   ├── admin/             # Admin-only APIs
│   │   │   ├── auth/              # Login, signup, verify-email
│   │   │   ├── builder/           # Resume builder CRUD + AI
│   │   │   ├── career-map/        # Career analysis & study plan AI
│   │   │   ├── courses/           # Course creation & chat
│   │   │   ├── credits/           # Credit balance & requests
│   │   │   ├── interview-buddy/   # Kit generation
│   │   │   ├── jobs/              # Job search & interactions
│   │   │   ├── me/                # Current user info
│   │   │   ├── my-courses/        # Course progress
│   │   │   ├── notes/             # Note CRUD & sharing
│   │   │   ├── profile/           # Profile & avatar
│   │   │   ├── recorder/          # Transcription
│   │   │   ├── resumes/           # Admin resume management
│   │   │   ├── review/            # Resume review
│   │   │   ├── self-test/         # Test creation & grading
│   │   │   ├── skills/            # Skill library
│   │   │   ├── templates/         # Resume templates
│   │   │   └── utilities/         # Document conversion APIs
│   │   ├── auth/callback/         # OAuth / email verification redirect
│   │   ├── cron/                  # Scheduled cleanup jobs
│   │   └── public/resume/         # Public resume sharing endpoint
│   ├── auth/                      # /login, /signup, /verify-email, /forgot-password, /reset-password
│   ├── print/[id]/                # Print-mode resume view
│   └── r/[token]/                 # Public shared resume view
├── components/
│   ├── admin/                     # Admin UI (user forms, credit forms, question editor, etc.)
│   ├── builder/                   # ResumeCanvas, SectionEditor, ATSPanel, TemplateGallery, WritingAssistantModal, etc.
│   ├── career-map/                # CareerMapPage, Questionnaire, QuestionCard, CareerGraph
│   │   ├── course/                # CourseDetailPage, CourseChat, StudyGuide, ExerciseSection, SourcesPanel
│   │   ├── nodes/                 # D3/graph nodes
│   │   └── roadmap/               # Career progression visualization
│   ├── editor/                    # RichTextEditor (Tiptap), custom extensions
│   ├── impersonation/             # Admin impersonation banner
│   ├── interview-buddy/           # KitPlayer, QuestionCard, CategoryTabs
│   ├── jobs/                      # JobCard, JobFilters, RecommendationsList
│   ├── marketing/                 # Landing page sections
│   ├── my-courses/                # CourseCard, CourseCreationModal, MyCoursesPage
│   ├── nav/                       # Navbar, Sidebar, MobileNav
│   ├── playground/                # CodeEditor, ExecutionOutput
│   ├── quiz/                      # MCQ, TrueFalse, ShortAnswer question components
│   ├── recorder/                  # ScreenRecorder, AudioRecorder, PlaybackControls
│   ├── skills/                    # SkillLookupInput, SkillPill, SkillCategory
│   └── utilities/                 # DocumentConverter, PDFEditor, ImageTools
│       └── edit-pdf/modes/        # AnnotateMode, DrawMode, TextMode, SignatureMode (Fabric.js v6)
├── lib/
│   ├── aiHelpers.js               # AI prompt helpers
│   ├── auth-helpers.js            # requireUser(), requireAdmin(), rate limiting, impersonation proxy
│   ├── authUtils.js               # getAuthUser() — reads Supabase session + proxy_uid for impersonation
│   ├── builderApi.js              # Resume builder API client (TanStack Query fns)
│   ├── credits.js                 # CREDIT_COSTS, deductCredits(), grantCredits(), getBalance()
│   ├── email.js                   # Resend email sending
│   ├── gemini.js                  # callGemini() + callGroqFallback() — primary AI entry point
│   ├── jobParser.js               # Parse job description text
│   ├── parser.js                  # Resume parsing (OpenRouter → Groq → regex fallback)
│   ├── scorer.js                  # ATS scoring logic
│   ├── storage.js                 # Supabase Storage wrapper
│   ├── supabase.js                # Supabase admin client (service role)
│   ├── supabase-browser.js        # Supabase browser client
│   ├── supabase-server.js         # Supabase server client (SSR)
│   ├── career-map/
│   │   ├── buildSearchQuery.js    # Build web search query for career content
│   │   ├── extractKnowledgeFromResume.js  # Extract known/unknown facts from resume
│   │   ├── fetchYouTubeVideo.js   # YouTube search with DB caching
│   │   ├── generateFromWeb.js     # Scrape & generate content from URLs
│   │   ├── providers/exa.js       # Exa search provider
│   │   ├── providers/tavily.js    # Tavily search provider
│   │   ├── sectionTypeRouter.js   # Route section to correct generator
│   │   ├── structureWebContent.js # Structure raw web text (Groq llama-3.1-8b)
│   │   ├── synthesiseContent.js   # Synthesize educational content
│   │   └── youtubeQuotaGuard.js   # YouTube API quota management
│   ├── jobs/
│   │   ├── buildJobQuery.js       # Build JSearch query from profile
│   │   ├── fetchFromJSearch.js    # JSearch API client
│   │   ├── formatters.js          # Format raw job data
│   │   ├── jobsCache.js           # 12-hour DB-backed cache
│   │   └── quotaMonitor.js        # Track JSearch quota (200/month)
│   ├── playground/
│   │   ├── htmlBuilder.js         # HTML sandbox
│   │   ├── javaRunner.js          # Java execution
│   │   ├── pythonWorker.js        # Python execution
│   │   └── sqlRunner.js           # SQL execution (sql.js)
│   ├── recorder/
│   │   ├── sendToNotes.js         # Save transcript to notes
│   │   └── useScreenRecorder.js   # Browser MediaRecorder wrapper
│   ├── self-test/
│   │   ├── questionLibrary.js     # fetchFromLibrary(), saveQuestionsToLibrary(), normaliseLibraryQuestion()
│   │   └── prompts/metadataInstruction.js  # AI prompt for question metadata
│   └── skills/
│       ├── findExistingByAlias.js # Skill alias lookup
│       ├── resolveSkill.js        # Resolve skill name to DB record
│       └── saveTopicHint.js       # Save topic hints per skill
├── supabase/
│   └── migrations/                # 25 SQL migration files (see §14)
├── hooks/                         # React custom hooks (useTheme, etc.)
├── data/                          # Seed data files
├── public/                        # Static assets
├── styles/                        # Global CSS
├── middleware.js                  # Auth routing middleware (redirects, session validation)
├── next.config.mjs                # Next.js configuration
├── tailwind.config.js             # Tailwind + design token config
└── jsconfig.json                  # Path aliases (@/ → nextjs/)
```

---

## 5. Authentication & Authorization

### Login Flow (Email/Password)
1. User submits form → `POST /api/v1/auth/login`
2. Rate limit check: `failed_login_attempts` + `locked_until` from `profiles` table
3. `supabase.auth.signInWithPassword()` validates credentials
4. On success: stamp `last_login_at`, clear `failed_login_attempts`
5. Return `access_token`, `refresh_token`, `isAdmin` flag + set session cookies
6. Middleware validates `email_confirmed_at` — unconfirmed redirects to `/verify-email`

### Signup Flow
1. `POST /api/v1/auth/signup` — validates email format + password strength (8+ chars, uppercase, number, special char)
2. Check email not already registered
3. `supabase.auth.admin.createUser()` with `email_confirm: false`
4. Create `profiles` row with `status: 'pending'`
5. Generate confirmation link → send via Resend
6. User clicks link → `GET /auth/callback` → session established → stamp `last_login_at`

### OAuth / Magic Link Callback
- Route: `GET /auth/callback`
- Exchanges code for session via `supabase.auth.exchangeCodeForSession()`
- Stamps `last_login_at` on success
- Redirects to `/builder` (user) or `/resumes` (admin)

### Middleware (`middleware.js`)
- Validates session on all `/(main)/*` routes
- Unauthenticated → `/login`
- Unverified email → `/verify-email`
- Admin-only routes enforce `role === 'admin'`

### `requireUser(request)` — `lib/auth-helpers.js`
Used by most API routes. Returns `{ user, profile }`. Supports impersonation:
- If `proxy_uid` cookie is set and the real user is admin → returns the proxied user's identity

### `getAuthUser()` — `lib/authUtils.js`
Used by all builder API routes. Reads Supabase session. Also supports impersonation:
- Checks `proxy_uid` cookie and `profiles.role === 'admin'` → returns proxied user if active

### Admin Impersonation
1. Admin clicks "Login as" on `/admin/users`
2. `POST /api/v1/admin/impersonate` → sets `proxy_uid` cookie (8-hour TTL)
3. Full page reload to `/builder` — all subsequent API calls resolve to the impersonated user
4. `ImpersonationBanner` shown in `(main)` layout
5. `DELETE /api/v1/admin/impersonate` → clears cookie, audit logged

### Rate Limiting
- Failed logins tracked in `profiles.failed_login_attempts`
- Lock threshold: 5 failures → `locked_until` set to +15 minutes
- `checkLoginRateLimit()` enforced on every login attempt

---

## 6. Credit System

### Overview
All AI-powered features consume credits. Users start with **30 free credits**. Additional credits are requested via admin approval or directly granted by admins.

### Credit Costs (defined in `lib/credits.js`)

| Feature | Type Key | Credits |
|---------|----------|---------|
| Resume Import (AI) | `resume_import` | 5 |
| Course / Study Plan Creation | `course_create` | 5 |
| ATS Score Analysis | `ats_score` | 3 |
| Career Path Recommendations | `career_recommend` | 2 |
| Interview Buddy Kit | `interview_buddy` | 2 |
| Self-Test Generation | `test_create` | 2 |
| Study Guide Generation | `study_guide` | 2 |
| Audio Transcription | `transcription` | 2 |
| Writing Assist (per use) | `writing_assist` | 1 |
| Course AI Chat (per message) | `course_chat` | 1 |
| Career Resume Analysis | `career_analyse` | 1 |
| AI Job Recommendations | `job_search` | 1 |

### Deduction Flow
1. API route calls `getBalance(userId)` — returns current balance
2. If `balance < cost` → return HTTP 402 `{ error, code: 'insufficient_credits', balance }`
3. Execute AI call
4. On success: `deductCredits(userId, type)` → calls Supabase RPC `deduct_credits()` (atomic SQL)
5. Logs to `credit_transactions` with type, amount (negative), description
6. Response includes `credits_used` and `credits_remaining`

### Grant / Request Flow
- **Admin grant**: POST `/api/v1/admin/credits` → `grantCredits()` → RPC `add_credits()`
- **User request**: POST `/api/v1/credits/request` → inserts into `credit_requests` (status: pending)
- **Admin approves**: POST `/api/v1/admin/credits/requests/[reqId]` → grant + mark approved

### UI Display
- **Navbar**: Credit balance pill (red if < 5, gold if ≥ 5) — links to `/credits`
- **Feature buttons**: Each AI action button shows inline credit cost badge
- **Credits page** (`/credits`): Balance stats, full cost grid (11 features), request modal, transaction history, request history

---

## 7. AI Model Usage

### Primary: Google Gemini 3.5 Flash
- Entry point: `callGemini(contents, opts)` in `lib/gemini.js`
- Supports: `system`, `json`, `temperature`, `maxTokens` options
- JSON mode: `responseMimeType: 'application/json'`

### Fallback: Groq llama-3.3-70b-versatile
- Auto-triggers on HTTP 429, 503, 500, 502, 504 or message patterns matching `overloaded/rate.?limit/quota/unavailable`
- `callGroqFallback(contents, opts)` — converts Gemini turn format (`{role, parts}`) to OpenAI messages format
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`

### Resume Parsing Chain (`lib/parser.js`)
1. OpenRouter `meta-llama/llama-3.3-70b-instruct:free` (primary)
2. Groq `meta-llama/llama-4-scout-17b-16e-instruct` (fallback)
3. Regex extraction (last resort: name, email, phone)

### Web Content Structuring
- `lib/career-map/structureWebContent.js`
- Groq `llama-3.1-8b-instant` — converts raw scraped text to structured markdown

### Audio Transcription
- Groq Whisper API — `POST /api/v1/recorder/transcribe` and `transcribe-chunk`
- 25 MB per chunk limit

### Where AI is Used (by feature)

| Feature | Model | Purpose |
|---------|-------|---------|
| ATS Scoring | Gemini | 5-dimension resume scoring vs job description |
| Writing Assist | Gemini | Improve resume section text |
| Resume Import | OpenRouter → Groq | Parse uploaded PDF/DOCX to structured data |
| Career Questionnaire | Gemini | Generate adaptive questions (3 for skills, up to 10 for resume mode) |
| Career Recommendations | Gemini | Recommend 4–6 career roles based on resume |
| Study Plan Generation | Gemini | Full week-by-week curriculum generation |
| Topic Content | Gemini + Web Search | Generate concept explanations, real-world applications, prerequisites |
| Exercises | Gemini | Generate exercises per topic section |
| Study Guide | Gemini | Synthesize study guide from sources |
| Course Chat | Gemini | Answer questions about course content |
| Web Content Structuring | Groq (llama-3.1-8b) | Structure scraped web content |
| Self-Test Questions | Gemini | Generate MCQ, T/F, short-answer questions |
| Short Answer Grading | Gemini | Grade free-text answers (accuracy + completeness + clarity) |
| JD Skill Extraction | Gemini | Extract skills from job descriptions |
| Interview Buddy | Gemini | Generate interview Q&A kits with follow-ups and guides |
| Career Resume Analysis | Gemini | Extract profile knowledge from resume for career map |
| Job Recommendations | JSearch API | Fetch job listings (no LLM for listing fetch itself) |
| Transcription | Groq Whisper | Transcribe audio recordings |

---

## 8. External Integrations

| Service | Purpose | Env Variable(s) |
|---------|---------|----------------|
| **Supabase** | PostgreSQL DB, Auth, RLS, Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Google Gemini** | Primary LLM | `GEMINI_API_KEY` |
| **Groq** | Fallback LLM + Whisper transcription + web structuring | `GROQ_API_KEY` |
| **OpenRouter** | Resume parsing (free tier Llama) | `OPENROUTER_API_KEY` |
| **YouTube Data API v3** | Fetch educational videos for study plan topics | `YOUTUBE_API_KEY` |
| **JSearch (RapidAPI)** | Job listing search (200 calls/month free) | `JSEARCH_API_KEY` |
| **Tavily Search** | Web search for career content generation | `TAVILY_API_KEY` |
| **Exa Search** | Alternative web search provider | `EXA_API_KEY` |
| **Resend** | Transactional email (verification, notifications) | Configured in `lib/email.js` |

---

## 9. Feature Inventory

### 9.1 Resume Builder
**Pages:** `/builder`, `/builder/new`, `/builder/[id]`, `/builder/[id]/review`

| Sub-feature | Details |
|-------------|---------|
| Template selection | 15+ templates with static SVG previews (`ResumeTemplatePreviews.jsx`), gallery with search + category + Featured filter |
| New resume flow | Choose template (click → modal preview), name resume, start blank or import file |
| Import resume | Upload PDF/DOCX → AI parses to structured JSON → review page with inline editing → confirm → open editor |
| Section editing | Work experience, education, skills, projects, certifications, languages, summary, references, hobbies, custom |
| Rich text | Tiptap editor per section |
| Design panel | Template switch, color scheme, font, spacing |
| ATS scoring | 5-dimension score (section completeness, keyword match, content quality, formatting, measurable impact) — **3 credits** |
| Writing assist | AI rewrite for any section — **1 credit** |
| PDF export | Puppeteer/browser-based PDF generation |
| DOCX export | Programmatic Word document generation |
| Share | Generate public share link (`/r/[token]`) |
| Duplicate | Clone resume with all sections |
| Print view | `/print/[id]` for browser print |

### 9.2 Career Map & Study Plans
**Pages:** `/career-map`, `/career-map/study-plan/[id]`, `/career-map/study-plan/[id]/topic/[topicId]`

| Sub-feature | Details |
|-------------|---------|
| Resume selection | Pick from published resumes; "Create course with my skills instead" if no resume |
| Career questionnaire (resume mode) | Up to 10 adaptive AI questions covering career_direction, target_role, timeline, learning_commitment, work_environment, blockers |
| Career recommendations | AI recommends 4–6 roles based on resume + questionnaire — **2 credits** |
| Skill gap analysis | Compare current skills vs target role requirements |
| Study plan generation | Full week-by-week curriculum with topics, estimated hours, YouTube video queries — **5 credits** |
| Topic content | Concept explanation, real-world applications, prerequisites (AI + web search) |
| YouTube videos | Auto-fetched per topic, ranked by views/engagement/recency, cached in DB |
| Exercises | AI-generated exercises per section |
| Study guide | AI-synthesized guide from sources — **2 credits** |
| Course chat | AI assistant per course — **1 credit** per message |
| Sources | Add PDF, URL, text, web scrape as course sources |
| Progress tracking | Section-level and topic-level completion |
| Skills-based course | Create directly from skills without a resume — **5 credits** |
| Questionnaire (skills mode) | 1–3 focused questions: `learning_goal`, `timeline`, `focus_area` |
| Preferences | Hours/day, days/week, learning style (video/reading/project/mixed), current level |

### 9.3 Self-Test / Interview Prep
**Pages:** `/interview-prep`, `/interview-prep/[id]`

| Sub-feature | Details |
|-------------|---------|
| Test creation modes | Skills-based, content-based (paste text), JD-based |
| Question types | MCQ, True/False, Short Answer, Mixed |
| Difficulty levels | Easy, Medium, Hard (affects scenario weighting) |
| Timer | Configurable 5–180 min; auto-submits on expiry |
| Question generation | AI generates questions from question library first, then fills gaps — **2 credits** |
| JD skill extraction | Extract skills from job description — **1 credit** |
| Answer submission | MCQ/T/F auto-scored; short answers AI-graded |
| Short answer grading | AI grades accuracy (0–4), completeness (0–3), clarity (0–3) |
| Self-grading | Users can self-grade short answers |
| Results | Overall score, skill breakdown, topic breakdown, question type breakdown |
| Retake | Create new session from prior attempt |
| Session history | Filter by mode/date; retake from history |
| Shareable links | Admin can create public test links (token-based) |
| Flag for review | F key or flag button per question |
| Keyboard shortcuts | Arrow keys, F (flag), 1–4 (MCQ options) |

### 9.4 Interview Buddy
**Pages:** `/interview-buddy`, `/interview-buddy/[kitId]`

| Sub-feature | Details |
|-------------|---------|
| Kit generation | Paste JD → AI generates categorized Q&A kit — **2 credits** |
| Depth levels | Quick (basic), Standard, Deep (follow-ups + real-world examples) |
| Role calibration | Junior/Mid/Senior question calibration |
| Question categories | Behavioral, Technical, Situational, Role-specific |
| Answer guides | Model answers + key points per question |
| Kit player | Navigate Q&A, track progress, view guides |
| Kit history | List of past kits with last-viewed timestamp |

### 9.5 Job Recommendations
**Pages:** `/job-recommendations`, `/job-recommendations/saved`

| Sub-feature | Details |
|-------------|---------|
| AI job recommendations | JSearch API fetch based on resume skills + location — **1 credit** |
| 12-hour cache | Results cached in DB; same query reuses cache |
| Quota tracking | JSearch quota monitored (200 calls/month) |
| Interactions | Track view, apply, save, dismiss per job |
| Saved jobs | View all saved job listings |
| Skill extraction | Parse skills from JD text |

### 9.6 Notes (Block Editor)
**Pages:** `/notes`, `/notes/[noteId]`

| Sub-feature | Details |
|-------------|---------|
| Rich block editor | Tiptap v3 with headings, lists, code, tables, links, images, embeds |
| Auto-save | Debounced 1s auto-save |
| Tags | Inline tag extraction and filtering |
| Backlinks | Bidirectional note linking |
| Full-text search | Search across all notes content |
| Sharing | Generate public read-only link (`/notes/public/[token]`) |
| Pin / Archive | Pin important notes, archive old ones |
| Duplicate | Clone a note |
| Folder / parent | Nest notes hierarchically |
| Context linking | Link note to a resume, topic, or course |
| Transcript save | Recorder transcripts saved directly to notes |

### 9.7 Utilities Suite
**Pages:** `/utilities/*`

#### Document Conversion (10 tools)
Word → PDF, Excel → PDF, HTML → PDF, Markdown → PDF, PPT → PDF, Images → PDF, Merge Word, PDF → Text, Text → PDF, PDF → Word

#### Image Tools (4 tools)
Compress, Convert (format), Crop, Resize

#### PDF Tools (19 tools)
Merge, Split, Compress, Repair, Rotate, Flatten, Watermark, Add Page Numbers, Redact, Remove Pages, Organise, Extract Images, Compare, Edit (Fabric.js canvas), PDF → Excel, PDF → HTML, PDF → Images, PDF → Word, Crop

#### PDF Security (3 tools)
Protect (encrypt), Sign, Unlock

#### Code Playground
- Languages: Java (Docker), Python (isolated), HTML (sandbox iframe), SQL (sql.js in browser)
- Live output panel, error display

#### Screen & Audio Recorder
- Browser MediaRecorder API
- Chunked transcription via Groq Whisper — **2 credits**
- Save transcript to notes

### 9.8 My Courses
**Pages:** `/my-courses`

| Sub-feature | Details |
|-------------|---------|
| Course list | Filter by All / In Progress / Not Started / Completed / Paused |
| Sort | Last updated, most/least progress, newest/oldest |
| Search | Text search across course titles |
| Progress tracking | Per-topic and overall percentage |
| Course creation | Opens `CourseCreationModal` — skills → questionnaire → preferences → generate |
| Auto-open on `?create=1` | Navigating to `/my-courses?create=1` opens creation modal immediately |
| Reset progress | Start course over |
| Status management | Active, paused, completed states |

### 9.9 Admin Dashboard
**Pages:** `/admin/*`

| Sub-feature | Details |
|-------------|---------|
| User management | List, search, filter users; view profile, resumes, test history |
| User actions | Activate, deactivate, change role, reset password |
| Impersonation | "Login as" — sets `proxy_uid` cookie, full page reload to `/builder` |
| Credit management | View balances, grant credits, review requests, transaction history |
| Question library | CRUD, bulk import, AI generation, difficulty/skill tagging |
| Test management | Create tests, add questions, generate shareable links, view results |
| Skill management | CRUD skills, topics, categories, aliases |
| Template management | Mark templates as Featured — `TemplatePreviewCard` used for consistent preview |
| Resume management | View uploaded resumes, re-parse, ATS score, export |
| Bulk import | CSV/JSON data import |
| Invite management | Send invites, manage pending invites |
| Audit log | Impersonation start/end logged |

---

## 10. Page Inventory

### Public Pages
| Route | Description |
|-------|-------------|
| `/login` | Email/password login with rate limiting |
| `/signup` | User registration |
| `/verify-email` | Email verification prompt + resend |
| `/forgot-password` | Password reset request |
| `/reset-password` | Set new password (token-based) |
| `/access-denied` | 403 page |
| `/r/[token]` | Public shared resume view |
| `/test/[token]` | Public shared test (token-based) |
| `/notes/public/[token]` | Public shared note view |
| `/print/[id]` | Print-mode resume |

### User Pages (Protected)
| Route | Description |
|-------|-------------|
| `/builder` | Resume list dashboard |
| `/builder/new` | New resume wizard (template → title) |
| `/builder/[id]` | Resume editor |
| `/builder/[id]/review` | Import review page (scrollable) |
| `/career-map` | Career map — resume picker → questionnaire → recommendations |
| `/career-map/study-plan/[id]` | Study plan overview |
| `/career-map/study-plan/[id]/topic/[topicId]` | Topic learning page (content, videos, exercises, chat) |
| `/credits` | Credit balance, cost grid, request modal, transaction history |
| `/interview-buddy` | Interview kit list |
| `/interview-buddy/[kitId]` | Kit player |
| `/interview-prep` | Self-test creation + history |
| `/interview-prep/[id]` | Take self-test |
| `/job-recommendations` | AI job recommendations |
| `/job-recommendations/saved` | Saved jobs |
| `/my-courses` | Enrolled courses list |
| `/notes` | Notes list |
| `/notes/[noteId]` | Note editor |
| `/profile` | Profile settings (name, headline, location, avatar) |
| `/utilities` | Utility tools hub |
| `/utilities/documents` | Document converters hub |
| `/utilities/pdf` | PDF tools hub |
| `/utilities/playground` | Code sandbox |
| `/utilities/recorder` | Screen & audio recorder |
| `/utilities/documents/[tool]` | Individual document converter (10 tools) |
| `/utilities/images/[tool]` | Individual image tool (4 tools) |
| `/utilities/pdf/[tool]` | Individual PDF tool (19 tools) |
| `/utilities/security/[tool]` | PDF security tool (3 tools) |

### Admin Pages (Role: admin)
| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard home |
| `/admin/credits` | Credit management (balances, grants, requests) |
| `/admin/import` | Bulk data import |
| `/admin/invite` | Manage invitations |
| `/admin/question-library` | Question CRUD |
| `/admin/question-library/new` | Create question |
| `/admin/question-library/[id]/edit` | Edit question |
| `/admin/skills` | Skill library management |
| `/admin/templates` | Template management (Featured flag) |
| `/admin/tests` | Test management |
| `/admin/tests/new` | Create test |
| `/admin/tests/[id]` | Edit test |
| `/admin/tests/[id]/links` | Shareable test links |
| `/admin/tests/[id]/results` | Test results |
| `/admin/tests/[id]/results/[aid]` | Individual attempt |
| `/admin/users` | User list + "Login as" |
| `/admin/users/[id]` | User detail (tabs: account, resumes, self-tests) |
| `/admin/users/[id]/resumes/[resumeId]` | Resume detail |
| `/admin/users/[id]/self-tests/[sessionId]` | Test session detail |

---

## 11. API Route Inventory

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/auth/signup` | User registration |
| POST | `/api/v1/auth/verify-email` | Resend verification email |
| POST | `/api/v1/auth/accept-invite` | Accept org invite |
| GET | `/auth/callback` | OAuth / email verification redirect |

### Builder — Resumes
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/builder` | List user's resumes |
| POST | `/api/v1/builder` | Create resume |
| GET | `/api/v1/builder/[id]` | Get resume with sections |
| PUT | `/api/v1/builder/[id]` | Update resume (personal info, template, title) |
| DELETE | `/api/v1/builder/[id]` | Delete resume |
| POST | `/api/v1/builder/[id]/duplicate` | Clone resume |
| POST | `/api/v1/builder/[id]/export/pdf` | Export to PDF |
| POST | `/api/v1/builder/[id]/export/word` | Export to DOCX |
| POST | `/api/v1/builder/[id]/import` | AI parse uploaded file — **5 credits** |
| POST | `/api/v1/builder/[id]/ats-score` | ATS score analysis — **3 credits** |
| POST | `/api/v1/builder/[id]/writing-assist` | AI writing suggestions — **1 credit** |
| GET/POST | `/api/v1/builder/[id]/photo` | Upload/delete profile photo |
| GET/POST | `/api/v1/builder/[id]/share` | Manage share link |
| GET/POST | `/api/v1/builder/[id]/sections` | List/create sections |
| GET/PUT/DELETE | `/api/v1/builder/[id]/sections/[sectionId]` | Section CRUD |

### Career Map
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/career-map/analyse-resume` | Extract profile from resume — **1 credit** |
| POST | `/api/v1/career-map/recommend` | Career path recommendations — **2 credits** |
| POST | `/api/v1/career-map/next-question` | Generate next questionnaire question |
| POST | `/api/v1/career-map/submit-answer` | Save questionnaire answer |
| POST | `/api/v1/career-map/generate-study-plan` | Create study plan — **5 credits** |
| POST | `/api/v1/career-map/update-study-plan` | Regenerate/update study plan — **5 credits** |
| POST | `/api/v1/career-map/learning-roadmap` | Generate learning roadmap — **5 credits** |
| POST | `/api/v1/career-map/generate-section-content` | Generate topic section content |
| POST | `/api/v1/career-map/generate-exercises` | Generate exercises for topic |
| POST | `/api/v1/career-map/generate-summary` | Generate topic summary |
| POST | `/api/v1/career-map/complete-topic` | Mark topic complete |
| POST | `/api/v1/career-map/complete-section` | Mark section complete |
| GET | `/api/v1/career-map/published-resumes` | List published resumes for analysis |
| POST | `/api/v1/career-map/fetch-youtube-videos` | Bulk YouTube video fetch |
| POST | `/api/v1/career-map/fetch-youtube-videos/single` | Single video fetch |

### Courses
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/courses/create-from-skills` | Create course from skill list |
| POST | `/api/v1/courses/[id]/chat` | AI chat message — **1 credit** |
| GET/POST | `/api/v1/courses/[id]/sources` | Course sources management |
| DELETE | `/api/v1/courses/[id]/sources/[sourceId]` | Delete source |
| POST | `/api/v1/courses/[id]/study-guide/generate` | Generate study guide — **2 credits** |
| GET | `/api/v1/my-courses` | List enrolled courses |
| GET/PUT | `/api/v1/my-courses/[id]` | Course detail / update status |
| POST | `/api/v1/my-courses/[id]/reset-progress` | Reset course progress |
| GET | `/api/v1/my-courses/stats` | Course statistics |

### Credits
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/credits` | Current balance + recent transactions |
| GET/POST | `/api/v1/credits/request` | List / submit credit requests |

### Interview Buddy
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/v1/interview-buddy` | List kits / create kit |
| GET | `/api/v1/interview-buddy/[kitId]` | Get kit details |
| POST | `/api/v1/interview-buddy/generate` | Generate interview kit — **2 credits** |

### Jobs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/jobs/recommendations` | AI job recommendations — **1 credit** |
| POST | `/api/v1/jobs/interact` | Track view/apply/save/dismiss |
| GET | `/api/v1/jobs/saved` | Saved jobs list |
| POST | `/api/v1/jobs/parse-skills` | Extract skills from JD |
| GET/POST | `/api/v1/jobs` | Admin: list/create jobs |
| GET/PUT/DELETE | `/api/v1/jobs/[id]` | Admin: job CRUD |
| POST | `/api/v1/jobs/[id]/score/[resumeId]` | Score resume against job |
| GET | `/api/v1/jobs/[id]/candidates` | Admin: job candidates |

### Notes
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/v1/notes` | List / create notes |
| GET/PUT/DELETE | `/api/v1/notes/[id]` | Note CRUD |
| POST | `/api/v1/notes/[id]/archive` | Archive note |
| POST | `/api/v1/notes/[id]/pin` | Pin/unpin |
| POST | `/api/v1/notes/[id]/duplicate` | Clone note |
| POST | `/api/v1/notes/[id]/share` | Generate share link |
| GET | `/api/v1/notes/[id]/backlinks` | Get bidirectional links |
| GET | `/api/v1/notes/public/[token]` | Public note read |
| GET | `/api/v1/notes/search` | Full-text search |
| POST | `/api/v1/notes/upload-image` | Upload image |
| GET | `/api/v1/notes/tags` | Tag list |

### Self-Test
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/v1/self-test` | Session history / create test — POST costs **2 credits** |
| GET | `/api/v1/self-test/[id]` | Session details |
| POST | `/api/v1/self-test/[id]/submit` | Submit answers |
| POST | `/api/v1/self-test/[id]/grade-short-answers` | AI grade short answers |
| POST | `/api/v1/self-test/[id]/self-grade` | Self-grade short answers |
| POST | `/api/v1/self-test/evaluate-short-answer` | Evaluate single answer |
| POST | `/api/v1/self-test/jd-extract` | Extract skills from JD |
| GET | `/api/v1/self-test/sessions` | Paginated session list |
| GET | `/api/v1/self-test/sessions/[id]` | Session detail |
| POST | `/api/v1/self-test/sessions/[id]/retake` | Create retake session |
| GET | `/api/v1/self-test/skills` | Available test skills |

### Recorder
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/recorder/transcribe` | Transcribe audio — **2 credits** |
| POST | `/api/v1/recorder/transcribe-chunk` | Transcribe audio chunk — **2 credits** |
| POST | `/api/v1/recorder/sessions` | Save recording session |

### Profile & User
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/me` | Current user info |
| GET/PUT | `/api/v1/profile` | User profile |
| POST | `/api/v1/profile/avatar` | Upload avatar |

### Skills
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/skills` | Full skill list |
| GET | `/api/v1/skills/search` | Fuzzy skill search |
| GET | `/api/v1/skills/categories` | Skill categories |
| GET | `/api/v1/skills/trending` | Trending skills |
| GET | `/api/v1/skills/popular` | Popular skills |
| GET | `/api/v1/skills/analytics` | Usage analytics |
| GET | `/api/v1/skills/[id]` | Skill detail |
| GET | `/api/v1/skills/[id]/topics` | Skill topics |

### Templates
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/templates` | List templates with featuredIds |

### Admin APIs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/admin/users` | User list with pagination/sort/filter |
| GET/PUT | `/api/v1/admin/users/[id]` | User detail / update |
| POST | `/api/v1/admin/users/[id]/actions` | User actions (activate, deactivate, etc.) |
| GET | `/api/v1/admin/credits` | All users' credit balances |
| POST | `/api/v1/admin/credits` | Grant credits to user |
| GET | `/api/v1/admin/credits/requests` | Pending credit requests |
| POST/PUT | `/api/v1/admin/credits/requests/[reqId]` | Approve/reject credit request |
| GET | `/api/v1/admin/credits/transactions` | Transaction history |
| POST | `/api/v1/admin/impersonate` | Start impersonation (sets proxy_uid cookie) |
| DELETE | `/api/v1/admin/impersonate` | End impersonation |
| GET/POST | `/api/v1/admin/question-library` | Question CRUD |
| POST | `/api/v1/admin/question-library/generate` | AI generate questions |
| GET/POST | `/api/v1/admin/tests` | Test management |
| GET/PUT/DELETE | `/api/v1/admin/tests/[id]` | Test CRUD |
| GET/POST | `/api/v1/admin/tests/[id]/links` | Shareable test links |
| GET | `/api/v1/admin/tests/[id]/results` | Test attempt results |
| GET/POST | `/api/v1/admin/skills` | Skill CRUD |
| GET/PATCH | `/api/v1/admin/templates` | Template management (Featured flag) |
| POST | `/api/v1/admin/import` | Bulk data import |
| POST | `/api/v1/admin/invite` | Send invite |

---

## 12. Component Directory

### `components/builder/`
| Component | Purpose |
|-----------|---------|
| `ResumeCanvas.jsx` | Main editor canvas — orchestrates all editor panels |
| `ResumePreview.jsx` | Live resume renderer with 15+ templates |
| `ResumeTemplatePreviews.jsx` | Static SVG preview components for all 15 templates |
| `TemplatePreviewCard.jsx` | Shared card for template preview (used in gallery + new resume + admin) |
| `TemplateGallery.jsx` | Modal gallery for template switching within builder |
| `SectionEditor.jsx` | Per-section editing UI |
| `ATSPanel.jsx` | ATS score display, dimension breakdown, improvement suggestions |
| `DesignPanel.jsx` | Template/color/font/spacing controls |
| `WritingAssistantModal.jsx` | AI writing suggestions modal |
| `ShareModal.jsx` | Resume sharing controls |
| `TemplateThumbnail` | (exported from ResumePreview) — live mini render (fallback only) |

### `components/career-map/`
| Component | Purpose |
|-----------|---------|
| `CareerMapPage.jsx` | Main career map wizard (resume picker → questionnaire → roles) |
| `ResumePicker.jsx` | Select resume for career analysis (shows 1 credit badge) |
| `NoResumeEmptyState.jsx` | Empty state when no published resume — links to `/my-courses?create=1` |
| `Questionnaire.jsx` | State machine for adaptive AI questionnaire |
| `QuestionCard.jsx` | Renders individual question with progress dots |
| `OptionsQuestion.jsx` | MCQ-style 4-option question |
| `FreeTextQuestion.jsx` | Free text answer input |
| `QuestionnaireComplete.jsx` | Completion screen with confidence score |
| `ConfidenceDots.jsx` | Visual confidence indicator |

### `components/career-map/course/`
| Component | Purpose |
|-----------|---------|
| `CourseDetailPage.jsx` | Full topic learning page |
| `CourseChat.jsx` | AI chat interface for course |
| `SourcesPanel.jsx` | Manage course sources (PDF, URL, etc.) |
| `StudyGuide.jsx` | Rendered study guide |
| `ExerciseSection.jsx` | Exercises display |
| `SectionNavSidebar.jsx` | Section navigation |
| `GeneratedContent.jsx` | Render AI-generated topic content |
| `AddSourceModal.jsx` | Add new source |

### `components/my-courses/`
| Component | Purpose |
|-----------|---------|
| `MyCoursesPage.jsx` | Course list with tabs/filters/search; reads `?create=1` to auto-open modal |
| `CourseCreationModal.jsx` | 3-step creation: skills → questionnaire → preferences → generate |
| `CourseCard.jsx` | Course card with progress bar |
| `CourseStatsBar.jsx` | Overall stats bar |
| `EmptyState.jsx` | No courses empty state |
| `PreferencesForm` | (inside CourseCreationModal) Hours/day, days/week, style, level |

### `components/nav/`
| Component | Purpose |
|-----------|---------|
| `Navbar.jsx` | Top nav with credit balance pill, dark mode toggle, user menu |
| `Sidebar.jsx` | Left sidebar navigation |

### `components/utilities/edit-pdf/`
| Component | Purpose |
|-----------|---------|
| `FabricCanvas.jsx` | Fabric.js v6 canvas wrapper; overlays PDF canvas |
| `EditPDFEditor.jsx` | Main PDF editor — orchestrates mode + canvas |
| `modes/TextMode.jsx` | Add/edit text on PDF |
| `modes/AnnotateMode.jsx` | Draw shapes (rect, ellipse, line, triangle) |
| `modes/DrawMode.jsx` | Freehand drawing with PencilBrush |
| `modes/SignatureMode.jsx` | Add signature image (uses FabricImage.fromURL) |

---

## 13. Library Directory

### `lib/credits.js`
```js
CREDIT_COSTS    // { ats_score: 3, resume_import: 5, writing_assist: 1, ... }
CREDIT_LABELS   // Human-readable labels for each type
INITIAL_CREDITS // 30
ensureCredits(userId)         // Create record if missing
getBalance(userId)            // Returns current balance
deductCredits(userId, type)   // Atomic deduct; returns { ok, balance }
grantCredits(userId, amount, type, description) // Admin/system grant
getTransactions(userId, limit)  // Recent transaction history
```

### `lib/gemini.js`
```js
callGemini(contents, opts)     // Primary AI call; auto-falls back to Groq
callGroqFallback(contents, opts) // Direct Groq call (internal)
// opts: { system, json, temperature, maxTokens }
// Auto-fallback on: 429, 503, 500, 502, 504 or overloaded/rate-limit messages
```

### `lib/auth-helpers.js`
```js
requireUser(request)    // Validates auth; supports proxy_uid impersonation
requireAdmin(request)   // requireUser + role === 'admin' check
checkLoginRateLimit(userId)       // Rate limit check
recordFailedLogin(userId)         // Increment failure count
clearFailedLogins(userId)         // Reset + stamp last_login_at
auditLog({ performedBy, action, targetUserId, ... })
```

### `lib/authUtils.js`
```js
getAuthUser()   // Reads Supabase session + proxy_uid impersonation support
// Used by all builder/* API routes
```

### `lib/self-test/questionLibrary.js`
```js
fetchFromLibrary(skill, difficulty, type, count)  // Two-pass library lookup
saveQuestionsToLibrary(questions)                 // Auto-save AI questions
normaliseLibraryQuestion(q)                       // Map to session format
updateLibraryQuestionStats(questionId, correct)   // Update times_correct/incorrect
```

---

## 14. Database Schema

### User & Auth
| Table | Key Columns |
|-------|-------------|
| `auth.users` | Supabase managed — id, email, created_at, email_confirmed_at |
| `profiles` | id (→ auth.users), first_name, last_name, email, role, status, headline, city, country, avatar_url, last_login_at, failed_login_attempts, locked_until, updated_at |

### Credits
| Table | Key Columns |
|-------|-------------|
| `user_credits` | id, user_id, balance (default 30), created_at, updated_at |
| `credit_transactions` | id, user_id, amount (negative=debit), type, description, metadata, created_at |
| `credit_requests` | id, user_id, amount_requested, reason, status (pending/approved/rejected), reviewed_by, reviewed_at, admin_notes |

**Supabase RPCs:**
- `deduct_credits(p_user_id, p_amount)` → returns new balance or -1 if insufficient
- `add_credits(p_user_id, p_amount)` → returns new balance

### Resume Builder
| Table | Key Columns |
|-------|-------------|
| `builder_resumes` | id, user_id, title, template_id, personal_info (JSONB), created_at, updated_at |
| `builder_sections` | id, resume_id, user_id, type, title, content (JSONB), position, enabled |
| `resumes` | id, user_id, file_path, file_name, parsed_data (JSONB), ats_score, status, created_at |

### Career Map & Study Plans
| Table | Key Columns |
|-------|-------------|
| `career_map_sessions` | id, user_id, resume_id, extracted_profile (JSONB), selected_skills, creation_mode, questionnaire (JSONB), status |
| `career_map_questions` | id, session_id, question_number, question_text, question_type, question_intent, options (JSONB), answer_value, answer_label, confidence_after, should_continue |
| `study_plans` | id, user_id, session_id, target_role_id, target_role_title, missing_skills, preferences (JSONB), plan_structure (JSONB), total_weeks, total_hours, status |
| `study_plan_topics` | id, study_plan_id, week_number, topic_order, skill, title, description, estimated_hours, sections (JSONB), youtube_videos (JSONB), is_completed |
| `study_plan_progress` | id, user_id, topic_id, section_id, is_completed, completed_at |

### Courses
| Table | Key Columns |
|-------|-------------|
| `course_sources` | id, course_id, user_id, type (pdf/url/text/web/ai/youtube), title, url, extracted_text, token_count, metadata (JSONB) |
| `course_chat_messages` | id, course_id, user_id, role (user/assistant), content, created_at |
| `course_study_guides` | course_id, user_id, content, source_ids, generated_at |

### Self-Test
| Table | Key Columns |
|-------|-------------|
| `self_test_sessions` | id, user_id, input_type, difficulty, timer_minutes, questions (JSONB), question_types (JSONB), status |
| `self_test_attempts` | id, session_id, user_id, answers (JSONB), score, short_answer_score, combined_score, combined_pct, auto_submitted |
| `question_library` | id, skill, topic, type, question_text, options (JSONB), correct_answer, explanation, difficulty, times_correct, times_incorrect, source, created_at |
| `admin_tests` | id, title, description, skill, difficulty, question_type, question_ids (JSONB), created_by |
| `admin_test_links` | id, test_id, token, max_attempts, expires_at, created_by |

### Interview Buddy
| Table | Key Columns |
|-------|-------------|
| `interview_kits` | id, user_id, title, company, role_level, depth, jd_text, categories (JSONB), questions (JSONB), question_count, created_at |

### Jobs
| Table | Key Columns |
|-------|-------------|
| `job_listings_cache` | id, cache_key, query_text, jobs (JSONB), result_count, hit_count, cached_at, expires_at |
| `user_job_interactions` | id, user_id, job_id, job_title, company, action (viewed/applied/saved/dismissed), created_at |
| `jsearch_quota_log` | id, called_at, query, result_count |

### Notes
| Table | Key Columns |
|-------|-------------|
| `notes` | id, user_id, title, content (JSONB Tiptap), icon, is_pinned, is_archived, word_count, context_type, context_id, parent_id, share_token |
| `note_tags` | id, note_id, tag_name |

### Skills
| Table | Key Columns |
|-------|-------------|
| `skills` | id, name, slug, category, subcategory, aliases (JSONB), description, is_active, is_trending, is_verified, search_count, selection_count |
| `skill_categories` | id, name, slug, description, icon, sort_order |
| `skill_topics` | id, skill_id, name, slug, description, is_active |
| `skill_analytics` | id, skill_id, event_type, user_id, context, created_at |
| `user_submitted_skills` | id, name, submitted_by, status, merged_into, admin_note |

### Caching
| Table | Key Columns |
|-------|-------------|
| `youtube_video_cache` | id, query_hash, video_id, video_data (JSONB), skill, hit_count, cached_at, expires_at |
| `transcript_sessions` | id, session_id, user_id, chunks (JSONB), full_text, language, source_url |
| `email_resend_limits` | email, resend_count, window_start |

### Audit
| Table | Key Columns |
|-------|-------------|
| `audit_logs` | id, performed_by, action, target_user_id, target_email, details (JSONB), created_at |

---

## 15. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role (admin client) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GROQ_API_KEY` | ✅ | Groq API key (fallback LLM + Whisper) |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter (resume parsing) |
| `YOUTUBE_API_KEY` | ✅ | YouTube Data API v3 |
| `JSEARCH_API_KEY` | ✅ | JSearch / RapidAPI (job search) |
| `TAVILY_API_KEY` | ✅ | Tavily web search |
| `EXA_API_KEY` | ✅ | Exa web search |
| `RESEND_API_KEY` | ✅ | Resend email service |
| `NEXTAUTH_SECRET` | ✅ | Session secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL (e.g. https://proflect-neo.vercel.app) |
