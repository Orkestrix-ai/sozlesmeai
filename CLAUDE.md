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

### LLM providers

`src/app/api/contracts/[id]/turn` and `/review` never touch `@anthropic-ai/sdk` or `groq-sdk` directly — both call `getLlmProvider()` from `src/lib/ai/provider/` (selected by `LLM_PROVIDER` env var, default `"anthropic"`), which returns a `streamTurn`/`createMessage` interface (`src/lib/ai/provider/types.ts`) implemented by `provider/anthropic.ts` (`claude-opus-5`, adaptive thinking, prompt caching) and `provider/groq.ts` (`openai/gpt-oss-120b`, no prompt caching, per-tool-call `role:"tool"` messages instead of Anthropic's single `tool_result` batch). Tool schemas in `contract-tools.ts`/`review-tool.ts` are provider-neutral (`LlmToolDef`) and shared verbatim between both. Anthropic's `tool_choice` can't be forced while `thinking` is on (400 if you try) — the `forceTool` request field is honored by Groq only, Anthropic ignores it. Both provider clients are constructed lazily (first call, not module import) so an unset key for the *inactive* provider doesn't crash the app at boot.

### Phase Plan

All five phases are code-complete:

- **Phase 1** — skeleton, design system, bilingual landing page.
- **Phase 2** — Supabase auth, workspace/membership scheme, RLS, dashboard shell, package-based dashboards (design.md §7).
- **Phase 3** — Contract creation screen (design.md §8) + Claude API (`claude-opus-5`, adaptive thinking, streaming); PRD FR-02…FR-07.
- **Phase 4** — PDF (Puppeteer/Chromium, not react-pdf — see below), archive, sharing (PRD FR-08), credit/package accounting.
- **Phase 5** — Admin panel (design.md §9).

**Standing caveat (Anthropic path only):** `ANTHROPIC_API_KEY` in `.env` has stayed a placeholder throughout, so the Anthropic provider (`provider/anthropic.ts`) has never been exercised against the real Anthropic API in this environment. The Groq provider (`provider/groq.ts`), added 2026-09-08, HAS been live-verified directly against the Groq API — a real `GROQ_API_KEY` confirmed tool-calling, streaming, strict nested-object schemas, and Turkish output quality against `openai/gpt-oss-120b`, using the app's actual tool schemas byte-for-byte. Everything else (auth, workspace, DB writes, PDF generation, sharing, admin) has been live-verified end-to-end via manual/manual-equivalent paths regardless of LLM provider. If odd behavior shows up in the chat/review flow specifically on the Anthropic path once a real `ANTHROPIC_API_KEY` is in place, start there — the two providers share tool schemas and prompts but have independent request/response mapping code.

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

`prd.md` names the packages **Starter / Pro / Business**; `design.md` §6.6 and §7 still say **Free** for the entry tier (design.md's Pro and Business already match code 1:1 — the pay-as-you-go billing method and its "Pay-as-you-go" package name were removed from design.md directly). **The PRD governs.** The one remaining naming gap:

| design.md | Code / UI | Design intent (design.md §7) |
|---|---|---|
| Free | **Starter** | Simple, instructional, low density; 2–3 metrics; calm inline upgrade nudge |

## Product principles

- **AI output is never shown as automatically "final".** Draft / review / approved states are visually distinct (design.md §8). Every output is editable and subject to user approval.
- Unknown information is **never fabricated**; missing/ambiguous fields are marked explicitly (PRD FR-04).
- The risk/consistency check is not legal advice or a validity guarantee (PRD FR-07).
- **Out of MVP scope:** electronic signatures, secure-link signing, signature-status tracking, signed-document archive, an advanced client portal. Don't present these as available features in primary navigation (design.md §7.1); mark them "coming soon" only where needed.

## Database security

Supabase/PostgREST, no `DATABASE_URL`, no ORM — every DB access goes through `@supabase/supabase-js` (`.from()`/`.rpc()`), parametric by construction. Five-column hardening applied 2026-09-08 (`supabase/migrations/20260908*`, not yet applied to the live project as of this writing — apply, then regenerate `src/lib/supabase/types.ts` via Supabase MCP `generate_typescript_types`, then re-run `supabase/checks/security_assertions.sql`):

- **Tenant isolation.** RLS is on for every `public` table; `private.*` SECURITY DEFINER helpers (`workspace_ids_for_current_user`, `current_workspace_role`, `is_workspace_admin`, `coworker_ids`, `is_platform_admin`) break the `workspace_members` RLS-recursion trap (42P17) — never inline a policy that queries its own table, add a helper in `private` instead. `contract_documents`/`contract_findings` carry a **composite FK** to `(contract_versions.id, contract_id)`, not just `version_id` — this is what stops a forged `contract_id` + someone-else's `version_id` pairing. `contract_documents.storage_path` is **not client-writable in practice**: a `BEFORE INSERT/UPDATE` trigger (`tg_contract_documents_normalize_path`) recomputes it from `contract_id`/`version_no` every time, so whatever the client sends is overwritten — this is what makes the public `/s/[token]` share page's `storage_path`-based signed URL trustworthy.
- **Least privilege.** There is no `app_user`/`migration_user` pair to create — this project already maps 1:1 onto Supabase's own roles: `authenticated`/`anon` (PostgREST JWT roles, no DDL, table/RPC grants + RLS only) = the CRUD role; `postgres` (Supabase MCP/CLI only, never touched by application code) = the migration role; `service_role` (bypasses RLS entirely) = the one role to keep rare — after this hardening it's used in exactly one place, `src/lib/supabase/admin.ts`, called from exactly one call site (`s/[token]/page.tsx`, for `createSignedUrl` only; the share page's actual row lookups now go through the `get_shared_contract` RPC on the normal client). `eslint.config.mjs` enforces this with `no-restricted-imports` on `@/lib/supabase/admin` — new call sites must be justified, not just added. `alter default privileges` closes new tables/sequences/functions to `anon`/`authenticated` by default (previously each migration had to remember its own `revoke`).
- **Append-only audit tables.** `credit_ledger`, `workspace_activity`, `admin_audit_log` reject `UPDATE`/`DELETE`/`TRUNCATE` at the trigger level (`private.tg_append_only`, statement-level, fires for `service_role` too — only a superuser session-replication-role bypass gets around it, which this project's connections never have). Consequence: these tables' `actor_id`/`contract_id`/`workspace_id` are **plain `uuid` columns, not FKs** to anything cascadable — a deleted contract or profile never rewrites a historical ledger row (`workspace_activity`'s `actor_id → profiles` FK is the one exception, kept `on delete restrict` for the `profiles(full_name)` PostgREST embed in `getWorkspaceActivity()`). Run `supabase/checks/security_assertions.sql` after any migration that touches these three tables or adds a new SECURITY DEFINER function.
- **Credit integrity.** `workspace_credits.balance >= 0` is a DB-level `CHECK`, not just application logic. `credit_ledger.idempotency_key` (unique, nullable) makes `consume_credits`/`refund_credits`/`admin_add_credits` safe to retry. `contract_versions` has **no direct INSERT grant** for `authenticated` — the only way to create a version is `create_contract_version(contract_id, sections, source, idempotency_key)`, which locks the parent `contracts` row, computes `version_no`, deducts credit, and inserts the version in one transaction (no more "credit spent, version write failed" gap). `can_afford(workspace_id, operation)` is a cheap pre-flight gate called *before* the LLM/PDF work starts, purely to stop burning provider tokens on a workspace that's already at zero — the real, authoritative deduction is still `consume_credits` inside the RPC. Zero-cost operations (`ai_edit`, `risk_check`, `pdf_generate`, `manual_edit` while `operation_costs.credits = 0`) still write a `credit_ledger` row (`amount = 0`) for audit continuity — they just don't move the balance.
- **Error handling.** `src/lib/db/errors.ts` (`toPublicError`, `DbError`) and `src/lib/db/safe.ts` (`dbQuery`, `dbRpc`, `withApiErrors`) are the *only* place a Postgres/PostgREST error should be translated for a client response — never `error.message` directly. Classification is by SQLSTATE (`PG_CODE_MAP`) plus a narrow allowlist of this project's own `raise exception '<label>'` strings (`MESSAGE_ALLOWLIST`); anything outside that allowlist is logged server-side with a short `reference` code and returned to the client as `generic` — extend the allowlist when a new RPC introduces a new `raise exception` label, never by matching on Postgres's own generated text.
- **Input validation at the DB boundary.** `src/lib/db/schemas.ts` is a second, narrower Zod layer than `src/lib/validation.ts` — the latter is form/UX validation returning i18n keys (deliberately not Zod, see its header comment); `db/schemas.ts` is what a route/action parses a route param, header, or RPC argument through immediately before it reaches Supabase.

## Open items

- **Prices and credit amounts are still placeholders.** The Pro price in `messages/*.json` (₺499 / $19), Starter being free, and the `operation_costs` table's per-operation credit costs (draft_generate=1, ai_edit/risk_check/pdf_generate=0) are none of them defined in the PRD — update via a single new migration (`operation_costs`) and the message files together once real numbers are decided. Business stays "Get a quote".
- The footer's corporate/legal links (About, Contact, Privacy, Terms) still point to in-page sections, not real pages — `HREFS` in `src/components/landing/site-footer.tsx`.
- Email sending has no configured provider, so sharing is link-based only ("copy link"); email delivery is marked "coming soon" in `messages/*.json`.
- `prd.md` cuts off at FR-08; archive, sharing, credit accounting, and the admin panel followed design.md §7/§9 and the MVP scope list instead of a written FR — noted here since there's no PRD text to cross-check against.
- See the Phase Plan section above for the standing Phase 3 live-AI-verification caveat.
- **No error monitoring is configured** (no Sentry/Datadog/etc. in `package.json`). The 404/error pages (`src/app/[locale]/{not-found,error}.tsx`, `src/app/global-{not-found,error}.tsx`, `src/app/[locale]/(app)/{not-found,error}.tsx`, shared presentation in `src/components/feedback/status-view.tsx`) deliberately avoid claiming "our team has been notified" (`messages/*.json` → `errors.page.unexpected.description`) since that would be false. Update that copy once monitoring exists.
- **No support channel exists yet** (no support email/page). The error pages' secondary action is "go back" (`src/components/feedback/back-button.tsx`) rather than a support link; once a real support address is defined, a `mailto:` tertiary link embedding the reference code could be added (pairs with the footer `HREFS` open item above).
- **No search backend exists** (not even a filter on `/archive`). The error pages offer locale-aware quick links instead of a search box; if `/archive` gains a text filter, the 404 pages could grow a search box that feeds it via `?q=`.
- **Architectural note on `[locale]`:** it's a single dynamic segment, not a catch-all — `/tr/<unmatched>` (two+ segments, no matching `page.tsx`) never reaches `[locale]/layout.tsx` at all and falls straight to `src/app/global-not-found.tsx` (requires `next.config.ts`'s `experimental.globalNotFound: true`, confirmed available in Next 16.3.4). `src/app/[locale]/not-found.tsx` only fires for an explicit `notFound()` call from a matched route with no closer boundary (currently none call it — `(auth)/*` and `s/[token]` handle invalid state inline) or a single bad-locale segment like `/xx` — though in practice `src/proxy.ts`'s next-intl middleware redirects `/xx` → `/tr/xx` before that can happen, routing it to global-not-found instead. `global-not-found.tsx` resolves its locale from the `x-next-intl-locale` header set by that same middleware (falling back to the `NEXT_LOCALE` cookie, then `Accept-Language`) since it has no `params` to read.
- **Share links are not pinned to the version live at share time.** `/s/[token]` (via `get_shared_contract`) always serves the contract's *current* latest version — an edit made after sharing is visible on the existing link immediately. This was a deliberate scope decision during the 2026-09-08 DB security pass (pinning is a product call about whether a share link is a "live document" or a "frozen snapshot", and changes the share UX copy); only the security half was done — the link stops working once `contracts.status` leaves `ready`/`shared`. Pinning would mean adding `contract_shares.version_id` and reading that fixed version instead of "latest".
- **No user-deletion (GDPR) path.** Already impossible in the schema before the 2026-09-08 hardening (`workspaces.owner_id` is `on delete restrict`, every user owns a personal workspace) — the append-only audit trigger added in that pass doesn't change this, just makes it more permanent. Needs a real design (anonymize vs. hard-block) before FR work starts here.
- **No rate limiting.** `/api/contracts/[id]/turn` triggers a billable LLM call and `src/proxy.ts`'s matcher excludes `/api` entirely (each route re-checks auth itself, by design — see the route's own header comment). The 2026-09-08 pass added a pre-flight `can_afford` credit gate, which stops a zero-balance workspace from burning free LLM calls, but a workspace *with* credits has no request-rate limit. Needs an infra decision (Vercel/Upstash) before it's addressed.