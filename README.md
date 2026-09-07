# AI-Powered Contract SaaS

The user describes their needs in natural language; the system prompts for missing information, generates an editable contract draft, converts it to PDF, and archives it.

## Source Documents

- **`design.md`** — Design system (color, typography, section and screen designs, QA list). Binding.
- **`prd.md`** — Product requirements. Cut off in FR-08; no written requirements for archiving, package/credits, and admin.
- **`CLAUDE.md`** — Architectural decisions, design rules, and resolved conflicts.

## Getting Started
```bash
npm install
cp .env.example .env.local # Values ​​not read in Phase 1
npm run dev
```
- <http://localhost:3000> → redirects to `/tr`
- <http://localhost:3000/en> → English
- <http://localhost:3000/tr/style-guide> → internal design reference

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (Radix) · next-intl

## Status

**Phase 1 completed:** project skeleton, design system, bilingual landing page.

Next up: Phase 2 Supabase (auth, workspace, RLS, dashboards) → Phase 3 contract creation screen + Claude API → Phase 4 PDF/archive → Phase 5 admin panel.