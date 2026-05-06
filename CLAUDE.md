# LocalPulse AI — Claude Code Instructions

## Agent routing

Always delegate to the appropriate specialist agent. Do not do the work yourself when a matching agent exists.

| Task | Agent to use |
|------|-------------|
| Deploy to Vercel / push to GitHub | `deployer` |
| Plan a new feature or sprint | `planner` |
| Review code before merging | `code-reviewer` |
| Review UI layout, spacing, accessibility | `ui-reviewer` |
| Improve UX flows and interaction design | `ux-enhancer` |
| Write or update documentation | `docs-writer` |
| Security audit of routes, auth, or data | `security-reviewer` |
| Database schema, queries, migrations | `db-analyst` |

### How to invoke an agent
Use the Agent tool with `subagent_type` matching the agent name above, or tell the user:
> "I'll hand this off to the `<agent>` agent."

## Skill routing

Use the matching skill for structured, multi-step work:

| Task | Skill |
|------|-------|
| Build a new full-stack feature | `/new-feature` |
| Write frontend component / page | `/frontend` |
| Write backend route / model / service | `/backend` |
| Write tests (pytest or RTL) | `/testing` |
| Design a UI/UX flow | `/uiux` |
| Write docs / docstrings / README sections | `/docs` |

## Stack reference

- **Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind · `src/app/`
- **Backend:** FastAPI · SQLAlchemy 2.0 async · PostgreSQL
- **Auth:** Magic links only — no passwords (FR-AUTH-02)
- **Design tokens:** violet-700 primary, amber-500 accent, gray-50 background
- **CSS utilities:** `.card`, `.btn-primary`, `.btn-amber`, `.btn-secondary`, `.input`, `.label`

## Non-negotiable rules

- Run `npm run build` locally before any deployment — never push broken code
- Never commit `.env`, `*.db`, `node_modules/`, or `plan/*.docx`
- Never store GitHub PATs in any file
- Use `git add <specific files>` — never `git add .`
- No passwords anywhere — magic link auth only
- Keep mock data realistic, not placeholder text
