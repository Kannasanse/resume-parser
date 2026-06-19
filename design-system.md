# Proflect Design System
> Version 2.0 · Tailwind CSS v3 · Custom CSS Properties · React · Web & Mobile

A unified reference for all Proflect UI tokens, component classes, and patterns.
**No external component library** — all UI built on Tailwind utilities + custom CSS classes defined in `globals.css`.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Color Tokens](#2-color-tokens)
   - [CSS Custom Properties (--c-*)](#css-custom-properties---c-)
   - [Legacy Aliases (--ds-*)](#legacy-aliases---ds-)
   - [Tailwind Color Config](#tailwind-color-config)
3. [Typography](#3-typography)
4. [Spacing](#4-spacing)
5. [Border Radius](#5-border-radius)
6. [Shadows & Elevation](#6-shadows--elevation)
7. [Dark Mode](#7-dark-mode)
8. [Utility Component Classes](#8-utility-component-classes)
   - [Cards & Surfaces](#cards--surfaces)
   - [Buttons](#buttons)
   - [Chips & Badges](#chips--badges)
   - [Inputs](#inputs)
   - [Alerts](#alerts)
   - [Tables](#tables)
   - [Progress & Scores](#progress--scores)
   - [Skeletons](#skeletons)
9. [Animation & Motion](#9-animation--motion)
10. [Gradients & Glass](#10-gradients--glass)
11. [Prose & Rich Text](#11-prose--rich-text)
12. [Responsive Breakpoints](#12-responsive-breakpoints)
13. [Accessibility](#13-accessibility)
14. [Tailwind Config Reference](#14-tailwind-config-reference)
15. [File Locations](#15-file-locations)
16. [Page-Level Design Reference](#16-page-level-design-reference)

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| CSS Framework | Tailwind CSS v3.4 |
| Token Layer | CSS Custom Properties (`--c-*`, `--r-*`, `--shadow-*`) |
| Dark Mode | `class` strategy (`<html class="dark">`) |
| Theme Persistence | `localStorage` + system `prefers-color-scheme` |
| Rich Text | Tiptap v3 (custom extensions) |
| Code Editor | Monaco Editor |
| Fonts | Inter (UI) · JetBrains Mono (code) · EB Garamond / Lora (serif resume templates) |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Flow Diagrams | `@xyflow/react` |

---

## 2. Color Tokens

### CSS Custom Properties (`--c-*`)

Defined in `nextjs/app/globals.css` under `:root` (light) and `.dark`.

#### Light Mode

| Variable | Value | Purpose |
|----------|-------|---------|
| `--c-primary` | `#185FA5` | CTAs, links, active states, focus rings |
| `--c-primary-dark` | `#0C447C` | Hover/pressed states, sticky headers |
| `--c-primary-light` | `#E6F1FB` | Selected rows, chip BG, highlight surfaces |
| `--c-success` | `#1D9E75` | Verified, Active, Complete states |
| `--c-success-bg` | `#D1FAE5` | Success backgrounds |
| `--c-error` | `#D93025` | Errors, destructive actions |
| `--c-error-bg` | `#FEE2E2` | Error backgrounds |
| `--c-warning` | `#F59E0B` | Warnings, pending states |
| `--c-warning-text` | `#B45309` | Warning text on light BG |
| `--c-warning-bg` | `#FEF3C7` | Warning backgrounds |
| `--c-text` | `#2C2C2A` | Primary text (charcoal) |
| `--c-text-2` | `#6B7280` | Secondary / muted text |
| `--c-text-3` | `#9CA3AF` | Tertiary / disabled text |
| `--c-border` | `#D1DCE8` | Input borders, dividers, table lines |
| `--c-surface` | `#FFFFFF` | Cards, modals, dropdowns |
| `--c-bg` | `#F4F8FC` | Page background |
| `--c-neutral-bg` | `#F3F4F6` | Neutral section backgrounds |
| `--shadow-card` | `0 2px 8px rgba(12,68,124,0.10)` | Card shadow |
| `--shadow-modal` | `0 8px 32px rgba(12,68,124,0.16)` | Modal shadow |
| `--r-input` | `8px` | Input border-radius |
| `--r-card` | `12px` | Card border-radius |
| `--r-modal` | `16px` | Modal border-radius |

#### Dark Mode (`.dark` selector)

| Variable | Value | Notes |
|----------|-------|-------|
| `--c-bg` | `#0A1628` | Deep navy — not pure black |
| `--c-surface` | `#111F35` | Card/modal surface |
| `--c-border` | `rgba(255,255,255,0.10)` | Subtle white border |
| `--c-text` | `#E8EFF7` | Light blue-tinted white |
| `--c-text-2` | `#8BA3C1` | Cool muted gray |
| `--c-text-3` | `#4A6380` | Deep muted |
| `--c-primary` | `#5B9FD4` | Lightened for contrast |
| `--c-success` | `#34C68A` | Brighter for dark backgrounds |
| `--c-error-bg` | `rgba(217,48,37,0.15)` | Transparent tint |
| `--c-warning-bg` | `rgba(245,158,11,0.15)` | Transparent tint |
| `--c-neutral-bg` | `rgba(255,255,255,0.06)` | Subtle neutral surface |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.30)` | |
| `--shadow-modal` | `0 8px 32px rgba(0,0,0,0.40)` | |

---

### Legacy Aliases (`--ds-*`)

Backward-compat aliases kept for older components. Map to the `--c-*` values above.

| ds-* Token | Light | Dark |
|-----------|-------|------|
| `--ds-bg` | `#F4F8FC` | `#0A1628` |
| `--ds-card` | `#FFFFFF` | `#111F35` |
| `--ds-border` | `#D1DCE8` | `rgba(255,255,255,0.10)` |
| `--ds-borderStrong` | `#A8B8CC` | `rgba(255,255,255,0.20)` |
| `--ds-inputBorder` | `#A8B4C0` | `rgba(255,255,255,0.12)` |
| `--ds-text` | `#2C2C2A` | `#E8EFF7` |
| `--ds-textSecondary` | `#6B7280` | `#8BA3C1` |
| `--ds-textTertiary` | `#9CA3AF` | `#4A6380` |
| `--ds-textMuted` | `#9CA3AF` | `#8BA3C1` |
| `--ds-success` | `#1D9E75` | `#34C68A` |
| `--ds-successLight` | `#E6F5F0` | `rgba(29,158,117,0.15)` |
| `--ds-warning` | `#F59E0B` | `#F5A623` |
| `--ds-warningLight` | `#FEF3C7` | `rgba(245,158,11,0.15)` |
| `--ds-danger` | `#D93025` | `#F87171` |
| `--ds-dangerLight` | `#FEE2E2` | `rgba(217,48,37,0.15)` |

> **Preference:** Use `--c-*` tokens in new code. `--ds-*` tokens exist for compatibility.

---

### Tailwind Color Config

```js
// tailwind.config.js — extend.colors
{
  primary:   { DEFAULT: '#185FA5', dark: '#0C447C', light: '#E6F1FB' },
  secondary: { DEFAULT: '#1D9E75', light: '#E6F5F0' },
  charcoal:  '#2C2C2A',
  success:   '#1D9E75',
  error:     '#D93025',
  warning:   '#F59E0B',
  border:    '#D1DCE8',
  surface:   '#FFFFFF',
  bg:        '#F4F8FC',
}
```

Usage:
```html
<div class="bg-primary text-white">CTA</div>
<div class="bg-primary-light text-primary">Selected</div>
<div class="border border-border">Card</div>
<div class="bg-bg text-charcoal">Page</div>
```

---

## 3. Typography

### Font Stack

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **UI (heading + body)** | `Inter` | 400, 500, 600, 700, 800 | All UI text |
| **Monospace** | `JetBrains Mono` | 400, 500, 600 | Code editor, inline code |
| **Serif (resume)** | `EB Garamond` | 400–700 | Serif resume templates |
| **Serif (resume)** | `Lora` | 400–700 | Serif resume templates |

Fonts loaded via `@import` in `globals.css` (Google Fonts).

### Type Scale

| Usage | Size | Weight | Line Height | Tailwind |
|-------|------|--------|-------------|----------|
| Page hero | 36px | 700 | 1.2 | `text-4xl font-bold` |
| Page title | 28px | 700 | 1.2 | `text-3xl font-bold` |
| Section heading | 22px | 600 | 1.25 | `text-2xl font-semibold` |
| Card title | 18px | 600 | 1.3 | `text-lg font-semibold` |
| Sub-heading | 16px | 600 | 1.35 | `text-base font-semibold` |
| Label heading | 14px | 600 | 1.4 | `text-sm font-semibold` |
| Primary body | 16px | 400 | 1.6 | `text-base` |
| Default body | 14px | 400 | 1.6 | `text-sm` |
| Metadata | 12px | 400 | 1.5 | `text-xs` |
| Section overline | 11px | 500 | 2.0 | `text-xs font-medium uppercase tracking-widest` |
| Button text | 14px | 500 | — | `text-sm font-medium` |
| Code | 13px | 400 | 1.6 | `font-mono text-sm` |

### Base Rules

```css
/* globals.css */
body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  transition: background-color 200ms, color 200ms;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
```

- Minimum readable size: **14px** (base body)
- Never use pure `#000000` — use charcoal `#2C2C2A`
- Use `--c-text-2` (`#6B7280`) for supporting text, metadata, placeholders

---

## 4. Spacing

Tailwind default spacing scale (base unit: 4px). No custom extend. Key values:

| Tailwind | Value | Usage |
|----------|-------|-------|
| `p-1` | 4px | Tight icon padding |
| `p-2` | 8px | Compact badge/chip |
| `p-3` | 12px | Button vertical pad |
| `p-4` | 16px | Card padding, standard gap |
| `p-6` | 24px | Section inner padding |
| `p-8` | 32px | Section separation |
| `gap-2` | 8px | Tight inline gap |
| `gap-3` | 12px | Standard inline gap |
| `gap-4` | 16px | Card grid gap |
| `gap-6` | 24px | Section gap |

---

## 5. Border Radius

```js
// tailwind.config.js — extend.borderRadius
{
  sm:      '4px',   // Tags, inline badges
  DEFAULT: '8px',   // Inputs, buttons, chips (rounded-lg)
  lg:      '12px',  // Cards, dropdowns
  xl:      '12px',  // Large cards (alias)
  '2xl':   '16px',  // Modals, hero banners
  btn:     '999px', // Pill buttons, rounded-full badges
}
```

| Context | Class | Radius |
|---------|-------|--------|
| Inline badges, tags | `rounded` or `rounded-sm` | 4px |
| Inputs, buttons, chips | `rounded-lg` | 8px |
| Cards, dropdowns | `rounded-xl` | 12px |
| Modals | `rounded-2xl` | 16px |
| Avatars, pill badges | `rounded-full` | 999px |

CSS variables: `--r-input: 8px`, `--r-card: 12px`, `--r-modal: 16px`

---

## 6. Shadows & Elevation

All shadows tinted with Deep Navy `#0C447C` for brand consistency.

### Tailwind Shadow Classes

```js
// tailwind.config.js — extend.boxShadow
{
  sm:      '0 1px 2px rgba(12,68,124,0.06)',
  DEFAULT: '0 2px 8px rgba(12,68,124,0.10)',
  md:      '0 4px 16px rgba(12,68,124,0.12)',
  lg:      '0 8px 32px rgba(12,68,124,0.16)',
  xl:      '0 16px 48px rgba(12,68,124,0.20)',
}
```

### Extended Shadows (globals.css)

| Class | Usage |
|-------|-------|
| `shadow-xs` | Hairline dividers, subtle separators |
| `shadow-sm` | Input fields, table rows |
| `shadow` | Standard cards |
| `shadow-md` | Floating panels, popovers |
| `shadow-lg` | Modals, drawers |
| `shadow-xl` | Full-screen overlays |
| `shadow-2xl` | Hero / marketing |
| `shadow-glow-primary` | Focus glow on primary elements |
| `shadow-glow-success` | Success state glow |

### CSS Variable Shadows

| Variable | Value | Usage |
|----------|-------|-------|
| `--shadow-card` | `0 2px 8px rgba(12,68,124,0.10)` | `.ds-card` |
| `--shadow-modal` | `0 8px 32px rgba(12,68,124,0.16)` | `.ds-modal` |

Dark mode: `--shadow-card: 0 1px 3px rgba(0,0,0,0.30)`, `--shadow-modal: 0 8px 32px rgba(0,0,0,0.40)`

---

## 7. Dark Mode

### Strategy

`class` mode — toggle `dark` class on `<html>`.

### Theme Initialization

Inline script in `app/layout.jsx` runs before React hydration:

```js
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (saved === 'dark' || (!saved && prefersDark)) {
  document.documentElement.classList.add('dark');
}
```

### `useTheme` Hook (`hooks/useTheme.js`)

```js
const { isDark, toggle } = useTheme();
// toggle() flips documentElement.classList and persists to localStorage
```

### Writing Dark-Mode-Aware Code

**Use CSS variables** — they flip automatically:
```html
<!-- Preferred: CSS variable -->
<div style="color: var(--c-text); background: var(--c-surface)">…</div>

<!-- Also common: Tailwind dark: variant -->
<div class="bg-white dark:bg-[#111F35] text-[#2C2C2A] dark:text-[#E8EFF7]">…</div>
```

Prefer CSS variables over inline `dark:bg-[#...]` for new components. The inline dark variant is common in older code.

---

## 8. Utility Component Classes

All defined in `nextjs/app/globals.css`.

### Cards & Surfaces

```css
.ds-card   { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 12px; box-shadow: var(--shadow-card); }
.ds-paper  { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 12px; }  /* no shadow */
.ds-modal  { background: var(--c-surface); border-radius: 16px; box-shadow: var(--shadow-modal); }
```

```
.card              — base card (white, border, shadow)
.card-interactive  — .card + hover lift + border color shift
.card-featured     — .card + gradient top-accent line
.mode-card         — interactive card with transform lift
.auth-card         — modal-style card for auth pages
```

Usage:
```html
<div class="ds-card p-6">Standard card</div>
<div class="card-interactive p-4 cursor-pointer">Clickable card</div>
```

---

### Buttons

```css
.btn-primary {
  /* gradient blue, white text, shine sweep on hover */
  background: linear-gradient(135deg, #185FA5, #0C447C);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  /* hover: ::after shine effect + slight lift */
}
```

Secondary (Tailwind):
```html
<button class="border border-primary text-primary hover:bg-primary-light rounded-lg px-4 py-2 text-sm font-medium transition-colors">
  Secondary
</button>
```

Destructive:
```html
<button class="bg-error hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
  Delete
</button>
```

---

### Chips & Badges

```css
.chip-primary { background: linear-gradient(135deg, rgba(24,95,165,0.12), rgba(12,68,124,0.08)); color: #185FA5; border: 1px solid rgba(24,95,165,0.2); border-radius: 8px; }
.chip-success { /* green gradient */  color: #1D9E75; }
.chip-warning { /* amber gradient */  color: #B45309; }
.chip-error   { /* red gradient */    color: #D93025; }
```

Tailwind equivalents:
```html
<!-- Primary chip -->
<span class="bg-primary-light text-primary text-xs font-medium px-2.5 py-1 rounded-lg">React</span>

<!-- Success status -->
<span class="bg-green-100 text-success text-xs font-medium px-2 py-0.5 rounded">Active</span>

<!-- Danger status -->
<span class="bg-red-100 text-error text-xs font-medium px-2 py-0.5 rounded">Rejected</span>
```

---

### Inputs

```css
.input-enhanced {
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);   /* 8px */
  transition: border-color 200ms, box-shadow 200ms;
}
.input-enhanced:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(24,95,165,0.12);
  outline: none;
}
```

Tailwind equivalent:
```html
<input class="w-full border border-border rounded-lg px-3 py-2 text-sm
              focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none
              dark:bg-[#111F35] dark:border-white/10 dark:text-[#E8EFF7]
              transition-colors" />
```

---

### Alerts

```css
.ds-alert         { border-radius: 8px; padding: 12px 16px; display: flex; gap: 12px; }
.ds-alert-info    { background: var(--c-primary-light); color: var(--c-primary); border: 1px solid rgba(24,95,165,0.2); }
.ds-alert-success { background: var(--c-success-bg);   color: var(--c-success); border: 1px solid rgba(29,158,117,0.2); }
.ds-alert-warning { background: var(--c-warning-bg);   color: var(--c-warning-text); }
.ds-alert-error   { background: var(--c-error-bg);     color: var(--c-error); }
```

Usage:
```html
<div class="ds-alert ds-alert-success">Profile updated successfully.</div>
<div class="ds-alert ds-alert-error">Upload failed. Please try again.</div>
```

---

### Tables

```css
.ds-table {
  width: 100%; border-collapse: collapse;
  border: 1px solid var(--c-border); border-radius: 12px; overflow: hidden;
}
.ds-table thead           { background: var(--c-primary-light); }
.ds-table thead th        { color: var(--c-primary); font-size: 12px; font-weight: 600;
                            text-transform: uppercase; letter-spacing: 0.05em; }
.ds-table tbody tr:hover  { background: var(--c-bg); }
.ds-table td              { border-bottom: 1px solid var(--c-border); padding: 12px 16px; }
```

---

### Progress & Scores

```css
.ds-progress      { height: 6px; background: var(--c-primary-light); border-radius: 3px; overflow: hidden; }
.ds-progress-fill { height: 100%; background: var(--c-primary); border-radius: 3px; transition: width 600ms ease; }
```

ATS score ring — SVG-based in `ATSPanel.jsx`:
```jsx
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--c-primary-light)" strokeWidth="8" />
  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--c-primary)" strokeWidth="8"
    strokeDasharray={`${score * 2.51} 251`} strokeLinecap="round"
    transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 800ms ease' }} />
</svg>
```

```css
.stat-icon { width: 48px; height: 48px; border-radius: 12px;
             background: linear-gradient(135deg, var(--c-primary-light), rgba(24,95,165,0.08));
             display: flex; align-items: center; justify-content: center; }
```

---

### Skeletons

```css
.ds-skel {
  background: linear-gradient(90deg, var(--c-neutral-bg) 25%, rgba(255,255,255,0.5) 50%, var(--c-neutral-bg) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}
```

Usage:
```html
<div class="ds-skel h-4 w-48 mb-2"></div>
<div class="ds-skel h-4 w-32"></div>
```

---

## 9. Animation & Motion

### Durations & Easings

| Use case | Duration | Easing |
|----------|----------|--------|
| Hover color, focus ring | 150–200ms | `ease-in-out` |
| Dropdown / collapse open | 250ms | `ease-out` |
| Modal enter | 225ms | `ease-out` |
| Modal leave | 195ms | `ease-in` |
| Page / section transition | 300ms | `ease-in-out` |
| Score ring fill | 600–800ms | `ease` |
| Shimmer sweep | 1400ms | `ease-in-out infinite` |

Standard interactive elements: `transition-colors duration-200` or `transition-all duration-200`.
`.btn-primary` uses `cubic-bezier(0.4, 0, 0.2, 1)`.

### Animation Classes

| Class | Effect | Duration |
|-------|--------|----------|
| `.animate-fade-in-up` | Fade + translate Y 10px → 0 | 300ms |
| `.animate-fade-in-scale` | Fade + scale 0.95 → 1 | 200ms |
| `.animate-float` | Floating bob ±8px | 3s infinite |
| `.animate-pulse-glow` | Pulsing glow ring | 2s infinite |
| `.animate-shake` | Error shake ±4px | 400ms |
| `.stagger-children` | Children stagger 0–400ms delay | — |

Keyframes defined in `globals.css`: `shimmer`, `fadeInUp`, `float`, `pulseGlow`, `shake`.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Gradients & Glass

### Gradient Utilities

| Class | Definition | Usage |
|-------|-----------|-------|
| `.gradient-primary` | `linear-gradient(135deg, #185FA5, #0C447C)` | Primary CTA backgrounds |
| `.gradient-primary-soft` | `linear-gradient(135deg, #E6F1FB, rgba(24,95,165,0.05))` | Soft section highlights |
| `.gradient-success` | `linear-gradient(135deg, #1D9E75, #15805E)` | Success banners |
| `.gradient-amber` | `linear-gradient(135deg, #F59E0B, #D97706)` | Warning banners |
| `.gradient-mesh-1` | Radial mesh — primary + success | Hero backgrounds |
| `.gradient-dark-hero` | Dark navy gradient | Dark mode hero sections |
| `.text-gradient-primary` | Gradient text fill (primary) | Feature headings |
| `.text-gradient-dark` | Dark gradient text | Dark hero text |
| `.dot-grid` | `radial-gradient` repeating dot pattern | Page hero backgrounds |

### Glassmorphism

| Class | Style |
|-------|-------|
| `.glass-light` | `backdrop-filter: blur(12px)` + white 70% BG + border |
| `.glass-dark` | `backdrop-filter: blur(12px)` + navy 70% BG + border |
| `.glass-primary` | `backdrop-filter: blur(12px)` + primary-light 80% BG |

Usage: floating panels, navbar on marketing pages, tooltips over images.

---

## 11. Prose & Rich Text

### AI-Generated Content (`.prose-content`)

Applied to containers rendering AI markdown (study plan topics, career analysis).

```css
.prose-content p      { margin-bottom: 0.875rem; line-height: 1.7; }
.prose-content h3     { font-size: 1rem; font-weight: 600; color: var(--c-text); margin: 1.25rem 0 0.5rem; }
.prose-content ul, ol { padding-left: 1.5rem; margin-bottom: 0.875rem; }
.prose-content li     { margin-bottom: 0.25rem; line-height: 1.6; }
.prose-content strong { font-weight: 600; color: var(--c-text); }
.prose-content code   { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
                        background: var(--c-neutral-bg); padding: 2px 6px; border-radius: 4px; }
.prose-content pre    { background: var(--c-neutral-bg); border-radius: 8px; padding: 1rem; overflow-x: auto; }
.prose-content a      { color: var(--c-primary); text-decoration: underline; }
.prose-content blockquote { border-left: 3px solid var(--c-primary); padding-left: 1rem; color: var(--c-text-2); }
```

### Other Text Classes

| Class | Usage |
|-------|-------|
| `.resume-rich-body` | Resume section editor preview — compact formatting |
| `.rich-content` | Tiptap editor preview — tighter spacing than `.prose-content` |

### Print Styles (`styles/resume-print.css`)

Dedicated stylesheet for `/print/[id]`:
- `print-color-adjust: exact` — preserves color
- Page break rules — keeps headings/entries together
- Hides UI chrome (navbar, sidebars, buttons)
- Suppresses link URL display
- Flow-root BFC on section blocks

---

## 12. Responsive Breakpoints

Tailwind defaults (no custom extend):

| Name | Min Width | Tailwind | Devices |
|------|-----------|----------|---------|
| — | 0px | (default) | Mobile portrait |
| `sm` | 640px | `sm:` | Mobile landscape, small tablet |
| `md` | 768px | `md:` | Tablet |
| `lg` | 1024px | `lg:` | Desktop |
| `xl` | 1280px | `xl:` | Wide desktop |
| `2xl` | 1536px | `2xl:` | Ultra-wide |

### Mobile-First Patterns

```html
<!-- Vertical mobile, row desktop -->
<div class="flex flex-col md:flex-row gap-4">

<!-- Show/hide by breakpoint -->
<nav class="hidden md:flex">Desktop nav</nav>
<button class="md:hidden">Hamburger</button>

<!-- Responsive padding -->
<div class="px-4 md:px-8 lg:px-12">

<!-- Responsive grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Layout Patterns

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Navigation | Bottom nav (fixed, 64px) | Left sidebar (240px permanent) |
| Page padding | `px-4` | `px-8` |
| Modals | `w-full mx-4` or full-screen | `max-w-lg mx-auto` |
| Tables | Horizontal scroll | Full width |
| Primary FAB | `fixed bottom-20 right-4` | Inline button |

---

## 13. Accessibility

### Contrast Ratios (WCAG AA)

| Text | Background | Ratio | Pass |
|------|-----------|-------|------|
| Charcoal `#2C2C2A` | White `#FFFFFF` | 14.5:1 | ✅ AAA |
| White `#FFFFFF` | Primary `#185FA5` | 5.1:1 | ✅ AA |
| Primary `#185FA5` | Sky Mist `#E6F1FB` | 4.6:1 | ✅ AA |
| White `#FFFFFF` | Deep Navy `#0C447C` | 7.8:1 | ✅ AAA |
| White `#FFFFFF` | Error `#D93025` | 4.5:1 | ✅ AA |
| White `#FFFFFF` | Success `#1D9E75` | 3.2:1 | ⚠️ Large text only |

### Focus Rings

Do not suppress focus without a replacement:
```css
:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
```

Tailwind:
```html
<button class="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none">
```

### ARIA Patterns

```html
<!-- Icon-only buttons -->
<button aria-label="Delete resume"><svg aria-hidden="true">…</svg></button>

<!-- Loading state -->
<button disabled aria-busy="true">
  <span class="sr-only">Saving…</span>
  <svg class="animate-spin" aria-hidden="true">…</svg>
</button>

<!-- Live regions for dynamic content -->
<div role="status" aria-live="polite" class="sr-only">{statusMessage}</div>

<!-- Skip link -->
<a href="#main-content"
   class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded">
  Skip to content
</a>
```

---

## 14. Tailwind Config Reference

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#185FA5', dark: '#0C447C', light: '#E6F1FB' },
        secondary: { DEFAULT: '#1D9E75', light: '#E6F5F0' },
        charcoal:  '#2C2C2A',
        success:   '#1D9E75',
        error:     '#D93025',
        warning:   '#F59E0B',
        border:    '#D1DCE8',
        surface:   '#FFFFFF',
        bg:        '#F4F8FC',
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm:      '4px',
        DEFAULT: '8px',
        lg:      '12px',
        xl:      '12px',
        '2xl':   '16px',
        btn:     '999px',
      },
      boxShadow: {
        sm:      '0 1px 2px rgba(12,68,124,0.06)',
        DEFAULT: '0 2px 8px rgba(12,68,124,0.10)',
        md:      '0 4px 16px rgba(12,68,124,0.12)',
        lg:      '0 8px 32px rgba(12,68,124,0.16)',
        xl:      '0 16px 48px rgba(12,68,124,0.20)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## 15. File Locations

| File | Purpose |
|------|---------|
| `nextjs/tailwind.config.js` | Tailwind config — colors, fonts, radius, shadows |
| `nextjs/app/globals.css` | All CSS variables, utility classes, animations, dark mode |
| `nextjs/styles/resume-print.css` | Print-mode styles for `/print/[id]` |
| `nextjs/app/layout.jsx` | Root layout — dark mode init script |
| `nextjs/hooks/useTheme.js` | Dark mode toggle hook (`isDark`, `toggle`) |
| `nextjs/postcss.config.js` | PostCSS — tailwindcss + autoprefixer |

---

---

## 16. Page-Level Design Reference

Visual layout, structure, and component composition for every major page.

> **Global shell** (from `(main)/layout.jsx`): Fixed left sidebar (240px) + flex-column main area (sticky TopBar + scrollable content). ImpersonationBanner shown above TopBar when admin is proxying a user. Idle-session warning modal can appear over any page.

---

### Auth Pages

#### Login (`/login`)
**Layout:** Full-height split pane — branded left panel (42% desktop, hidden mobile) + centered form on the right.

| Region | Content |
|--------|---------|
| Left panel | Gradient background + dot-grid overlay, brand name, tagline |
| Right — form card | Email input, password input (visibility toggle), "Forgot password" link, primary submit button, Google OAuth button, sign-up link |
| Error banners | Account locked (amber), email unverified (blue), generic error (red) — shown above form |

Pattern: glass-effect card on light `#F4F8FC` background. No sidebar.

#### Signup (`/signup`)
**Layout:** Same split pane as login. Left panel uses a teal-to-blue gradient variant.

| Region | Content |
|--------|---------|
| Right — form card | First + Last name (2-col grid), Email, Password (with 4-bar strength meter + label), Confirm Password, Google OAuth, login link |
| Success state | Replaces form: checkmark icon, email confirmation message, resend link |

---

### Main App Shell

#### Sidebar
Fixed 240px left column, full-height, background `var(--c-bg)`.

| Section | Items |
|---------|-------|
| Branding | Logo mark + "Proflect" wordmark |
| Primary nav | Builder · Career Map · My Courses · Interview Prep · Interview Buddy · Job Recs · Notes · Utilities |
| Credit pill | Balance badge (gold ≥5 credits, red <5) → links to `/credits` |
| User section | Avatar, name, role chip, Settings link |

Responsive: collapses to icon-only rail or bottom sheet on mobile.

#### TopBar
Sticky, full-width, 64px height, white background + bottom border.

| Left | Center | Right |
|------|--------|-------|
| Page title / breadcrumb | — | Theme toggle, notifications bell, user avatar menu |

---

### Resume Builder

#### Resume List (`/builder`)
**Layout:** Full-width single column with constrained max-width content.

```
[Header: "My Resumes"  |  Upload button  |  + New Resume button]
[Responsive card grid: 1 col mobile → 2 col tablet → 3 col desktop]
[Empty state: icon + heading + two CTA buttons]
```

**Resume card anatomy:**
- Top: 3-dot overflow menu (Open · Rename · Duplicate · Download PDF · Share · Delete)
- Body: Colored template accent, resume title (inline-editable on double-click), template badge
- Bottom bar: **Edit** (primary blue) · **Preview** (outlined)
- Hover: `card-interactive` lift effect

Loading: 6-card skeleton grid.

#### Resume Editor (`/builder/[id]`)
**Layout:** Three-panel on desktop, tab-based on mobile.

```
Desktop:
┌─────────────┬──────────────────────┬──────────────┐
│ Left panel  │   Top bar (sticky)   │              │
│  (340px)    ├──────────────────────┤ Live preview │
│             │   Edit content area  │   (scaled)   │
└─────────────┴──────────────────────┴──────────────┘

Mobile:
[Edit tab | Preview tab]  ← toggle between panels
```

**Left panel (340px fixed):**
- Mode toggle: **Content** / **Customize**
- Customize sub-tabs: Design · Spacing · Sections
- Personal info card (collapsible) — photo, name, contact fields
- Section list — accordions per section type, click to expand inline editor

**Top bar (sticky):**
- Left: Back link, resume title (editable), save status indicator
- Right: ATS Score (gradient button, "3 credits") · Import · Templates · Export ▾

**Overlays / side panels:**
- Template gallery (full-screen overlay with search + category filter)
- ATS panel (right side panel — ring score, 5 dimensions, suggestions)
- Share modal (link + export PDF/DOCX)
- Writing Assist modal (AI rewrite, "1 credit")
- Import progress overlay

#### Import Review (`/builder/[id]/review`)
**Layout:** Scrollable single column + sticky bottom action bar.

```
[Header: "Review Your Imported Resume"  |  Start Fresh]
[Summary card: fields extracted count]
[Validation error banner (conditional)]
[Accordion: Personal Info]
[Accordion: Work Experience]
[Accordion: Education]
[… more sections …]
────────────────────────────────────────────────────
[sticky bottom bar: Skip review (ghost) | Confirm & Open Editor (primary)]
```

Section accordions: header shows missing-field count badge; body shows 1–2 column field grid with inline-editable inputs; "⚠ Not found" badges on empty fields.

---

### Career Map

#### Career Map (`/career-map`)
Multi-step flow managed by `CareerMapPage` component:

| Step | UI |
|------|----|
| Resume picker | Card grid of published resumes; "Analyse this resume" (1 credit badge); "Create course with skills →" link if no resume |
| Questionnaire | Full-width card with question text + answer options (MCQ or free text); progress dots at bottom; back button top-left |
| Recommendations | Grid of 4–6 role cards with skill match %, gap list; "Generate Study Plan" button (5 credits) |
| Generating | Centered spinner + status message |

#### Study Plan (`/career-map/study-plan/[id]`)
**Layout:** Sidebar nav + main content.

```
┌──────────────────────┬──────────────────────────────┐
│ Week nav (left)      │ Plan overview                │
│  Week 1 ▾            │ Title, target role, progress │
│   • Topic A          │ Overall progress bar         │
│   • Topic B          │ Week cards (collapsible)     │
│  Week 2              │  Topic rows with status dots │
│  …                   │                              │
└──────────────────────┴──────────────────────────────┘
```

#### Topic Page (`/career-map/study-plan/[id]/topic/[topicId]`)
**Layout:** Full-width with sticky section nav.

```
[Sticky top: breadcrumb + Mark complete button]
[YouTube video embed (if available)]
[Tab bar: Concepts · Real-World · Prerequisites · Exercises · Sources · Study Guide · Chat]
[Tab content area — varies per tab]
[Sources panel (collapsible right sidebar on desktop)]
```

Tab content patterns:
- **Concepts / Real-World / Prerequisites:** `.prose-content` rendered markdown
- **Exercises:** Card list with expandable answer reveals
- **Study Guide:** "Generate" button (2 credits) → long-form markdown
- **Chat:** Message thread + input bar at bottom (1 credit/message)
- **Sources:** Add PDF / URL / text / web scrape; source cards with token counts

---

### Interview Prep

#### Test List & Creation (`/interview-prep`)
**Layout:** Full-width, gradient mesh background.

**Top half — mode selection:**
```
[Header: "Interview Prep"  description]
[4-card grid: Assess by Skill · Content · Job Description · Interview Buddy ↗]
```

**Bottom half — creation form (appears after mode selected):**

Multi-step form inside a card:

| Step | UI Elements |
|------|-------------|
| Skills mode | SkillLookupInput (autocomplete + chip tags), focus-area suggestions, QuestionTypeSelector, DifficultyTimer (Easy/Med/Hard radio + timer slider), "Generate" (2 credits) |
| Content mode | Large textarea + char count, same question type + difficulty selectors |
| JD mode | Textarea → Extract Skills → chip grid (hard/soft grouped) with add/remove → same selectors |
| Generating | Centered spinner |
| Review | Stats grid (count, difficulty, timer), skills chips, Start Test / Start Over |

**Session history table:**
Desktop: multi-column (Topic · Mode · Score · Band · Questions · Date · Actions)
Mobile: stacked row cards
Filters: mode dropdown + date range; Pagination; empty state with CTA.

#### Test Taking (`/interview-prep/[id]`)
**Layout:** Fixed header + scrollable question card + fixed bottom question nav.

```
┌─────────────────────────────────────────────────┐
│ [Progress bar — green fill]                     │  ← fixed top
│ Question X of Y                    [00:42 timer]│
├─────────────────────────────────────────────────┤
│                                                 │
│  [Save & Exit]              [Submit Quiz ✓]     │
│  Skill badge · Difficulty chip · Type badge     │
│  Q3. ▶ "What does useEffect do?"               │  ← scrollable
│                                                 │
│  A) First option                                │
│  B) Second option    ← selected (gradient bg)  │
│  C) Third option                                │
│  D) Fourth option                               │
│                                                 │
│  [← Prev]                         [Next →]     │
├─────────────────────────────────────────────────┤
│ [1][2][3][4][5][6][7]…                          │  ← fixed bottom nav
│  ● answered  ○ current  ✕ skipped  ⚑ flagged   │
└─────────────────────────────────────────────────┘
```

Keyboard shortcuts: Arrow keys (prev/next), 1–4 (MCQ select), F (flag).

#### Test Results (same route, results state)
```
[Score card — gradient text "82%" · "41 / 50" · Difficulty · Auto-submitted badge]
[Skill breakdown — colored progress bars per skill]
[Topic breakdown — collapsible table]
[By question type — mini bars]
[Question review accordion — per question:
  skill/topic badge · type badge · question text ·
  user answer (green✓ or red✗) · model answer · explanation (amber box)]
[Action buttons: Retake | Practice Again | Back]
```

---

### My Courses (`/my-courses`)

**Layout:** Full-width single column (via `MyCoursesPage` component).

```
[Header: "My Courses"  |  + Create Course button (5 credits)]
[Filter tabs: All · In Progress · Not Started · Completed · Paused]
[Search bar  |  Sort dropdown]
[Course card grid: 1 col mobile → 2 col → 3 col desktop]
[Empty state: icon + message + Create Course CTA]
```

**Course card anatomy:**
- Header: Target role title, status badge (pill)
- Progress bar (green fill, % label)
- Meta: Weeks, topics, hours
- Footer: **Continue** / **Start** button + last-updated timestamp

**Course Creation Modal (auto-opens on `?create=1`):**
3-step flow inside a centered modal:
1. Skill input (SkillLookupInput + chip tags)
2. Questionnaire (1–3 AI questions: learning goal, timeline, focus area)
3. Preferences (hours/day · days/week · learning style radio · level select)
→ Generate (5 credits) → redirects to new study plan

---

### Credits (`/credits`)

**Layout:** Single-column with max-width container.

```
[Header: "Credits"  |  Request Credits button (or "Pending" badge)]
[Alert banner — success/error (conditional)]

[3 stat cards: Available balance · Used this month · Total received]

[Credit costs grid — 2–3 col:
  [icon] Feature name          X credits
  … 11 features total …]

[Credit requests — collapsible list with status badges (Pending/Approved/Rejected)]

[Usage history — transaction list:
  [icon] Description              Date    ±Amount]
```

Request modal: amount input + reason textarea + Submit button.

---

### Notes

#### Notes List (`/notes`)
**Layout:** Collapsible left sidebar + main content area.

```
┌──────────────┬────────────────────────────────────┐
│ Sidebar      │ Toolbar: All Notes | Sort | Grid/  │
│ (280px)      │         List toggle | + New Note   │
│              ├────────────────────────────────────┤
│ [Search]     │ Grid view: 3-col note cards        │
│ [New Note]   │  or                                │
│ Note tree    │ List view: tabular rows            │
│ (pinned,     │                                    │
│  archived,   │ [Empty state]                      │
│  tagged)     │ [Loading skeletons]                │
└──────────────┴────────────────────────────────────┘
```

**Note card (grid):** Title, snippet preview, date, word count; hover reveals action icons (Pin · Archive · Duplicate · Delete · Move).

Cmd+K: full-text search modal overlay.

#### Note Editor (`/notes/[noteId]`)
**Layout:** Full-width editor within main content area.

```
[Breadcrumb path (supports wikilinks)]
[Note title — large inline editable h1]
[Tiptap block editor — full width, auto-save 1s debounce]
[Backlinks panel — collapsible bottom section]
```

Toolbar: heading levels, bold/italic/code, lists, table, embed, share link.

---

### Interview Buddy

#### Kit List (`/interview-buddy`)
**Layout:** Full-width single column.

```
[Header: "Interview Buddy"  |  + New Kit button (2 credits)]
[Kit card list — most recent first]
[Empty state: icon + description + Generate CTA]
```

**Kit creation flow (modal or inline):**
- JD textarea → Depth selector (Quick / Standard / Deep) → Role level (Junior/Mid/Senior) → Generate (2 credits)

#### Kit Player (`/interview-buddy/[kitId]`)
**Layout:** Split pane — question nav sidebar + question content.

```
┌─────────────────┬────────────────────────────────┐
│ Category tabs   │ Question text (bold, 16px)      │
│ (left sidebar)  │                                 │
│ • Behavioral  3 │ [Key points to cover]           │
│ • Technical   5 │                                 │
│ • Situational 2 │ [Model answer — collapsible]    │
│                 │                                 │
│ [Question list] │ [← Prev]  Q3 of 10  [Next →]   │
└─────────────────┴────────────────────────────────┘
```

Progress tracked per question; category tabs show question count badges.

---

### Job Recommendations (`/job-recommendations`)

**Layout:** Full-width with gradient mesh background.

```
[Header: "Jobs for you" (gradient text)  |  Refresh (1 credit)]
[Active filters bar — skill chips, location, type]
[Job card grid — 2 col desktop, 1 col mobile]
[Load more / Pagination]
[Empty / quota-exceeded state]
```

**Job card anatomy:**
- Company logo + name, posted date
- Job title (bold), location, type badge (Full-time / Remote)
- Skills chips (matched vs required)
- Action row: Save ♥ · Dismiss · Apply ↗

Saved jobs tab: `/job-recommendations/saved` — same card layout, filtered to saved interactions.

---

### Admin Dashboard (`/admin`)

**Layout:** Full-width with gradient background, constrained content.

```
[Header: "Dashboard" (gradient text)]
[3 stat cards: Total Users · Pending Invites · Tests Created]
[Quick actions grid (2–3 col):
  [Manage Users card → /admin/users]
  [Invite Users card — 2 buttons: Invite | Bulk Import CSV]
  [Manage Tests card → /admin/tests]
  [Template Settings card → /admin/templates]]
```

Stat cards use `.stat-icon` (gradient background icon) + large number + label.

#### Admin Users (`/admin/users`)
**Layout:** Full-width data table with filter bar.

```
[Header: "Users"  |  + Invite User button]
[Filter bar: Search input · Role filter · Status filter · Sort]
[Users table:
  Name · Email · Role chip · Status chip · Last Login · Credits · Actions]
[Pagination]
```

Row actions: View Profile · Grant Credits · Login As (sets `proxy_uid`) · Deactivate.

#### Admin User Detail (`/admin/users/[id]`)
**Layout:** Full-width with tab navigation.

```
[Header: Avatar · Name · Email · Status badge · Action buttons]
[Tabs: Account · Resumes · Self-Tests]
[Tab content area]
```

Account tab: profile fields, role/status controls, credit balance + grant form, login history, failed attempts.

#### Admin Templates (`/admin/templates`)
**Layout:** Responsive card grid.

```
[Header: "Templates"]
[Template card grid:
  [TemplatePreviewCard — static SVG preview]
  [Footer: template name · Featured toggle switch]]
```

Featured toggle: marks template for promotion in user gallery.

---

### Utilities Hub (`/utilities`)

**Layout:** Category card grid on full-width background.

```
[Header: "Tools & Utilities"]
[Category cards:
  PDF Tools (19)  |  Document Converters (10)  |  Image Tools (4)
  Code Playground  |  Screen Recorder  |  PDF Security (3)]
```

**Individual tool pages:**
```
[Tool header: icon + name + description]
[Drop zone or file input (drag & drop)]
[Options panel (tool-specific controls)]
[Action button: Convert / Process / Download]
[Output/preview area]
```

**PDF Editor (`/utilities/pdf/edit`):**
```
┌────────────────┬──────────────────────────────────┐
│ Mode toolbar   │                                  │
│ (left):        │  PDF canvas (Fabric.js overlay)  │
│ • Text         │                                  │
│ • Annotate     │  [Page 1 of N]                   │
│ • Draw         │                                  │
│ • Signature    │                                  │
└────────────────┴──────────────────────────────────┘
[Bottom: prev page / next page / zoom / download]
```

**Code Playground (`/utilities/playground`):**
```
[Language selector tabs: HTML · Python · Java · SQL]
┌─────────────────────┬────────────────────────┐
│ Monaco code editor  │ Output / preview panel │
│ (left, ~60%)        │ (right, ~40%)          │
└─────────────────────┴────────────────────────┘
[Run button (bottom)]
```

---

### Cross-Cutting UI Patterns

| Pattern | Description |
|---------|-------------|
| **Sticky toolbars** | Save state (builder), progress bar (test), section nav (topic page) — always visible while scrolling content |
| **Multi-step wizards** | Career map → courses, test creation, signup — each step replaces previous in the same container; no page navigation |
| **Credit gate modal** | Any AI action shows inline cost badge on button; on 402 response, shows "Get more credits →" link inline in error state |
| **Skeleton loading** | All data-fetching views show `.ds-skel` placeholder shapes matching the final layout before content loads |
| **Empty states** | Consistent pattern: centered icon (large, muted) + heading + description + single CTA button |
| **Inline editing** | Resume title, note title, personal info fields — click to activate text input, blur to auto-save |
| **3-dot overflow menus** | Resume cards, note cards, question rows — floating `<menu>` panel aligned to trigger |
| **Confirmation modals** | Delete actions always require a `ds-modal` confirmation with item name, danger button, and cancel |
| **Impersonation banner** | Amber fixed banner at top of all `(main)` pages when `proxy_uid` cookie is active; shows who is being impersonated + Exit button |
| **Mobile tab switching** | Builder (Edit/Preview), Notes (List/Editor on small screens) use horizontal tab bars to toggle between panels |

---

*Proflect Design System · v2.0 · Tailwind CSS · Custom CSS Properties · No external UI library*
