
# PharmaOpenings — Product Requirements Document (PRD)

**Version:** 2.0  
**Date:** April 10, 2026  
**Author:** Lovable AI + PharmaOpenings Team  
**Status:** Draft for Review  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)  
2. [Vision & Goals](#2-vision--goals)  
3. [User Personas](#3-user-personas)  
4. [Information Architecture](#4-information-architecture)  
5. [Feature Specifications](#5-feature-specifications)  
   - 5.1 [Candidate Registration & Profile](#51-candidate-registration--profile)  
   - 5.2 [Job Listings & Advanced Filters](#52-job-listings--advanced-filters)  
   - 5.3 [Job Application Flow](#53-job-application-flow)  
   - 5.4 [Admin Dashboard](#54-admin-dashboard)  
   - 5.5 [Job Management (Admin)](#55-job-management-admin)  
   - 5.6 [Google Sheets Sync](#56-google-sheets-sync)  
   - 5.7 [Candidate Talent Pool (Passive Registration)](#57-candidate-talent-pool-passive-registration)  
6. [Database Schema](#6-database-schema)  
7. [User Flows (Detailed)](#7-user-flows-detailed)  
8. [Edge Cases & Error Handling](#8-edge-cases--error-handling)  
9. [Non-Functional Requirements](#9-non-functional-requirements)  
10. [Future Enhancements (Phase 2+)](#10-future-enhancements-phase-2)  
11. [Appendix](#11-appendix)  

---

## 1. Executive Summary

PharmaOpenings is a mobile-first pharmaceutical recruitment portal designed to connect pharma companies with qualified candidates across API, Injectables, OSD, and other manufacturing modules. The platform enables candidates to register via mobile OTP, build a profile, browse and apply for jobs with advanced filters, and allows admins to manage the entire pipeline — with real-time sync to Google Sheets for operational simplicity.

### What Makes This World-Class

- **Registration-first model:** Captures candidate data even when no suitable job exists today, building a talent pool.
- **Module-based taxonomy:** Pharma-specific categorization (API, Injectables, OSD, Others) for precise matching.
- **Zero-friction apply:** OTP-verified, no passwords, auto-fill from profile — apply in under 60 seconds.
- **Google Sheets as operational backend:** No need for the admin to learn a new tool; data lives where they already work.
- **Bulk job management:** Upload 100+ jobs via CSV template in seconds.

---

## 2. Vision & Goals

### Vision
Become the go-to recruitment platform for India's pharmaceutical manufacturing sector, where both candidates and recruiters experience zero friction.

### Goals

| Goal | Metric | Target |
|------|--------|--------|
| Candidate conversion | Registration → Application rate | >60% |
| Time to apply | From job click to submission | <90 seconds |
| Admin efficiency | Time to review an application | <30 seconds |
| Talent pool growth | Registered candidates without active application | 500+ in 6 months |
| Data accuracy | Google Sheets sync reliability | 99.9% |

---

## 3. User Personas

### Persona 1: Candidate — Rajesh (28, QC Analyst)
- **Context:** Works in an API manufacturing plant in Hyderabad. Browsing for better opportunities on mobile during commute.
- **Pain points:** Hates creating accounts with passwords. Wants to apply quickly. Wants to know if his module/qualification matches.
- **Needs:** OTP login, auto-fill profile on repeat visits, filter by module & location.

### Persona 2: Candidate — Priya (24, Fresh M.Pharm Graduate)
- **Context:** Just completed M.Pharm. No current designation. Wants to register and be considered for future openings.
- **Pain points:** No relevant jobs posted right now. Doesn't want to lose the opportunity to be in the pipeline.
- **Needs:** Register profile, get notified when matching jobs appear, talent pool registration.

### Persona 3: Admin — Suresh (HR Manager)
- **Context:** Manages recruitment for 3 pharma plants. Lives in Google Sheets. Needs to post jobs, review applications, and sync data.
- **Pain points:** Manual data entry. Inconsistent application formats. No centralized talent pool.
- **Needs:** Bulk upload jobs, one-click sync to Sheets, advanced filters, status management.

---

## 4. Information Architecture

```
PharmaOpenings
├── / (Home — Job Listings)
│   ├── Search bar
│   ├── Advanced Filters panel
│   │   ├── Module (API / Injectables / OSD / Others)
│   │   ├── Location
│   │   ├── Department
│   │   ├── Job Type (Full-time / Contract / Part-time)
│   │   └── Qualification Required
│   ├── Job cards (filterable, sortable)
│   └── "No matching jobs? Register anyway" CTA
│
├── /register (Candidate Registration)
│   ├── Mobile OTP verification
│   ├── Profile form (name, email, designation, dept, company, qualification, module, resume)
│   └── Redirect to job listing or application
│
├── /profile (Candidate Profile — post-registration)
│   ├── View / Edit profile
│   ├── Application history
│   └── Saved jobs
│
├── /apply/:jobId (Job Application)
│   ├── Job details card
│   ├── Pre-filled form from profile
│   ├── Additional fields (if any)
│   └── Submit
│
├── /admin/login (Admin Login)
│
├── /admin (Admin Dashboard)
│   ├── Stats overview
│   ├── Applications tab
│   │   ├── Table view with search, filters, sort
│   │   ├── Status management (New / Reviewed / Shortlisted / Rejected)
│   │   └── Sync to Google Sheets button
│   ├── Jobs tab
│   │   ├── Add Job (with qualification_needed field)
│   │   ├── Bulk Upload CSV
│   │   ├── Download Template
│   │   ├── Toggle active/inactive
│   │   └── Edit / Delete jobs
│   └── Talent Pool tab
│       ├── Registered candidates without applications
│       ├── Filter by module, qualification, location
│       └── Sync to Google Sheets
```

---

## 5. Feature Specifications

### 5.1 Candidate Registration & Profile

#### Registration Flow
1. User lands on `/register` (via CTA on homepage or redirect from `/apply/:jobId`).
2. Enters **mobile number**.
3. Receives OTP → verifies (demo: code `1234`).
4. Fills profile form:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full Name | Text | ✅ | Max 100 chars |
| Email | Email | ✅ | Validated format |
| Mobile | Text | ✅ | Auto-filled post-OTP, read-only |
| Current Designation | Text | ❌ | e.g. "QC Analyst", "Production Officer" |
| Current Department | Text | ❌ | e.g. "Quality Control", "Production" |
| Current Company | Text | ❌ | e.g. "Sun Pharma", "Dr. Reddy's" |
| Highest Qualification | Dropdown | ✅ | B.Pharm / M.Pharm / B.Sc / M.Sc / PhD / D.Pharm / ITI / Diploma / Other |
| Preferred Module | Multi-select Dropdown | ✅ | API / Injectables / OSD / Others |
| Resume | File Upload | ❌ | PDF/DOC, max 5MB |

5. Profile saved → redirected to job listings (or back to the job they were trying to apply for).

#### Edge Cases
- **User tries to register with an already-registered mobile:** Show "Already registered. Login instead?" with OTP re-verification.
- **User abandons registration mid-way:** Save partial data; allow completion on next visit.
- **Invalid file type for resume:** Show error immediately, don't allow submission.
- **Network failure during OTP send:** Show retry button with countdown timer (30s).

#### Profile Management
- Registered candidates can update their profile at `/profile`.
- Profile data auto-fills future job applications.
- Application history visible on profile page.

---

### 5.2 Job Listings & Advanced Filters

#### Homepage Job Listing
- All active jobs displayed as cards with: Title, Location, Department, Type, Module, Qualification Required, Description (truncated).
- Default sort: Newest first.
- Quick search bar: searches across title, location, department, module.

#### Advanced Filter Panel
Collapsible/slide-out filter panel with:

| Filter | Type | Options |
|--------|------|---------|
| Module | Multi-select checkboxes | API, Injectables, OSD, Others |
| Location | Multi-select or search | Dynamic from posted jobs |
| Department | Multi-select | Dynamic from posted jobs |
| Job Type | Multi-select | Full-time, Part-time, Contract |
| Qualification | Multi-select | B.Pharm, M.Pharm, B.Sc, M.Sc, PhD, D.Pharm, ITI, Diploma |
| Posted Date | Date range / presets | Last 7 days, 30 days, All |

#### Filter Results View
- Results update in real-time as filters are applied.
- Show active filter count badge on filter button.
- "Clear all filters" button.
- Result count displayed: "Showing 12 of 45 jobs".
- Empty state: "No jobs match your filters. Try adjusting your criteria or [Register for future openings →]"

#### Edge Cases
- **No jobs match any filter combination:** Show helpful empty state with CTA to register.
- **All jobs inactive:** Show "No openings currently. Register to be notified."
- **Extremely long job list (100+):** Implement pagination or infinite scroll (20 per page).

---

### 5.3 Job Application Flow

#### Pre-condition
Candidate **must be registered** before applying. If not registered, redirect to `/register` with a return URL.

#### Application Form (Pre-filled from profile)

| Field | Source | Editable |
|-------|--------|----------|
| Full Name | Profile | No |
| Email | Profile | No |
| Mobile | Profile | No |
| Current Designation | Profile | Yes |
| Current Department | Profile | Yes |
| Current Company | Profile | Yes |
| Highest Qualification | Profile | Yes |
| Module applying for | Job's module (pre-selected) | No |
| Resume | Profile (re-upload optional) | Yes |

**Removed:** Cover Letter field (per requirements).

#### Flow
1. Candidate clicks "Apply Now" on a job card.
2. **If not registered:** Redirect to `/register?redirect=/apply/:jobId`.
3. **If registered:** Show application form with pre-filled data.
4. Candidate reviews, optionally updates resume.
5. Clicks "Submit Application".
6. Success screen with confirmation.
7. Application saved in DB + queued for Google Sheets sync.

#### Edge Cases
- **Duplicate application:** Check if candidate already applied for this job. Show "You've already applied for this position on [date]."
- **Job becomes inactive while user is filling form:** On submit, check `is_active`. Show "This position has been closed. Browse other openings."
- **Resume upload fails (network):** Allow submission without resume; show warning "Application submitted without resume. You can upload it from your profile."
- **Candidate updates profile after applying:** Previous applications retain original data; new applications use updated data.

---

### 5.4 Admin Dashboard

#### Stats Overview
| Stat | Calculation |
|------|-------------|
| Total Applications | Count of all applications |
| Active Jobs | Count of jobs where `is_active = true` |
| New Today | Applications with `created_at = today` |
| Shortlisted | Applications with `status = 'shortlisted'` |
| Talent Pool | Registered candidates with 0 applications |
| This Week | Applications in last 7 days |

#### Applications Tab

**Table View** with columns:
| Column | Notes |
|--------|-------|
| # | Row number |
| Candidate Name | Clickable → expand details |
| Email | |
| Mobile | |
| Applied For (Job Title) | |
| Module | |
| Current Company | |
| Qualification | |
| Status | Dropdown: New / Reviewed / Shortlisted / Rejected |
| Date Applied | Formatted: "10 Apr 2026, 2:30 PM" |
| Resume | Download/view link |

**Filters for Applications:**
- Status filter (multi-select)
- Job filter (which job)
- Module filter
- Date range
- Search (name, email, mobile)

**Bulk Actions:**
- Select multiple → Change status
- Select multiple → Export selected to CSV

#### Talent Pool Tab (New)
- Shows registered candidates who haven't applied to any job.
- Same table format with profile fields.
- Admin can tag/note candidates.
- Filterable by module, qualification, location.

---

### 5.5 Job Management (Admin)

#### Add Job Form

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | Text | ✅ | e.g. "QC Analyst" |
| Location | Text | ✅ | e.g. "Hyderabad" |
| Department | Text | ❌ | e.g. "Quality Control" |
| Type | Dropdown | ❌ | Full-time (default) / Part-time / Contract |
| Module | Dropdown | ✅ | API / Injectables / OSD / Others |
| Qualification Needed | Dropdown | ✅ | B.Pharm / M.Pharm / B.Sc / M.Sc / PhD / D.Pharm / ITI / Diploma / Any |
| Description | Rich Text/Textarea | ✅ | Job responsibilities & requirements |

#### Edit / Delete / Toggle Active
- Each job card has: Edit (opens form), Delete (with confirmation), Toggle Active/Inactive.
- Inactive jobs are hidden from candidates but retained in DB.

#### Bulk Upload CSV

**Template columns:**
```
Title, Location, Department, Type, Module, Qualification Needed, Description
```

**Supported aliases:**
- "Job Title" → Title
- "Qualification" / "Qualification Required" → Qualification Needed

**Validation:**
- Title, Location, Description are required per row.
- Invalid module values default to "Others".
- Invalid qualification values default to "Any".
- Report: "Uploaded 15 of 18 rows. 3 rows skipped (missing required fields)."

#### Edge Cases
- **Duplicate job title + location:** Allow (same role in same city is valid for different shifts/teams).
- **CSV with BOM characters:** Strip BOM before parsing.
- **CSV with extra columns:** Ignore unknown columns gracefully.
- **Very large CSV (1000+ rows):** Batch insert in chunks of 50, show progress.

---

### 5.6 Google Sheets Sync

#### Architecture
- **One-way sync:** Platform → Google Sheets (not bidirectional).
- **Trigger:** Manual "Sync" button click on admin dashboard.
- **Two sheets in one spreadsheet:**
  1. `Applications` — All application data.
  2. `Talent Pool` — Registered candidates without applications.

#### Applications Sheet Columns
```
Timestamp | Full Name | Email | Mobile | Current Designation | Current Dept | Current Company | Highest Qualification | Module | Applied For (Job Title) | Job Location | Status | Resume Link
```

#### Talent Pool Sheet Columns
```
Registered Date | Full Name | Email | Mobile | Current Designation | Current Dept | Current Company | Highest Qualification | Preferred Modules | Resume Link
```

#### Sync Behavior
1. Admin clicks "Sync to Google Sheets" button.
2. Edge function triggered.
3. Fetches all data from respective tables.
4. Clears existing sheet data (full replace strategy for consistency).
5. Writes all rows.
6. Returns success/failure count.
7. Toast notification: "Synced 142 applications and 56 talent pool entries to Google Sheets."

#### Edge Cases
- **Google API rate limit:** Implement exponential backoff with max 3 retries.
- **Sheet deleted manually:** Re-create sheet on next sync, notify admin.
- **Network timeout during sync:** Show "Sync partially completed. Try again."
- **No data to sync:** Show "No data to sync yet."
- **Concurrent sync clicks:** Debounce — disable button during sync with loading state.

#### Setup Requirements
- Google Sheets connector linked via Lovable Cloud.
- Sheet ID stored as environment variable.
- Service account or OAuth token for write access.

---

### 5.7 Candidate Talent Pool (Passive Registration)

#### Concept
When a candidate visits the platform and no suitable job is available, they should still be able to **register their profile** for future consideration. This builds a talent pipeline.

#### Flow
1. Candidate browses jobs → no suitable match found.
2. Sees CTA: "Don't see a matching role? Register your profile and we'll reach out when the right opportunity comes."
3. Clicks → goes to `/register`.
4. Completes registration (same flow as 5.1).
5. Profile saved in `candidates` table.
6. No application created — just a profile entry.
7. Admin sees them in "Talent Pool" tab.

#### Value Proposition
- **For candidates:** "Your profile is saved. When a matching job is posted, you'll be the first to know."
- **For admin:** Access to pre-qualified candidates when a new position opens. Filter by module + qualification to find matches instantly.

---

## 6. Database Schema

### Tables

#### `candidates` (NEW — Registered Users)
```
id              UUID    PK, auto-generated
mobile          TEXT    UNIQUE, NOT NULL
full_name       TEXT    NOT NULL
email           TEXT    NOT NULL
current_designation TEXT    NULLABLE
current_department  TEXT    NULLABLE
current_company     TEXT    NULLABLE
highest_qualification TEXT  NOT NULL
preferred_modules   TEXT[]  NOT NULL (array of: API, Injectables, OSD, Others)
resume_url      TEXT    NULLABLE
otp_verified    BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `jobs` (MODIFIED)
```
id              UUID    PK, auto-generated
title           TEXT    NOT NULL
location        TEXT    NOT NULL
description     TEXT    NOT NULL
department      TEXT    NULLABLE
type            TEXT    DEFAULT 'Full-time'
module          TEXT    NOT NULL (API / Injectables / OSD / Others)
qualification_needed TEXT NOT NULL DEFAULT 'Any'
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `applications` (MODIFIED)
```
id              UUID    PK, auto-generated
job_id          UUID    FK → jobs.id, NOT NULL
candidate_id    UUID    FK → candidates.id, NOT NULL
current_designation TEXT    (snapshot from profile at time of apply)
current_department  TEXT    (snapshot)
current_company     TEXT    (snapshot)
highest_qualification TEXT  (snapshot)
resume_url      TEXT    NULLABLE
status          TEXT    DEFAULT 'new'
created_at      TIMESTAMPTZ DEFAULT now()
```

> **Note:** Application stores a **snapshot** of candidate data at the time of application. If the candidate updates their profile later, historical applications retain original data.

### RLS Policies

| Table | Operation | Rule |
|-------|-----------|------|
| candidates | INSERT | Anyone (anon + authenticated) |
| candidates | SELECT own | candidate can read own record (by mobile match or auth) |
| candidates | UPDATE own | candidate can update own record |
| candidates | SELECT all | authenticated (admin) can read all |
| jobs | SELECT (active) | public |
| jobs | ALL | authenticated (admin) |
| applications | INSERT | Anyone (with valid candidate_id + job_id) |
| applications | SELECT all | authenticated (admin) |
| applications | UPDATE | authenticated (admin) — status changes |

---

## 7. User Flows (Detailed)

### Flow 1: New Candidate → Register → Browse → Apply

```
[Landing Page] 
    → "Register / Login" (top nav)
    → [/register]
        → Enter mobile → Send OTP → Verify
        → Fill profile form
        → Submit → Profile saved
    → [/ (Home)] 
        → Browse jobs → Use filters
        → Click "Apply Now" on a job
    → [/apply/:jobId]
        → Form pre-filled from profile
        → Review → Submit
    → [Success Screen]
        → "Browse More Jobs" / "View Profile"
```

### Flow 2: Returning Candidate → Auto-Login → Apply

```
[Landing Page]
    → "Login" → Enter mobile → OTP → Verified
    → Profile loaded from DB
    → Browse → Apply (pre-filled)
    → Submit → Done
```

### Flow 3: Candidate → No Matching Job → Register for Talent Pool

```
[Landing Page]
    → Browse jobs → No match
    → See CTA: "Register for future openings"
    → [/register]
    → Complete profile
    → [Success] "We'll reach out when a matching role opens!"
    → Profile in Talent Pool (no application created)
```

### Flow 4: Admin → Bulk Upload Jobs → Review Applications → Sync

```
[/admin/login] → Email + Password → Dashboard
    → "Manage Jobs" tab
        → Download CSV template
        → Fill in 50 jobs
        → Upload CSV → "50 jobs uploaded!"
    → "Applications" tab
        → Search/filter applications
        → Change status: New → Reviewed → Shortlisted
    → Click "Sync to Google Sheets"
        → "142 applications synced!"
    → Open Google Sheets → All data there
```

### Flow 5: Admin → Add Single Job with Qualification

```
[/admin] → "Manage Jobs" → "Add Job"
    → Fill: Title, Location, Module (dropdown: API), 
      Qualification Needed (dropdown: M.Pharm), Description
    → Post → Job live on homepage
    → Candidates filtered by module/qualification see it
```

---

## 8. Edge Cases & Error Handling

### Registration & Auth

| Scenario | Handling |
|----------|----------|
| OTP expires (5 min) | Show "OTP expired. Click Resend." |
| Wrong OTP 3 times | Lock for 5 minutes. Show countdown. |
| Mobile already registered | "Already registered. Verify to login." |
| Network fails during OTP | Retry button with 30s cooldown |
| Browser back during OTP flow | Preserve state; don't reset form |
| User refreshes during registration | Preserve entered data via sessionStorage |

### Application

| Scenario | Handling |
|----------|----------|
| Job deactivated during form fill | Show banner: "This job is no longer active." Prevent submit. |
| Duplicate application (same candidate + job) | Block with: "You applied on [date]. View your applications." |
| Resume upload network failure | Allow submit without resume, show warning |
| File too large (>5MB) | Client-side check, show error before upload attempt |
| Invalid file type | Accept only .pdf, .doc, .docx — validate on select |
| Session expired mid-application | Save form to sessionStorage, re-auth, restore form |

### Admin

| Scenario | Handling |
|----------|----------|
| CSV with wrong encoding | Detect and handle UTF-8 BOM, Latin-1 |
| CSV with missing required columns | Show specific error: "Missing 'Title' column" |
| CSV with 0 valid rows | "No valid rows found. Check template format." |
| Google Sheets API down | "Sync failed. Google services unavailable. Retry later." |
| Admin session expires | Redirect to login, preserve current tab/state |
| Concurrent admin edits | Last-write-wins (acceptable for MVP) |
| Delete job with existing applications | Soft delete (set `is_active = false`). Applications retained. |

### Data Integrity

| Scenario | Handling |
|----------|----------|
| Candidate updates profile | Future applications use new data; past applications unchanged |
| Admin changes application status | Log timestamp of status change (audit trail) |
| Google Sheets out of sync | Full replace on each sync ensures consistency |
| Database constraint violation | Show user-friendly error, log technical details |

---

## 9. Non-Functional Requirements

### Performance
- **Page load:** <2s on 3G mobile connection.
- **Job search/filter:** <500ms response time.
- **Application submission:** <3s including file upload.
- **Google Sheets sync:** <30s for 500 rows.

### Security
- **OTP verification:** Required for all candidate interactions.
- **Admin auth:** Email + password with session management.
- **RLS policies:** All database tables protected.
- **File uploads:** Server-side validation (type + size).
- **Input sanitization:** All user inputs validated with Zod schemas.
- **HTTPS only:** All traffic encrypted.
- **No PII in URLs:** Candidate data never in query params.

### Accessibility
- **WCAG 2.1 AA** compliance.
- Keyboard navigable forms.
- Screen reader compatible.
- Minimum contrast ratio 4.5:1.
- Focus indicators on all interactive elements.

### Mobile-First
- Primary design target: 360px–414px width (Android/iOS).
- Touch targets: minimum 44x44px.
- Thumb-friendly layouts — primary actions at bottom.
- Responsive breakpoints: 360, 768, 1024, 1440.

### SEO
- Semantic HTML (H1, H2, etc.).
- Meta descriptions per page.
- JSON-LD structured data for job postings (`JobPosting` schema).
- Sitemap for active job URLs.
- OG tags for social sharing.

### Scalability
- Designed for 10,000+ candidates, 500+ jobs.
- Paginated queries (20 items per page).
- Indexed database columns for search/filter.

---

## 10. Future Enhancements (Phase 2+)

### Candidate Experience
1. **Email/WhatsApp notifications:** Alert candidates when a matching job is posted (based on module + qualification).
2. **Application tracking:** Candidates see real-time status of their applications.
3. **Job alerts subscription:** Candidates subscribe to alerts for specific modules/locations.
4. **Saved jobs:** Bookmark jobs to apply later.
5. **Profile completeness score:** Gamify profile completion with a progress bar.

### Admin Features
6. **Bidirectional Google Sheets sync:** Changes in Sheets reflect in platform.
7. **Analytics dashboard:** Application funnel, conversion rates, time-to-fill metrics.
8. **Email templates:** Send templated emails to shortlisted/rejected candidates from dashboard.
9. **Interview scheduling:** Built-in calendar integration for scheduling interviews.
10. **Role-based admin access:** Multiple admin users with different permissions (viewer, editor, super-admin).
11. **Automated screening:** AI-based resume parsing to auto-match candidates with jobs based on qualification + module + experience.
12. **Audit log:** Full trail of all admin actions (status changes, job edits, etc.).

### Platform
13. **Multi-language support:** Hindi, Telugu, Tamil for regional pharma candidates.
14. **PWA (Progressive Web App):** Install on mobile home screen, offline job browsing.
15. **API for integration:** REST API for third-party job boards to pull active listings.
16. **Custom domain email:** careers@pharmaopenings.com for automated candidate communications.
17. **Resume parser:** Auto-extract designation, company, qualification from uploaded resumes using AI.

### Data & Intelligence
18. **Candidate scoring:** Score candidates based on match % with job requirements.
19. **Duplicate detection:** Flag duplicate candidates (same mobile/email registered multiple times).
20. **Heatmap analytics:** Which jobs get most views vs. applications (identify listing quality issues).

---

## 11. Appendix

### A. Module Definitions

| Module | Description | Example Roles |
|--------|-------------|---------------|
| **API** | Active Pharmaceutical Ingredients manufacturing | Process Chemist, QC Analyst, Production Officer, R&D Scientist |
| **Injectables** | Sterile injectable drug manufacturing | Aseptic Processing Operator, QA Executive, Filling Machine Operator |
| **OSD** | Oral Solid Dosage forms (tablets, capsules) | Tablet Compression Operator, Coating Operator, QC Analyst, Packing Supervisor |
| **Others** | All other pharma manufacturing (topicals, liquids, biologics, packaging, warehousing) | Warehouse Executive, Packaging Supervisor, Microbiology Analyst |

### B. Qualification Hierarchy

```
PhD > M.Pharm > M.Sc > B.Pharm > B.Sc > D.Pharm > Diploma > ITI > Other
```

### C. Application Status Workflow

```
New → Reviewed → Shortlisted → Interview Scheduled (Phase 2) → Offered (Phase 2)
                → Rejected
```

### D. Google Sheets Sync — Technical Architecture

```
[Admin clicks "Sync"]
    → Frontend calls Edge Function: /sync-to-sheets
    → Edge Function:
        1. Authenticates with Google Sheets API (service account)
        2. Fetches all applications + candidates from DB
        3. Formats into rows
        4. Clears existing sheet data
        5. Batch writes all rows (Google Sheets API batchUpdate)
        6. Returns { success: true, applications_synced: 142, talent_pool_synced: 56 }
    → Frontend shows toast notification
```

### E. CSV Template (Bulk Upload)

```csv
Title,Location,Department,Type,Module,Qualification Needed,Description
"QC Analyst","Hyderabad","Quality Control","Full-time","API","M.Sc","Responsible for quality testing of API products."
"Production Officer","Vizag","Production","Full-time","Injectables","B.Pharm","Manage aseptic production line for injectable drugs."
"Packing Supervisor","Baddi","Packaging","Full-time","OSD","Diploma","Supervise packaging operations for OSD products."
```

### F. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Animation | Framer Motion |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL |
| Auth | OTP (Mobile) + Email/Password (Admin) |
| File Storage | Lovable Cloud Storage (Supabase Storage) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Google Sheets | Google Sheets API v4 via Connector Gateway |
| Deployment | Lovable Cloud (Vercel-compatible CDN) |

### G. Acceptance Criteria Checklist

- [x] Candidate can register with mobile OTP and fill profile
- [x] Candidate can browse jobs with advanced filters (module, location, qualification, type)
- [x] Candidate must register before applying
- [x] Application form has: designation, department, company, qualification, module — NO cover letter
- [x] Jobs have module dropdown (API, Injectables, OSD, Others)
- [x] Jobs have qualification_needed field
- [x] Admin can add single job with all new fields
- [x] Admin can bulk upload jobs via CSV with new columns
- [x] Admin can view all applications in table format
- [x] Admin can filter/search applications
- [x] Admin can change application status
- [x] Talent pool: registered candidates without applications visible to admin
- [x] "Sync to Google Sheets" button syncs all applications + talent pool data
- [x] Google Sheets has correct columns and formatted data
- [x] Mobile-responsive on all screens
- [x] OTP verification works end-to-end
- [x] Duplicate application prevention works
- [x] Filter results view shows count and active filters

---

*This PRD is a living document. Reflects all requested features, existing functionality, and recommended enhancements for a world-class pharmaceutical recruitment platform.*
