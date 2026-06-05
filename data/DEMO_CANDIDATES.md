# Demo candidate profiles (60)

> **Not for Jobs bulk upload.** For job postings use [`demo-jobs-60.csv`](./demo-jobs-60.csv) and [`DEMO_JOBS.md`](./DEMO_JOBS.md).

Realistic mix-and-match pharma profiles for **Admin → Talent Pool** demos.

| Item | Value |
|------|--------|
| Count | 60 |
| Mobiles | `9900100001` – `9900100060` |
| Emails | `demo.profile.001@pharmaopenings.demo` … `060` |
| CSV preview | [`demo-candidates-60.csv`](./demo-candidates-60.csv) |

## Mix includes

- **QA / QC** — IPQA, QMS, validations, stability, micro
- **Production** — OSD (granulation, compression, coating), injectables (filling, lyophilization)
- **Packing, Engineering, R&D / FR&D / AR&D**
- **Regulatory, SCM, procurement, sales**
- **Freshers** and support functions (CSV IT QA, safety)
- **Modules** — OSD, API, Injectables, combinations (e.g. `OSD, API`)
- **Locations** — Ahmedabad, Hyderabad, Mumbai, Pune, Baddi, etc.
- **Qualifications** — B.Pharm, M.Pharm, B.Sc, M.Sc, PhD, D.Pharm, Diploma, ITI

## Commands

```bash
# Load into Supabase (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
npm run seed:demo-candidates

# Replace existing demo rows
npm run seed:demo-candidates -- --clean

# Regenerate CSV only
npm run seed:demo-candidates -- --export

# Preview without DB writes
npm run seed:demo-candidates -- --dry-run
```

Remove demo data:

```sql
DELETE FROM public.candidates
WHERE email LIKE 'demo.profile.%@pharmaopenings.demo';
```
