# PharmaOpenings — Step-by-Step Cursor Prompts

> **How to use:** Open a **new Cursor chat window** for each step. Paste the prompt exactly. Wait for completion before moving to the next step. Each step is designed to be small, focused, and easily fixable.

---

## Phase 1: Database Schema & Foundation

---

### Step 1 of 14 — Create the `candidates` table

```
Create a new Supabase migration file to add a `candidates` table with the following columns:

- id: UUID, primary key, default gen_random_uuid()
- mobile: TEXT, UNIQUE, NOT NULL
- full_name: TEXT, NOT NULL
- email: TEXT, NOT NULL
- current_designation: TEXT, nullable
- current_department: TEXT, nullable
- current_company: TEXT, nullable
- highest_qualification: TEXT, NOT NULL
- preferred_modules: TEXT[] (array), NOT NULL
- resume_url: TEXT, nullable
- otp_verified: BOOLEAN, default false
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()

Also:
1. Enable Row Level Security (RLS) on the table.
2. Add these RLS policies:
   - "Anyone can insert a candidate" — allow INSERT for anon and authenticated roles.
   - "Candidates can read own record" — allow SELECT where mobile matches a request header or for authenticated users.
   - "Authenticated users can read all candidates" — allow SELECT for authenticated role.
   - "Candidates can update own record" — allow UPDATE for rows where id matches.
3. Create an `update_updated_at_column()` trigger function (if it doesn't exist) and attach it to this table.
4. Add an index on the `mobile` column.

Do NOT modify any existing tables. Only create the new `candidates` table.
```

---

### Step 2 of 14 — Modify the `jobs` table (add module + qualification_needed)

```
Create a Supabase migration to modify the existing `jobs` table:

1. Add a new column: `module` of type TEXT, NOT NULL, with a default value of 'Others'.
2. Add a new column: `qualification_needed` of type TEXT, NOT NULL, with a default value of 'Any'.

Do NOT drop or rename any existing columns. Do NOT modify RLS policies. Just add the two columns.

After the migration, update any TypeScript types file that references the jobs table to include these new fields — but ONLY if the types are manually maintained. If types are auto-generated from Supabase, skip this.
```

---

### Step 3 of 14 — Modify the `applications` table (link to candidates, add snapshot fields)

```
Create a Supabase migration to modify the existing `applications` table:

1. Add column: `candidate_id` UUID, nullable (we'll backfill later; new applications will require it).
2. Add column: `current_designation` TEXT, nullable.
3. Add column: `current_department` TEXT, nullable.
4. Add column: `current_company` TEXT, nullable.
5. Add column: `highest_qualification` TEXT, nullable.
6. Remove the `cover_letter` column if it exists (or leave it if the team wants to keep legacy data — your choice, but add a comment).
7. Add a foreign key from `candidate_id` to `candidates(id)`.

Update the RLS policies so that:
- Anyone (anon + authenticated) can INSERT into applications.
- Only authenticated users (admin) can SELECT all applications.
- Only authenticated users (admin) can UPDATE applications (for status changes).

Do NOT touch the `full_name`, `email`, `mobile`, or `resume_url` columns — keep them as-is for backward compatibility.
```

---

## Phase 2: Candidate Registration & OTP

---

### Step 4 of 14 — Create the OTP verification edge function

```
Create a new Supabase Edge Function at `supabase/functions/verify-otp/index.ts`.

This function handles a simple demo OTP flow:

**POST /verify-otp**
- Request body: { "mobile": "9876543210", "otp": "1234" }
- For demo purposes, the valid OTP is always "1234".
- Logic:
  1. Parse the request body for `mobile` and `otp`.
  2. If `otp !== "1234"`, return 400 with `{ error: "Invalid OTP" }`.
  3. If `otp === "1234"`, check if a candidate with this mobile already exists in the `candidates` table.
     - If exists: return 200 with `{ exists: true, candidate: <candidate row> }`.
     - If not exists: return 200 with `{ exists: false }`.
  4. Set `otp_verified = true` on the candidate row if it exists.

Use the Supabase service role key to query the database. Add proper CORS headers for the frontend to call this function. The function should import createClient from "https://esm.sh/@supabase/supabase-js@2".

Do NOT create any other files. Only this one edge function.
```

---

### Step 5 of 14 — Build the `/register` page UI

```
Create a new page component at `src/pages/Register.tsx` and add a route for `/register` in `src/App.tsx`.

The registration page has TWO steps:

**Step 1 — Mobile OTP Verification:**
- Input field for 10-digit mobile number (Indian format, validate length).
- "Send OTP" button → calls the `verify-otp` edge function (for now, just simulate sending).
- After clicking Send OTP, show an OTP input field (4 digits).
- "Verify" button → calls POST to the `verify-otp` edge function with { mobile, otp }.
- If OTP is valid and candidate exists → redirect to `/` (home) or to the redirect URL from query params.
- If OTP is valid and candidate does NOT exist → show Step 2 (profile form).
- Show a "Resend OTP" button with a 30-second countdown timer.

**Step 2 — Profile Form (shown only after OTP verified, candidate not found):**
- Fields:
  - Full Name (text, required, max 100 chars)
  - Email (email, required, validated format)
  - Mobile (text, read-only, pre-filled from Step 1)
  - Current Designation (text, optional)
  - Current Department (text, optional)
  - Current Company (text, optional)
  - Highest Qualification (dropdown, required): B.Pharm, M.Pharm, B.Sc, M.Sc, PhD, D.Pharm, ITI, Diploma, Other
  - Preferred Module (multi-select dropdown, required): API, Injectables, OSD, Others
  - Resume (file upload, optional, accept .pdf/.doc/.docx, max 5MB client-side validation)
- "Register" button → inserts into `candidates` table via Supabase client.
- On success → redirect to `/` or to `redirect` query param URL (e.g., `/apply/:jobId`).

**Styling:**
- Use shadcn/ui components (Input, Button, Label, Select).
- Mobile-first layout, max-w-md centered.
- Use existing design tokens from index.css / tailwind.config.ts.
- Use Framer Motion for step transitions (fade/slide).

**Important:**
- Use `react-hook-form` with `zod` for form validation.
- Store the verified mobile number in React state (not localStorage).
- Check for `redirect` query parameter: if present, redirect there after registration instead of home.
- Handle the edge case: if the candidate already exists after OTP, skip the form and go directly to home.
```

---

### Step 6 of 14 — Build the `/profile` page

```
Create a new page component at `src/pages/Profile.tsx` and add a route for `/profile` in `src/App.tsx`.

This page allows a registered candidate to view and edit their profile.

**How to identify the candidate:**
- For now, use a simple approach: store the candidate's mobile number in sessionStorage after successful OTP verification (set this in the Register page).
- On the Profile page, read the mobile from sessionStorage. If not found, redirect to `/register`.
- Fetch the candidate record from the `candidates` table using the mobile number.

**Page layout:**
1. **Profile header:** Show candidate name, mobile, email, and qualification badge.
2. **Editable form** (same fields as registration, except mobile is read-only):
   - Full Name, Email, Current Designation, Current Department, Current Company, Highest Qualification, Preferred Modules, Resume.
   - "Save Changes" button → updates the `candidates` table row.
   - Show toast on success: "Profile updated successfully."
3. **Application History section:**
   - Fetch applications from `applications` table where `candidate_id` matches.
   - Show as a list/cards: Job Title (from joined jobs table), Status badge, Date Applied.
   - If no applications: "You haven't applied to any jobs yet. Browse openings →"

**Styling:**
- Mobile-first, max-w-2xl centered.
- Use shadcn/ui Card, Badge, Separator components.
- Use existing design tokens.

**Important:**
- Use react-hook-form + zod for the edit form.
- The resume upload should allow re-upload (replace existing).
- Add a "Back to Jobs" link at the top.
```

---

## Phase 3: Job Listings & Filters

---

### Step 7 of 14 — Rebuild the homepage with advanced filters

```
Rewrite `src/pages/Index.tsx` to implement the full job listings page with advanced filters.

**Layout:**
- Top: Navigation bar with logo ("PharmaOpenings"), "Register / Login" button (links to /register), and if candidate is logged in (mobile in sessionStorage), show "My Profile" link instead.
- Below nav: Search bar (full-width, searches across job title, location, department, module).
- Filter button that opens a collapsible/slide-out filter panel.
- Job cards grid below.

**Filter Panel (collapsible sidebar or sheet on mobile):**
- Module: Multi-select checkboxes — API, Injectables, OSD, Others
- Location: Multi-select — dynamically populated from distinct locations in the jobs table
- Department: Multi-select — dynamically populated from distinct departments in the jobs table
- Job Type: Multi-select — Full-time, Part-time, Contract
- Qualification: Multi-select — B.Pharm, M.Pharm, B.Sc, M.Sc, PhD, D.Pharm, ITI, Diploma
- "Clear All Filters" button
- Show active filter count as a badge on the filter button

**Job Cards:**
- Each card shows: Title, Location, Department, Type badge, Module badge, Qualification Needed, Description (truncated to 2 lines), "Apply Now" button.
- "Apply Now" links to `/apply/:jobId`. If candidate is not registered (no mobile in sessionStorage), link to `/register?redirect=/apply/:jobId`.
- Default sort: newest first (by created_at DESC).

**Results Info:**
- Show "Showing X of Y jobs" above the grid.
- Results update in real-time as filters change (client-side filtering from fetched data, or re-query with filters).

**Empty States:**
- No jobs match filters: "No jobs match your filters. Try adjusting your criteria."
- No active jobs at all: "No openings currently. Register to be notified." with CTA button to /register.
- Below the job list (or in empty state): CTA banner — "Don't see a matching role? Register your profile and we'll reach out." linking to /register.

**Data fetching:**
- Fetch all active jobs (`is_active = true`) from the `jobs` table using Supabase client.
- Use @tanstack/react-query for data fetching with proper loading/error states.

**Styling:**
- Mobile-first responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop.
- Use shadcn/ui Sheet for mobile filter panel, or a collapsible div on desktop.
- Use shadcn/ui Badge, Card, Button, Input components.
- Existing design tokens from index.css.

**Pagination:**
- If more than 20 jobs, show pagination (simple "Load More" button or numbered pages).

Do NOT change any other pages. Only modify Index.tsx and App.tsx if needed.
```

---

## Phase 4: Application Flow

---

### Step 8 of 14 — Rebuild the `/apply/:jobId` page

```
Rewrite `src/pages/Apply.tsx` to implement the registration-first application flow.

**Pre-condition check:**
1. On page load, check if candidate is logged in (mobile in sessionStorage).
2. If NOT logged in → redirect to `/register?redirect=/apply/${jobId}`.
3. If logged in → fetch the candidate record from `candidates` table by mobile.
4. Also fetch the job details from `jobs` table by jobId (from URL params).

**Duplicate check:**
- Query `applications` table for existing application with same `candidate_id` + `job_id`.
- If duplicate found: show a message "You've already applied for this position on [date]." with a button to browse other jobs. Do NOT show the form.

**Job Details Card (top of page):**
- Show: Title, Location, Department, Module badge, Qualification Needed, Description (full).
- If job `is_active` is false: show banner "This position has been closed. Browse other openings →" and disable the form.

**Application Form (pre-filled from candidate profile):**
| Field | Pre-filled From | Editable |
|-------|----------------|----------|
| Full Name | candidate.full_name | No (read-only) |
| Email | candidate.email | No (read-only) |
| Mobile | candidate.mobile | No (read-only) |
| Current Designation | candidate.current_designation | Yes |
| Current Department | candidate.current_department | Yes |
| Current Company | candidate.current_company | Yes |
| Highest Qualification | candidate.highest_qualification | Yes (dropdown) |
| Module | job.module | No (read-only, from job) |
| Resume | candidate.resume_url (show current, allow re-upload) | Yes |

- NO cover letter field.
- "Submit Application" button.

**On Submit:**
1. Insert into `applications` table with:
   - job_id, candidate_id, full_name, email, mobile (from candidate)
   - current_designation, current_department, current_company, highest_qualification (from form — snapshot)
   - resume_url (from form or existing)
   - status: 'new'
2. On success: show a success screen with confetti or checkmark animation.
   - "Browse More Jobs" button → /
   - "View Profile" button → /profile
3. On error: show toast with error message.

**Styling:**
- Mobile-first, max-w-2xl centered.
- Use shadcn/ui components.
- Use Framer Motion for the success animation.

**Important:**
- Use react-hook-form + zod for validation.
- The qualification dropdown should have same options as registration.
- Resume re-upload should be optional — if not re-uploaded, use existing resume_url from profile.
```

---

## Phase 5: Admin Dashboard

---

### Step 9 of 14 — Admin Dashboard: Stats Overview

```
Modify `src/pages/AdminDashboard.tsx` to add a stats overview section at the top.

**Auth check:**
- On mount, check if user is authenticated via Supabase auth (supabase.auth.getSession()).
- If not authenticated, redirect to `/admin/login`.

**Stats Cards (top row, responsive grid):**
| Stat | Query |
|------|-------|
| Total Applications | COUNT(*) from applications |
| Active Jobs | COUNT(*) from jobs WHERE is_active = true |
| New Today | COUNT(*) from applications WHERE created_at >= today's start |
| Shortlisted | COUNT(*) from applications WHERE status = 'shortlisted' |
| Talent Pool | COUNT(*) from candidates WHERE id NOT IN (SELECT candidate_id FROM applications WHERE candidate_id IS NOT NULL) |
| This Week | COUNT(*) from applications WHERE created_at >= 7 days ago |

- Fetch all stats using Supabase client in a single useQuery hook (or multiple parallel queries).
- Show loading skeletons while fetching.
- Each stat card: icon, label, number value, subtle background color.

**Tab Navigation (below stats):**
- Three tabs: "Applications" | "Manage Jobs" | "Talent Pool"
- Use shadcn/ui Tabs component.
- For now, just render placeholder content in each tab: "Applications content coming next", etc.

**Styling:**
- Stats grid: 2 columns on mobile, 3 on tablet, 6 on desktop.
- Use shadcn/ui Card for stat cards.
- Clean, professional admin aesthetic.

Do NOT implement the tab contents yet — only the stats and tab structure.
```

---

### Step 10 of 14 — Admin Dashboard: Applications Tab

```
In `src/pages/AdminDashboard.tsx`, implement the "Applications" tab content.

**Applications Table:**
- Fetch all applications from `applications` table, joined with `jobs` table (for job title).
- Columns:
  1. # (row number)
  2. Candidate Name (full_name)
  3. Email
  4. Mobile
  5. Applied For (job title from joined jobs table)
  6. Module (from joined jobs table)
  7. Current Company
  8. Qualification (highest_qualification)
  9. Status — render as a dropdown (Select component) with options: New, Reviewed, Shortlisted, Rejected. Changing the dropdown updates the `applications` row status immediately via Supabase.
  10. Date Applied — formatted as "10 Apr 2026, 2:30 PM"
  11. Resume — if resume_url exists, show a "View" link that opens in new tab.

**Filters (above the table):**
- Search input: filters by name, email, or mobile (client-side filtering is fine).
- Status filter: multi-select dropdown — New, Reviewed, Shortlisted, Rejected.
- Job filter: dropdown of all jobs.
- Date range: simple "Last 7 days / Last 30 days / All" radio/select.

**Bulk Actions:**
- Checkbox on each row.
- "Select All" checkbox in header.
- When rows selected, show action bar: "Change Status to [dropdown]" button.
- Apply status change to all selected rows.

**Styling:**
- Use shadcn/ui Table, Select, Input, Checkbox, Badge components.
- Responsive: on mobile, show a card-based layout instead of table (or horizontal scroll).
- Status badges: New = blue, Reviewed = yellow, Shortlisted = green, Rejected = red.

**Important:**
- Use @tanstack/react-query for fetching and mutations.
- Invalidate query cache after status update.
- Show loading state while data loads.
- Paginate if more than 20 rows (show page numbers or "Load More").
```

---

### Step 11 of 14 — Admin Dashboard: Manage Jobs Tab

```
In `src/pages/AdminDashboard.tsx`, implement the "Manage Jobs" tab content.

**Job List:**
- Fetch ALL jobs (active + inactive) from `jobs` table.
- Display as a table or card grid with columns:
  - Title, Location, Department, Type, Module, Qualification Needed, Status (Active/Inactive toggle), Actions (Edit, Delete).

**Add Job Form (in a Dialog/Sheet):**
- "Add Job" button opens a modal/sheet with form:
  - Title (text, required)
  - Location (text, required)
  - Department (text, optional)
  - Type (dropdown: Full-time, Part-time, Contract — default Full-time)
  - Module (dropdown, required): API, Injectables, OSD, Others
  - Qualification Needed (dropdown, required): B.Pharm, M.Pharm, B.Sc, M.Sc, PhD, D.Pharm, ITI, Diploma, Any — default Any
  - Description (textarea, required)
- "Post Job" button → inserts into `jobs` table.
- On success: close modal, refetch jobs, show toast "Job posted successfully."

**Edit Job:**
- Click "Edit" on a job row → opens the same modal pre-filled with job data.
- "Save Changes" → updates the row in `jobs` table.

**Toggle Active/Inactive:**
- Toggle switch on each row. Updates `is_active` in DB immediately.
- Inactive jobs shown with reduced opacity or a badge.

**Delete Job:**
- Click "Delete" → confirmation dialog: "Are you sure? This will hide the job from candidates."
- On confirm: set `is_active = false` (soft delete, don't actually delete the row).

**Bulk CSV Upload:**
- "Upload CSV" button.
- File input accepts .csv files.
- Parse CSV client-side using a simple parser (split by comma, handle quoted fields).
- Expected columns: Title, Location, Department, Type, Module, Qualification Needed, Description.
- Also accept aliases: "Job Title" → Title, "Qualification" or "Qualification Required" → Qualification Needed.
- Validate each row: Title, Location, Description are required. Invalid module defaults to "Others". Invalid qualification defaults to "Any".
- Insert valid rows into `jobs` table in batches.
- Show result: "Uploaded 15 of 18 jobs. 3 rows skipped (missing required fields)."
- "Download Template" button → downloads a CSV file with the correct headers and 1 example row.

**Styling:**
- Use shadcn/ui Dialog, Table, Switch, Button, Textarea, Select components.
- Mobile-responsive layout.
- Use react-hook-form + zod for the add/edit job form.
```

---

### Step 12 of 14 — Admin Dashboard: Talent Pool Tab

```
In `src/pages/AdminDashboard.tsx`, implement the "Talent Pool" tab content.

**What is the Talent Pool?**
- Candidates who have registered (exist in `candidates` table) but have NOT submitted any application (no rows in `applications` where candidate_id matches).

**Talent Pool Table:**
- Fetch candidates from `candidates` table where the candidate's id is NOT in any application's candidate_id.
- Query: Select from candidates LEFT JOIN applications ON candidates.id = applications.candidate_id WHERE applications.id IS NULL.
- Columns:
  1. # (row number)
  2. Full Name
  3. Email
  4. Mobile
  5. Current Designation
  6. Current Company
  7. Highest Qualification (as badge)
  8. Preferred Modules (as badge list)
  9. Registered Date (formatted: "10 Apr 2026")
  10. Resume (view link if exists)

**Filters:**
- Search: by name, email, mobile (client-side).
- Module filter: multi-select — API, Injectables, OSD, Others.
- Qualification filter: multi-select dropdown.

**Styling:**
- Same table styling as Applications tab for consistency.
- Use shadcn/ui Table, Badge, Input, Select.
- Mobile-responsive.
- Empty state: "No candidates in the talent pool yet."
```

---

## Phase 6: Google Sheets Sync

---

### Step 13 of 14 — Google Sheets Sync Edge Function

```
Create a Supabase Edge Function at `supabase/functions/sync-to-sheets/index.ts`.

This edge function syncs application data and talent pool data to a Google Sheet.

**Function logic:**
1. Authenticate the request: check for a valid Supabase auth token in the Authorization header. Only allow authenticated (admin) users.
2. Read the `GOOGLE_SHEETS_SPREADSHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_KEY` from environment variables (Deno.env.get).
3. Fetch ALL applications from the `applications` table, joined with `jobs` (for job title, location) and `candidates` (for any missing profile data).
4. Fetch ALL talent pool candidates (candidates with no applications).
5. Format applications into rows matching these columns:
   Timestamp | Full Name | Email | Mobile | Current Designation | Current Dept | Current Company | Highest Qualification | Module | Applied For (Job Title) | Job Location | Status | Resume Link
6. Format talent pool into rows:
   Registered Date | Full Name | Email | Mobile | Current Designation | Current Dept | Current Company | Highest Qualification | Preferred Modules | Resume Link
7. Use the Google Sheets API v4:
   - Authenticate using the service account JSON key.
   - Clear the "Applications" sheet (Sheet1).
   - Write all application rows.
   - Clear the "Talent Pool" sheet (Sheet2).
   - Write all talent pool rows.
8. Return JSON: { success: true, applications_synced: <count>, talent_pool_synced: <count> }
9. On error: return { success: false, error: <message> }

**CORS:** Add proper CORS headers.

**Google Auth helper:**
- Parse the service account JSON key.
- Create a JWT signed with the private key.
- Exchange for an access token via Google OAuth2.
- Use the access token for Sheets API calls.

**Important:**
- Use fetch() for Google API calls (no npm packages needed in Deno).
- Handle Google API rate limits with a simple retry (max 2 retries with 1s delay).
- If the sheet doesn't exist, return an error asking admin to create the spreadsheet first.

Do NOT create any frontend code in this step. Only the edge function.
```

---

### Step 14 of 14 — Add "Sync to Google Sheets" button to Admin Dashboard

```
In `src/pages/AdminDashboard.tsx`, add a "Sync to Google Sheets" button.

**Placement:**
- In the stats overview area or as a floating action button — visible on all tabs.
- Or place it in both the Applications tab and Talent Pool tab headers.

**Button behavior:**
1. On click, show a loading state (spinner + "Syncing..." text).
2. Disable the button during sync to prevent double-clicks.
3. Call the edge function: POST to `${SUPABASE_URL}/functions/v1/sync-to-sheets` with the user's auth token in the Authorization header.
4. On success: show toast "Synced {X} applications and {Y} talent pool entries to Google Sheets."
5. On error: show toast with error message (variant: destructive).
6. Re-enable button after response.

**Get the auth token:**
- Use `supabase.auth.getSession()` to get the current session's access_token.
- Pass it as `Authorization: Bearer <token>` header.

**Styling:**
- Use shadcn/ui Button with an icon (e.g., Sheet icon from lucide-react, or FileSpreadsheet).
- Green accent color to match Google Sheets branding.

Do NOT modify the edge function. Only add the frontend button and API call.
```

---

## Post-Implementation Checklist

After completing all 14 steps, verify:

- [ ] Candidate can register with mobile + OTP (demo code: 1234)
- [ ] Candidate profile is saved and editable at `/profile`
- [ ] Homepage shows job listings with advanced filters (module, location, qualification, type)
- [ ] "Apply Now" redirects to registration if not logged in
- [ ] Application form pre-fills from candidate profile, no cover letter field
- [ ] Duplicate application is blocked with a message
- [ ] Admin login works at `/admin/login`
- [ ] Admin dashboard shows stats overview
- [ ] Applications tab: table with search, filters, status dropdown, bulk actions
- [ ] Manage Jobs tab: add/edit/delete jobs, CSV upload, toggle active
- [ ] Talent Pool tab: registered candidates without applications
- [ ] "Sync to Google Sheets" button calls the edge function
- [ ] All pages are mobile-responsive
- [ ] All forms use zod validation

---

*Generated from PharmaOpenings PRD v2.0 — April 2026*
