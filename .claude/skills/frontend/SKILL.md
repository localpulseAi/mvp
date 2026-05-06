---
name: frontend
description: Next.js 14 App Router + TypeScript + Tailwind specialist for the LocalPulse AI frontend. Use when building pages, components, hooks, or layouts.
when_to_use: Triggered when writing pages in src/app/, components in src/components/, Tailwind styles, or Next.js routing.
allowed-tools: Read Glob Grep Bash(npm run build) Bash(npm run lint) Bash(npm run dev)
---

# Frontend — Next.js 14 (App Router) + TypeScript + Tailwind

## Project Structure
```
frontend/src/
├── app/
│   ├── layout.tsx             # Root layout (html, body, metadata)
│   ├── globals.css            # Tailwind base + component classes
│   ├── page.tsx               # Landing page (founding member pitch)
│   ├── onboarding/page.tsx    # 5-step wizard
│   ├── (auth)/
│   │   ├── login/page.tsx     # Magic link login
│   │   └── verify/page.tsx    # Email verification
│   └── (dashboard)/
│       ├── layout.tsx         # Sidebar + main content wrapper
│       ├── dashboard/page.tsx # Overview (brief preview, stats, calendar)
│       ├── brief/page.tsx     # Weekly Strategic Brief
│       ├── session/page.tsx   # Strategy Session (6-agent chat UI)
│       ├── competitors/page.tsx # Competitor analysis
│       └── settings/page.tsx  # Profile, notifications, integrations
├── components/
│   ├── layout/Sidebar.tsx     # Navigation sidebar (uses usePathname)
│   └── ui/Badge.tsx           # Reusable badge component
└── lib/utils.ts               # Shared utilities
```

## Route Groups
- `(auth)` — login/verify pages, no sidebar
- `(dashboard)` — sidebar layout, all authenticated pages
- Pages are default-exported — Next.js App Router convention

## Design System

### Colour palette
| Role | Class | Hex |
|------|-------|-----|
| Primary | `brand-600` | #7c3aed (violet) |
| Primary dark | `brand-700` | #6d28d9 |
| Accent / CTA | `amber-500` | #f59e0b |
| Background | `gray-50` | #f9fafb |
| Card bg | `white` | #ffffff |
| Text primary | `gray-900` | #111827 |
| Text muted | `gray-500` | #6b7280 |

### CSS Utility Classes (defined in globals.css)
Always use these — never reinvent them:
```
.card          — bg-white rounded-2xl border border-gray-100 shadow-sm
.card-hover    — card + hover:shadow-md hover:border-gray-200
.btn-primary   — brand-600 bg, white text, rounded-xl
.btn-secondary — white bg, gray-700 text, ring border, rounded-xl
.btn-amber     — amber-500 bg, white text, rounded-xl (CTAs)
.input         — rounded-xl, border-gray-200, focus:ring-brand-500
.label         — text-sm font-medium text-gray-700 mb-1.5
.section-title — text-base font-semibold text-gray-900
.muted         — text-sm text-gray-500
```

### Typography
- Font: Inter (loaded via Google Fonts in globals.css)
- Scale: `text-xs` (12), `text-sm` (14), `text-base` (16), `text-lg` (18), `text-xl` (20), `text-2xl` (24)
- Headings use `font-bold` or `font-extrabold`

### Icons
- Use `lucide-react` — already installed
- Standard size: `h-4 w-4` (small), `h-5 w-5` (default), `h-6 w-6` (large)

### Animations
- Use `framer-motion` for page/section animations
- IMPORTANT: When using bezier ease arrays in Framer Motion variants, always add `as const`:
  ```tsx
  ease: "easeOut" as const   // ✅
  ease: [0.16, 1, 0.3, 1]   // ❌ TypeScript widens to number[]
  ```

## Component Rules
- Functional components only
- Pages use `"use client"` only when client interactivity is needed
- Props interface named `[ComponentName]Props`
- Keep components under 200 lines — split if larger
- Mock data goes at the top of the file, clearly labelled

## Page Patterns

### Dashboard pages
```tsx
"use client";
import { motion } from "framer-motion";
import { IconName } from "lucide-react";

// Mock data at top
const items = [...];

export default function PageName() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Page Title</h1>
      <div className="card p-6">
        {/* Content */}
      </div>
    </div>
  );
}
```

### Auth pages
```tsx
export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card p-8 w-full max-w-md">
        {/* Auth form — magic link only, no password fields */}
      </div>
    </div>
  );
}
```

## Auth Rules
- Magic link only — NEVER add password fields (FR-AUTH-02)
- Login: email input → send magic link → redirect to /verify
- No JWT in localStorage — use httpOnly session cookies (set by backend)

## After Every Change
1. Run `npm run build` — MUST pass before commit (catches TypeScript errors)
2. Verify the page renders correctly at `/` route
3. Hand off to `ui-reviewer` agent for visual consistency check
4. Hand off to `deployer` agent if ready to ship
