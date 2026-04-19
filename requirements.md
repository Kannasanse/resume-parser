# Resume Parser — Requirements

## Overview

A web application that allows users to upload resumes (PDF/DOCX), automatically extracts structured information, and displays the parsed data in a searchable, exportable interface.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Vite, TailwindCSS, React Query, React Router v6 |
| Backend    | Node.js, Express 4                      |
| Database   | Supabase (PostgreSQL)                   |
| Storage    | Supabase Storage                        |
| Auth       | None (open access)                      |
| Parsing    | pdf-parse, mammoth, rule-based extractor |

---

## Functional Requirements

### FR-01 — Resume Upload
- User can upload a resume file via drag-and-drop or file browser
- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10 MB
- File is stored in Supabase Storage

### FR-02 — Resume Parsing
- System extracts raw text from uploaded file
- Rule-based extractor identifies:
  - Candidate name
  - Email address
  - Phone number
  - Professional summary / objective
  - Skills (comma or bullet separated lists)
  - Work experience (company, title, dates, description)
  - Education (institution, degree, field, graduation year)
- Parsed data is stored in the database

### FR-03 — Resume List View
- Displays all uploaded resumes in a paginated grid (10 per page)
- Each card shows: candidate name, email, status badge, top 5 skills
- User can navigate to detail view or delete from the card

### FR-04 — Resume Detail View
- Displays full parsed data for a resume:
  - Candidate info (name, email, phone)
  - Professional summary
  - Skills (all)
  - Work experience timeline
  - Education history
- User can trigger a reparse of the resume

### FR-05 — Delete Resume
- User can delete a resume from the list or detail view
- Deletion removes the database record and the stored file
- Related parsed_data, work_experience, and education records are cascade deleted

### FR-06 — Export
- User can export a resume's parsed data as:
  - **JSON** — full structured data
  - **CSV** — flat summary (name, email, phone, skills)
- Export triggers a file download in the browser

### FR-07 — Reparse
- User can re-run parsing on a previously uploaded resume using the stored raw text
- Old parsed data is replaced with the new result

---

## Non-Functional Requirements

### NFR-01 — Performance
- Upload + parse response time < 5 seconds for files under 2 MB
- Resume list page loads in < 2 seconds

### NFR-02 — Reliability
- Resume status reflects processing state: `pending`, `processing`, `completed`, `failed`
- Failed parses do not leave orphaned records

### NFR-03 — Security
- Service role key used only server-side (never exposed to frontend)
- Publishable key used client-side only
- File uploads restricted to PDF/DOCX MIME types
- File size capped at 10 MB server-side via multer

### NFR-04 — Usability
- Responsive layout (mobile + desktop)
- Drag-and-drop upload with visual feedback
- Loading and error states on all async operations

---

## Database Schema

```
resumes          id, file_name, file_url, raw_text, status, created_at, updated_at
parsed_data      id, resume_id*, candidate_name, email, phone, summary, skills[], raw_json, created_at
work_experience  id, parsed_data_id*, company, title, start_date, end_date, description
education        id, parsed_data_id*, institution, degree, field, graduation_year
```
`*` = foreign key with ON DELETE CASCADE

---

## REST API Endpoints

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| POST   | /api/v1/resumes/upload          | Upload file and parse          |
| GET    | /api/v1/resumes                 | List resumes (paginated)       |
| GET    | /api/v1/resumes/:id             | Get resume with parsed data    |
| DELETE | /api/v1/resumes/:id             | Delete resume                  |
| GET    | /api/v1/resumes/:id/export      | Export as JSON or CSV          |
| POST   | /api/v1/resumes/:id/reparse     | Re-run parsing on stored text  |
| GET    | /health                         | Backend health check           |

---

## Project Structure

```
Resume Grader/
├── database/
│   └── schema.sql              PostgreSQL schema for Supabase
├── backend/
│   ├── src/
│   │   ├── index.js            Express app entry point (port 3000)
│   │   ├── routes/
│   │   │   └── resumes.js      All resume API routes
│   │   └── services/
│   │       ├── supabase.js     Supabase client (service role)
│   │       ├── storage.js      Supabase Storage upload/delete
│   │       └── parser.js       Text extraction + rule-based parser
│   ├── .env                    Environment variables
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx             Router setup
    │   ├── main.jsx            React entry point
    │   ├── index.css           Tailwind directives
    │   ├── lib/
    │   │   └── api.js          Axios API client
    │   ├── pages/
    │   │   ├── Upload.jsx      File upload page
    │   │   ├── ResumeList.jsx  Paginated resume grid
    │   │   └── ResumeDetail.jsx Full parsed resume view
    │   └── components/
    │       ├── Navbar.jsx
    │       └── ResumeCard.jsx
    ├── .env                    Frontend environment variables
    └── package.json

---

## Known Limitations

- Rule-based parser accuracy depends on resume formatting conventions
- Name detection may fail on non-standard resume layouts
- Experience parsing relies on date patterns being present in the text
- No authentication — all resumes are accessible to anyone with the URL
- CSV export is a flat summary only (does not include work experience/education rows)

---

## Future Enhancements

- Integrate Claude AI (Anthropic API) for higher-accuracy parsing
- Add authentication (Supabase Auth)
- Resume search and filter by skills, name, or date
- Job description matching / resume scoring
- Bulk upload support
- Resume comparison view
```
