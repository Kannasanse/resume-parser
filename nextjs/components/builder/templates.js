// Template and design system definitions for the resume builder

export const TEMPLATES = [
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    style: 'Classic',
    plan: 'free',
    description: 'Traditional single-column layout with a clean header.',
    accent: '#1a3a5c',
  },
  {
    id: 'modern-slate',
    name: 'Modern Slate',
    style: 'Modern',
    plan: 'free',
    description: 'Two-column design with a sidebar for skills and contact info.',
    accent: '#2d4a6e',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    style: 'Minimal',
    plan: 'free',
    description: 'Ultra-clean layout with generous whitespace.',
    accent: '#333333',
  },
  {
    id: 'ats-clean',
    name: 'ATS Clean',
    style: 'ATS-Friendly',
    plan: 'free',
    description: 'Plain text-first, optimised for applicant tracking systems.',
    accent: '#000000',
  },
  {
    id: 'creative-edge',
    name: 'Creative Edge',
    style: 'Creative',
    plan: 'basic',
    description: 'Sidebar layout with icon accents and a bold header.',
    accent: '#6c3fc5',
  },
  {
    id: 'executive-navy',
    name: 'Executive Navy',
    style: 'Executive',
    plan: 'basic',
    description: 'Formal typography with a dark header band.',
    accent: '#1a2744',
  },
  {
    id: 'tech-stack',
    name: 'Tech Stack',
    style: 'Modern',
    plan: 'basic',
    description: 'Two-column with skills sidebar and monospace accents.',
    accent: '#0f4c75',
  },
  {
    id: 'soft-gradient',
    name: 'Soft Gradient',
    style: 'Creative',
    plan: 'pro',
    description: 'Gradient header with pastel accents.',
    accent: '#7c3aed',
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    style: 'Modern',
    plan: 'pro',
    description: 'High-contrast design with a full-width header.',
    accent: '#c0392b',
  },
  {
    id: 'elegant-script',
    name: 'Elegant Script',
    style: 'Classic',
    plan: 'pro',
    description: 'Decorative header with refined spacing.',
    accent: '#4a235a',
  },
  {
    id: 'heritage',
    name: 'Heritage',
    style: 'Serif',
    plan: 'free',
    description: 'Centered serif name, full-width hairline rules, right-aligned dates.',
    accent: '#1a1a1a',
  },
  {
    id: 'beacon',
    name: 'Beacon',
    style: 'Modern',
    plan: 'free',
    description: 'Dark navy sidebar with contact details, clean white main column.',
    accent: '#1f2a3a',
  },
  {
    id: 'banded',
    name: 'Banded',
    style: 'Modern',
    plan: 'free',
    description: 'Gray rounded header, gray title bands, left-rail dates.',
    accent: '#2d3540',
  },
  {
    id: 'foundry',
    name: 'Foundry',
    style: 'Modern',
    plan: 'free',
    description: 'Bordered header card with avatar, pill bands, multi-column lists.',
    accent: '#283b3a',
  },
];

export const TEMPLATE_CATEGORIES = ['All', 'Classic', 'Modern', 'Creative', 'Minimal', 'ATS-Friendly', 'Executive', 'Serif'];

export const FONTS = [
  { id: 'source-sans', name: 'Source Sans', family: "'Source Sans 3', 'Helvetica Neue', sans-serif", plan: 'free' },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif", plan: 'free' },
  { id: 'georgia', name: 'Georgia', family: "Georgia, 'Times New Roman', serif", plan: 'free' },
  { id: 'inter', name: 'Inter', family: "'Inter', 'Arial', sans-serif", plan: 'basic' },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', 'Arial', sans-serif", plan: 'basic' },
  { id: 'lato', name: 'Lato', family: "'Lato', sans-serif", plan: 'basic' },
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', Georgia, serif", plan: 'basic' },
  { id: 'open-sans', name: 'Open Sans', family: "'Open Sans', sans-serif", plan: 'pro' },
  { id: 'raleway', name: 'Raleway', family: "'Raleway', sans-serif", plan: 'pro' },
  { id: 'nunito', name: 'Nunito', family: "'Nunito', sans-serif", plan: 'pro' },
  { id: 'merriweather', name: 'Merriweather', family: "'Merriweather', Georgia, serif", plan: 'pro' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", plan: 'pro' },
];

export const COLOR_THEMES = [
  { id: 'slate-blue', name: 'Slate Blue', primary: '#2d4a6e', accent: '#4a90a4', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'midnight', name: 'Midnight', primary: '#1a1a2e', accent: '#e94560', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'forest', name: 'Forest', primary: '#2d6a4f', accent: '#52b788', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'ocean', name: 'Ocean Blue', primary: '#0077b6', accent: '#00b4d8', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'charcoal', name: 'Charcoal', primary: '#2c3e50', accent: '#7f8c8d', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'crimson', name: 'Crimson', primary: '#c0392b', accent: '#e74c3c', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'plum', name: 'Plum', primary: '#6c3fc5', accent: '#9b59b6', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'teal', name: 'Teal', primary: '#0d7377', accent: '#14a085', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'navy', name: 'Navy', primary: '#1a2744', accent: '#2980b9', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'burnt-orange', name: 'Burnt Orange', primary: '#c0530a', accent: '#e67e22', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'sage', name: 'Sage Green', primary: '#5a7a6a', accent: '#7cb08a', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'indigo', name: 'Indigo', primary: '#3730a3', accent: '#6366f1', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'rose-gold', name: 'Rose Gold', primary: '#9b4a5a', accent: '#c97b8a', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'graphite', name: 'Graphite', primary: '#374151', accent: '#6b7280', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'cobalt', name: 'Cobalt', primary: '#1040a0', accent: '#2563eb', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'jade', name: 'Jade', primary: '#00695c', accent: '#26a69a', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'maroon', name: 'Maroon', primary: '#7b1c30', accent: '#ad2b45', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'copper', name: 'Copper', primary: '#7a4a2a', accent: '#b06030', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'evergreen', name: 'Evergreen', primary: '#1b4332', accent: '#40916c', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'steel', name: 'Steel', primary: '#44546a', accent: '#607b96', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'aubergine', name: 'Aubergine', primary: '#4a1942', accent: '#7b2d72', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'stone', name: 'Stone', primary: '#57534e', accent: '#78716c', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'arctic', name: 'Arctic', primary: '#1e3a5f', accent: '#2196f3', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'olive', name: 'Olive', primary: '#555b00', accent: '#878b00', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'burgundy', name: 'Burgundy', primary: '#6b1c3a', accent: '#a33158', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'cerulean', name: 'Cerulean', primary: '#005f89', accent: '#0093c4', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'mauve', name: 'Mauve', primary: '#7e5f7e', accent: '#a882a8', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'onyx', name: 'Onyx', primary: '#111111', accent: '#444444', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'amber', name: 'Amber', primary: '#9a5200', accent: '#c76f00', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
  { id: 'moss', name: 'Moss', primary: '#3d5a3e', accent: '#587d57', text: '#1a1a1a', subtext: '#555', border: '#d8dee4' },
];

export const SPACING_OPTIONS = [
  { id: 'compact', label: 'Compact', sectionGap: 14, itemGap: 8, lineHeight: 1.35 },
  { id: 'normal', label: 'Normal', sectionGap: 20, itemGap: 12, lineHeight: 1.5 },
  { id: 'spacious', label: 'Spacious', sectionGap: 28, itemGap: 18, lineHeight: 1.7 },
];

export const MARGIN_OPTIONS = [
  { id: 'narrow', label: 'Narrow', value: 28 },
  { id: 'normal', label: 'Normal', value: 40 },
  { id: 'wide', label: 'Wide', value: 56 },
];

export const PAGE_SIZES = [
  { id: 'a4', label: 'A4', width: 794, height: 1123 },
  { id: 'letter', label: 'Letter (US)', width: 816, height: 1056 },
];

export const SECTION_TYPES = [
  { id: 'summary',        label: 'Summary / Profile',    icon: '◉', defaultTitle: 'Summary',        singleton: true, description: 'Brief professional intro' },
  { id: 'work_experience',label: 'Work Experience',       icon: '⊞', defaultTitle: 'Work Experience',               description: 'Roles & responsibilities' },
  { id: 'education',      label: 'Education',             icon: '◎', defaultTitle: 'Education',                     description: 'Degrees & schools' },
  { id: 'skills',         label: 'Skills',                icon: '⊛', defaultTitle: 'Skills',                        description: 'Technical & soft skills' },
  { id: 'certifications', label: 'Certifications',        icon: '◈', defaultTitle: 'Certifications',                description: 'Credentials & licenses' },
  { id: 'projects',       label: 'Projects',              icon: '⊟', defaultTitle: 'Projects',                      description: 'Side projects & work' },
  { id: 'languages',      label: 'Languages',             icon: '◐', defaultTitle: 'Languages',                     description: 'Spoken languages' },
  { id: 'hobbies',        label: 'Interests & Hobbies',   icon: '◑', defaultTitle: 'Interests',                     description: 'Interests outside work' },
  { id: 'references',     label: 'References',            icon: '◍', defaultTitle: 'References',                    description: 'Referees & contacts' },
  { id: 'custom',         label: 'Custom Section',        icon: '⊕', defaultTitle: 'Custom Section',                description: 'Anything else' },
];

export const FREE_PLAN_FONT_COUNT = 3;
export const FREE_PLAN_THEME_COUNT = 30;

export function getDefaultContent(type) {
  switch (type) {
    case 'summary':      return { text: '' };
    case 'references':   return { text: 'Available upon request' };
    case 'hobbies':      return { text: '' };
    default:             return { entries: [] };
  }
}

export function getDefaultDesign() {
  return {
    font: 'source-sans',
    colorTheme: 'slate-blue',
    spacing: 'normal',
    margins: 'normal',
    pageSize: 'a4',
  };
}

export function resolveDesign(design = {}) {
  const d = { ...getDefaultDesign(), ...design };
  const font = FONTS.find(f => f.id === d.font) || FONTS[0];
  const theme = COLOR_THEMES.find(t => t.id === d.colorTheme) || COLOR_THEMES[0];
  const spacing = SPACING_OPTIONS.find(s => s.id === d.spacing) || SPACING_OPTIONS[1];
  const margins = MARGIN_OPTIONS.find(m => m.id === d.margins) || MARGIN_OPTIONS[1];
  const page = PAGE_SIZES.find(p => p.id === d.pageSize) || PAGE_SIZES[0];
  return { font, theme, spacing, margins, page };
}
