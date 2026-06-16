-- Homepage CMS: tables for section content, RLS policies, and publish log.
-- Run this migration once against the Supabase project.

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS homepage_sections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key  TEXT        NOT NULL UNIQUE,
  section_type TEXT        NOT NULL,
  title        TEXT,
  subtitle     TEXT,
  overline     TEXT,
  is_visible   BOOLEAN     NOT NULL DEFAULT true,
  sort_order   INTEGER     NOT NULL,
  content      JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID        REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS homepage_publish_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID        REFERENCES auth.users(id),
  snapshot     JSONB       NOT NULL
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE homepage_sections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_publish_log ENABLE ROW LEVEL SECURITY;

-- Public can read visible sections (used by /home SSR)
CREATE POLICY "Public can read visible sections"
  ON homepage_sections FOR SELECT
  USING (is_visible = true);

-- Service role bypasses RLS automatically — no extra policy needed for admin API.

-- Publish log: service role only
CREATE POLICY "Service role full access to publish log"
  ON homepage_publish_log FOR ALL
  USING (auth.role() = 'service_role');

-- ── Seed: default homepage content ───────────────────────────────────────────

INSERT INTO homepage_sections (section_key, section_type, title, subtitle, overline, is_visible, sort_order, content)
VALUES
(
  'hero', 'hero',
  'Build a Resume That Gets You Hired', NULL, 'AI-POWERED RESUME BUILDER', true, 1,
  '{
    "badge_text": "AI-POWERED RESUME BUILDER",
    "heading": "Build a Resume That Gets You Hired",
    "subheading": "Proflect creates ATS-optimised resumes with a live preview, smart scoring, and one-click export to PDF and Word — so you spend less time formatting and more time applying.",
    "primary_cta_label": "Get started free",
    "primary_cta_href": "/signup",
    "secondary_cta_label": "See how it works",
    "secondary_cta_href": "#how-it-works",
    "trust_items": ["Free forever plan", "No credit card required", "ATS-friendly exports"]
  }'::jsonb
),
(
  'stats', 'stats',
  NULL, NULL, NULL, true, 2,
  '{
    "items": [
      {"id": "s1", "value": "50,000+", "label": "Resumes Created"},
      {"id": "s2", "value": "3x",      "label": "Higher Interview Rate"},
      {"id": "s3", "value": "98%",     "label": "ATS Pass Rate"}
    ]
  }'::jsonb
),
(
  'features', 'features',
  'Everything you need to land the job',
  'From building to exporting, Proflect handles every step of the resume process.',
  'WHAT PROFLECT DOES', true, 3,
  '{
    "items": [
      {"id": "f1", "icon": "preview",   "title": "Live Resume Preview",  "description": "See exactly how your resume looks as you type. Real-time pagination ensures your layout is always print-perfect.", "sort_order": 1},
      {"id": "f2", "icon": "ai",        "title": "AI-Powered Content",   "description": "Get smart bullet point suggestions, professional summaries, and keyword recommendations tailored to your target role.", "sort_order": 2},
      {"id": "f3", "icon": "ats",       "title": "ATS Score & Analysis", "description": "Instant ATS scoring based on resume best practices. Know exactly what to fix before you apply.", "sort_order": 3},
      {"id": "f4", "icon": "export",    "title": "PDF & Word Export",    "description": "Export your resume as a fully ATS-readable PDF or an editable Word document with one click.", "sort_order": 4},
      {"id": "f5", "icon": "templates", "title": "Multiple Templates",   "description": "Choose from professionally designed templates. Every template is ATS-friendly and recruiter-approved.", "sort_order": 5},
      {"id": "f6", "icon": "speed",     "title": "Built for Speed",      "description": "Go from blank page to a polished, exported resume in under 10 minutes. No design skills required.", "sort_order": 6}
    ]
  }'::jsonb
),
(
  'steps', 'steps',
  'From blank page to job application in minutes', NULL, 'HOW IT WORKS', true, 4,
  '{
    "items": [
      {"id": "st1", "step_number": 1, "title": "Create Your Account",  "description": "Sign up free in seconds. No credit card, no commitment.", "sort_order": 1},
      {"id": "st2", "step_number": 2, "title": "Fill In Your Details", "description": "Add your experience, skills, and education using our guided builder.", "sort_order": 2},
      {"id": "st3", "step_number": 3, "title": "Optimise with AI",     "description": "Get your ATS score, apply smart suggestions, and pick a template.", "sort_order": 3},
      {"id": "st4", "step_number": 4, "title": "Export & Apply",       "description": "Download your ATS-ready PDF or Word file and start applying.", "sort_order": 4}
    ]
  }'::jsonb
),
(
  'pricing', 'pricing',
  'Start free. Upgrade when you''re ready.', 'No hidden fees. Cancel anytime.', 'PRICING', true, 5,
  '{
    "items": [
      {
        "id": "p1", "plan_name": "Free", "price": "$0", "period": "forever",
        "description": "Everything you need to get started.",
        "is_highlighted": false, "highlight_label": "",
        "cta_label": "Get started free", "cta_href": "/signup", "cta_variant": "outlined",
        "features": ["1 resume", "Live preview", "PDF export (with Proflect watermark)", "Basic ATS score", "3 templates"],
        "sort_order": 1
      },
      {
        "id": "p2", "plan_name": "Pro", "price": "$9", "period": "per month",
        "description": "For serious job seekers who want every advantage.",
        "is_highlighted": true, "highlight_label": "Most Popular",
        "cta_label": "Get started free", "cta_href": "/signup", "cta_variant": "contained",
        "features": ["Unlimited resumes", "Live preview", "PDF & Word export (no watermark)", "Full ATS score + suggestions", "All templates", "AI content suggestions", "Priority support"],
        "sort_order": 2
      },
      {
        "id": "p3", "plan_name": "Team", "price": "$29", "period": "per month",
        "description": "For teams and career coaches managing multiple profiles.",
        "is_highlighted": false, "highlight_label": "",
        "cta_label": "Contact us", "cta_href": "/signup", "cta_variant": "outlined",
        "features": ["Everything in Pro", "Up to 10 team members", "Shared template library", "Admin dashboard", "Bulk export", "Dedicated support"],
        "sort_order": 3
      }
    ]
  }'::jsonb
),
(
  'cta', 'cta',
  'Ready to land your next job?', NULL, NULL, true, 6,
  '{
    "heading": "Ready to land your next job?",
    "subtext": "Join 50,000+ professionals who have built better resumes with Proflect.",
    "primary_cta_label": "Create my resume — it''s free",
    "primary_cta_href": "/signup",
    "secondary_cta_label": "See pricing",
    "secondary_cta_href": "#pricing"
  }'::jsonb
),
(
  'footer', 'footer',
  NULL, NULL, NULL, true, 7,
  '{
    "tagline": "Build resumes that get you hired.",
    "copyright": "© 2025 Proflect. All rights reserved.",
    "columns": [
      {
        "id": "fc1", "heading": "Product",
        "links": [
          {"id": "fl1", "label": "Features",       "href": "#features"},
          {"id": "fl2", "label": "Templates",      "href": "#"},
          {"id": "fl3", "label": "Pricing",        "href": "#pricing"},
          {"id": "fl4", "label": "ATS Checker",    "href": "#"},
          {"id": "fl5", "label": "Export Options", "href": "#"}
        ]
      },
      {
        "id": "fc2", "heading": "Company",
        "links": [
          {"id": "fl6",  "label": "About",   "href": "#"},
          {"id": "fl7",  "label": "Blog",    "href": "#"},
          {"id": "fl8",  "label": "Careers", "href": "#"},
          {"id": "fl9",  "label": "Press",   "href": "#"},
          {"id": "fl10", "label": "Contact", "href": "#"}
        ]
      },
      {
        "id": "fc3", "heading": "Legal",
        "links": [
          {"id": "fl11", "label": "Privacy Policy",    "href": "#"},
          {"id": "fl12", "label": "Terms of Service",  "href": "#"},
          {"id": "fl13", "label": "Cookie Policy",     "href": "#"},
          {"id": "fl14", "label": "Security",          "href": "#"}
        ]
      }
    ]
  }'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
