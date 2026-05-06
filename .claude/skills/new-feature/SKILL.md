---
name: new-feature
description: Full-stack feature orchestrator for LocalPulse AI. Runs the complete workflow from planning through implementation, testing, review, and deployment.
disable-model-invocation: true
argument-hint: [feature description]
---

# New Feature Workflow: $ARGUMENTS

Follow these phases in order. Each phase delegates to the right agent or skill.

## Phase 1 — Plan (use `planner` agent)
Delegate to the `planner` agent to:
- Read relevant existing code in `frontend/src/` and `backend/app/`
- Break down the feature into backend tasks + frontend tasks + tests
- Identify new models, routes, and components needed
- Define API contracts (method, path, request/response)
- Flag risks and dependencies

Output: ordered task list, approved before proceeding.

## Phase 2 — UI/UX Design (use `/uiux` skill)
Before writing code, design the UI:
- Component hierarchy using the LocalPulse design system
- Which `.card`, `.btn-*`, `.input` classes to use
- Page layout within the `(dashboard)/layout.tsx` sidebar structure
- User flow: entry point → happy path → error paths → success state
- Mobile responsiveness considerations

## Phase 3 — Backend (use `/backend` skill)
Implement in this order:
1. Create/update SQLAlchemy models in `backend/app/models/`
2. Create Pydantic schemas (request/response) if needed
3. Implement service logic in `backend/app/services/`
4. Create route handlers in `backend/app/api/`
5. Register new router in `backend/app/main.py` (if new file)
6. Run `pytest` — all tests must pass

Remember:
- Routes go in `app/api/`, NOT `app/routers/`
- All routes prefixed with `/api/v1`
- No passwords — magic link auth only
- Business logic in services, not route handlers

## Phase 4 — Frontend (use `/frontend` skill)
Implement in this order:
1. Create the page in `frontend/src/app/` (correct route group)
2. Use the LocalPulse design system (`.card`, `.btn-primary`, etc.)
3. Use `lucide-react` icons (h-4 w-4 / h-5 w-5)
4. Add `framer-motion` animations where appropriate
5. Add navigation link in `Sidebar.tsx` if it's a new page
6. Run `npm run build` — MUST pass (catches TypeScript errors)

Remember:
- Framer Motion ease: always use `"easeOut" as const` (not number arrays)
- Pages use `"use client"` only when needed
- Mock data at the top of the file, realistic (not placeholder)

## Phase 5 — Tests (use `/testing` skill)
1. Write pytest tests for each new API endpoint (happy path + 2 edge cases)
2. Write component tests for new React pages
3. Run `pytest && npm run build` — all must pass

## Phase 6 — UI Review (use `ui-reviewer` agent)
Delegate to `ui-reviewer` to check:
- Design system consistency (colours, spacing, radius, shadows)
- Loading/error/empty states
- Responsive layout at mobile + desktop
- Interactive states (hover, focus, disabled)

## Phase 7 — UX Review (use `ux-enhancer` agent)
Delegate to `ux-enhancer` to check:
- User flow completeness
- Accessibility (keyboard nav, ARIA, contrast)
- Feedback on every action (loading, success, error)
- Cognitive load

## Phase 8 — Security Review (use `security-reviewer` agent)
Delegate to `security-reviewer` if the feature touches:
- Auth flows or session handling
- User data or PII
- External API calls
- File uploads or user-submitted content

## Phase 9 — Code Review (use `code-reviewer` agent)
Delegate to `code-reviewer` for final quality check:
- Correctness, code quality, consistency
- Type safety (no `any` in TypeScript, full hints in Python)
- Performance (no N+1 queries, no unnecessary re-renders)

## Phase 10 — Deploy (use `deployer` agent)
Hand off to the `deployer` agent:
1. Commit with descriptive message: `feat: $ARGUMENTS`
2. Stage specific files only — `git add frontend/src/ backend/app/`
3. Push to `localpulseAi/mvp` main branch
4. Verify Vercel deployment succeeds
5. Report production URL

## Commit Convention
```
feat: $ARGUMENTS       — new feature
fix: description       — bug fix
chore: description     — maintenance
refactor: description  — code restructure
```
Always use `git add <specific files>` — never `git add .`
