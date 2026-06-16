# Proflect — Requirements & Implementation Reference

> **Status:** Living document. Reflects implementation as of 2026-06-15.  
> **Stack:** Next.js 15 App Router · MUI v9 · Tiptap v3 · Supabase · Gemini 3.5 Flash  
> **Platform:** https://proflect-neo.vercel.app  
> **Design Reference:** `design-brief` (MUI v9 + TailwindCSS component spec)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [AI Model Usage](#4-ai-model-usage)
5. [Credit System](#5-credit-system)
6. [Feature Inventory by Surface](#6-feature-inventory-by-surface)
7. [Page Inventory](#7-page-inventory)
8. [Block Editor](#8-block-editor)
9. [API Route Inventory](#9-api-route-inventory)
10. [Database Tables](#10-database-tables)
11. [Environment Variables](#11-environment-variables)
12. [Authentication & Authorization](#12-authentication--authorization)

---

## 1. Product Overview

Proflect is a career-intelligence platform for job seekers and professionals. It combines AI-powered resume analysis, a visual resume builder, a portfolio website builder, a Notion-style block editor for notes, a self-assessment test engine, an AI-guided career-map learning roadmap, and an AI-powered interview preparation kit generator — all in one product.

**Primary users:**
- Job seekers preparing resumes and portfolios
- Professionals mapping their career path
- Students studying for technical roles
- Organizations using the proctored test engine (admin surface)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, App Router, `'use client'` components |
| UI | MUI v9 + Tailwind CSS · light-first, dark-mode via `dark:` variant |
| Rich Text | Tiptap v3 (`^3.23.6`) — ProseMirror-based block editor |
| Auth | Supabase Auth (email/password + email verification) |
| Database | Supabase (Postgres) with RLS + RPC functions |
| Storage | Supabase Storage (avatars, resume files) |
| PDF export | Puppeteer (headless Chrome) |
| DOCX export | `docx` npm package |
| PDF parsing | `pdfjs-dist` (coordinate-aware, multi-column aware) + `pdf-parse` fallback |
| DOCX parsing | `mammoth` |
| Utilities — PDF edit | `pdf-lib` (client-side: merge, split, rotate, crop, watermark, redact, sign, protect) |
| Utilities — Spreadsheets | `xlsx` / SheetJS (server-side: PDF↔Excel conversion) |
| Utilities — Markdown | `marked` (server-side: Markdown → HTML → PDF via Puppeteer) |
| Utilities — Image compression | `browser-image-compression` (client-side) |
| Utilities — Image crop | `react-image-crop` v11 (client-side) |
| Utilities — ZIP bundling | `jszip` (client-side multi-file downloads) |
| AI — All features | Google Gemini 3.5 Flash (`@google/genai` SDK) |
| Deployment | Vercel |

---

## 3. Design System

> Full component spec in `design-brief`. Summary below for quick reference.

**Fonts:** `Inter` (all text) · `JetBrains Mono` (code/monospace)

**Color tokens:**

| Token | Value | Usage |
|---|---|---|
| Primary | `#185FA5` | Buttons, links, active states |
| Primary Dark | `#0C447C` | Hover/pressed |
| Primary Light bg | `#E6F1FB` | Selected rows, chips, active nav |
| Success | `#1D9E75` | Positive scores, active status |
| Error | `#D93025` | Errors, failed status, danger zone |
| Warning | `#F59E0B` | Moderate scores, pending status |
| Text | `#2C2C2A` | Primary body text |
| Secondary Text | `#6B7280` | Subtitles, captions |
| Disabled | `#9CA3AF` | Placeholder, muted |
| Border | `#D1DCE8` | Card/input borders |
| Surface | `#FFFFFF` | Card, modal backgrounds |
| Page bg | `#F4F8FC` | App background |

**Shape:** Inputs/buttons `8px` · Cards `12px` · Modals `16px` · Pills `9999px`  
**Shadows:** Cards `0 2px 8px rgba(12,68,124,0.10)` · Modals `0 8px 32px rgba(12,68,124,0.16)`  
**Spacing base:** 8px  
**Theme:** Light-first; dark-mode toggle exists but is secondary.

**Score band colors:**

| Band | bg | color |
|---|---|---|
| Strong Match | `#D1FAE5` | `#1D9E75` |
| Good Match | `#E6F1FB` | `#185FA5` |
| Moderate Match | `#FEF3C7` | `#B45309` |
| Weak Match | `#FEE2E2` | `#D93025` |

---

## 4. AI Model Usage

### 3.1 Model Reference

| Provider | Model ID | Notes |
|---|---|---|
| Google Gemini | `gemini-3.5-flash` | Single model used across all AI features; via `@google/genai` SDK |

### 3.2 Feature → Model Map

All AI features now use **Gemini 3.5 Flash** via the `callGemini()` wrapper. No provider fallback chain.

| Feature | Cost |
|---|---|
| Resume parsing (file upload) | Free |
| Resume parsing (builder import) | 5 credits |
| Resume reparse | Free |
| ATS score analysis | 3 credits |
| ATS score narrative summary | Included in ATS |
| Writing assistant | 1 credit |
| Self-test: Question generation (all input types) | Free |
| Self-test: JD skill extraction | Free |
| Self-test: Short-answer grading | Free |
| Career Map: Learning roadmap generation | Free |
| Career Map: Section content generation | Free |
| Jobs: Skill extraction from JD | Free |
| Admin: Question library generation | Admin only |
| Interview Buddy: Kit generation | Free |
| Course workspace: Chat (grounded Q&A) | Free |
| Course workspace: Study guide generation | Free |

### 3.3 JSON Reliability

`callGemini()` in `lib/gemini.js` applies a 3-stage JSON parse fallback for all `json: true` calls:
1. Direct `JSON.parse(text)`
2. Strip markdown fences (` ```json … ``` `) then parse
3. Apply `jsonrepair` (npm) to fix unescaped newlines, trailing commas, etc.

### 3.4 AI Wrapper Functions

| Function | File | Purpose |
|---|---|---|
| `callGemini(contents, opts)` | `lib/gemini.js` | Gemini 3.5 Flash wrapper; supports `system`, `json`, `temperature`, `maxTokens` |
| `checkAiUsage(userId, supabase)` | `lib/gemini.js` | Count AI uses this calendar month from `ai_usage` table |
| `recordAiUsage(userId, feature, supabase)` | `lib/gemini.js` | Insert row into `ai_usage` |
| `parseResume(buffer, mimeType)` | `lib/parser.js` | Gemini-powered parse; returns `{ rawText, structured }` |
| `extractResumeText(buffer, mimeType)` | `lib/parser.js` | Text extraction only (no AI) |

---

## 5. Credit System

### 4.1 Credit Costs

Defined in `lib/credits.js` (`CREDIT_COSTS`):

| Action | Credit Type Key | Cost |
|---|---|---|
| ATS Score Analysis | `ats_score` | **3 credits** |
| Resume Import (AI parse in builder) | `resume_import` | **5 credits** |
| AI Writing Assistant | `writing_assist` | **1 credit** |

### 4.2 Initial Grant

New users automatically receive **30 credits** on first login (inserted by `ensureCredits()`).

### 4.3 Credit Flow

1. Client calls a credit-gated API route
2. Route calls `deductCredits(userId, type)` which executes the Supabase RPC `deduct_credits(p_user_id, p_amount)` atomically
3. RPC returns new balance or `-1` if insufficient
4. On insufficient balance: `{ ok: false, balance }` — client shows upgrade prompt
5. Each deduction is logged as a row in `credit_transactions`

### 4.4 Credit Sources

| Source | Type Key | Description |
|---|---|---|
| Account creation | `initial_grant` | 30 credits automatically |
| Admin grant | `admin_grant` | Admin dashboard → user credits panel |
| Approved request | `request_approved` | User submits credit request; admin approves |

### 4.5 Admin Credit Management

- `GET /api/v1/admin/credits` — list all users with balances
- `POST /api/v1/admin/credits` — grant credits to a specific user
- `GET /api/v1/admin/credits/requests` — list pending credit requests
- `PATCH /api/v1/admin/credits/requests/[reqId]` — approve/reject request
- `GET /api/v1/admin/credits/transactions` — full transaction log

---

## 6. Feature Inventory by Surface

### 5.1 Resume Upload & Parsing

**Route:** `POST /api/v1/resumes/upload`

- Accepts PDF, DOCX, TXT (max 10 MB)
- Coordinate-aware PDF text extraction handles multi-column layouts (`pdfjs-dist`, sorted by Y then X coordinate)
- Fallback to `pdf-parse` for encrypted/non-standard PDFs
- AI parsing: Gemini 3.5 Flash (`callGemini` via `lib/parser.js`)
- Extracted fields: `personal_info`, `summary`, `skills` (with proficiency), `experience`, `projects`, `education`, `certifications`, `other`
- Skills proficiency inferred: Expert / Advanced / Intermediate / Beginner / null
- Stored in `resumes` table with `raw_text` and `parsed_data` (JSONB)

**Reparse:** `POST /api/v1/resumes/[id]/reparse`
- Re-runs AI parsing on existing `raw_text`; same Gemini 3.5 Flash chain

### 5.2 Resume Viewer

**Route:** `app/(main)/resumes/[id]`

- Read-only view of parsed resume
- Sections: Contact, Summary, Skills, Experience, Projects, Education, Certifications
- Skills display with proficiency badges
- Review mode: `app/(main)/review/[id]` — recruiter-facing link-based view (no auth required)

### 5.3 ATS Score

**Route:** `POST /api/v1/resumes/[id]/score`  
**Cost:** 3 credits (`ats_score`)

- Requires a job profile (from `job_profiles` table or raw JD text)
- Scoring dimensions: Skills (40%), Experience (25%), Education (15%), Projects (10%), Quality (10%)
- Skill synonym matching via `SKILL_SYNONYMS` map in `lib/scorer.js`
- Returns: overall score (0–100), band (Excellent/Good/Fair/Poor), per-dimension breakdown, skill match detail, narrative summary
- AI narrative summary: Gemini 3.5 Flash (`callGemini`, 200–400 tokens)

### 5.4 Resume Builder

**Routes:** `GET/POST /api/v1/builder`, `GET/PUT/DELETE /api/v1/builder/[id]`

**Sections:** `GET/POST /api/v1/builder/[id]/sections`, `PUT/DELETE /api/v1/builder/[id]/sections/[sectionId]`

- Visual resume editor with reorderable sections
- Section types: Summary, Experience, Education, Skills, Projects, Certifications, Custom
- Photo upload: `POST /api/v1/builder/[id]/photo`

**AI Import (parse resume into builder):**
- `POST /api/v1/builder/[id]/import` — costs 5 credits (`resume_import`)
- Uses Gemini 3.5 Flash (`callGemini` via `lib/parser.js`)

**AI Writing Assistant:**
- `POST /api/v1/builder/[id]/writing-assist` — costs 1 credit (`writing_assist`)
- Model: Gemini 3.5 Flash
- Rewrites or improves selected section content

**ATS Score (builder):**
- `POST /api/v1/builder/[id]/ats-score` — costs 3 credits (`ats_score`)
- Same scoring logic as resume ATS score

**Export:**
- `POST /api/v1/builder/[id]/export/pdf` — Puppeteer headless PDF
- `POST /api/v1/builder/[id]/export/word` — DOCX via `docx` package

**Share / Public view:**
- `POST /api/v1/builder/[id]/share` — generates a share token
- `GET /api/public/resume/[token]` — public read-only view (no auth required)

**Templates:**
- `GET /api/v1/templates` — list available resume templates; returns `featuredIds[]` for Featured category
- Admin: `GET/POST /api/v1/admin/templates`
- 11 built-in templates: Modern, Atlantic Blue, Corporate, Atlantic Crest, Mercury Flow, Steady Form, Executive, Azure Wave, Noir Flash, Verdant Crest, Confetti
- `TemplateGallery` component: search, category/style filter pills, Featured virtual category, thumbnail grid, full-size preview modal with prev/next navigation
- `ResumeTemplatePreviews.jsx`: SVG-based static preview thumbnails for all 11 templates (no rendering overhead); each exported component accepts a `dark` prop; `TEMPLATE_PREVIEWS` map keyed by template ID; `PreviewThumb` wrapper falls back to CSS-scaled `TemplateThumbnail` for any unmapped ID

### 5.6 Notes (Block Editor)

**Routes:** `GET/POST /api/v1/notes`, `GET/PUT/DELETE /api/v1/notes/[id]`  
**Pages:** `app/(main)/notes`, `app/(main)/notes/[noteId]`

- Hierarchical notes: parent/child pages (sub-pages)
- Each note stores content as Tiptap JSON in `notes.content` (JSONB)
- Notes sidebar: folder tree navigation
- Block editor uses `mode='full'` (all features enabled)
- Move-to modal for restructuring note hierarchy
- Grid and list view for note browsing

### 5.7 Self-Test Engine

**Routes:**  
`POST /api/v1/self-test` — create session  
`GET /api/v1/self-test/[id]` — fetch session + questions  
`POST /api/v1/self-test/[id]/self-grade` — grade short-answer responses  
`POST /api/v1/self-test/skills` — list available skills  
`POST /api/v1/self-test/jd-extract` — extract skills from job description  

**Input types:**

| `input_type` | Source | Description |
|---|---|---|
| `skills` | User selects from skill list | Generate questions for chosen skills |
| `content` | Free text or topic content | Generate questions from pasted content (min 100 chars) |
| `jd` | Job description URL or text | Extract skills from JD → generate skill-mapped questions |

**Question types:**
- **MCQ** — 4 options, exactly 1 correct, all have `explanation` field
- **True/False** — one definitively correct answer with `explanation`
- **Short Answer** — 2–6 sentence written response; AI-graded; has `model_answer`, `grading_rubric`, `answer_keywords`

**Configuration options:**
- Question count: 5 / 10 / 15 / 20
- Difficulty: Easy / Medium / Hard
- Timer: optional per-session countdown (minutes)
- Question type: MCQ only / Mixed (MCQ + Short Answer)

**AI model:** Gemini 3.5 Flash (`callGemini`) for question generation, JD skill extraction, and short-answer grading.

**Self-test from topic (Career Map integration):**
- "Test yourself" button on `CourseDetailPage` opens `TestConfigModal`
- Modal extracts plain text from topic sections (handles string content or Tiptap JSON via recursive `extractTiptapText()`)
- POSTs to `/api/v1/self-test` with `input_type: 'content'`
- Redirects to `/self-test/[sessionId]` on success

### 5.8 My Courses — Knowledge Workspace

**Course topic view** (`/career-map/study-plan/[id]/topic/[topicId]`) is a **3-panel workspace**:

```
[Sources 240px] | [Section nav + content] | [Chat / Study Guide 320px]
```

All existing functionality (section generation, progress tracking, phases, YouTube, Notes) is preserved. Three new toggleable panels are added via top-bar buttons:

#### Left Panel — Sources

Button: **Sources** in top bar (toggles 240px left panel)

User can add material to ground the AI chat and study guide:
- 📄 **PDF** — upload up to 25 MB; text extracted with `pdf-parse`; file stored in Supabase Storage `course-sources` bucket
- 🔗 **URL** — fetches and strips HTML to plain text
- 📝 **Text** — free-text paste

Existing AI-generated sections and web-sourced content are surfaced as `ai` / `web` source types (future enhancement).

#### Right Panel — Chat & Study Guide

Button: **Chat** in top bar (toggles 320px right panel, Chat tab active)

**Chat tab** — grounded Q&A against course sources:
- Model: Gemini 3.5 Flash, temperature 0.2, max 800 tokens
- Sources injected into system prompt (up to ~12k chars of context)
- If no sources: falls back to general knowledge with a prompt to add material
- Chat history persisted in `course_chat_messages`; last 100 messages loaded on open
- Suggested prompts shown when history is empty

**Study Guide tab** — auto-generated structured guide:
- Model: Gemini 3.5 Flash, temperature 0.3, max 1500 tokens
- Sections: Key Concepts, Key Differences, Common Patterns, Quick Quiz (5–7 Q&A pairs), Sources Used
- Cached in `course_study_guides` (upsert by course_id); regenerate on demand
- Export to PDF via existing `/api/v1/utilities/documents/markdown-to-pdf`
- "Send to Notes" saves to `/api/v1/notes`

**Notes** button still opens `TopicNotesPanel` (unchanged). Notes and Chat/Guide panels are mutually exclusive.

#### New API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/courses/[id]/sources` | List course sources |
| POST | `/api/v1/courses/[id]/sources` | Add source (multipart for PDF, JSON for url/text) |
| DELETE | `/api/v1/courses/[id]/sources/[sourceId]` | Remove source |
| GET | `/api/v1/courses/[id]/chat` | Load chat history (100 messages) |
| POST | `/api/v1/courses/[id]/chat` | Send message, get grounded reply |
| GET | `/api/v1/courses/[id]/study-guide/generate` | Load cached guide |
| POST | `/api/v1/courses/[id]/study-guide/generate` | Generate/regenerate guide |

#### New Database Tables

| Table | Purpose |
|---|---|
| `course_sources` | User-added source material (PDF/URL/text) per course; `extracted_text`, `token_count`, `file_path` |
| `course_chat_messages` | Persisted chat history per course; `role` (user/assistant) |
| `course_study_guides` | Cached study guide per course (upserted); `source_ids[]`, `generated_at` |

**Migration:** `nextjs/supabase/migrations/20260609_course_workspace.sql`

---

### 5.9 Career Map

**Pages:**
- `app/(main)/career-map` — search and select target role
- `app/(main)/career-map/study-plan/[studyPlanId]` — study plan overview
- `app/(main)/career-map/study-plan/[studyPlanId]/topic/[topicId]` — course topic detail

**Routes:**
- `POST /api/v1/career-map/learning-roadmap` — generate full study plan for a target role
- `POST /api/v1/career-map/generate-section-content` — generate content for one topic section (streaming-friendly)
- `POST /api/v1/career-map/complete-section` — mark section as complete
- `POST /api/v1/career-map/complete-topic` — mark topic as complete
- `GET /api/v1/career-map/study-plan/[id]` — fetch plan + all topics
- `POST /api/v1/career-map/update-study-plan` — update plan metadata

**AI model:** Gemini 3.5 Flash (`callGemini`) for roadmap generation and section content generation.
- Roadmap generation: max 1500 tokens
- Section content generation: max 1024 tokens; prompt adapts to learner level and learning style; content is 300–600 words structured with `###` sub-headings; includes code examples or exercises when relevant

**Breadcrumb resolution:**  
TopBar detects UUID segments in career-map URLs and fetches real names from `/api/v1/career-map/study-plan/[planId]` to show human-readable breadcrumbs (e.g., "Career Map > Frontend Developer > React Hooks") instead of raw UUIDs.

**My Courses:**
- `app/(main)/my-courses` — list enrolled study plans with progress
- `GET/POST /api/v1/my-courses/[id]` — course details / enroll
- `GET /api/v1/my-courses/stats` — progress statistics
- `POST /api/v1/my-courses/[id]/status` — update enrollment status
- `POST /api/v1/my-courses/[id]/reset-progress` — reset all section/topic progress

### 5.10 Jobs

**Routes:** `GET/POST /api/v1/jobs`, `GET/PUT/DELETE /api/v1/jobs/[id]`  
`GET /api/v1/jobs/[id]/candidates` — list resumes scored for this job  
`GET /api/v1/jobs/[id]/score/[resumeId]` — get score for a specific resume  

**Job skill parsing:**
- `POST /api/v1/jobs/parse-skills` — extract skills from raw JD text
- Model: Gemini 3.5 Flash

### 5.11 Admin Surface

**Users:**
- `GET/POST /api/v1/admin/users` — list / create users (sortable by `last_login_at`)
- `GET/PUT/DELETE /api/v1/admin/users/[id]` — user management
- `POST /api/v1/admin/users/[id]/actions` — suspend, activate, reset password
- `GET /api/v1/admin/users/[id]/resumes/[resumeId]` — view any user's resume
- `GET /api/v1/admin/users/[id]/self-tests` — view user's test history
- `POST /api/v1/admin/impersonate` — start impersonation session (sets `proxy_uid` cookie; redirects admin to `/builder` as the target user)

**Last Login tracking:**  
`profiles.last_login_at` is kept in sync automatically via a Postgres trigger on `auth.users` (`on_auth_user_sign_in`). Fires on every sign-in method (password, magic link, OAuth, invite accept). Migration: `nextjs/supabase/migrations/20260612_sync_last_login.sql`.

**Proctored Test Engine (admin):**
- Create / edit tests: `GET/POST/PUT /api/v1/admin/tests/[id]`
- Add questions: `GET/POST /api/v1/admin/tests/[id]/questions`
- Reorder questions: `POST /api/v1/admin/tests/[id]/questions/reorder`
- Share test via links (token-based): `GET/POST /api/v1/admin/tests/[id]/links`
- View attempts: `GET /api/v1/admin/tests/[id]/attempts`, `GET .../[aid]`

**Question Library:**
- `GET/POST /api/v1/admin/question-library` — browse / create questions
- `PUT/DELETE /api/v1/admin/question-library/[qid]` — edit / delete
- `POST /api/v1/admin/question-library/generate` — AI-generate questions (Gemini 3.5 Flash)
- `POST /api/v1/admin/tests/[id]/questions/from-library` — add library questions to a test

**Homepage CMS:**
- `GET/PUT /api/v1/admin/homepage` — edit landing page content
- Editable sections: Hero, Features, Steps, Pricing, Testimonials, CTA, Footer, Custom HTML/text blocks

**Skills database:**
- `GET/POST /api/v1/admin/skills` — manage global skills taxonomy
- Users can submit new skills; admin approves via pending submissions tab

**Import:**
- `POST /api/v1/admin/import` — bulk user import

### 5.12 Interview Buddy

**Routes:**  
`POST /api/v1/interview-buddy/generate` — create kit  
`GET /api/v1/interview-buddy` — list user's kits (20 most recent)  
`GET /api/v1/interview-buddy/[kitId]` — fetch kit detail (updates `last_viewed_at`)  
`DELETE /api/v1/interview-buddy/[kitId]` — delete kit (RLS owner-only)

**Pages:** `app/(main)/interview-buddy` · `app/(main)/interview-buddy/[kitId]`

**Inputs:** Job description text (min 100 chars), role level (entry/mid/senior/lead/exec), depth (quick/standard/deep)

**AI output per kit:**
- Categorised behavioural interview questions
- Per-question difficulty chip: `core` (blue), `probing` (orange), `red-flag` (red)
- Expandable answer coaching with Strong answer / Weak answer guidance (inline colour-formatted)
- Follow-up probes per question
- `jdSignal` — which part of the JD triggered the question

**Frontend features:** Category filter pills (All + per-category), expand-all toggle, "Practice with self-test" action, "Print/Save PDF" action, previous kits list on landing page

**AI model:** Gemini 3.5 Flash (`callGemini` with `json: true`), temperature 0.4; `jsonrepair` fallback applied to handle malformed JSON output.

**Database:** `interview_kits` table — RLS via `auth.uid() = user_id`; stores `title`, `company`, `role_level`, `depth`, `jd_text`, `categories` (text[]), `questions` (JSONB), `question_count`, `last_viewed_at`

**Migration:** `nextjs/supabase/migrations/20260609_interview_buddy.sql` — run in prod ✓ (2026-06-09)

---

### 5.13 Profile

- `GET/PUT /api/v1/profile` — user profile (name, headline, bio, location, etc.)
- `POST /api/v1/profile/avatar` — upload avatar to Supabase Storage

### 5.14 Proctored Test (Candidate)

- `GET /api/v1/test/[token]` — load test by share link token (no auth)
- `POST /api/v1/test/[token]/save` — save answers
- `POST /api/v1/test/[token]/integrity` — log integrity events (tab-switch, focus-loss, copy-paste, etc.)

### 5.15 Utilities

**Page:** `app/(main)/utilities`  
34 browser-native tools for PDF manipulation, document conversion, image processing, and PDF security. No authentication required; all processing is either fully client-side (no upload) or via anonymous server routes.

**Hub structure** — 5 sections shown on `/utilities`:

#### PDF Tools (14)

| Tool | Route | Processing | Description |
|---|---|---|---|
| Merge PDF | `/utilities/pdf/merge` | Client (pdf-lib) | Combine multiple PDFs in order |
| Split PDF | `/utilities/pdf/split` | Client (pdf-lib) | Extract pages or split into multiple files |
| Compress PDF | `/utilities/pdf/compress` | Server | Reduce file size via re-serialisation |
| Rotate Pages | `/utilities/pdf/rotate` | Client (pdf-lib + pdfjs) | Per-page or bulk rotation with pdfjs thumbnail preview |
| Organise Pages | `/utilities/pdf/organise` | Client (pdf-lib + pdfjs) | Reorder/delete pages via drag-and-drop thumbnail grid |
| Remove Pages | `/utilities/pdf/remove-pages` | Client (pdf-lib + pdfjs) | Click thumbnails to mark pages for removal |
| Add Page Numbers | `/utilities/pdf/page-numbers` | Client (pdf-lib) | Stamp page numbers; configurable position and font size |
| Add Watermark | `/utilities/pdf/watermark` | Client (pdf-lib) | Overlay diagonal text (e.g. DRAFT, CONFIDENTIAL) |
| Crop PDF | `/utilities/pdf/crop` | Client (pdf-lib) | Set Top/Right/Bottom/Left margins in mm; `page.setCropBox()` |
| Repair PDF | `/utilities/pdf/repair` | Server | Re-load and re-save with `ignoreEncryption: true, throwOnInvalidObject: false` |
| Extract Images | `/utilities/pdf/extract-images` | Client (pdfjs) | Render pages to canvas at chosen DPI; download as ZIP |
| Compare PDFs | `/utilities/pdf/compare` | Client (pdfjs) | Side-by-side view of two PDFs with shared page navigator |
| Redact PDF | `/utilities/pdf/redact` | Client (pdfjs + pdf-lib) | Search text via `page.getTextContent()`; draw black rectangles over matches |
| Flatten PDF | `/utilities/pdf/flatten` | Client (pdf-lib) | `doc.getForm().flatten()` — bakes form fields into static content |

**Key implementation details — PDF tools:**
- pdfjs thumbnails: rendered at scale 0.3–0.4 for previews; full DPI scale for exports (72 dpi = scale 1, 150 = 2.08, 300 = 4.17)
- Redact coordinate system: pdfjs `item.transform[4/5]` is already in PDF user-space (bottom-left origin), directly matching pdf-lib coordinate system
- Crop: mm to PDF points conversion = `mm * 2.8346`; applied via `page.setCropBox(x_left_pt, y_bottom_pt, width_pt, height_pt)`
- Rotation: `page.setRotation(degrees(n))` from pdf-lib; existing page rotation is read via pdfjs to initialize CSS preview

#### Convert to PDF (7)

| Tool | Route | Processing | Description |
|---|---|---|---|
| Word to PDF | `/utilities/documents/word-to-pdf` | Server (Puppeteer) | mammoth → HTML → Puppeteer PDF |
| Excel to PDF | `/utilities/documents/excel-to-pdf` | Server (SheetJS + Puppeteer) | SheetJS `sheet_to_html()` → styled HTML → Puppeteer landscape A4 PDF |
| PowerPoint to PDF | `/utilities/documents/ppt-to-pdf` | — | Coming Soon placeholder; suggests Google Slides / LibreOffice |
| Images to PDF | `/utilities/documents/images-to-pdf` | Client (pdf-lib) | Embeds JPG/PNG (`embedJpg`/`embedPng`); WebP converted via canvas → PNG first; A4/Letter/Auto page sizes |
| HTML to PDF | `/utilities/documents/html-to-pdf` | Server (Puppeteer) | Accepts pasted HTML or `.html` file; auto-wraps fragments without `<!DOCTYPE` |
| Text to PDF | `/utilities/documents/text-to-pdf` | Client (pdf-lib) | Wraps plain text into a styled PDF client-side |
| Markdown to PDF | `/utilities/documents/markdown-to-pdf` | Server (marked + Puppeteer) | Write/Preview tabs; `marked()` → GitHub-styled HTML → Puppeteer PDF |

#### Convert from PDF (5)

| Tool | Route | Processing | Description |
|---|---|---|---|
| PDF to Word | `/utilities/pdf/to-word` | Server (pdfjs + docx) | Text extraction → DOCX via `docx` package |
| PDF to Excel | `/utilities/pdf/to-excel` | Server (pdfjs + SheetJS) | Y-coordinate snapping (`Math.round(y/5)*5`) for row grouping; one sheet per page |
| PDF to Images | `/utilities/pdf/to-images` | Client (pdfjs) | Renders each page to canvas; downloads as ZIP via JSZip |
| PDF to Text | `/utilities/documents/pdf-to-text` | Client (pdfjs) | Extracts raw text; download as `.txt` |
| PDF to HTML | `/utilities/pdf/to-html` | Server (pdfjs) | Text per page → `<section class="page">` HTML with stylesheet |

#### Image Tools (4)

| Tool | Route | Processing | Description |
|---|---|---|---|
| Compress Image | `/utilities/images/compress` | Client (browser-image-compression) | Quality slider 10–100%; `alwaysKeepResolution: true`; multi-file ZIP |
| Resize Image | `/utilities/images/resize` | Client (Canvas API) | Pixel/percentage/preset resize; aspect lock toggle; JPG/PNG/WebP output |
| Convert Format | `/utilities/images/convert` | Client (Canvas API) | Multi-file JPG↔PNG↔WebP; quality slider for lossy formats; ZIP download |
| Crop Image | `/utilities/images/crop` | Client (react-image-crop + Canvas) | Aspect presets (Free/1:1/16:9/4:3/3:2); canvas crop using natural/display scale factor |

**Key implementation details — image tools:**
- react-image-crop v11: `centerCrop`, `makeAspectCrop`; `onChange((_, percentCrop) => setCrop(percentCrop))`; `onComplete(pixelCrop)` for pixel coordinates
- Canvas crop scale: `scaleX = img.naturalWidth / img.width`; `drawImage(img, x*scaleX, y*scaleY, cw, ch, 0, 0, cw, ch)`

#### Security & Other (4)

| Tool | Route | Processing | Description |
|---|---|---|---|
| Password Protect | `/utilities/security/protect` | Client (pdf-lib) | User + owner password; permission checkboxes (Print, Copy, Edit) via `doc.encrypt()` |
| Unlock PDF | `/utilities/security/unlock` | Client (pdf-lib) | `PDFDocument.load(bytes, { password })` → copy pages into new unencrypted PDF |
| Sign PDF | `/utilities/security/sign` | Client (pdf-lib) | Three modes: Draw (canvas mouse/touch), Type (Georgia italic canvas preview), Upload PNG/JPG; placement (bottom-right/center/left), apply to last/all/first page |
| Merge Word Docs | `/utilities/documents/merge-word` | Server | Combine multiple DOCX files into one |

**Shared component notes:**
- `FileDropZone` — `accept` prop must be a comma-separated string (e.g. `".pdf,application/pdf"`); calls `.split(',')` internally
- `ToolPageLayout` — wraps all tool pages; accepts `icon` (JSX SVG), `title`, `description`, `parentHref`, `parentLabel`
- `ProcessingState` — spinner shown during async operations
- `ToolCard` — used on hub pages; `href`, `name`, `description`, `icon` (JSX), `gradient` (Tailwind `from-/to-` classes)

#### Code Playground

**Page:** `app/(main)/utilities/playground?lang=web|python|java|sql`  
**Component:** `components/playground/CodePlayground.jsx`  
**Sidebar location:** Learning → Code Playground

| Language | Execution | Notes |
|---|---|---|
| HTML/CSS/JS (`web`) | Client — sandboxed `<iframe>` with `srcdoc` | Live preview; full DOM access |
| Python | Client — Pyodide WASM via `lib/playground/pythonWorker.js` | Runs in a Web Worker; no install needed |
| SQL | Client — sql.js WASM served from `/public/sql-wasm.wasm` | In-memory SQLite; create tables, run queries |
| Java | Server — Wandbox API via `POST /api/v1/playground/run-java` | Proxied server-side to avoid CORS; dynamic compiler resolved from Wandbox `/api/list.json` |

`?lang=<language>` query param sets the initial tab. `CodePlayground` component exposes a language tab switcher.

---

## 7. Page Inventory

> Persona key: **Admin** = `profiles.role === 'admin'` · **User** = authenticated non-admin · **Public** = unauthenticated

### Auth & Onboarding

| Route | Page | Persona |
|---|---|---|
| `/login` | Login | All |
| `/signup` | Sign Up | All |
| `/verify-email` | Email Verification | All |
| `/forgot-password` | Forgot Password | All |
| `/reset-password` | Reset Password | All |
| `/join` | Invite Acceptance | All (token-gated) |

### Admin Surface

| Route | Page | Description |
|---|---|---|
| `/resumes` | Profiles List | Grid/table of uploaded resumes; status filter; bulk delete |
| `/resumes/upload` | Upload Resume | Drag-drop file queue; optional job profile link |
| `/resumes/:id` | Resume Detail | Parsed data tabs + scoring panel; export JSON/CSV |
| `/jobs` | Job Profiles List | Tile grid; candidate count per job |
| `/jobs/new` | New Job Profile | Form: basic info, JD, AI skill extraction, scoring weights |
| `/jobs/:id/edit` | Edit Job Profile | Same form pre-populated |
| `/jobs/:id` | Job Detail + Candidates | Candidates tab with band filter; Overview + Settings tabs |
| `/admin` | Dashboard | Stat cards (users, invitations, jobs) + quick actions |
| `/admin/users` | User List | Search/filter table; role + status chips |
| `/admin/users/:id` | User Detail + Edit | Role/status edit; danger zone with hold-to-delete |
| `/admin/invite` | Invite Users | Email chip input; pending invitations panel |
| `/admin/import` | Bulk CSV Import | 3-step: upload → preview → results |

### User Surface

| Route | Page | Description |
|---|---|---|
| `/builder` | Resume List | Resume cards with template swatch; create / upload |
| `/builder/:id` | Resume Editor | Two-panel split: section editor left, live preview right |
| `/builder/:id/review` | Review + Export | Full-page A4 preview; Download PDF button |
| `/interview-buddy` | Interview Buddy — Create | JD paste, role level + depth selectors, previous kits list |
| `/interview-buddy/:kitId` | Interview Buddy — Kit View | Category filter pills, question cards with expandable coaching, follow-ups |
| `/utilities/playground` | Code Playground | HTML/CSS/JS · Python · Java · SQL multi-tab editor; `?lang=` param sets initial tab |

### Public

| Route | Page | Description |
|---|---|---|
| `/r/:token` | Public Share | Unauthenticated resume view in selected template |
| `/access-denied` | Access Denied | Role-aware CTA (user → builder, admin → resumes) |

---

## 8. Block Editor

Built on **Tiptap v3** with ProseMirror. The main component is `BlockEditor` (`components/editor/BlockEditor.jsx`).

### 6.1 Mode Prop

| Mode | Description | Used On |
|---|---|---|
| `full` | All blocks, drag handles, slash menu, bubble menu | Notes |
| `standard` | Common blocks, no video, no sub-pages | Portfolio sections (planned) |
| `minimal` | Paragraphs + basic formatting only | Short fields |
| `readonly` | No editing; renders content only | Review, public views |

`isReadonly = readOnly prop || mode === 'readonly'`  
`isMinimal = mode === 'minimal'`  
VideoExtension is excluded when `mode === 'minimal'`.

### 6.2 Supported Block Types

**TEXT**
- Paragraph (`¶`) — shortcut: Enter
- Heading 1 (`H1`) — markdown: `# + Space`
- Heading 2 (`H2`) — markdown: `## + Space`
- Heading 3 (`H3`) — markdown: `### + Space`
- Heading 4 (`H4`) — markdown: `#### + Space`
- Heading 5 (`H5`)
- Heading 6 (`H6`)

**LISTS**
- Bulleted List (`•`) — markdown: `- + Space`
- Numbered List (`1.`) — markdown: `1. + Space`
- To-do / Task List (`☑`) — markdown: `[] + Space`
- Toggle — collapsible content block (`▶`)

**MEDIA** *(excluded in `minimal` mode)*
- Image (`🖼`) — insert by URL via `window.prompt`
- Video (`▶️`) — embed YouTube, Vimeo, or Loom

**STRUCTURE**
- Quote / Blockquote (`"`) — markdown: `> + Space`
- Divider / Horizontal Rule (`—`)
- Table (`⊞`) — 3×3 default with header row

**CODE**
- Code Block (`<>`) — markdown: ` ``` + Enter`; supports syntax highlighting

**CALLOUTS** (7 types)

| Block | Icon | `data-callout-type` value |
|---|---|---|
| Note (Info) | 💡 | `info` |
| Success | ✅ | `success` |
| Warning | ⚠️ | `warning` |
| Danger | 🚨 | `danger` |
| Important | 🔥 | `important` |
| Tip | 🎯 | `tip` |
| Quote block | 💬 | `quote` |

**PAGES** *(full mode only)*
- Sub-page (`📄`) — triggers `onCreateSubpage` callback

### 6.3 Inline Formatting (Bubble Menu)

Appears on text selection. Components in `NoteBubbleMenu.jsx`:

Bold · Italic · Underline · Strikethrough · Superscript · Subscript · Inline Code · Link (prompt) · Highlight · H1 / H2 / H3 toggle · Text Alignment (Left / Center / Right / Justify via dropdown)

### 6.4 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+E` | Inline code |
| `Ctrl+K` | Link |
| `Ctrl+Shift+H` | Highlight |
| `Ctrl+Shift+K` | Delete current block |
| `# + Space` | Heading 1 |
| `## + Space` | Heading 2 |
| `### + Space` | Heading 3 |
| `#### + Space` | Heading 4 |
| `- + Space` | Bullet list |
| `1. + Space` | Numbered list |
| `[] + Space` | Task list |
| `` ``` + Enter `` | Code block |
| `> + Space` | Blockquote |

### 6.5 Slash Menu (`/` command)

Component: `NoteSlashMenu.jsx`

- Triggered by typing `/` at the start of a paragraph
- Supports keyboard navigation: ↑↓ to move, Enter to insert, Escape to close
- Mouse hover updates selection; `onMouseDown` (not `onClick`) prevents editor blur
- Shows "Recently used" section (up to 3 items, stored in `localStorage` under key `editor_recent_blocks`)
- Real-time fuzzy search across block `label`, `desc`, and `id`

### 6.6 Drag Handle Left Rail (`BlockLeftRail`)

Component: `components/editor/BlockLeftRail.jsx`

- Rendered as a React portal (`createPortal`) at `position: fixed` in `document.body` to escape `overflow: hidden` containers
- Tracks hovered block via `mousemove` on `editor.view.dom`, walking up the DOM to find direct children of the editor root
- Block position resolved via `editor.view.posAtDOM(el, 0) - 1` → `$pos.before(1)` / `$pos.after(1)` for top-level block bounds
- Three buttons per hovered block:
  - `+` — insert new paragraph below current block
  - `⠿` (drag handle) — initiate drag-and-drop
  - `⋮` — open block context menu

**Drag-and-drop (no Tiptap Pro extension required):**
- `mousedown` on `⠿` → begin tracking mouse movement
- 2 px blue drop-line renders between blocks during drag
- Drop target stored in a `ref` (not state) to avoid stale closure in the `mouseup` handler
- `mouseup` executes ProseMirror transaction:
  - Moving **down**: `tr.insert(targetPos, node).delete(nodeStart, nodeEnd)` (insert first to keep positions valid)
  - Moving **up**: `tr.delete(nodeStart, nodeEnd).insert(targetPos, node)`
- Left rail positions cleared on `#layout-main` scroll events

### 6.7 Block Context Menu (`BlockContextMenu`)

Component: `components/editor/BlockContextMenu.jsx`

- Opens from `⋮` button; renders at `position: fixed` via a React portal at click coordinates
- Closes on Escape key or outside click (`mousedown` listener on `document`)

**Sections:**
- **Actions:** Delete block, Duplicate block, Copy text to clipboard
- **Move:** Move up one block, Move down one block (same ProseMirror transaction pattern as drag-and-drop)
- **Turn into:** Text (paragraph), H1, H2, H3, Bullet list, Numbered list, Quote, Code block

### 6.8 Custom Tiptap Extensions

| Extension | File | Description |
|---|---|---|
| `CalloutExtension` | `extensions/CalloutNode.jsx` | 7 callout variants; `data-callout-type` attribute; content via `block+` |
| `VideoExtension` | `extensions/VideoNode.jsx` | YouTube/Vimeo/Loom embed; `toEmbedUrl()` transforms share URLs to embed URLs; renders `<iframe>` at 16:9 |
| `BlockShortcuts` | `extensions/BlockShortcuts.js` | `Ctrl+Shift+K` keyboard shortcut to delete current block |

### 6.9 Tiptap Extensions Used

From `@tiptap/*` packages:

`StarterKit` (heading levels 1–6, paragraph, lists, code block, blockquote, horizontal rule, bold, italic, strike, code, history) · `TaskList` + `TaskItem` · `TextAlign` · `Image` · `Link` · `Highlight` · `Underline` · `Superscript` · `Subscript` · `Table` + `TableRow` + `TableCell` + `TableHeader` · `Placeholder` · `Typography`

---

## 9. API Route Inventory

### Resume

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/resumes` | List user's resumes |
| POST | `/api/v1/resumes/upload` | Upload & parse resume (Gemini 3.5 Flash) |
| GET | `/api/v1/resumes/[id]` | Get parsed resume |
| PUT | `/api/v1/resumes/[id]` | Update resume data |
| DELETE | `/api/v1/resumes/[id]` | Delete resume |
| POST | `/api/v1/resumes/[id]/reparse` | Re-run AI parsing |
| POST | `/api/v1/resumes/[id]/score` | ATS score vs job — **3 credits** |
| GET | `/api/v1/resumes/[id]/export` | Export resume |
| GET | `/api/public/resume/[token]` | Public resume view (no auth) |

### Builder

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/v1/builder` | List / create resume builders |
| GET/PUT/DELETE | `/api/v1/builder/[id]` | Get / update / delete builder |
| GET/POST | `/api/v1/builder/[id]/sections` | List / add sections |
| PUT/DELETE | `/api/v1/builder/[id]/sections/[sectionId]` | Update / delete section |
| POST | `/api/v1/builder/[id]/import` | Import from resume file — **5 credits** |
| POST | `/api/v1/builder/[id]/ats-score` | ATS score builder — **3 credits** |
| POST | `/api/v1/builder/[id]/writing-assist` | AI rewrite section — **1 credit** |
| POST | `/api/v1/builder/[id]/photo` | Upload photo |
| POST | `/api/v1/builder/[id]/share` | Generate share link |
| POST | `/api/v1/builder/[id]/duplicate` | Duplicate builder |
| POST | `/api/v1/builder/[id]/export/pdf` | Export PDF (Puppeteer) |
| POST | `/api/v1/builder/[id]/export/word` | Export DOCX |

### Jobs

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/v1/jobs` | List / create job profiles |
| GET/PUT/DELETE | `/api/v1/jobs/[id]` | Job CRUD |
| GET | `/api/v1/jobs/[id]/candidates` | Scored candidates for job |
| GET | `/api/v1/jobs/[id]/score/[resumeId]` | Score for specific resume |
| POST | `/api/v1/jobs/parse-skills` | Extract skills from JD (Groq) |

### Self-Test

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/self-test` | Create test session |
| GET | `/api/v1/self-test/[id]` | Fetch session + questions |
| POST | `/api/v1/self-test/[id]/self-grade` | AI-grade short-answer responses |
| POST | `/api/v1/self-test/skills` | List available skills |
| POST | `/api/v1/self-test/jd-extract` | Extract skills from JD |

### Career Map

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/career-map/learning-roadmap` | Generate study plan (Gemini 3.5 Flash) |
| POST | `/api/v1/career-map/generate-section-content` | Generate topic section (Gemini 3.5 Flash) |
| POST | `/api/v1/career-map/complete-section` | Mark section complete |
| POST | `/api/v1/career-map/complete-topic` | Mark topic complete |
| GET | `/api/v1/career-map/study-plan/[id]` | Get plan + all topics |
| POST | `/api/v1/career-map/update-study-plan` | Update plan metadata |
| GET | `/api/v1/my-courses/[id]` | Course enrollment details |
| GET | `/api/v1/my-courses/stats` | Enrollment statistics |
| POST | `/api/v1/my-courses/[id]/status` | Update enrollment status |
| POST | `/api/v1/my-courses/[id]/reset-progress` | Reset progress |

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/signup` | Register |
| POST | `/api/v1/auth/resend-verification` | Resend email verification |
| POST | `/api/v1/auth/forgot-password` | Send password reset email |
| POST | `/api/v1/auth/reset-password` | Set new password from reset token |
| POST | `/api/v1/auth/invite` | Generate invite |
| POST | `/api/v1/auth/accept-invite` | Accept invite token (`/join` page) |
| GET | `/api/v1/auth/invite/[token]` | Validate invite token + pre-fill email/role |

### Credits

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/credits` | Get balance + recent transactions |
| POST | `/api/v1/credits/request` | Submit credit request |

### Profile

| Method | Path | Description |
|---|---|---|
| GET/PUT | `/api/v1/profile` | Get / update profile |
| POST | `/api/v1/profile/avatar` | Upload avatar |

### Admin

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/users` | List users |
| GET/PUT/DELETE | `/api/v1/admin/users/[id]` | Manage user |
| POST | `/api/v1/admin/users/[id]/actions` | Suspend / activate |
| POST | `/api/v1/admin/invite` | Invite user |
| POST | `/api/v1/admin/import` | Bulk import |
| GET/POST | `/api/v1/admin/tests` | Test library CRUD |
| GET/PUT/DELETE | `/api/v1/admin/tests/[id]` | Test management |
| GET/POST | `/api/v1/admin/tests/[id]/questions` | Questions CRUD |
| PUT/DELETE | `/api/v1/admin/tests/[id]/questions/[qid]` | Edit/delete question |
| POST | `/api/v1/admin/tests/[id]/questions/reorder` | Reorder questions |
| GET/POST | `/api/v1/admin/tests/[id]/links` | Share link management |
| DELETE | `/api/v1/admin/tests/[id]/links/[lid]` | Delete share link |
| GET | `/api/v1/admin/tests/[id]/attempts` | All attempts |
| GET/PUT | `/api/v1/admin/tests/[id]/attempts/[aid]` | Attempt detail / score |
| GET/POST | `/api/v1/admin/question-library` | Question library |
| PATCH/DELETE | `/api/v1/admin/question-library/[qid]` | Edit / approve / suppress / delete question |
| DELETE | `/api/v1/admin/question-library/bulk` | Bulk delete questions |
| POST | `/api/v1/admin/question-library/generate` | AI-generate questions (Gemini 3.5 Flash) |
| POST | `/api/v1/admin/question-library/import` | Bulk import questions from CSV or JSON |
| GET | `/api/v1/admin/question-library/facets` | Skill and topic facets for filter dropdowns |
| POST | `/api/v1/admin/tests/[id]/questions/from-library` | Add from library |
| POST | `/api/v1/admin/impersonate` | Start impersonation session as a user |
| GET | `/api/v1/admin/credits` | Credit overview |
| POST | `/api/v1/admin/credits` | Grant credits |
| GET | `/api/v1/admin/credits/requests` | Pending credit requests |
| PATCH | `/api/v1/admin/credits/requests/[reqId]` | Approve / reject |
| GET | `/api/v1/admin/credits/transactions` | Transaction log |
| GET/PUT | `/api/v1/admin/homepage` | Homepage CMS |
| GET/POST | `/api/v1/admin/templates` | Resume templates |
| GET/POST | `/api/v1/admin/skills` | Skills taxonomy management |

### Interview Buddy

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/interview-buddy/generate` | Generate interview kit from JD (Gemini 3.5 Flash) |
| GET | `/api/v1/interview-buddy` | List user's kits (20 most recent) |
| GET | `/api/v1/interview-buddy/[kitId]` | Get kit detail; updates `last_viewed_at` |
| DELETE | `/api/v1/interview-buddy/[kitId]` | Delete kit (owner-only via RLS) |

### Proctored Test (Candidate)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/test/[token]` | Load test by share link token |
| POST | `/api/v1/test/[token]/save` | Save answers |
| POST | `/api/v1/test/[token]/integrity` | Log integrity event |

### Utilities (server-side routes only — most tools are fully client-side)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/utilities/pdf/compress` | Compress PDF via re-serialisation |
| POST | `/api/v1/utilities/pdf/repair` | Rebuild corrupted PDF (`ignoreEncryption`, `throwOnInvalidObject: false`) |
| POST | `/api/v1/utilities/pdf/to-excel` | Extract PDF text → XLSX (pdfjs + SheetJS) |
| POST | `/api/v1/utilities/pdf/to-html` | Extract PDF text → structured HTML (pdfjs) |
| POST | `/api/v1/utilities/pdf/to-word` | Extract PDF text → DOCX (pdfjs + docx) |
| POST | `/api/v1/utilities/documents/excel-to-pdf` | XLSX → PDF (SheetJS + Puppeteer, landscape A4) |
| POST | `/api/v1/utilities/documents/html-to-pdf` | HTML → PDF (Puppeteer) |
| POST | `/api/v1/utilities/documents/markdown-to-pdf` | Markdown → PDF (marked + Puppeteer) |
| POST | `/api/v1/utilities/documents/word-to-pdf` | DOCX → PDF (mammoth + Puppeteer) |
| POST | `/api/v1/utilities/documents/merge-word` | Merge multiple DOCX files into one |

All utilities routes accept `multipart/form-data` with a `file` field (or `html`/`markdown` text fields where noted). No authentication required.

### Code Playground

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/playground/run-java` | Proxy Java code to Wandbox API (avoids CORS); resolves compiler from `/api/list.json` dynamically |

---

## 10. Database Tables

| Table | Purpose |
|---|---|
| `resumes` | Uploaded resume files; `parsed_data` (JSONB), `raw_text` |
| `builder_sections` | Resume builder section data |
| `notes` | Block editor notes; `content` (Tiptap JSON JSONB), `parent_id` for hierarchy |
| `study_plans` | Career map study plans |
| `study_plan_topics` | Topics within a plan; `sections` (JSONB array with `generation_status`) |
| `career_map_sessions` | Career map assessment sessions; `extracted_profile` |
| `career_role_database` | Master role/skill taxonomy; `required_skills`, `core_skills`, `avg_years_exp` |
| `self_test_sessions` | Self-test sessions with questions (JSONB) |
| `self_test_attempts` | Candidate answers and scores |
| `admin_tests` | Admin-created proctored tests |
| `admin_test_questions` | Questions for admin tests |
| `admin_test_links` | Share links with token for proctored tests |
| `admin_test_attempts` | Candidate attempt records with integrity events |
| `question_library` | Reusable admin question bank |
| `user_credits` | Current credit balance per user |
| `credit_transactions` | Full ledger of all credit changes (amount, type, description) |
| `ai_usage` | Portfolio AI usage tracking for monthly rate limiting |
| `jobs` | Job profiles (title, JD text, required skills) |
| `job_skills` | Normalized skills per job |
| `organizations` | Multi-tenant organization support |
| `profiles` | User profile data (name, headline, avatar URL, bio, location); `last_login_at` synced from `auth.users.last_sign_in_at` via trigger |
| `skills` | Global skills taxonomy with pending approval queue |
| `interview_kits` | Interview Buddy kits; `questions` (JSONB), `categories` (text[]), `jd_text`, `last_viewed_at` |
| `question_library` entries have `is_approved`, `ai_generated`, `generated_for`, `source`, `skill_tag`, `topic`, `difficulty`, `points` | — |
| `course_sources` | User-added source material per course (PDF/URL/text); `extracted_text`, `token_count`, `file_path` |
| `course_chat_messages` | Grounded chat history per course; `role` (user/assistant) |
| `course_study_guides` | Cached AI study guide per course (upserted); `source_ids[]`, `generated_at` |

**Supabase RPCs:**

| RPC | Signature | Purpose |
|---|---|---|
| `deduct_credits` | `(p_user_id uuid, p_amount int) → int` | Atomic credit deduction; returns new balance or -1 if insufficient |
| `add_credits` | `(p_user_id uuid, p_amount int) → int` | Admin credit grant; returns new balance |

---

## 11. Environment Variables

All secrets in `.env.local` — **gitignored, never commit**.

| Variable | Used By | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client (browser) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client (browser) | Yes |
| `SUPABASE_URL` | Supabase server-side client (`lib/supabase.js`) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-side — bypasses RLS (preferred) | Yes |
| `GEMINI_API_KEY` | All AI features — Gemini 3.5 Flash via `@google/genai` | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API (career map video suggestions) | Optional |
| `TAVILY_API_KEY` | Tavily web search (career map content generation) | Optional |
| `EXA_API_KEY` | Exa search (career map content generation) | Optional |
| `JSEARCH_API_KEY` | JSearch API (job recommendations) | Optional |
| `NEXT_PUBLIC_APP_URL` | Base URL for share links and public routes | Yes |

> **Note:** `SUPABASE_SECRET_KEY` (legacy name) is accepted as a fallback for `SUPABASE_SERVICE_ROLE_KEY` in `lib/supabase.js`, but must be set to the actual service role key value — not the anon key.

---

## 12. Authentication & Authorization

- Auth provider: Supabase Auth (email/password)
- New accounts require email verification before login
- Server routes use `requireUser(request)` helper (`lib/auth-helpers.js`)
  - Reads `Authorization: Bearer <token>` header
  - Returns `{ user }` or throws 401
- Admin routes additionally check `profiles.role === 'admin'`
- Organizations: users can belong to an org; org-level access control scopes admin test visibility
- Public routes (no auth required):
  - `GET /api/public/resume/[token]` — share link for resume
  - `GET /api/v1/portfolios/public/[slug]` — published portfolio
  - `GET /api/v1/test/[token]` — proctored test by share link

---

## Appendix: Planned / Not Yet Implemented

The following features were scoped but not yet built:

- **Block editor — additional block types:** Math/KaTeX, Mermaid diagrams, Wikilinks, @mentions, tags, YAML frontmatter, footnotes, columns layout, synced blocks, template blocks, TOC block, bookmark/URL embed block, database/properties block
- **Builder → BlockEditor migration:** Replace textarea-based section editors in the resume builder with the block editor
- **Self-test improvements:** Spaced repetition scheduling, history/trend charts, per-skill performance breakdown, leaderboard
- **Career Map:** Video resource embedding per topic section, community notes on topics
- **Notes:** Full-text search across all notes, sharing individual notes publicly
- **Utilities — PowerPoint to PDF:** `/utilities/documents/ppt-to-pdf` is a Coming Soon placeholder; requires LibreOffice or a cloud conversion API on the server
- **Code Playground:** Expand to additional languages (Go, Rust, C++) via Wandbox; add file persistence and share links

---

*Last updated: 2026-06-15*
