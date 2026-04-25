# PharmaOpenings — PRD-complete implementation track

**Source of truth:** [`docs/prd.md`](prd.md) **Version 2.0** — implement **§1–§9** and **§11** only for this wave.

**PRD §10 “Future Enhancements” — out of scope** until you explicitly reopen it. Do not implement §10 items as part of **P-01–P-30**; ignore that section when executing prompts below. (A short reminder still lives under **Deferred: §10** at the end of this file.)

**How to use this doc (no back-and-forth)**

1. Execute tasks **in numeric order**: **P-01 → P-02 → …** unless a task’s **Depends on** line says otherwise (only ever depends on *earlier* numbers). **P-04** is optional: you may go **P-03 → P-05** (login) and return to **P-04** later if needed.
2. For each task: copy the **Executor prompt** into your agent as the **only** instruction for that unit of work. Complete **Definition of done** and **Verify** before moving on.
3. If the repo **already** matches a task: still run the **Verify** checklist; fix any drift from `prd.md` until the task is fully green, then proceed. Do not skip verification.
4. After every task: `npm run lint` and `npm run build` (or project equivalents) + quick manual smoke on touched flows.

**One new chat per task (handoff)**

- Open a **fresh chat** for each task ID (e.g. next chat = **P-01** only).
- Paste: (1) the **Executor prompt** code block for that task from this file, (2) one line: `Task: P-0N — completed P-01…P-0(N-1) already` (adjust as needed), (3) optional: `Ignore docs/prd.md §10.`
- No need to paste the whole PRD; point the agent at `docs/prd.md` + this file for context.

**Conventions**

- **RLS:** Candidate flows use anon Supabase + `x-po-verified-mobile` (`src/lib/supabase.ts`, `src/lib/poClientHeaders.ts`, `supabase/migrations/006_rls_candidates_applications.sql`). Never widen anon policies without a security review.
- **Next.js:** Follow [`AGENTS.md`](../AGENTS.md) — check `node_modules/next/dist/docs/` when APIs are unclear.
- **Schema changes:** add a migration under `supabase/migrations/`, then align `types/database.types.ts`.

---

## Master plan (single forward path)

| ID | PRD focus | Task title | Depends on |
|----|-----------|------------|------------|
| P-01 | §6, RLS | Database schema, snapshots, indexes, RLS parity | — |
| P-02 | §5.1, §8 | OTP Edge Functions (`send-otp`, `verify-otp`) + `otp_verified` | P-01 |
| P-03 | §5.1, §8 | Registration page (fields, edges, redirect) | P-02 |
| P-04 | §5.1, §8 (optional) | Realtime OTP (Supabase Realtime + strict RLS / feature flag) | P-02, P-03 |
| P-05 | §5.1, §7 Flow 2 | Login page (OTP, redirect) | P-02 |
| P-06 | §9 | Candidate client: headers, no PII in URLs, session consistency | P-03, P-05 |
| P-07 | §5.1 | Profile: view, edit, resume; application history | P-06 |
| P-08 | §4 | Information architecture: nav, routes, CTAs | P-06 |
| P-09 | §4, §5.2 | Homepage: active job cards (newest first, PRD card fields) | P-01 |
| P-10 | §5.2, §11.G | `/jobs`: advanced filters, search, counts, pagination (20), empty states | P-09 |
| P-11 | §5.2 | Job detail `/jobs/[id]`: listing + apply entry, inactive handling | P-10 |
| P-12 | §5.3, §8 | Apply flow: gate, form, success, duplicates, inactive, resume edge, snapshots | P-07, P-11 |
| P-13 | §5.4 | Admin: login gate, layout, session | P-01 |
| P-14 | §5.4 | Admin: stats overview | P-13 |
| P-15 | §5.4 | Admin: Applications tab (table, expand, filters, bulk, export) | P-14 |
| P-16 | §5.4 | Admin: Talent Pool (filters incl. location, admin notes) | P-15 |
| P-17 | §5.5 | Admin: single job CRUD, soft delete, toggle active | P-13 |
| P-18 | §5.5, §8 | Admin: CSV bulk import (aliases, validation, BOM, chunks, reporting) | P-17 |
| P-19 | §5.6, Appx D | Google Sheets Edge Function (`sync-to-sheets`) | P-01 |
| P-20 | §5.6 | Admin: Sync to Sheets UI + edge-case messaging | P-19 |
| P-21 | §5.7 | Passive talent CTAs (empty states → `/register`) | P-10 |
| P-22 | §8 | Cross-cutting edge cases (remaining matrix rows) | P-12, P-20 |
| P-23 | §9 | Zod validation on all major write paths | P-12 |
| P-24 | §9 | Server-side file validation (storage policies / constraints) | P-23 |
| P-25 | §9 | SEO: metadata, JSON-LD JobPosting, sitemap, robots | P-11 |
| P-26 | §9 | Accessibility + mobile touch targets (WCAG-oriented pass) | P-07, P-10, P-12, P-15 |
| P-27 | §9 | Performance: DB indexes; optional server-side job paging | P-10 |
| P-28 | §8 | Application status change audit (`updated` / history) | P-15 |
| P-29 | §11.G | Final acceptance checklist + tick boxes in `prd.md` | P-01–P-28 |
| P-30 | §4 / §10 | Saved jobs (bookmarks) — IA lists; implement MVP if in scope | P-07, P-11 |

---

## P-01 — Database schema, snapshots, indexes, RLS (PRD §6)

**Definition of done**

- Tables `candidates`, `jobs`, `applications` match **§6** (including snapshot semantics: historical applications must not change when profile changes — use snapshot columns on `applications` if not already wired on insert).
- RLS matrix in **§6** is satisfied or documented with equivalent controls (`x-po-verified-mobile` for anon self-service).
- Missing indexes for common filters (`jobs.is_active`, `jobs.module`, `jobs.created_at`, FKs) added where needed.

**Executor prompt**

```
Task P-01 — PRD §6 database parity.

1. Read docs/prd.md §6 and compare to supabase/migrations/* and types/database.types.ts.
2. Ensure applications row stores snapshot of designation, department, company, qualification, resume at apply time per PRD note. If inserts only write live candidate fields, add migration for snapshot_* columns (if missing) and update ApplyJobForm + types to fill them; keep backward compatibility for existing rows.
3. Verify RLS: candidates insert/select/update own; jobs public read active; applications insert for verified candidate; admin authenticated read/update as PRD.
4. Add CREATE INDEX CONCURRENTLY or standard indexes in a new migration for filter/sort columns used by /jobs (module, qualification_needed, created_at, is_active).
5. Document any intentional PRD deviation in a one-line comment in the migration file only.

Deliver: migrations + types updates + minimal insert/query code fixes if schema changed.
```

**Verify**

- Supabase local or linked DB applies migrations clean.
- Anon cannot read other users’ applications; admin can read all.

---

## P-02 — OTP Edge Functions (PRD §5.1, §8)

**Depends on:** P-01

**Definition of done**

- `send-otp` stores time-bound OTP; `verify-otp` validates (including non-demo path), marks OTP used, returns shape expected by login/register clients.
- PRD §8: distinct handling for expired OTP, wrong OTP, optional lockout after 3 failures (5 min), resend path; user-facing error codes/messages stable for UI mapping.
- PRD §6: on successful verify, set `candidates.otp_verified = true` when that candidate row exists.
- CORS + OPTIONS aligned with existing functions; no secrets logged.

**Executor prompt**

```
Task P-02 — OTP functions per docs/prd.md §5.1 and §8.

Files: supabase/functions/send-otp/index.ts, supabase/functions/verify-otp/index.ts.

1. Audit current behavior vs PRD. Implement: expiry (5 min), attempt counting / lockout for wrong non-demo OTPs, clear JSON errors for {expired|invalid|locked}.
2. Keep demo OTP 1234 if product still needs it; gate with env OTP_DEMO_BYPASS default true for dev.
3. After successful verification, update candidates.otp_verified=true for matching mobile when row exists (service role).
4. Ensure register/login pages can map errors without code changes; if response shape must change, update clients in P-03/P-05 same commit.

Deliver: edge functions + optional migration for lockout fields + any minimal client error-key alignment.
```

**Verify**

- Wrong code 3x → lock or clear error; expired row → expired; happy path 200.

---

## P-03 — Registration UI (PRD §5.1, §8)

**Depends on:** P-02

**Definition of done**

- All fields and validations from **§5.1** table (full name max 100, email format, mobile read-only after OTP, qualification + preferred modules required, resume optional PDF/DOC max 5MB, immediate invalid file feedback).
- Already-registered mobile path with “Login instead?” (PRD).
- Redirect after save: return URL from session (`takePostAuthRedirect`) or `/jobs` per PRD.
- §8: OTP resend cooldown (~30s); network error on send shows retry; sessionStorage draft for step-2 fields after OTP (abandon + return).

**Executor prompt**

```
Task P-03 — Registration per docs/prd.md §5.1 + §8.

File: app/register/page.tsx (+ tiny util if needed).

1. Map every row in the §5.1 registration table to UI + validation. Enforce max length full name 100; resume accept + size checks before upload.
2. Already registered: after verify OTP if server indicates existing candidate, show PRD messaging + link /login.
3. sessionStorage: persist step-2 draft (debounced) after OTP verified; restore banner on return; clear on successful submit.
4. OTP UX: show expired/locked/invalid messages from P-02 error contract.
5. Post-submit: takePostAuthRedirect() ?? /jobs (align copy with PRD “job listings”).

Deliver: register flow only; do not redesign unrelated landing sections.
```

**Verify**

- New user full flow; duplicate mobile; refresh mid step-2 restores draft.

---

## P-04 — Realtime OTP (optional) (PRD §5.1, §8)

**Depends on:** P-02, P-03

**Definition of done**

- **Product / default:** Realtime OTP is **optional** and **off in production** unless explicitly enabled (e.g. `NEXT_PUBLIC_REALTIME_OTP=1` or server-side flag), so SMS-led flows stay the default for millions-scale rollout.
- **Supabase Realtime:** `otp_codes` (or a dedicated narrow view) is eligible for `postgres_changes` only with **RLS that matches the same trust model as `x-po-verified-mobile`** (anon may see at most rows for the current verified mobile — migration + policy tests; no global anon SELECT on OTP rows).
- **Client:** Shared helper (e.g. `src/lib/realtimeOtp.ts` + hook) used from **register** OTP step; **login** (`P-05`) wires the same helper when you implement or revisit that page (same commit as `P-05` acceptable).
- Subscribe only while the OTP step is mounted; **unsubscribe** on success, unmount, or mobile change. Never log OTP values.
- Short **security note** in code or migration `COMMENT`: Realtime does not replace SMS; dev convenience / secondary channel only unless product ships SMS-backed verification.

**Executor prompt**

```
Task P-04 — Optional Realtime OTP (Supabase Realtime) after P-02 + P-03.

1. Confirm with product: enable only for dev/staging or for prod; gate with env and document in .env.example.
2. Migration: tighten `otp_codes` RLS for Realtime (anon SELECT/UPDATE visibility scoped by verified-mobile header pattern mirroring candidates/applications style, or restrict Realtime to authenticated service path only — pick one documented approach).
3. Implement subscribe in register OTP step; debounce; cleanup. Reuse `createSupabaseClient()` fetch header behavior from src/lib/supabase.ts.
4. Wire the same helper into app/login/page.tsx when completing P-05 if not done in the same PR.

Deliver: migration (if RLS changes) + minimal client module + register integration + note for login parity.
```

**Verify**

- With flag off: zero Realtime channels opened.
- With flag on: only the active mobile’s OTP row events arrive; other mobiles never appear; unsubscribe after verify.

---

## P-05 — Login UI (PRD §5.1, §7 Flow 2)

**Depends on:** P-02

**Definition of done**

- Mobile OTP login; not-registered path per PRD; post-login redirect; same OTP error UX as register.
- If **P-04** (Realtime OTP) was implemented, reuse its subscription helper on the OTP step; otherwise remain HTTP-only via P-02.

**Executor prompt**

```
Task P-05 — Login per docs/prd.md §5.1 / Flow 2.

File: app/login/page.tsx.

1. Align OTP send/verify and error mapping with P-02 contract.
2. If verify returns no candidate, show not-registered CTA to /register with same post-auth redirect preservation where appropriate.
3. Resend cooldown; loading/disabled states.

Deliver: login page only.
```

**Verify**

- Registered vs unregistered mobile; redirect after login.

---

## P-06 — Candidate client integrity (PRD §9)

**Depends on:** P-03, P-05

**Definition of done**

- All candidate Supabase calls that need it send `x-po-verified-mobile` where RLS expects it.
- No candidate PII in query strings for sensitive flows (PRD §9); redirects use session storage keys already used for post-auth paths.

**Executor prompt**

```
Task P-06 — PRD §9 candidate security hygiene.

1. Audit src/lib/supabase.ts, src/context/CandidateContext.tsx, app/apply/*, app/profile/*, app/register/* for Supabase usage.
2. Ensure verified-mobile header is attached consistently for anon RLS.
3. Search for email/full_name/mobile in router query params; remove or replace with token/session patterns if found.

Deliver: small targeted fixes + comments only where non-obvious.
```

**Verify**

- Grep for `?email=` style leaks; test apply + profile under anon RLS.

---

## P-07 — Profile: view, edit, history (PRD §5.1)

**Depends on:** P-06

**Definition of done**

- `/profile`: edit all editable registration fields (mobile read-only); resume replace; saves under RLS.
- Application history list (job title, date, status, link to job); empty state + CTA `/jobs`.
- Profile updates reflect on next apply (new snapshots on next application per PRD).

**Executor prompt**

```
Task P-07 — Profile management docs/prd.md §5.1.

File: app/profile/page.tsx (+ hooks if needed).

1. Add edit mode (or always-on form) for full_name, email, designation, department, company, qualification, preferred_modules, resume — mirror register validation (5MB, types).
2. Load applications for candidate_id with job title; respect RLS (join jobs or second query). Read-only status for candidate.
3. useCandidate.refreshCandidate after save.

Deliver: profile page; migrations only if a column is missing (prefer none).
```

**Verify**

- Edit persists; history lists only own applications.

---

## P-08 — Information architecture & nav (PRD §4)

**Depends on:** P-06

**Definition of done**

- Global nav exposes routes in **§4**: Home, Jobs (or embedded list), Register, Login, Profile when session exists, Admin entry if desired (hidden or env-gated is OK if product prefers).
- Apply links land on `/apply/[jobId]` with correct job id propagation from cards.

**Executor prompt**

```
Task P-08 — IA docs/prd.md §4.

1. Audit app/components/*nav*, app/layout.tsx, FloatingNavbar or equivalent.
2. Ensure links exist for: /, /jobs, /register, /login, /profile (when authenticated), /admin/login (document if admin link is omitted in prod).
3. Ensure JobApplyLink (or JobCard CTA) sets post-auth redirect to /apply/:id when unauthenticated.

Deliver: navigation components only unless a route is missing (then add minimal page shell).
```

**Verify**

- Click-through map matches §4 tree.

---

## P-09 — Homepage job listing (PRD §4, §5.2 opening)

**Depends on:** P-01

**Definition of done**

- `/` shows **active** jobs as cards: Title, Location, Department, Type, Module, Qualification required, description truncated; **newest first**.
- Quick path to full browse `/jobs` and to apply/detail per your card pattern.

**Executor prompt**

```
Task P-09 — Homepage jobs docs/prd.md §4 + §5.2 (Homepage Job Listing).

1. Extend app/page.tsx or landing sections to load active jobs server-side (reuse src/lib/jobs.ts; add fetchRecentActiveJobs(limit, order by created_at desc) if needed).
2. Render JobCard or equivalent with PRD fields; truncate description safely.
3. Primary CTA to /jobs for full filter experience.

Deliver: home + jobs lib only; avoid duplicating entire /jobs filter UI on home.
```

**Verify**

- Zero jobs: graceful block; many jobs: sorted newest first.

---

## P-10 — Job browse `/jobs` complete (PRD §5.2, §11.G)

**Depends on:** P-09

**Definition of done**

- Collapsible / slide-out **advanced filter panel**: module (multi), location (multi or combobox from distinct job locations), department (multi), job type (multi), qualification (multi), posted date presets (7d / 30d / all) + optional custom range.
- Quick search: **title OR location OR department OR module** (substring).
- Active filter **count badge**; **Clear all**; copy **Showing X of Y jobs**; empty state with register CTA; global “no active jobs” copy per §5.2 edge cases.
- **Pagination:** 20 jobs per page, URL-driven `page` param, preserves filters.

**Executor prompt**

```
Task P-10 — /jobs complete docs/prd.md §5.2 + acceptance §11.G filter bullets.

File: app/jobs/page.tsx + extracted modules e.g. src/lib/jobFilters.ts.

1. Implement advanced filter panel (mobile: sheet/drawer; desktop: collapsible sidebar). Multi-select per PRD dimensions; locations/departments derived from current active job set unless you implement server aggregation later (P-27).
2. URL encodes all filters + page; shareable links.
3. Quick search q matches title, location, department, module (case-insensitive).
4. Badge = count of non-default filters; "Clear all" resets filters+page.
5. Header text "Showing {x} of {y} jobs" where y counts active jobs matching filters before pagination slice, x counts current page slice — define consistently in code comments.
6. Pagination size 20; clamp invalid page.
7. Empty states: filtered vs zero-active-global vs load error — each distinct; include /register CTA where PRD says.

Deliver: jobs listing UX; DB paging optional here (can load filtered set server-side in page until P-27 optimizes).
```

**Verify**

- Filter matrix; URL reload; page 2 with filters; empty states.

---

## P-11 — Job detail page (PRD §5.2 cards / apply entry)

**Depends on:** P-10

**Definition of done**

- `/jobs/[id]` shows full job fields; inactive job message; Apply CTA to `/apply/[id]` (or embedded apply if PRD interpreted that way — default: link to apply route).

**Executor prompt**

```
Task P-11 — Job detail docs/prd.md §5.2.

Files: app/jobs/[id]/page.tsx, not-found.

1. Show title, location, dept, type, module, qualification_needed, full description (semantic headings).
2. If inactive: PRD-aligned message, no apply.
3. CTA Apply → /jobs/[id] already or /apply/[id] — pick /apply/:id to match §4; ensure JobCard from /jobs links correctly.

Deliver: job detail + metadata hooks if duplicated (P-25 may extend).
```

**Verify**

- Active vs inactive; apply link.

---

## P-12 — Apply flow complete (PRD §5.3, §8)

**Depends on:** P-07, P-11

**Definition of done**

- Unregistered → `/register` with return to apply (already present: extend if query param PRD `redirect=` differs — align to PRD string).
- Form matches **§5.3** table; no cover letter.
- Duplicate apply message with date; inactive on submit; **resume upload failure** allows submit with profile resume/null + **warning** copy §5.3.
- Inserts write **snapshot** fields so profile edits do not rewrite history (verify with P-01 schema).

**Executor prompt**

```
Task P-12 — Apply flow docs/prd.md §5.3 + §8 application rows.

Files: app/apply/[jobId]/page.tsx, ApplyJobForm.tsx.

1. Verify redirect to /register?redirect=/apply/:id per PRD; harmonize with setPostAuthRedirect if both exist.
2. ApplyJobForm: on storage upload failure for optional new resume, fall back to existing resume_url or null, still insert application, then show success + prominent warning banner per PRD.
3. Ensure insert uses snapshot columns from P-01 for designation/dept/company/qualification/resume.
4. Duplicate + inactive behaviors per PRD copy.

Deliver: apply route + form only.
```

**Verify**

- Simulate upload failure; DB row snapshots unchanged after profile edit + second application.

---

## P-13 — Admin: auth gate (PRD §5.4, §9)

**Depends on:** P-01

**Definition of done**

- `/admin/login` email+password; `/admin` requires session; logout; session expiry redirects to login (PRD §8 admin).

**Executor prompt**

```
Task P-13 — Admin gate docs/prd.md §5.4 / §9.

Files: app/admin/login/page.tsx, app/admin/page.tsx, layout.

1. Audit existing Supabase auth gating; ensure unauthenticated users cannot load admin data.
2. On session loss mid-use, redirect to /admin/login with optional return path (query or localStorage key admin_return) — minimal implementation acceptable.

Deliver: admin auth shell only.
```

**Verify**

- Logout; expired session behavior (simulate via revoke).

---

## P-14 — Admin: stats (PRD §5.4)

**Depends on:** P-13

**Definition of done**

- All stats rows in **§5.4** table implemented and wired to real queries (Talent pool = candidates with 0 applications — same definition everywhere).

**Executor prompt**

```
Task P-14 — Stats bar docs/prd.md §5.4.

File: app/admin/page.tsx (stats effect), StatsBar.tsx.

1. Verify counts: total applications, active jobs, new today, shortlisted, talent pool, this week — formulas match PRD wording.
2. Fix any miscounts vs Applications/TalentPoolTab definitions.

Deliver: stats only.
```

**Verify**

- Numbers match manual SQL spot-check on seed data.

---

## P-15 — Admin: Applications tab (PRD §5.4)

**Depends on:** P-14

**Definition of done**

- Columns **§5.4** (#, name expandable, email, mobile, job title, module, company, qualification, status dropdown, formatted date, resume link).
- Filters: status multi, job, module, date range, search name/email/mobile.
- Bulk status + export selected CSV.

**Executor prompt**

```
Task P-15 — Applications tab docs/prd.md §5.4.

File: app/admin/components/ApplicationsTab.tsx.

1. Audit table vs PRD column list; add missing columns or rename headers.
2. Candidate name opens expandable inline detail (or dialog) with extra fields admin needs.
3. Ensure filters cover PRD list; date range inclusive; search debounced optional.
4. Bulk + export already partially there — align CSV columns to PRD sheet column order where sensible.

Deliver: ApplicationsTab + small shared formatters if needed.
```

**Verify**

- Large list performance acceptable (<1000 rows); export opens.

---

## P-16 — Admin: Talent Pool + notes + location filter (PRD §5.4)

**Depends on:** P-15

**Definition of done**

- Talent pool = registered, **zero** applications.
- Filters: module, qualification, **location** — if `candidates` lacks location, add **`preferred_location` text nullable** (or equivalent) via migration + register/profile UI in same task so filter is meaningful.
- Admin notes: separate table **`admin_candidate_notes`** (recommended) with RLS **authenticated only**; UI to add/view latest notes per candidate.

**Executor prompt**

```
Task P-16 — Talent pool docs/prd.md §5.4 (Talent Pool Tab).

1. If PRD location filter cannot work: add preferred_location (text) to candidates + show on register (optional field) and profile edit (P-07 may need small follow-up if already merged — do in same PR as P-16).
2. Implement admin_candidate_notes (id, candidate_id, body, created_at, admin_email) + RLS policies authenticated-only CRUD.
3. TalentPoolTab: filter by module, qualification, location (preferred_location or derived), search; column for notes summary + dialog to append note.

Deliver: migration + types + TalentPoolTab + minimal register/profile field if new column.
```

**Verify**

- Anon cannot select notes; admin can; location filter works when set.

---

## P-17 — Admin: single job management (PRD §5.5)

**Depends on:** P-13

**Definition of done**

- Add/Edit form fields per **§5.5**; delete = soft (`is_active=false`) if applications exist (PRD §8); toggle active; inactive hidden from candidates.

**Executor prompt**

```
Task P-17 — Jobs admin docs/prd.md §5.5.

File: app/admin/components/JobsTab.tsx.

1. Map every Add Job field; defaults: type Full-time, qualification Any where PRD allows.
2. Delete confirmation: implement soft delete per PRD edge case; hard delete only if no applications OR explicitly out of scope — default soft.
3. Toggle active/inactive visible and clear.

Deliver: JobsTab job form + list behaviors.
```

**Verify**

- Soft-deleted job disappears from /jobs; still in admin list.

---

## P-18 — Admin: CSV bulk jobs (PRD §5.5, §8)

**Depends on:** P-17

**Definition of done**

- Template columns + aliases **§5.5**; per-row validation message; strip **UTF-8 BOM**; ignore extra columns; **chunk insert 50** rows with aggregated report “Uploaded X of Y rows…”; missing required column → specific error (§8).

**Executor prompt**

```
Task P-18 — CSV import docs/prd.md §5.5 + §8 admin CSV rows.

Files: app/admin/lib/jobCsv.ts, JobsTab.tsx.

1. Strip \uFEFF before parse; detect missing required headers with explicit error string.
2. Batch inserts of 50 with running totals; surface skipped row reasons (cap list in UI).
3. Large file progress indicator (simple text ok).

Deliver: CSV pipeline + UI summary only.
```

**Verify**

- BOM file; 120 rows; bad header file.

---

## P-19 — Google Sheets: Edge Function (PRD §5.6, Appendix D)

**Depends on:** P-01

**Definition of done**

- `sync-to-sheets`: admin JWT required; service role read; Sheets **full replace**; tabs `Applications` + `Talent Pool` with **exact PRD column sets**; backoff **3** retries; recreate missing sheet/tab if feasible, else clear error (§8).

**Executor prompt**

```
Task P-19 — sync-to-sheets docs/prd.md §5.6 + Appendix D.

Create supabase/functions/sync-to-sheets/index.ts.

1. POST + OPTIONS CORS like other functions.
2. Authenticate Supabase user JWT; reject anon.
3. Service role: fetch applications joined to jobs + candidates for Applications sheet columns exactly as PRD list. Talent pool rows = candidates with zero applications, columns per PRD.
4. Google service account auth to Sheets API v4; clear range; batch write; exponential backoff 429/5xx max 3.
5. Env vars documented in file header: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_KEY.

Deliver: edge function; no secrets in repo.
```

**Verify**

- 401 without admin; 200 with empty DB counts zero; staging sheet receives rows.

---

## P-20 — Google Sheets: Admin UI (PRD §5.6)

**Depends on:** P-19

**Definition of done**

- Sync button(s): loading, debounce double-click; success counts toast/banner; errors: rate limit, network, no data (“No data to sync yet.”), partial failure message **§5.6** edge cases.

**Executor prompt**

```
Task P-20 — Sheets UI docs/prd.md §5.6.

Files: app/admin/page.tsx, ApplicationsTab and/or TalentPoolTab, src/lib/edgeFunctions.ts.

1. Invoke sync-to-sheets with admin access_token in Authorization.
2. UX: disabled while syncing; success string with counts; map Google failures to PRD copy.
3. Single sync action that refreshes both tabs' data conceptually (one function call).

Deliver: client wiring + minimal toast lib if not present (prefer shadcn toast pattern).
```

**Verify**

- Double-click does not double-sync; empty DB message.

---

## P-21 — Passive talent pool CTAs (PRD §5.7)

**Depends on:** P-10

**Definition of done**

- When filters or browse show “no match” / talent messaging, CTA copy aligns with **§5.7** value prop and links `/register`.

**Executor prompt**

```
Task P-21 — Passive registration docs/prd.md §5.7.

1. Audit empty states on /jobs (P-10) and home (P-09); add CTA "Don't see a matching role? Register…" per PRD tone.
2. Optional: success message after register-from-empty-state (copy only).

Deliver: copy + links only unless a small shared CTA component helps.
```

**Verify**

- User paths from empty jobs → register.

---

## P-22 — Remaining edge-case matrix (PRD §8)

**Depends on:** P-12, P-20

**Definition of done**

- Walk **§8** tables; every row either implemented or explicitly documented as out-of-scope in code comment (only where product agrees). Minimum: admin CSV wrong encoding note, Sheets API down string, apply sessionStorage restore mid-flow (if not done), browser back OTP state preserved.

**Executor prompt**

```
Task P-22 — PRD §8 sweep.

1. Walk docs/prd.md §8 tables (Registration & Auth, Application, Admin, Data Integrity). For each row, either implement the behavior in the relevant file or leave a one-line code comment ONLY where product explicitly defers (rare).
2. Implement gaps across login/register/apply/admin/sync/csv (e.g. Latin-1 CSV note if still missing, Sheets down copy, OTP back-button state).
3. Session expired mid-application: add sessionStorage restore for apply form fields after re-auth if practical; otherwise show a clear inline warning and preserve what you can without a large refactor.

Deliver: scattered small fixes; no unrelated refactors; do not add new standalone markdown files for checklists.
```

**Verify**

- Manual script covering §8 rows.

---

## P-23 — Zod validation (PRD §9)

**Depends on:** P-12

**Definition of done**

- Zod schemas for register submit, profile update, apply payload, admin job insert/update, CSV row mapping output; forms show friendly errors.

**Executor prompt**

```
Task P-23 — Zod docs/prd.md §9.

1. Add zod dependency if missing.
2. src/lib/schemas/* with shared string limits matching PRD (e.g. name 100 chars).
3. Wire to register, profile, ApplyJobForm, JobsTab save + optional CSV preflight.

Deliver: schemas + integrations; tests optional.
```

**Verify**

- Invalid email blocked at submit boundary.

---

## P-24 — Server-side file validation (PRD §9)

**Depends on:** P-23

**Definition of done**

- Storage policies or upload metadata checks: reject oversize/wrong MIME at server where Supabase allows; document client+server split.

**Executor prompt**

```
Task P-24 — Server-side upload validation docs/prd.md §9.

1. Review supabase/migrations for storage bucket policies on resumes.
2. Tighten policies: max size, allowed mime types; if insufficient, add Edge Function upload-proxy ONLY if necessary — prefer storage policies first.

Deliver: migration/policy updates + short README comment in migration header.
```

**Verify**

- Attempt disallowed upload type against API.

---

## P-25 — SEO (PRD §9)

**Depends on:** P-11

**Definition of done**

- Semantic headings on key pages; per-route metadata; `JobPosting` JSON-LD on job detail; `sitemap.xml` with active jobs; `robots.txt`; OG basics.

**Executor prompt**

```
Task P-25 — SEO docs/prd.md §9.

1. app/layout.tsx metadata template; key routes export metadata or generateMetadata.
2. app/jobs/[id]: JSON-LD JobPosting using NEXT_PUBLIC_SITE_URL.
3. app/sitemap.ts + app/robots.ts per Next.js App Router docs.

Deliver: SEO files + job page LD-JSON.
```

**Verify**

- View-source JSON-LD; /sitemap.xml 200.

---

## P-26 — Accessibility + mobile (PRD §9)

**Depends on:** P-07, P-10, P-12, P-15

**Definition of done**

- Forms keyboard accessible; labels; `aria-live` for errors; dialogs focus trap verified; primary buttons **min 44px** height where below threshold; focus-visible rings.

**Executor prompt**

```
Task P-26 — A11y + mobile docs/prd.md §9.

1. Pass focused pages: login, register, /jobs, apply, profile, admin tables/dialogs.
2. Fix missing label associations, live regions, table headers, contrast issues only where clearly broken vs PRD 4.5:1 — do not redesign palette.

Deliver: TSX/CSS incremental fixes.
```

**Verify**

- Keyboard-only smoke; axe or Lighthouse spot check on /jobs and /apply.

---

## P-27 — Performance: indexes + optional job query optimization (PRD §9)

**Depends on:** P-10

**Definition of done**

- P-01 indexes verified in prod path; if `/jobs` still loads all rows, add **server-side filtered + paged** query in `src/lib/jobs.ts` and switch page to it without breaking P-10 URL contract.

**Executor prompt**

```
Task P-27 — Performance docs/prd.md §9.

1. Confirm indexes from P-01 exist on jobs for filter/sort.
2. Implement fetchJobsPage({ filters, range }) using Supabase range+count if still client-slicing entire table.
3. Keep sitemap/admin needs in mind — separate lightweight query if needed.

Deliver: jobs.ts + app/jobs/page.tsx wiring.
```

**Verify**

- Large seed dataset scroll remains responsive (subjective + timing log optional).

---

## P-28 — Status change audit (PRD §8 Data Integrity)

**Depends on:** P-15

**Definition of done**

- When admin changes application status, persist **timestamp** (and optionally previous value) — e.g. `applications.status_changed_at` or `application_status_events` table.

**Executor prompt**

```
Task P-28 — Audit trail docs/prd.md §8 Data Integrity admin status change.

1. Choose minimal schema: column status_changed_at timestamptz updated on each status change OR history table — prefer column + trigger OR update in ApplicationsTab update handler.
2. Migration + types; show timestamp in admin expandable detail optional.

Deliver: migration + admin update path + types.
```

**Verify**

- Change status twice; timestamps reflect.

---

## P-29 — Final acceptance (PRD §11.G)

**Depends on:** P-01–P-28

**Definition of done**

- Every checkbox in **§11.G** checked or explicitly struck with product approval; `docs/prd.md` Appendix G updated to `[x]` for shipped items.
- Optional **P-04** (Realtime OTP) may be marked **N/A** for a given release with a one-line product decision (no need to block ship).

**Executor prompt**

```
Task P-29 — Acceptance docs/prd.md §11.G.

1. Walk checklist G line by line; test in browser or document blockers.
2. Edit docs/prd.md checkboxes to [x] for completed items only.
3. Produce a short INTERNAL release note in commit message (no new md file).

Deliver: prd.md checkbox updates + any final tiny fixes discovered during audit.
```

**Verify**

- Full demo script: register → browse → apply → admin status → sync sheets.

---

## P-30 — Saved jobs (PRD §4 IA; also §10 item 4)

**Depends on:** P-07, P-11

**Definition of done**

- Bookmarks stored per candidate; toggle on job cards/detail; list on `/profile`; RLS consistent with other candidate-owned rows.

**Executor prompt**

```
Task P-30 — Saved jobs docs/prd.md §4 profile IA (bookmark MVP).

1. Migration: saved_jobs (candidate_id, job_id, created_at) unique pair; RLS: anon can manage own rows using same verified-mobile pattern as applications (mirror policy style from 006 migration).
2. UI: toggle on /jobs and /jobs/[id]; section on /profile.

Deliver: migration + types + UI + context/hook.
```

**Verify**

- Save/unsave; RLS isolation between candidates.

---

## Deferred: PRD §10 Future Enhancements

**Explicitly out of scope** for the current P-01–P-30 track — ignore `docs/prd.md` §10 until you schedule a follow-up. Items include notifications, bidirectional Sheets, analytics, multi-language, PWA, etc. When you adopt them, add **P-31+** tasks to this file using the same **Executor prompt** pattern.

---

## Version

- **implementation-prompts.md v2.1** — Adds **P-04** (optional Realtime OTP); renumbers former P-04–P-29 → P-05–P-30.
