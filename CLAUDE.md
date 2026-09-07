# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Basic Working Rule
- **Follow the rules:** ALWAYS read the existing files before performing any operation.
- **Ask if you are unsure:** Never guess, stop the operation, or ask a question directly in the face of unclear or incomplete information. - **Do not make assumptions:** Do not guess code, file paths, or variables.

## Project

AI-powered **contract SaaS**: the user describes their needs in natural language, the system asks for missing information, generates an editable contract draft, converts it to PDF, and archives it.

Two documents are the source of this project and **precede the code**:

- **`design.md`** (English) — Design system. Color tokens, typography, landing sections, package-based dashboards, contract screen, admin panel, button/status system, responsive rules, design QA list in §12. Ready to implement and binding. Originally authored in Turkish; translated to English in place — the section numbering (§1…§13) is unchanged, so every `design.md §N` cross-reference elsewhere in this file still resolves.
- **`prd.md`** (English) — Product requirements. **Cut off in FR-08 (PDF)**: No written requirements for archiving, sharing, package/credit accounting, and admin panel; only mentioned in the §3 MVP scope list. Ask the user before making assumptions in these areas.

## Commands

```bash
npm run dev # development server (Turbopack)
npm run build # production build + TypeScript check
npm run lint # ESLint (entire project)
npm run start # run compiled application

npx eslint src/components/landing/hero.tsx # single file
npx tsc --noEmit # type check only
```

The test infrastructure is not yet established (it was outside the scope of Phase 1). `npm run build` is currently the only gateway for type safety.

## Architecture

**Next.js 16.3.4 + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix) + next-intl.**

Next.js 16 is different from your tutorial. Read the relevant guide under `node_modules/next/dist/docs/` before writing code. Here are some things it has bitten off on:

- **`middleware.ts` is now `proxy.ts`.** The file is `src/proxy.ts`, export name is `proxy` or default. The function is the same.
- **`params` is a Promise** — `const { locale } = await params`.
- **`PageProps<'/[locale]'>` and `LayoutProps<'/[locale]'>` are global type helpers; don't write your own props interface. - Readable without locale prop-drilling via `next/root-params` (in Server Components).

### Folders

```
src/app/[locale]/ # root layout here (html/body), all routes under
src/app/[locale]/style-guide/ # internal design reference, non-i18n
src/components/landing/ # landing sections, each a separate component
src/components/ui/ # primitives (button, status-badge) according to design.md §10
src/i18n/ # routing, navigation, request configuration
src/proxy.ts # locale detection (formerly middleware)
messages/{tr,en}.json # ALL visible text
```

### i18n

- Languages: `tr` (default) and `en`. Configuration in one place: `src/i18n/routing.ts`.
- **No visible strings are embedded in the component** — all are in `messages/*.json`. The only exception is the `style-guide` page (internal developer reference).
- In-app links, use `Link` / `redirect` / `useRouter` in `@/i18n/navigation` NOT `next/link`; otherwise, the language prefix will be lost. - Update **both files** when adding new text; missing key is a runtime error in production.

### Phase Plan

All five phases are code-complete:

- **Phase 1** — skeleton, design system, bilingual landing page.
- **Phase 2** — Supabase auth, workspace/membership scheme, RLS, dashboard shell, package-based dashboards (design.md §7).
- **Phase 3** — Contract creation screen (design.md §8) + Claude API (`claude-opus-5`, adaptive thinking, streaming); PRD FR-02…FR-07.
- **Phase 4** — PDF (Puppeteer/Chromium, not react-pdf — see below), archive, sharing (PRD FR-08), credit/package accounting.
- **Phase 5** — Admin panel (design.md §9).

**Standing caveat:** Phase 3's AI chat/review round-trip (`/api/contracts/[id]/turn`, `/api/contracts/[id]/review`) has never been exercised against the real Anthropic API in this environment — `ANTHROPIC_API_KEY` in `.env` has stayed a placeholder throughout. Everything adjacent (auth, workspace, DB writes, credit consumption, PDF generation, sharing, admin) has been live-verified end-to-end via manual/manual-equivalent paths. The user explicitly decided to close this out as done without live AI verification; if odd behavior shows up in the chat/review flow once a real key is in place, start there.

**PDF library:** `@react-pdf/renderer`/`fontkit` has a confirmed upstream bug rendering Turkish dotless-ı (U+0131) as the digit "1" (reproduced across three font families). Switched to Puppeteer: render HTML with embedded `@fontsource` fonts via headless Chromium (`src/lib/pdf/contract-html.ts` + `render.ts`), which shapes text correctly since it uses Chromium's own engine, not fontkit.

## Design guidelines (non-negotiable)

Essence of design.md §1, §3, §5, and §12. These are priorities when writing a screen:

- **Red is not a decorative color, but an indicator of action and importance.** Overall ratio: 60% light neutral / 25% dark / 10% gray / **5% red**. Do not expose the user to multiple red CTAs simultaneously.
- **Each screen has only one primary action.**
- **Forbidden visual language:** purple-blue neon "AI" palette, gradients, neon glow, glass effects, overly rounded toy cards, robot/brain/magic wand images, 3D illustrations that do not support the content.
- **Border is dominant over shadow.** Single shadow `shadow-card`; radius 8–12 px (`--radius: 10px`), 16–20 px only in large marketing areas. - Icons are line-based and have the same stroke weight (`lucide-react`).
- Do not write text that includes legal guarantees or claims of a "completely error-free contract".

When you finish a screen, go through the **QA list in design.md §12** one by one.

### Dark surfaces are NOT dark mode

The `ink-950` / `ink-900` fields in design.md (navbar, hero, sidebar, final CTA, left panel of the contract screen) are **brand surfaces** that live inside the open theme. Write them with open utilities like `bg-ink-950`; not with `dark:`.

The line `@custom-variant dark (&:is(.dark *))` in `globals.css` is intentionally left: it binds the `dark:` variant to a `.dark` class that is never added, so `dark:` classes from shadcn components remain dead. **Do not delete** — if deleted, Tailwind v4 falls back to `prefers-color-scheme` and the palette silently breaks for visitors whose OS is in dark mode.

Tailwind's built-in `stone` palette is also deliberately cleared (`--color-stone-*: initial`). Writing an off-palette shade (e.g. `stone-500`) then generates no class at all — visibly broken is preferred over silently wrong.

## Package naming — resolved conflict

`prd.md` names the packages **Starter / Pro / Business**; `design.md` §6.6 and §7 say Free / Pay-as-you-go / Business. **The PRD governs.** design.md's design intent maps as follows (the document itself is not corrected; this mapping is what the code follows):

| design.md | Code / UI | Design intent (design.md §7) |
|---|---|---|
| Free | **Starter** | Simple, instructional, low density; 2–3 metrics; calm inline upgrade nudge |
| Pay-as-you-go | **Pro** | Usage/cost transparency; credit summary, transaction history, single red accent-series charts |
| Business | **Business** | Team management, KPI cards, role badges, advanced filters, API area |

## Product principles

- **AI output is never shown as automatically "final".** Draft / review / approved states are visually distinct (design.md §8). Every output is editable and subject to user approval.
- Unknown information is **never fabricated**; missing/ambiguous fields are marked explicitly (PRD FR-04).
- The risk/consistency check is not legal advice or a validity guarantee (PRD FR-07).
- **Out of MVP scope:** electronic signatures, secure-link signing, signature-status tracking, signed-document archive, an advanced client portal. Don't present these as available features in primary navigation (design.md §7.1); mark them "coming soon" only where needed.

## Open items

- **Prices and credit amounts are still placeholders.** The Pro price in `messages/*.json` (₺499 / $19), Starter being free, and the `operation_costs` table's per-operation credit costs (draft_generate=1, ai_edit/risk_check/pdf_generate=0) are none of them defined in the PRD — update via a single new migration (`operation_costs`) and the message files together once real numbers are decided. Business stays "Get a quote".
- The footer's corporate/legal links (About, Contact, Privacy, Terms) still point to in-page sections, not real pages — `HREFS` in `src/components/landing/site-footer.tsx`.
- Email sending has no configured provider, so sharing is link-based only ("copy link"); email delivery is marked "coming soon" in `messages/*.json`.
- `prd.md` cuts off at FR-08; archive, sharing, credit accounting, and the admin panel followed design.md §7/§9 and the MVP scope list instead of a written FR — noted here since there's no PRD text to cross-check against.
- See the Phase Plan section above for the standing Phase 3 live-AI-verification caveat.