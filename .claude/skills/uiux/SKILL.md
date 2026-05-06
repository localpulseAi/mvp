---
name: uiux
description: UI/UX design system and planning specialist for LocalPulse AI. Use when designing new features, planning component layout, defining design tokens, reviewing accessibility, or mapping user flows.
when_to_use: Triggered when planning a new page or feature UI, defining component hierarchy, reviewing visual design, accessibility audit, or user flow mapping.
---

# UI/UX — LocalPulse AI Design System

## Design Tokens

### Colour System
```
Primary (brand):
  brand-50  #f5f3ff   — subtle backgrounds
  brand-100 #ede9fe   — hover backgrounds
  brand-500 #8b5cf6   — light accent, bullet points
  brand-600 #7c3aed   — primary buttons, links, active states
  brand-700 #6d28d9   — primary dark hover

Accent (amber):
  amber-400 #fbbf24   — highlights
  amber-500 #f59e0b   — CTA buttons (.btn-amber), accent badges
  amber-600 #d97706   — CTA hover

Neutrals:
  gray-50   #f9fafb   — page background
  gray-100  #f3f4f6   — card borders, dividers
  gray-400  #9ca3af   — placeholder text
  gray-500  #6b7280   — muted text (.muted)
  gray-700  #374151   — secondary text, labels
  gray-900  #111827   — primary text, headings

Status:
  emerald-500 — positive / good
  red-500     — negative / urgent / alerts
  amber-500   — warnings / attention
```

### Typography
- **Font**: Inter (300–800 weights loaded)
- **Body**: text-sm (14px), text-gray-700, leading-relaxed
- **Labels**: text-sm, font-medium, text-gray-700 (.label)
- **Section headings**: text-base, font-semibold, text-gray-900 (.section-title)
- **Page headings**: text-xl or text-2xl, font-bold or font-extrabold
- **Muted/captions**: text-xs or text-sm, text-gray-500 (.muted)

### Spacing & Layout
- **4px base unit** — use Tailwind scale: `p-1`(4) `p-2`(8) `p-3`(12) `p-4`(16) `p-5`(20) `p-6`(24)
- **Card padding**: `p-5` or `p-6`
- **Section gaps**: `space-y-6`
- **Grid gaps**: `gap-3` (compact) to `gap-6` (spacious)

### Border Radius
- **Cards**: `rounded-2xl` (16px) — always, no exceptions
- **Buttons**: `rounded-xl` (12px)
- **Inputs**: `rounded-xl` (12px)
- **Badges**: `rounded-full` (pill) or `rounded-lg` (8px)

### Shadows
- **Cards**: `shadow-sm` (default), `shadow-md` (hover/elevated)
- **No deep shadows** — keep it flat and clean

## Component Library

### Existing CSS components (globals.css)
```
.card          — white, rounded-2xl, border-gray-100, shadow-sm
.card-hover    — card + transition + hover:shadow-md + hover:border-gray-200
.btn-primary   — brand-600 bg, rounded-xl
.btn-secondary — white bg, ring border, rounded-xl
.btn-amber     — amber-500 bg, rounded-xl (for CTAs)
.input         — rounded-xl, focus:ring-brand-500
.label         — text-sm, font-medium, mb-1.5
.section-title — text-base, font-semibold
.muted         — text-sm, text-gray-500
```

### Existing React components
- `Badge` — `src/components/ui/Badge.tsx` — status badges with colour variants
- `Sidebar` — `src/components/layout/Sidebar.tsx` — nav with usePathname active state

### Icons
`lucide-react` — use consistently:
- `h-4 w-4` in buttons, badges, inline text
- `h-5 w-5` in navigation, card headers
- `h-6 w-6` as standalone icons, empty states

## Page Layout Patterns

### Dashboard pages (inside `(dashboard)/layout.tsx`)
```
┌──────────────────────────────────────────┐
│ Sidebar (220px) │ Main Content (flex-1)  │
│                 │                        │
│ Logo            │ space-y-6              │
│ Nav links       │ ┌──────────────────┐   │
│ ...             │ │ .card p-6        │   │
│                 │ └──────────────────┘   │
│ Owner info      │ ┌──────────────────┐   │
│                 │ │ .card p-6        │   │
│                 │ └──────────────────┘   │
└──────────────────────────────────────────┘
```

### Landing page
Full-width sections, each inside `motion.section` with scroll-reveal animations.
Purple gradient hero, white content sections, amber CTAs.

### Auth pages
Centered card on gray-50 background, max-w-md.

## User Flow Reference

### Core user journey
```
Landing page (/):
  → "Apply for founding membership" [btn-amber]
  → Login (/login):
      → Enter email → Send magic link
      → Check email → Click link
      → Verify (/verify):
          → Token valid → Create session → Redirect
          → New user → Onboarding (/onboarding):
              → Step 1: Business info
              → Step 2: Brand voice
              → Step 3: Cost structure
              → Step 4: Operations
              → Step 5: Competitor discovery
              → → Dashboard (/dashboard)
          → Returning user → Dashboard (/dashboard)
```

### Weekly engagement loop
```
Monday 7am: Brief arrives (/brief)
  → Read brief → "Start a session" [CTA]
  → Strategy Session (/session):
      → 6-agent pipeline processes question
      → Actionable recommendation delivered
  → Check competitors (/competitors):
      → Review detected changes
      → Cross-competitor patterns
```

## Accessibility (WCAG 2.1 AA)
- Colour contrast: ≥4.5:1 body text, ≥3:1 large text (brand-600 on white = 4.56:1 ✓)
- All interactive elements keyboard-reachable (Tab, Enter, Space)
- Form inputs have visible `.label` — no placeholder-only labels
- Focus indicators: never remove outline without replacement
- `aria-describedby` for form errors
- Single `<h1>` per page, logical heading hierarchy

## After Designing
1. Produce the component hierarchy and layout sketch
2. List all `.card`, `.btn-*`, `.input` classes needed
3. Hand off to `/frontend` skill for implementation
4. After implementation, hand off to `ui-reviewer` agent for visual check
5. Hand off to `ux-enhancer` agent for flow and accessibility review
