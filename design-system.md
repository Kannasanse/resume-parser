# Proflect Design System
> Version 2.0 · Material UI v9 · Web & Mobile · React / Tailwind

A unified reference for all Proflect UI components, tokens, and patterns — structured in alignment with [Material UI v9's component taxonomy](https://mui.com/material-ui/all-components/).

---

## Table of Contents

1. [Brand Tokens](#1-brand-tokens)
   - [Color](#color)
   - [Typography](#typography)
   - [Spacing](#spacing)
   - [Elevation & Shadow](#elevation--shadow)
   - [Border Radius](#border-radius)
   - [Motion](#motion)
2. [Inputs](#2-inputs)
   - [Autocomplete](#autocomplete)
   - [Button](#button)
   - [Button Group](#button-group)
   - [Checkbox](#checkbox)
   - [Floating Action Button (FAB)](#floating-action-button-fab)
   - [Number Field](#number-field)
   - [Radio Group](#radio-group)
   - [Rating](#rating)
   - [Select](#select)
   - [Slider](#slider)
   - [Switch](#switch)
   - [Text Field](#text-field)
   - [Transfer List](#transfer-list)
   - [Toggle Button](#toggle-button)
3. [Data Display](#3-data-display)
   - [Avatar](#avatar)
   - [Badge](#badge)
   - [Chip / Tag](#chip--tag)
   - [Divider](#divider)
   - [Icons](#icons)
   - [List](#list)
   - [Table](#table)
   - [Tooltip](#tooltip)
   - [Typography](#typography-1)
4. [Feedback](#4-feedback)
   - [Alert](#alert)
   - [Backdrop](#backdrop)
   - [Dialog / Modal](#dialog--modal)
   - [Progress](#progress)
   - [Skeleton](#skeleton)
   - [Snackbar / Toast](#snackbar--toast)
5. [Surfaces](#5-surfaces)
   - [Accordion](#accordion)
   - [App Bar](#app-bar)
   - [Card](#card)
   - [Paper](#paper)
6. [Navigation](#6-navigation)
   - [Bottom Navigation](#bottom-navigation)
   - [Breadcrumbs](#breadcrumbs)
   - [Drawer](#drawer)
   - [Link](#link)
   - [Menu](#menu)
   - [Menubar](#menubar)
   - [Pagination](#pagination)
   - [Speed Dial](#speed-dial)
   - [Stepper](#stepper)
   - [Tabs](#tabs)
7. [Layout](#7-layout)
   - [Box](#box)
   - [Container](#container)
   - [Grid](#grid)
   - [Stack](#stack)
   - [Image List](#image-list)
8. [Utility Components](#8-utility-components)
   - [Click-Away Listener](#click-away-listener)
   - [CSS Baseline](#css-baseline)
   - [Modal (low-level)](#modal-low-level)
   - [Popover](#popover)
   - [Popper](#popper)
   - [Portal](#portal)
   - [Textarea Autosize](#textarea-autosize)
   - [Transitions](#transitions)
9. [MUI X / Advanced](#9-mui-x--advanced)
   - [Data Grid](#data-grid)
   - [Date & Time Pickers](#date--time-pickers)
   - [Charts](#charts)
   - [Tree View](#tree-view)
10. [Lab / Experimental](#10-lab--experimental)
    - [Masonry](#masonry)
    - [Timeline](#timeline)
11. [Search Bar Pattern](#11-search-bar-pattern)
12. [Filter Pattern](#12-filter-pattern)
13. [Responsive Breakpoints](#13-responsive-breakpoints)
14. [Accessibility Standards](#14-accessibility-standards)
15. [Tailwind Config Reference](#15-tailwind-config-reference)

---

## 1. Brand Tokens

### Color

#### Core Palette

| Token | Name | Hex | Tailwind Class | Usage |
|-------|------|-----|----------------|-------|
| `--color-primary` | Proflect Blue | `#185FA5` | `bg-primary` / `text-primary` | CTAs, links, active states, focus rings |
| `--color-primary-dark` | Deep Navy | `#0C447C` | `bg-primary-dark` | Hover/pressed, sticky headers |
| `--color-primary-light` | Sky Mist | `#E6F1FB` | `bg-primary-light` | Selected rows, chip BG, highlight surfaces |
| `--color-success` | Verified Teal | `#1D9E75` | `bg-success` / `text-success` | Verified, Active, Complete states |
| `--color-text` | Charcoal | `#2C2C2A` | `text-charcoal` | Body text, headings, labels |

#### Extended Semantic Palette

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--color-text-secondary` | `#6B7280` | `text-gray-500` | Subtitles, metadata, placeholders |
| `--color-text-disabled` | `#9CA3AF` | `text-gray-400` | Disabled fields, inactive tabs |
| `--color-border` | `#D1DCE8` | `border-border` | Input borders, dividers, table lines |
| `--color-border-focus` | `#185FA5` | — | Input focus ring |
| `--color-surface` | `#FFFFFF` | `bg-white` | Cards, modals, dropdowns |
| `--color-bg` | `#F4F8FC` | `bg-bg` | Page background |
| `--color-error` | `#D93025` | `text-error` / `bg-error` | Errors, destructive actions |
| `--color-warning` | `#F59E0B` | `text-warning` | Warnings, pending states |
| `--color-info` | `#185FA5` | — | Informational alerts (uses Primary) |

#### MUI Theme Mapping

```js
// createTheme palette mapping
palette: {
  primary:   { main: '#185FA5', dark: '#0C447C', light: '#E6F1FB', contrastText: '#fff' },
  success:   { main: '#1D9E75', contrastText: '#fff' },
  error:     { main: '#D93025', contrastText: '#fff' },
  warning:   { main: '#F59E0B', contrastText: '#fff' },
  text:      { primary: '#2C2C2A', secondary: '#6B7280', disabled: '#9CA3AF' },
  background:{ default: '#F4F8FC', paper: '#FFFFFF' },
  divider:   '#D1DCE8',
}
```

---

### Typography

#### Font Stack

| Role | Font | Weights | Import |
|------|------|---------|--------|
| **Display / Headings** | `Inter` | 600, 700 | Google Fonts |
| **Body** | `Inter` | 400, 500 | Google Fonts |
| **Monospace** | `JetBrains Mono` | 400 | Google Fonts |

#### Type Scale

| Variant (MUI) | Size | Weight | Line Height | Tailwind | Usage |
|---------------|------|--------|-------------|----------|-------|
| `h1` | 36px | 700 | 1.15 | `text-4xl font-bold` | Page hero |
| `h2` | 28px | 700 | 1.2 | `text-3xl font-bold` | Page title |
| `h3` | 22px | 600 | 1.25 | `text-2xl font-semibold` | Section heading |
| `h4` | 18px | 600 | 1.3 | `text-lg font-semibold` | Card title |
| `h5` | 16px | 600 | 1.35 | `text-base font-semibold` | Sub-heading |
| `h6` | 14px | 600 | 1.4 | `text-sm font-semibold` | Label heading |
| `subtitle1` | 16px | 400 | 1.6 | `text-base` | Large body / lead |
| `subtitle2` | 14px | 500 | 1.6 | `text-sm font-medium` | Meta subtitle |
| `body1` | 16px | 400 | 1.6 | `text-base font-normal` | Primary body |
| `body2` | 14px | 400 | 1.6 | `text-sm font-normal` | Default body |
| `caption` | 12px | 400 | 1.5 | `text-xs font-normal` | Timestamps, metadata |
| `overline` | 11px | 500 | 2.0 | `text-xs font-medium uppercase tracking-widest` | Section labels |
| `button` | 14px | 500 | 1.75 | `text-sm font-medium` | Button text |
| `code` | 13px | 400 | 1.6 | `font-mono text-sm` | Inline code |

#### Rules
- Minimum body font: **14px web**, **15px mobile**
- Line length: 60–80 characters for readable paragraphs
- Never use pure `#000000` — always use Charcoal `#2C2C2A`
- Contrast: white text on `#185FA5` passes AA (5.1:1); Charcoal on white passes AAA (14.5:1)

---

### Spacing

**Base unit: 8px** (MUI default). All spacing is a multiple of 8.

| MUI `spacing()` | Value | Tailwind | Usage |
|-----------------|-------|----------|-------|
| `spacing(0.5)` | 4px | `p-1` | Tight icon padding |
| `spacing(1)` | 8px | `p-2` | Compact badge/chip |
| `spacing(1.5)` | 12px | `p-3` | Button vertical pad |
| `spacing(2)` | 16px | `p-4` | Card padding, standard gap |
| `spacing(2.5)` | 20px | `p-5` | Form field gap |
| `spacing(3)` | 24px | `p-6` | Section inner padding |
| `spacing(4)` | 32px | `p-8` | Section separation |
| `spacing(5)` | 40px | `p-10` | Hero padding |
| `spacing(6)` | 48px | `p-12` | Large section |
| `spacing(8)` | 64px | `p-16` | Top-of-page whitespace |

---

### Elevation & Shadow

MUI uses 25 elevation levels (0–24). Proflect maps to 5 practical levels:

| Proflect Level | MUI Elevation | Tailwind | Usage |
|----------------|---------------|----------|-------|
| Flush | `elevation={0}` | `shadow-none` | Inline elements |
| Low | `elevation={1}` | `shadow-sm` | Input fields, table rows |
| Default | `elevation={2}` | `shadow` | Cards, dropdowns |
| Medium | `elevation={4}` | `shadow-md` | Floating panels, popovers |
| High | `elevation={8}` | `shadow-lg` | Modals, drawers |
| Highest | `elevation={16}` | `shadow-xl` | Full-screen overlays |

Shadows use Deep Navy `#0C447C` as the base tint for brand consistency.

---

### Border Radius

```js
// MUI theme
shape: { borderRadius: 8 }
```

| Token | Value | MUI | Tailwind | Usage |
|-------|-------|-----|----------|-------|
| `sm` | 4px | `sx={{ borderRadius: 1 }}` | `rounded` | Tags, inline badges |
| `md` | 8px | Default | `rounded-lg` | Inputs, buttons, chips |
| `lg` | 12px | `sx={{ borderRadius: '12px' }}` | `rounded-xl` | Modals, large cards |
| `xl` | 16px | `sx={{ borderRadius: '16px' }}` | `rounded-2xl` | Hero banners |
| `full` | 9999px | `sx={{ borderRadius: '50%' }}` | `rounded-full` | Avatars, pill badges |

---

### Motion

```js
// MUI theme
transitions: {
  duration: { shortest: 150, shorter: 200, short: 250, standard: 300, complex: 375, enteringScreen: 225, leavingScreen: 195 },
  easing:   { easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)', easeIn: 'cubic-bezier(0.4, 0, 1, 1)', sharp: 'cubic-bezier(0.4, 0, 0.6, 1)' }
}
```

| Use case | Duration | Easing |
|----------|----------|--------|
| Hover color shift | 150ms | `easeInOut` |
| Button press, focus ring | 200ms | `easeInOut` |
| Dropdown / menu open | 250ms | `easeOut` |
| Modal enter | 225ms | `easeOut` |
| Modal leave | 195ms | `easeIn` |
| Page transition | 300ms | `easeInOut` |

---

## 2. Inputs

### Autocomplete

MUI: `<Autocomplete>` — combobox with search + filtering built in.

**Proflect usage:** User search, tag selection, skill input, location search.

| Prop | Proflect default |
|------|-----------------|
| `variant` | `outlined` |
| `size` | `medium` |
| `multiple` | `false` (use `true` for multi-select chips) |
| `freeSolo` | `false` (unless creating new entries) |
| `disablePortal` | `false` |

```jsx
<Autocomplete
  options={options}
  renderInput={(params) => (
    <TextField {...params} label="Search skills" placeholder="e.g. React, Python" />
  )}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      '&.Mui-focused fieldset': { borderColor: '#185FA5' },
    }
  }}
/>
```

**States:** Default · Focused · Loading (show `CircularProgress`) · Error · Disabled · No options

---

### Button

MUI: `<Button>`, `<IconButton>`, `<LoadingButton>` (MUI X)

#### Variants & Proflect mapping

| MUI Variant | Proflect role | Primary color | Hover |
|-------------|---------------|---------------|-------|
| `contained` | Primary CTA | `#185FA5` bg, white text | `#0C447C` bg |
| `outlined` | Secondary action | White bg, `#185FA5` border/text | `#E6F1FB` bg |
| `text` | Ghost / tertiary | Transparent, `#185FA5` text | `#E6F1FB` bg |
| `contained` color=`error` | Destructive | `#D93025` bg | `#B91C1C` bg |
| `contained` color=`success` | Confirm / verify | `#1D9E75` bg | `#15805E` bg |

#### Sizes

| MUI size | Padding | Font | Min width |
|----------|---------|------|-----------|
| `small` | `4px 10px` | 13px | — |
| `medium` (default) | `6px 16px` | 14px | 64px |
| `large` | `8px 22px` | 15px | 80px |

```jsx
// Primary
<Button variant="contained" color="primary" size="medium">Submit</Button>

// Secondary
<Button variant="outlined" color="primary">Cancel</Button>

// Ghost
<Button variant="text" color="primary">Learn more</Button>

// With icon
<Button variant="contained" startIcon={<SaveIcon />}>Save</Button>

// Icon-only (always provide aria-label)
<IconButton aria-label="close" color="primary"><CloseIcon /></IconButton>
```

**States:** Default · Hover · Active/Pressed · Focus (ring) · Disabled · Loading

---

### Button Group

MUI: `<ButtonGroup>`

**Proflect usage:** Segmented controls (e.g. List / Grid view toggle, time filters).

```jsx
<ButtonGroup variant="outlined" color="primary">
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</ButtonGroup>
```

---

### Checkbox

MUI: `<Checkbox>`, `<FormControlLabel>`, `<FormGroup>`

| State | Color |
|-------|-------|
| Unchecked | `#D1DCE8` border |
| Checked | `#185FA5` fill |
| Indeterminate | `#185FA5` dash |
| Disabled | `#9CA3AF` |
| Error | `#D93025` |

```jsx
<FormGroup>
  <FormControlLabel
    control={<Checkbox defaultChecked sx={{ color: '#D1DCE8', '&.Mui-checked': { color: '#185FA5' } }} />}
    label="Remember me"
  />
</FormGroup>

// With helper text and error
<FormControl error>
  <FormControlLabel control={<Checkbox />} label="I agree to terms" />
  <FormHelperText>This field is required</FormHelperText>
</FormControl>
```

---

### Floating Action Button (FAB)

MUI: `<Fab>`

**Proflect usage:** Primary mobile action (e.g. Add new item on mobile screens).

| Variant | Size | Usage |
|---------|------|-------|
| `circular` | `large` (56px) | Main page action |
| `circular` | `small` (40px) | Secondary actions |
| `extended` | — | When label needed |

```jsx
// Standard
<Fab color="primary" aria-label="add" sx={{ bgcolor: '#185FA5', '&:hover': { bgcolor: '#0C447C' } }}>
  <AddIcon />
</Fab>

// Extended (mobile)
<Fab variant="extended" color="primary">
  <AddIcon sx={{ mr: 1 }} />
  Add Profile
</Fab>
```

Position: `fixed bottom-6 right-6` (web), above bottom nav (mobile).

---

### Number Field

MUI: `<NumberField>` (new in v9)

```jsx
<NumberField
  label="Experience (years)"
  defaultValue={0}
  min={0}
  max={50}
  step={1}
/>
```

---

### Radio Group

MUI: `<Radio>`, `<RadioGroup>`, `<FormControlLabel>`

```jsx
<FormControl>
  <FormLabel sx={{ color: '#2C2C2A', '&.Mui-focused': { color: '#185FA5' } }}>
    Employment type
  </FormLabel>
  <RadioGroup defaultValue="full-time">
    <FormControlLabel value="full-time" control={<Radio sx={{ '&.Mui-checked': { color: '#185FA5' } }} />} label="Full-time" />
    <FormControlLabel value="part-time" control={<Radio sx={{ '&.Mui-checked': { color: '#185FA5' } }} />} label="Part-time" />
    <FormControlLabel value="contract" control={<Radio sx={{ '&.Mui-checked': { color: '#185FA5' } }} />} label="Contract" />
  </RadioGroup>
</FormControl>
```

---

### Rating

MUI: `<Rating>`

**Proflect usage:** Skill proficiency rating, candidate scoring.

```jsx
<Rating
  value={3.5}
  precision={0.5}
  sx={{ color: '#185FA5', '& .MuiRating-iconEmpty': { color: '#D1DCE8' } }}
/>
```

---

### Select

MUI: `<Select>`, `<MenuItem>`, `<FormControl>`

| Variant | Usage |
|---------|-------|
| `outlined` (default) | All standard form selects |
| `standard` | Inline compact selects (table filters) |
| `filled` | Not used in Proflect |

```jsx
<FormControl fullWidth size="medium">
  <InputLabel>Role</InputLabel>
  <Select
    value={role}
    label="Role"
    onChange={handleChange}
    sx={{ borderRadius: '8px', '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#185FA5' } }}
  >
    <MenuItem value="engineer">Software Engineer</MenuItem>
    <MenuItem value="designer">Designer</MenuItem>
    <MenuItem value="pm">Product Manager</MenuItem>
  </Select>
</FormControl>

// Multiple select with chips
<Select multiple value={selected} renderValue={(vals) => (
  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
    {vals.map(v => <Chip key={v} label={v} size="small" />)}
  </Box>
)}>
```

---

### Slider

MUI: `<Slider>`

**Proflect usage:** Experience range filter, salary range, skill level indicator.

```jsx
// Range slider
<Slider
  value={[2, 8]}
  min={0} max={20}
  valueLabelDisplay="auto"
  valueLabelFormat={(v) => `${v} yrs`}
  sx={{
    color: '#185FA5',
    '& .MuiSlider-thumb': { bgcolor: '#185FA5' },
    '& .MuiSlider-track': { bgcolor: '#185FA5' },
    '& .MuiSlider-rail': { bgcolor: '#D1DCE8' },
  }}
/>
```

---

### Switch

MUI: `<Switch>`, `<FormControlLabel>`

| State | Colors |
|-------|--------|
| Off | `#D1DCE8` track |
| On | `#185FA5` track |
| Disabled | `#9CA3AF` |

```jsx
<FormControlLabel
  control={
    <Switch
      checked={checked}
      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#185FA5' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#185FA5' } }}
    />
  }
  label="Active"
/>
```

---

### Text Field

MUI: `<TextField>` — the most-used input. Wraps Input, InputLabel, FormHelperText.

**Proflect standard:** `variant="outlined"`, `size="medium"`, `fullWidth`

| State | Border | Label | Helper |
|-------|--------|-------|--------|
| Default | `#D1DCE8` | `#6B7280` | `#6B7280` |
| Focused | `#185FA5` (2px) | `#185FA5` | — |
| Error | `#D93025` | `#D93025` | `#D93025` |
| Disabled | `#D1DCE8` | `#9CA3AF` | `#9CA3AF` |
| Success | `#1D9E75` | `#1D9E75` | `#1D9E75` |

```jsx
// Standard
<TextField
  label="Full name"
  placeholder="John Doe"
  fullWidth
  variant="outlined"
  helperText="As shown on official documents"
  sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#185FA5' }, '& .MuiInputLabel-root.Mui-focused': { color: '#185FA5' } }}
/>

// Error
<TextField label="Email" error helperText="Invalid email address" />

// With adornment
<TextField
  label="Search"
  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
/>

// Password
<TextField
  label="Password"
  type={showPass ? 'text' : 'password'}
  InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={toggle}>{showPass ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
/>
```

---

### Transfer List

MUI: Custom pattern using `<List>` + `<Checkbox>` + `<Button>` controls.

**Proflect usage:** Assigning skills to job role, selecting team members.

Structure: Left list (available) → action buttons (move right/left) → Right list (selected).

---

### Toggle Button

MUI: `<ToggleButton>`, `<ToggleButtonGroup>`

**Proflect usage:** View mode (list/grid/map), filter toggles, status filters.

```jsx
<ToggleButtonGroup
  value={view}
  exclusive
  onChange={handleView}
  sx={{
    '& .MuiToggleButton-root': { color: '#6B7280', border: '1px solid #D1DCE8' },
    '& .MuiToggleButton-root.Mui-selected': { bgcolor: '#E6F1FB', color: '#185FA5', border: '1px solid #185FA5' },
  }}
>
  <ToggleButton value="list" aria-label="list view"><ViewListIcon /></ToggleButton>
  <ToggleButton value="grid" aria-label="grid view"><ViewModuleIcon /></ToggleButton>
</ToggleButtonGroup>
```

---

## 3. Data Display

### Avatar

MUI: `<Avatar>`, `<AvatarGroup>`

| Variant | Usage |
|---------|-------|
| Image | User profile photo |
| Initials | When photo unavailable |
| Icon | System / entity avatars |

```jsx
// Image
<Avatar src="/photo.jpg" alt="Jane Doe" sx={{ width: 40, height: 40 }} />

// Initials fallback
<Avatar sx={{ bgcolor: '#185FA5', width: 40, height: 40 }}>JD</Avatar>

// Group (overlap)
<AvatarGroup max={4}>
  <Avatar src="/a.jpg" />
  <Avatar src="/b.jpg" />
  <Avatar sx={{ bgcolor: '#185FA5' }}>+3</Avatar>
</AvatarGroup>
```

**Sizes:** 24px (xs), 32px (sm), 40px (md/default), 48px (lg), 64px (xl), 96px (profile)

---

### Badge

MUI: `<Badge>`

**Proflect usage:** Notification count, unread messages, active indicator.

```jsx
// Notification count
<Badge badgeContent={4} color="error">
  <NotificationsIcon />
</Badge>

// Dot indicator (online/active)
<Badge variant="dot" color="success">
  <Avatar src="/photo.jpg" />
</Badge>
```

Colors: `primary` (`#185FA5`), `error` (`#D93025`), `success` (`#1D9E75`), `warning` (`#F59E0B`)

---

### Chip / Tag

MUI: `<Chip>`

**Proflect usage:** Skills, tags, filters, status labels, selected filter pills.

| Variant | Usage |
|---------|-------|
| `filled` | Status labels, primary tags |
| `outlined` | Filter chips, secondary tags |

```jsx
// Skill chip
<Chip label="React" variant="filled" sx={{ bgcolor: '#E6F1FB', color: '#185FA5', fontWeight: 500 }} />

// Deletable chip (filter selected)
<Chip label="Remote" onDelete={handleDelete} sx={{ bgcolor: '#E6F1FB', color: '#185FA5' }} />

// Clickable filter chip
<Chip label="Full-time" variant="outlined" onClick={handleClick} clickable
  sx={{ borderColor: '#185FA5', color: '#185FA5', '&:hover': { bgcolor: '#E6F1FB' } }} />

// Success status
<Chip icon={<CheckCircleIcon />} label="Verified" size="small"
  sx={{ bgcolor: '#D1FAE5', color: '#1D9E75' }} />

// Error status
<Chip label="Rejected" size="small" sx={{ bgcolor: '#FEE2E2', color: '#D93025' }} />
```

**Sizes:** `small` (24px height), `medium` (32px height, default)

---

### Divider

MUI: `<Divider>`

```jsx
// Horizontal
<Divider sx={{ borderColor: '#D1DCE8' }} />

// With text
<Divider sx={{ borderColor: '#D1DCE8' }}>
  <Typography variant="caption" color="text.secondary">or</Typography>
</Divider>

// Vertical (inside flex)
<Divider orientation="vertical" flexItem sx={{ borderColor: '#D1DCE8', mx: 1 }} />
```

---

### Icons

**Library:** [Material Icons](https://mui.com/material-ui/material-icons/) + [Lucide React](https://lucide.dev) as supplement.

| Style | Usage |
|-------|-------|
| `Outlined` | Default — navigation, actions |
| `Filled` | Active/selected state of navigation icons |
| `Rounded` | Softer UI, onboarding |
| `TwoTone` | Illustrations, empty states |

```jsx
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle' // filled = active

// Sizes: inherit(default), small(20px), medium(24px), large(35px)
<CheckCircleIcon fontSize="small" sx={{ color: '#1D9E75' }} />
```

**Color rule:** Always use `currentColor` or semantic color — never hardcode grey for interactive icons.

---

### List

MUI: `<List>`, `<ListItem>`, `<ListItemButton>`, `<ListItemIcon>`, `<ListItemText>`, `<ListSubheader>`

**Proflect usage:** Sidebar nav items, search results, notification items, menu options.

```jsx
<List disablePadding>
  <ListSubheader sx={{ bgcolor: '#F4F8FC', color: '#6B7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
    Recent
  </ListSubheader>

  <ListItem disablePadding>
    <ListItemButton
      selected={selected === 'dashboard'}
      sx={{
        borderRadius: '8px',
        mx: 1,
        '&.Mui-selected': { bgcolor: '#E6F1FB', color: '#185FA5' },
        '&:hover': { bgcolor: '#E6F1FB' },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><DashboardIcon /></ListItemIcon>
      <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }} />
    </ListItemButton>
  </ListItem>
</List>
```

---

### Table

MUI: `<Table>`, `<TableHead>`, `<TableBody>`, `<TableRow>`, `<TableCell>`, `<TableSortLabel>`, `<TablePagination>`

**Proflect usage:** Candidate lists, job listings, analytics tables, admin views.

```jsx
<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #D1DCE8', borderRadius: '12px' }}>
  <Table>
    <TableHead sx={{ bgcolor: '#E6F1FB' }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <TableSortLabel active direction="asc">Name</TableSortLabel>
        </TableCell>
        <TableCell>Status</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow hover sx={{ '&:hover': { bgcolor: '#F4F8FC' }, '&:last-child td': { border: 0 } }}>
        <TableCell sx={{ fontWeight: 500, color: '#2C2C2A' }}>Jane Doe</TableCell>
        <TableCell><Chip label="Active" size="small" sx={{ bgcolor: '#D1FAE5', color: '#1D9E75' }} /></TableCell>
        <TableCell align="right">
          <Button size="small" variant="text">View</Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <TablePagination
    component="div"
    count={48} page={0} rowsPerPage={10}
    onPageChange={handlePage}
    onRowsPerPageChange={handleRowsPerPage}
    rowsPerPageOptions={[10, 25, 50]}
    sx={{ borderTop: '1px solid #D1DCE8' }}
  />
</TableContainer>
```

---

### Tooltip

MUI: `<Tooltip>`

```jsx
<Tooltip title="Verified by Proflect" placement="top" arrow>
  <CheckCircleIcon sx={{ color: '#1D9E75' }} />
</Tooltip>
```

**Proflect style:** Dark bg (`#2C2C2A`), white text, `arrow`, max-width 220px.

```jsx
// Custom styled
<Tooltip
  title="Your profile is 80% complete"
  slotProps={{ tooltip: { sx: { bgcolor: '#2C2C2A', fontSize: '12px', maxWidth: 220 } }, arrow: { sx: { color: '#2C2C2A' } } }}
>
```

---

### Typography

MUI: `<Typography>`

```jsx
<Typography variant="h2" sx={{ color: '#2C2C2A', fontWeight: 700 }}>Page Title</Typography>
<Typography variant="body1" color="text.secondary">Supporting description text.</Typography>
<Typography variant="caption" color="text.secondary">Last updated 2 hours ago</Typography>
<Typography variant="overline" sx={{ color: '#185FA5', letterSpacing: '0.1em' }}>Section Label</Typography>
```

---

## 4. Feedback

### Alert

MUI: `<Alert>`, `<AlertTitle>`

| Severity | Icon | BG | Text |
|----------|------|-----|------|
| `info` | ℹ️ | `#E6F1FB` | `#185FA5` |
| `success` | ✅ | `#D1FAE5` | `#1D9E75` |
| `warning` | ⚠️ | `#FEF3C7` | `#B45309` |
| `error` | ❌ | `#FEE2E2` | `#D93025` |

```jsx
<Alert severity="info" sx={{ borderRadius: '8px', border: '1px solid #185FA5/20' }}>
  <AlertTitle>Note</AlertTitle>
  Your session expires in 10 minutes.
</Alert>

<Alert severity="success" onClose={handleClose}>Profile updated successfully.</Alert>
<Alert severity="error" action={<Button size="small" color="error">Retry</Button>}>Upload failed.</Alert>
```

---

### Backdrop

MUI: `<Backdrop>`

```jsx
<Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'rgba(12,68,124,0.5)', backdropFilter: 'blur(4px)' }}>
  <CircularProgress color="inherit" />
</Backdrop>
```

---

### Dialog / Modal

MUI: `<Dialog>`, `<DialogTitle>`, `<DialogContent>`, `<DialogActions>`, `<DialogContentText>`

**Sizes:** `xs` (444px), `sm` (600px), `md` (960px), `lg` (1280px), `xl` (1536px), `fullScreen` (mobile)

```jsx
<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
  PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 8px 32px rgba(12,68,124,0.16)' } }}>

  <DialogTitle sx={{ fontWeight: 700, color: '#2C2C2A', borderBottom: '1px solid #D1DCE8', pb: 2 }}>
    Confirm action
    <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent sx={{ pt: 3 }}>
    <DialogContentText>Are you sure you want to proceed?</DialogContentText>
  </DialogContent>

  <DialogActions sx={{ borderTop: '1px solid #D1DCE8', px: 3, py: 2, bgcolor: '#F4F8FC' }}>
    <Button variant="outlined" onClick={handleClose}>Cancel</Button>
    <Button variant="contained" color="primary" onClick={handleConfirm}>Confirm</Button>
  </DialogActions>
</Dialog>
```

**Mobile:** Use `fullScreen` below `sm` breakpoint: `fullScreen={isMobile}`

---

### Progress

MUI: `<CircularProgress>`, `<LinearProgress>`

```jsx
// Circular — loading state
<CircularProgress size={24} sx={{ color: '#185FA5' }} />
<CircularProgress size={24} color="success" />

// Linear — page/file upload progress
<LinearProgress variant="determinate" value={65}
  sx={{ height: 6, borderRadius: 3, bgcolor: '#E6F1FB', '& .MuiLinearProgress-bar': { bgcolor: '#185FA5' } }} />

// Indeterminate
<LinearProgress sx={{ bgcolor: '#E6F1FB', '& .MuiLinearProgress-bar': { bgcolor: '#185FA5' } }} />
```

---

### Skeleton

MUI: `<Skeleton>`

**Proflect usage:** Content loading placeholders for cards, table rows, profile sections.

```jsx
// Card skeleton
<Box sx={{ p: 3 }}>
  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
    <Skeleton variant="circular" width={48} height={48} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.5 }} />
      <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '60%' }} />
    </Box>
  </Box>
  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '8px' }} />
</Box>
```

Animation: `wave` (default) — do not use `pulse` for Proflect.

---

### Snackbar / Toast

MUI: `<Snackbar>`, combined with `<Alert>`

| Property | Proflect default |
|----------|-----------------|
| Position | `bottom-right` desktop, `bottom-center` mobile |
| Auto-hide | 4000ms (success), 6000ms (error), none (warning) |
| Max stack | 3 visible |

```jsx
<Snackbar
  open={open}
  autoHideDuration={4000}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <Alert onClose={handleClose} severity="success" variant="filled"
    sx={{ bgcolor: '#2C2C2A', color: '#fff', '& .MuiAlert-icon': { color: '#1D9E75' }, borderRadius: '12px', boxShadow: '0 8px 32px rgba(12,68,124,0.16)' }}>
    Changes saved successfully
  </Alert>
</Snackbar>
```

---

## 5. Surfaces

### Accordion

MUI: `<Accordion>`, `<AccordionSummary>`, `<AccordionDetails>`

**Proflect usage:** FAQ sections, filter panels, detailed profile sections.

```jsx
<Accordion disableGutters elevation={0}
  sx={{ border: '1px solid #D1DCE8', borderRadius: '8px !important', '&:before': { display: 'none' }, mb: 1 }}>
  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#185FA5' }} />}
    sx={{ '& .MuiAccordionSummary-content': { my: 1.5 } }}>
    <Typography variant="body2" fontWeight={600} color="text.primary">Experience</Typography>
  </AccordionSummary>
  <AccordionDetails sx={{ borderTop: '1px solid #D1DCE8', pt: 2 }}>
    {/* content */}
  </AccordionDetails>
</Accordion>
```

---

### App Bar

MUI: `<AppBar>`, `<Toolbar>`

**Proflect standard:** White background, border-bottom, sticky, `elevation={0}`

```jsx
<AppBar position="sticky" elevation={0}
  sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #D1DCE8', color: '#2C2C2A' }}>
  <Toolbar sx={{ justifyContent: 'space-between', height: 64, px: { xs: 2, md: 4 } }}>
    {/* Logo */}
    <Box component="img" src="/logo.svg" alt="Proflect" sx={{ height: 32 }} />

    {/* Desktop nav links */}
    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
      <Button variant="text" sx={{ color: '#2C2C2A', '&:hover': { bgcolor: '#E6F1FB', color: '#185FA5' } }}>Dashboard</Button>
      {/* Active */}
      <Button variant="text" sx={{ color: '#185FA5', bgcolor: '#E6F1FB' }}>Profiles</Button>
    </Box>

    {/* Actions */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton aria-label="notifications"><Badge badgeContent={3} color="error"><NotificationsIcon /></Badge></IconButton>
      <Avatar src="/photo.jpg" sx={{ width: 36, height: 36, cursor: 'pointer', border: '2px solid #D1DCE8' }} />
    </Box>
  </Toolbar>
</AppBar>
```

---

### Card

MUI: `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardActions>`, `<CardMedia>`, `<CardActionArea>`

#### Variants

| Variant | Style |
|---------|-------|
| Default | White surface, `elevation={1}`, `borderRadius='12px'` |
| Highlighted | Sky Mist BG, primary border |
| Interactive | `CardActionArea` with hover lift |
| Media | `CardMedia` top image, then content |

```jsx
// Standard card
<Card elevation={1} sx={{ borderRadius: '12px', border: '1px solid #D1DCE8' }}>
  <CardHeader
    avatar={<Avatar sx={{ bgcolor: '#185FA5' }}>JD</Avatar>}
    title={<Typography variant="body1" fontWeight={600}>Jane Doe</Typography>}
    subheader={<Typography variant="caption" color="text.secondary">Software Engineer</Typography>}
    action={<Chip label="Verified" size="small" sx={{ bgcolor: '#D1FAE5', color: '#1D9E75' }} />}
  />
  <CardContent sx={{ pt: 0 }}>
    <Typography variant="body2" color="text.secondary">5 years of React experience.</Typography>
  </CardContent>
  <CardActions sx={{ px: 2, pb: 2 }}>
    <Button size="small" variant="outlined">View Profile</Button>
    <Button size="small" variant="contained">Contact</Button>
  </CardActions>
</Card>
```

---

### Paper

MUI: `<Paper>`

**Proflect usage:** Section containers, sidebar panels, content regions.

```jsx
<Paper elevation={0} sx={{ border: '1px solid #D1DCE8', borderRadius: '12px', p: 3 }}>
  {/* content */}
</Paper>
```

---

## 6. Navigation

### Bottom Navigation

MUI: `<BottomNavigation>`, `<BottomNavigationAction>`

**Proflect usage:** Primary mobile navigation (max 5 items).

```jsx
<BottomNavigation value={value} onChange={handleChange} showLabels
  sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid #D1DCE8', height: 64,
        '& .MuiBottomNavigationAction-root': { color: '#9CA3AF', minWidth: 0 },
        '& .MuiBottomNavigationAction-root.Mui-selected': { color: '#185FA5' } }}>
  <BottomNavigationAction label="Home" icon={<HomeIcon />} />
  <BottomNavigationAction label="Search" icon={<SearchIcon />} />
  <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
  <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
</BottomNavigation>
```

---

### Breadcrumbs

MUI: `<Breadcrumbs>`, `<Link>`, `<Typography>`

```jsx
<Breadcrumbs separator="›" sx={{ '& .MuiBreadcrumbs-separator': { color: '#9CA3AF' } }}>
  <Link href="/" underline="hover" sx={{ color: '#185FA5', fontSize: '14px' }}>Home</Link>
  <Link href="/candidates" underline="hover" sx={{ color: '#185FA5', fontSize: '14px' }}>Candidates</Link>
  <Typography variant="body2" color="text.primary" fontWeight={500}>Jane Doe</Typography>
</Breadcrumbs>
```

---

### Drawer

MUI: `<Drawer>`

| Variant | Usage |
|---------|-------|
| `temporary` | Mobile nav overlay (swipe to close) |
| `permanent` | Desktop sidebar (always visible) |
| `persistent` | Collapsible desktop sidebar |

```jsx
// Mobile drawer
<Drawer
  anchor="left"
  open={open}
  onClose={toggleDrawer}
  PaperProps={{ sx: { width: 280, bgcolor: '#FFFFFF', borderRight: '1px solid #D1DCE8' } }}
>
  {/* Sidebar nav list */}
</Drawer>

// Desktop permanent sidebar
<Drawer variant="permanent"
  PaperProps={{ sx: { width: 240, bgcolor: '#FFFFFF', borderRight: '1px solid #D1DCE8', pt: 8 } }}>
```

---

### Link

MUI: `<Link>`

```jsx
<Link href="#" underline="hover" sx={{ color: '#185FA5', fontSize: '14px', fontWeight: 500 }}>
  View all candidates
</Link>
```

---

### Menu

MUI: `<Menu>`, `<MenuItem>`, `<MenuList>`, `<Divider>`

**Proflect usage:** Context menus, dropdown actions, user account menu.

```jsx
<Menu
  anchorEl={anchor}
  open={Boolean(anchor)}
  onClose={handleClose}
  PaperProps={{ elevation: 4, sx: { borderRadius: '12px', border: '1px solid #D1DCE8', minWidth: 200, mt: 1 } }}
>
  <MenuItem onClick={handleClose} sx={{ fontSize: '14px', '&:hover': { bgcolor: '#E6F1FB', color: '#185FA5' } }}>
    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
    Edit
  </MenuItem>
  <MenuItem onClick={handleClose} sx={{ fontSize: '14px', '&:hover': { bgcolor: '#E6F1FB', color: '#185FA5' } }}>
    <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
    Duplicate
  </MenuItem>
  <Divider sx={{ borderColor: '#D1DCE8' }} />
  <MenuItem onClick={handleClose} sx={{ color: '#D93025', fontSize: '14px', '&:hover': { bgcolor: '#FEE2E2' } }}>
    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#D93025' }} /></ListItemIcon>
    Delete
  </MenuItem>
</Menu>
```

---

### Menubar

MUI: `<Menubar>` (new in v9) — horizontal navigation bar with keyboard navigation.

**Proflect usage:** Top-level desktop navigation for multi-section apps.

---

### Pagination

MUI: `<Pagination>`, `<PaginationItem>`

```jsx
<Pagination
  count={10}
  page={page}
  onChange={handlePage}
  shape="rounded"
  sx={{
    '& .MuiPaginationItem-root': { color: '#2C2C2A', borderColor: '#D1DCE8' },
    '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#185FA5', color: '#fff', borderColor: '#185FA5' },
    '& .MuiPaginationItem-root:hover': { bgcolor: '#E6F1FB' },
  }}
/>
```

---

### Speed Dial

MUI: `<SpeedDial>`, `<SpeedDialAction>`

**Proflect usage:** Contextual quick actions on mobile dashboards.

```jsx
<SpeedDial ariaLabel="Quick actions" icon={<SpeedDialIcon />}
  sx={{ position: 'fixed', bottom: 80, right: 16, '& .MuiSpeedDial-fab': { bgcolor: '#185FA5', '&:hover': { bgcolor: '#0C447C' } } }}>
  <SpeedDialAction icon={<AddIcon />} tooltipTitle="Add candidate" onClick={handleAdd} />
  <SpeedDialAction icon={<ShareIcon />} tooltipTitle="Share" onClick={handleShare} />
</SpeedDial>
```

---

### Stepper

MUI: `<Stepper>`, `<Step>`, `<StepLabel>`, `<StepContent>`

**Proflect usage:** Onboarding flows, multi-step forms, profile completion wizard.

```jsx
<Stepper activeStep={1} alternativeLabel
  sx={{ '& .MuiStepIcon-root.Mui-completed': { color: '#1D9E75' }, '& .MuiStepIcon-root.Mui-active': { color: '#185FA5' } }}>
  {['Account', 'Profile', 'Skills', 'Review'].map(label => (
    <Step key={label}>
      <StepLabel>{label}</StepLabel>
    </Step>
  ))}
</Stepper>
```

---

### Tabs

MUI: `<Tabs>`, `<Tab>`, `<TabPanel>` (custom)

**Proflect usage:** Profile sections, dashboard views, settings pages.

```jsx
<Tabs value={tab} onChange={handleTab}
  sx={{
    borderBottom: '1px solid #D1DCE8',
    '& .MuiTabs-indicator': { bgcolor: '#185FA5', height: 3, borderRadius: '3px 3px 0 0' },
    '& .MuiTab-root': { color: '#6B7280', fontWeight: 500, fontSize: '14px', textTransform: 'none', minHeight: 48 },
    '& .MuiTab-root.Mui-selected': { color: '#185FA5', fontWeight: 600 },
  }}>
  <Tab label="Overview" value="overview" />
  <Tab label="Experience" value="experience" />
  <Tab label="Skills" value="skills" />
</Tabs>
```

**Variants:**
- Default: underline indicator (above)
- Contained / pill: wrap Tabs in `Paper` with `bgcolor: '#F4F8FC'`, add `borderRadius` to selected Tab

---

## 7. Layout

### Box

MUI: `<Box>` — generic layout container, alias for `<div>` with `sx` prop.

```jsx
<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 3, bgcolor: '#F4F8FC', borderRadius: '12px' }}>
```

---

### Container

MUI: `<Container>`

```jsx
// Default (max-width: lg = 1280px)
<Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>

// Narrow (forms, auth pages)
<Container maxWidth="sm">

// Full bleed section
<Box sx={{ bgcolor: '#E6F1FB', py: 8 }}>
  <Container maxWidth="lg">
```

---

### Grid

MUI: `<Grid>` (v2, uses CSS gap)

```jsx
<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
    <CandidateCard />
  </Grid>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
    <CandidateCard />
  </Grid>
</Grid>
```

---

### Stack

MUI: `<Stack>` — one-dimensional flex layout.

```jsx
// Vertical (default)
<Stack spacing={2}>
  <TextField label="First name" />
  <TextField label="Last name" />
  <Button variant="contained">Submit</Button>
</Stack>

// Horizontal
<Stack direction="row" spacing={2} alignItems="center">
  <Avatar />
  <Typography>Jane Doe</Typography>
  <Chip label="Active" />
</Stack>
```

---

### Image List

MUI: `<ImageList>`, `<ImageListItem>`, `<ImageListItemBar>`

**Proflect usage:** Portfolio images, project screenshots, certificate gallery.

```jsx
<ImageList cols={3} gap={12} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
  {items.map(item => (
    <ImageListItem key={item.img}>
      <img src={item.img} alt={item.title} loading="lazy" />
      <ImageListItemBar title={item.title} subtitle={item.author} />
    </ImageListItem>
  ))}
</ImageList>
```

---

## 8. Utility Components

### Click-Away Listener

MUI: `<ClickAwayListener>` — detects clicks outside a wrapped element.

```jsx
<ClickAwayListener onClickAway={handleClose}>
  <Box>{/* dropdown or popover content */}</Box>
</ClickAwayListener>
```

---

### CSS Baseline

MUI: `<CssBaseline>` — normalizes browser defaults.

```jsx
// Place once at app root
<CssBaseline />
```

---

### Modal (low-level)

MUI: `<Modal>` — headless, use `<Dialog>` for most cases.

```jsx
<Modal open={open} onClose={handleClose} closeAfterTransition
  BackdropProps={{ sx: { bgcolor: 'rgba(12,68,124,0.5)', backdropFilter: 'blur(4px)' } }}>
  <Fade in={open}>
    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                bgcolor: '#fff', borderRadius: '16px', p: 4, boxShadow: '0 8px 32px rgba(12,68,124,0.16)' }}>
      {/* content */}
    </Box>
  </Fade>
</Modal>
```

---

### Popover

MUI: `<Popover>` — anchor-relative overlay.

**Proflect usage:** Profile preview cards, skill detail overlays, help text.

```jsx
<Popover
  open={open}
  anchorEl={anchorEl}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
  PaperProps={{ sx: { borderRadius: '12px', border: '1px solid #D1DCE8', boxShadow: '0 4px 16px rgba(12,68,124,0.12)', p: 2, minWidth: 240 } }}
>
```

---

### Popper

MUI: `<Popper>` — lower-level than Popover; used by Autocomplete, Tooltip internally.

---

### Portal

MUI: `<Portal>` — renders children into a different DOM node.

---

### Textarea Autosize

MUI: `<TextareaAutosize>` — auto-grows with content.

```jsx
<TextareaAutosize
  minRows={3}
  maxRows={8}
  placeholder="Describe your experience..."
  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1DCE8',
           fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2C2C2A', resize: 'none' }}
/>
```

---

### Transitions

MUI: `<Fade>`, `<Grow>`, `<Slide>`, `<Zoom>`, `<Collapse>`

| Transition | Usage |
|-----------|-------|
| `<Fade>` | Modals, toasts, overlays |
| `<Slide>` | Drawers (direction: left/right/up) |
| `<Collapse>` | Accordions, expandable rows |
| `<Grow>` | Popovers, speed dials |
| `<Zoom>` | FABs entering the screen |

---

## 9. MUI X / Advanced

### Data Grid

MUI X: `<DataGrid>`, `<DataGridPro>`, `<DataGridPremium>`

**Proflect usage:** Large candidate tables, analytics views, admin data management.

```jsx
<DataGrid
  rows={rows}
  columns={columns}
  pageSizeOptions={[10, 25, 50]}
  checkboxSelection
  disableRowSelectionOnClick
  slots={{ toolbar: GridToolbar }}
  sx={{
    border: '1px solid #D1DCE8',
    borderRadius: '12px',
    '& .MuiDataGrid-columnHeaders': { bgcolor: '#E6F1FB', color: '#185FA5', fontWeight: 600, fontSize: '12px' },
    '& .MuiDataGrid-row:hover': { bgcolor: '#F4F8FC' },
    '& .MuiDataGrid-cell:focus': { outline: 'none' },
    '& .MuiDataGrid-columnSeparator': { display: 'none' },
    '& .MuiCheckbox-root.Mui-checked': { color: '#185FA5' },
  }}
/>
```

---

### Date & Time Pickers

MUI X: `<DatePicker>`, `<TimePicker>`, `<DateTimePicker>`, `<DateRangePicker>`

```jsx
<DatePicker
  label="Start date"
  value={date}
  onChange={setDate}
  slotProps={{
    textField: { fullWidth: true, size: 'medium' },
    day: { sx: { '&.Mui-selected': { bgcolor: '#185FA5' }, '&.Mui-selected:hover': { bgcolor: '#0C447C' } } }
  }}
/>
```

---

### Charts

MUI X: `<BarChart>`, `<LineChart>`, `<PieChart>`, `<ScatterChart>`, `<SparkLineChart>`

```jsx
<BarChart
  series={[{ data: [40, 60, 75, 90], color: '#185FA5', label: 'Placements' }]}
  xAxis={[{ data: ['Q1', 'Q2', 'Q3', 'Q4'], scaleType: 'band' }]}
  height={300}
/>

// Color palette for multi-series
const chartColors = ['#185FA5', '#1D9E75', '#F59E0B', '#D93025', '#0C447C']
```

---

### Tree View

MUI X: `<RichTreeView>`, `<SimpleTreeView>`

**Proflect usage:** Org hierarchy, category navigation, skill taxonomy.

```jsx
<SimpleTreeView
  sx={{ '& .MuiTreeItem-root.Mui-selected > .MuiTreeItem-content': { bgcolor: '#E6F1FB', color: '#185FA5' } }}
>
  <TreeItem itemId="eng" label="Engineering">
    <TreeItem itemId="fe" label="Frontend" />
    <TreeItem itemId="be" label="Backend" />
  </TreeItem>
</SimpleTreeView>
```

---

## 10. Lab / Experimental

### Masonry

MUI Lab: `<Masonry>` — variable-height card grid.

**Proflect usage:** Portfolio/project gallery, media feeds.

```jsx
<Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
  {items.map(item => (
    <Card key={item.id} elevation={0} sx={{ border: '1px solid #D1DCE8', borderRadius: '12px' }}>
```

---

### Timeline

MUI Lab: `<Timeline>`, `<TimelineItem>`, `<TimelineSeparator>`, `<TimelineContent>`

**Proflect usage:** Work history, career progression, activity feed.

```jsx
<Timeline position="alternate">
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot sx={{ bgcolor: '#185FA5' }} />
      <TimelineConnector sx={{ bgcolor: '#D1DCE8' }} />
    </TimelineSeparator>
    <TimelineContent>
      <Typography variant="body2" fontWeight={600}>Software Engineer</Typography>
      <Typography variant="caption" color="text.secondary">Acme Corp · 2022–Present</Typography>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

---

## 11. Search Bar Pattern

A first-class UI pattern combining `<TextField>` + `<InputAdornment>` + optional `<Autocomplete>`.

### Standard Search Bar

```jsx
<TextField
  placeholder="Search candidates, skills, roles..."
  size="medium"
  fullWidth
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon sx={{ color: '#9CA3AF' }} />
      </InputAdornment>
    ),
    endAdornment: query && (
      <InputAdornment position="end">
        <IconButton size="small" onClick={clearSearch}><CloseIcon fontSize="small" /></IconButton>
      </InputAdornment>
    ),
    sx: { borderRadius: '8px', bgcolor: '#fff', '& fieldset': { borderColor: '#D1DCE8' } }
  }}
  sx={{ '& .MuiOutlinedInput-root:hover fieldset': { borderColor: '#185FA5' }, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#185FA5' } }}
  value={query}
  onChange={e => setQuery(e.target.value)}
/>
```

### Search with Suggestions (Autocomplete)

```jsx
<Autocomplete
  freeSolo
  options={suggestions}
  renderInput={(params) => (
    <TextField
      {...params}
      placeholder="Search..."
      InputProps={{
        ...params.InputProps,
        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>,
        sx: { borderRadius: '8px' }
      }}
    />
  )}
  renderOption={(props, option) => (
    <Box component="li" {...props} sx={{ fontSize: '14px', '&[aria-selected=true]': { bgcolor: '#E6F1FB !important' } }}>
      {option}
    </Box>
  )}
/>
```

---

## 12. Filter Pattern

### Inline Filter Bar (desktop)

```jsx
<Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
  {/* Search */}
  <TextField size="small" placeholder="Search..." InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
    sx={{ width: 280 }} />

  {/* Select filter */}
  <FormControl size="small" sx={{ minWidth: 140 }}>
    <InputLabel>Role</InputLabel>
    <Select value={role} label="Role" onChange={setRole} sx={{ borderRadius: '8px' }}>
      <MenuItem value="">All roles</MenuItem>
      <MenuItem value="engineer">Engineer</MenuItem>
    </Select>
  </FormControl>

  {/* Toggle group filter */}
  <ToggleButtonGroup value={status} exclusive onChange={setStatus} size="small">
    <ToggleButton value="all">All</ToggleButton>
    <ToggleButton value="active">Active</ToggleButton>
    <ToggleButton value="pending">Pending</ToggleButton>
  </ToggleButtonGroup>

  {/* Active filter chips */}
  {activeFilters.map(f => (
    <Chip key={f.id} label={f.label} onDelete={() => removeFilter(f.id)} size="small"
      sx={{ bgcolor: '#E6F1FB', color: '#185FA5' }} />
  ))}

  {activeFilters.length > 0 && (
    <Button size="small" variant="text" onClick={clearAll} sx={{ color: '#D93025' }}>Clear all</Button>
  )}
</Stack>
```

### Filter Drawer (mobile)

Open a `<Drawer anchor="bottom">` triggered by a "Filters" `<Button>` with `<FilterListIcon>`. Contains:
- `<Accordion>` for each filter group
- `<Slider>` for range filters (salary, experience)
- `<FormGroup>` + `<Checkbox>` for multi-select filters
- Sticky footer with "Apply Filters" (primary) + "Reset" (ghost) buttons

### Active Filter Count Badge

```jsx
<Button variant="outlined" startIcon={<FilterListIcon />}
  sx={{ borderColor: activeCount > 0 ? '#185FA5' : '#D1DCE8', color: activeCount > 0 ? '#185FA5' : '#6B7280' }}>
  Filters
  {activeCount > 0 && <Badge badgeContent={activeCount} color="primary" sx={{ ml: 1.5 }} />}
</Button>
```

---

## 13. Responsive Breakpoints

MUI breakpoints (configure via `createTheme`):

| Name | Default | Tailwind | Devices |
|------|---------|----------|---------|
| `xs` | 0px | (default) | Mobile portrait |
| `sm` | 600px | `sm:` | Mobile landscape, small tablet |
| `md` | 900px | `md:` | Tablet |
| `lg` | 1200px | `lg:` | Desktop |
| `xl` | 1536px | `xl:` | Wide screens |

```jsx
// Responsive sx prop
sx={{ display: { xs: 'none', md: 'flex' } }}
sx={{ px: { xs: 2, sm: 3, md: 4 } }}
sx={{ fontSize: { xs: '14px', md: '16px' } }}

// useMediaQuery hook
const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
```

**Mobile-first patterns:**
- Stack vertically on `xs`, row on `md+`
- Bottom nav on `xs/sm`, side nav on `md+`
- `fullScreen` dialogs on `xs`
- FAB for primary action on `xs/sm`, inline button on `md+`

---

## 14. Accessibility Standards

### Contrast Ratios (WCAG AA)

| Text | Background | Ratio | Pass |
|------|-----------|-------|------|
| Charcoal `#2C2C2A` | White `#FFFFFF` | 14.5:1 | ✅ AAA |
| White `#FFFFFF` | Primary `#185FA5` | 5.1:1 | ✅ AA |
| Primary `#185FA5` | Sky Mist `#E6F1FB` | 4.6:1 | ✅ AA |
| White `#FFFFFF` | Deep Navy `#0C447C` | 7.8:1 | ✅ AAA |
| White `#FFFFFF` | Success `#1D9E75` | 3.2:1 | ⚠️ Large text only |
| White `#FFFFFF` | Error `#D93025` | 4.5:1 | ✅ AA |

### Focus Management

```jsx
// MUI applies focus rings automatically — ensure theme doesn't remove them
// Custom focus ring override in theme:
components: {
  MuiButtonBase: {
    defaultProps: { disableRipple: false },
    styleOverrides: {
      root: { '&:focus-visible': { outline: '2px solid #185FA5', outlineOffset: '2px' } }
    }
  }
}
```

### ARIA Essentials

```jsx
// Icon-only buttons
<IconButton aria-label="Delete item"><DeleteIcon /></IconButton>

// Loading state
<Button disabled aria-busy="true">
  <CircularProgress size={16} sx={{ mr: 1 }} aria-hidden="true" /> Saving…
</Button>

// Live regions for dynamic updates
<Box role="status" aria-live="polite" sx={{ srOnly: true }}>
  {statusMessage}
</Box>

// Skip navigation
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4">
  Skip to content
</a>
```

---

## 15. Tailwind Config Reference

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#185FA5',
          dark:    '#0C447C',
          light:   '#E6F1FB',
        },
        success:  '#1D9E75',
        charcoal: '#2C2C2A',
        border:   '#D1DCE8',
        surface:  '#FFFFFF',
        bg:       '#F4F8FC',
        error:    '#D93025',
        warning:  '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
      },
      boxShadow: {
        sm:  '0 1px 2px rgba(12,68,124,0.06)',
        DEFAULT: '0 2px 8px rgba(12,68,124,0.10)',
        md:  '0 4px 16px rgba(12,68,124,0.12)',
        lg:  '0 8px 32px rgba(12,68,124,0.16)',
        xl:  '0 16px 48px rgba(12,68,124,0.20)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### MUI Theme (complete starter)

```js
import { createTheme } from '@mui/material/styles'

const proflectTheme = createTheme({
  palette: {
    primary:    { main: '#185FA5', dark: '#0C447C', light: '#E6F1FB', contrastText: '#fff' },
    success:    { main: '#1D9E75', contrastText: '#fff' },
    error:      { main: '#D93025', contrastText: '#fff' },
    warning:    { main: '#F59E0B', contrastText: '#fff' },
    text:       { primary: '#2C2C2A', secondary: '#6B7280', disabled: '#9CA3AF' },
    background: { default: '#F4F8FC', paper: '#FFFFFF' },
    divider:    '#D1DCE8',
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    h1: { fontSize: '2.25rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    h3: { fontSize: '1.375rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem',     fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '1rem',     lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 500 },
    caption: { fontSize: '0.75rem' },
    overline: { fontSize: '0.6875rem', letterSpacing: '0.1em', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(12,68,124,0.06)',
    '0 2px 8px rgba(12,68,124,0.10)',
    '0 2px 8px rgba(12,68,124,0.10)',
    '0 4px 16px rgba(12,68,124,0.12)',
    // ... levels 5-24 use progressively deeper navy shadows
  ],
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#2C2C2A', fontSize: '12px' },
        arrow: { color: '#2C2C2A' },
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } },
    },
    MuiTableHead: {
      styleOverrides: { root: { '& th': { fontWeight: 600, fontSize: '12px', letterSpacing: '0.05em' } } },
    },
  },
})

export default proflectTheme
```

---

*Proflect Design System · v2.0 · MUI v9 · Web & Mobile · Maintained by the Proflect product team*