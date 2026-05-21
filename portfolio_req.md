1. Portfolio Creation & Management
Multiple portfolios per user — users should be able to create and manage more than one portfolio (e.g. a general portfolio, a freelance portfolio, a job-specific one). Each portfolio has its own name, template, and content.
Link to resume data — when a user has an existing resume in the builder, the portfolio can pull from it automatically. Name, contact info, summary, work experience, skills, and education should pre-populate. Changes made in the resume builder should optionally sync to the portfolio, with the user choosing whether to accept or override per field.
Independent mode — the portfolio must also work for users who have not built a resume. All fields must be fillable from scratch without a resume being present.
Portfolio status — each portfolio has a status: Draft, Published, or Archived. Only published portfolios are publicly accessible via the shareable URL.

2. Content Blocks (Sections)
The portfolio builder must support a flexible, drag-and-drop section system. Users add, remove, and reorder blocks. Every block type below must be supported:
Core blocks (available to all users):

About / Hero — photo, name, headline/tagline, short bio, social links (LinkedIn, GitHub, Dribbble, Behance, personal website, Twitter/X), location, availability status (Open to work / Not available)
Work Experience — same structure as resume builder, can be linked or independent
Education — degrees, institutions, dates, achievements
Skills — with optional proficiency levels, grouped by category (Technical, Design, Soft Skills etc.)
Projects — the most important block (see Section 3 below)
Certifications & Awards — name, issuer, date, credential URL
Testimonials / Recommendations — quote, name, role, company, photo of recommender
Services — what the user offers (for freelancers), with optional pricing
Contact Form — embedded contact form with name, email, message, optional reCAPTCHA
Custom Text Block — rich text section for anything that doesn't fit elsewhere
Embed Block — paste any iframe or embed code (YouTube, CodePen, Figma, Google Maps etc.)

Creatives-specific blocks:

Photo / Image Gallery — grid or masonry layout, lightbox on click
Video Reel — YouTube or Vimeo URL embed as a hero video
Case Study — structured long-form block: problem, process, solution, outcome with images

Developers-specific blocks:

GitHub Stats — live-fetched GitHub contribution graph, top languages, repo count via GitHub API
Open Source Contributions — list of repos with stars, description, link
Tech Stack — visual icon grid of technologies (pulled from a curated icon library)
Code Snippet — syntax-highlighted code block


3. Projects Block (Most Critical Feature)
Projects are the centrepiece of any portfolio. Each project entry must support:

Title, tagline, description (rich text)
Cover image or video (upload or URL)
Project URL and source code URL (GitHub link)
Tech stack / tools used — tag chips
My role — dropdown (Lead Developer, Designer, Contributor etc.) + free text
Timeline — start and end date or "Ongoing"
Category / type — Web App, Mobile App, Design, Research, Writing, Other
Media gallery — multiple images/screenshots with captions
Outcomes / results — structured fields: metric name + value (e.g. "User growth: +40%")
Team size — solo or team, with optional team member links
Status — Completed, In Progress, Concept
Featured toggle — featured projects appear prominently on the portfolio hero or in a highlighted grid
Case study mode — expand a project into a full-page case study with sections for Problem, Process, Solution, and Results (for UX/product designers)
Project visibility — public, private (hidden from portfolio), or unlisted (accessible only via direct link)


4. Templates & Customisation
Portfolio templates — at least 5 distinct templates at launch, covering:

Minimal / clean (suits all professions)
Creative / visual-heavy (suits designers, photographers)
Developer / technical (code-themed, GitHub-integrated)
Corporate / executive (conservative, suits senior professionals)
Freelancer / agency (services-first layout)

Customisation options:

Primary colour and accent colour picker
Font pairing selector (heading font + body font, from a curated list of Google Fonts pairings)
Layout variants per section (e.g. projects as grid vs list vs featured+grid)
Section header style (underline, badge, plain, icon)
Dark mode / light mode toggle for the published portfolio
Custom favicon upload
Background options per section (solid colour, gradient, image with overlay)

Live preview — identical to the resume builder: split-pane editor on the left, live rendered preview on the right. What the user sees in preview is exactly what visitors see on the published URL.

5. Web Portfolio — Shareable URL & Hosting
Subdomain URL — every published portfolio gets a URL in the format:
username.proflect.com or proflect.com/p/username
Custom domain — Pro users can connect their own domain (e.g. johnsmith.com) via CNAME/A record configuration. Proflect handles SSL automatically.
Custom slug — users can choose their URL slug (e.g. /p/brukewechefo). Slug must be unique, alphanumeric + hyphens only, changeable once per 30 days.
Portfolio page features:

Meta title, meta description, and Open Graph image (for social sharing previews) — all editable by the user
Canonical URL set correctly to prevent duplicate content
robots.txt — user can toggle noindex if they want the portfolio to not appear in search results
Analytics — basic built-in page view count, unique visitors, and referrer source visible in the user's dashboard
Password protection — optional, for portfolios shared only with specific employers
Portfolio expiry date — optional, for temporary portfolios

Visitor experience:

Fully responsive (mobile, tablet, desktop)
Fast page load — statically generated (SSG/ISR) where possible
Smooth section scroll with a sticky nav that highlights the active section
Keyboard accessible
Print-friendly CSS for visitors who print the page


6. PDF Portfolio Export
Full portfolio as PDF — export the entire portfolio as a multi-page PDF. Unlike the resume PDF (which is strictly 1–2 pages), the portfolio PDF can be any length.
PDF-specific layout — the PDF version uses a print-optimised layout. Projects are rendered as full-page or half-page blocks. Image galleries are flattened to a grid. Embeds are replaced with a QR code linking to the live URL.
ATS-friendly — same requirements as the resume PDF: all text must be selectable, copyable, and parseable. No rasterised images of text.
Cover page — the PDF starts with a cover page containing name, headline, photo, contact info, and the portfolio URL as a QR code.
Section control for PDF — users can toggle which sections appear in the PDF export independently of the web version. For example, a contact form block appears on the web but is excluded from the PDF.
Page break control — each project starts on a new page in the PDF. Users can manually insert page breaks between sections.

7. AI Features
Bio / About generator — AI writes a first draft of the About section based on the user's job title, skills, and experience pulled from their resume data.
Project description enhancer — user pastes a rough project description, AI rewrites it to be results-focused and recruiter-friendly.
Tagline generator — AI generates 3–5 headline/tagline options based on the user's profile and target role.
Skills gap analysis — based on the user's target role (optional input), AI compares their current skills and projects against what is commonly expected for that role and surfaces gaps.
SEO suggestions — AI analyses the portfolio's meta title, description, and body text and suggests improvements for search visibility.

8. Integrations
GitHub — OAuth connect. Auto-import public repos as draft project entries. Show live contribution stats. Auto-update repo descriptions if they change on GitHub.
LinkedIn — OAuth import of work experience, education, and skills. One-time import only (not live sync due to LinkedIn API restrictions).
Behance / Dribbble — import project thumbnails and links (read-only API or manual URL paste with auto-preview).
Google Analytics — users can enter their own GA4 measurement ID to get full analytics on their portfolio page.
Calendly / Cal.com — embed a booking widget directly in the portfolio for freelancers and consultants.

9. Analytics & Insights
Built into the Proflect dashboard (no external tool needed for basic analytics):

Total page views — lifetime and last 30 days
Unique visitors — based on anonymised fingerprinting
Top referrer sources — where visitors came from (LinkedIn, direct, Google, etc.)
Most viewed projects — which project cards were clicked most
Average time on page
Contact form submissions — count and list
Geographic breakdown — country-level only (privacy-safe)

All analytics data is shown only to the portfolio owner in their dashboard. No data is shared with third parties.

10. Sharing & Distribution
Share panel — inside the builder, a "Share" button opens a panel with:

The portfolio URL with a copy button
QR code download (PNG and SVG)
Direct share buttons: LinkedIn post, Twitter/X, email
Embed code — <iframe> snippet so users can embed their portfolio on another website

Portfolio link in resume — when a user has both a resume and a portfolio, the resume builder should offer to auto-insert the portfolio URL into the resume's contact/header section.
Link in email signature generator — a simple tool that generates an HTML email signature with name, title, portfolio URL, and optional photo.

11. Privacy & Access Control

Public — anyone with the URL can view
Private — only the owner (must be logged in) can view
Password protected — visitor must enter a password set by the owner
Unlisted — not indexed by search engines, but accessible via direct URL without a password

Per-project visibility can also be set independently of the overall portfolio visibility.

12. Plan Gating
FeatureFreeProNumber of portfolios1UnlimitedCustom slug✓✓Custom domain✗✓PDF export✓ (with watermark)✓ (no watermark)Password protection✗✓AnalyticsBasic (views only)FullAI features3 uses/monthUnlimitedGitHub integration✗✓Google Analytics✗✓Template access2 templatesAll templatesRemove "Built with Proflect" badge✗✓

13. Key Technical Considerations
URL routing — portfolio pages at proflect.com/p/[slug] must be statically generated with ISR (revalidate on publish). Custom domains require a wildcard SSL certificate and reverse proxy routing at the infrastructure level.
Image handling — all uploaded images must be stored in Supabase Storage (already in project), served via a CDN, and auto-compressed/resized on upload (max 2MB per image, auto-converted to WebP).
Real-time preview — same architecture as the resume builder: changes in the editor instantly reflect in the preview pane without a full page reload.
SEO — portfolio pages must render as fully server-side HTML (not client-side only) so Google can index them. Use Next.js generateMetadata per portfolio slug for correct Open Graph tags.
Data model — portfolios are stored separately from resumes in Supabase but share the same user_id. A portfolio_resume_link flag indicates whether a portfolio section is synced from a resume or independently managed.
Performance — project image galleries must use lazy loading. The published portfolio page must score ≥ 90 on Lighthouse for Performance, Accessibility, and SEO.