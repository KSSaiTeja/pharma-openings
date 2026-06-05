# Demo job postings (60)

Use this for **Admin → Jobs → Bulk upload CSV**, not the talent-pool candidate file.

| Item | Value |
|------|--------|
| File | [`demo-jobs-60.csv`](./demo-jobs-60.csv) |
| Headers | `Title,Location,Department,Type,Module,Qualification Needed,Description` |
| Count | 60 active-style postings (QA, QC, production, R&D, RA, sales, etc.) |

## Commands

```bash
# Write CSV + insert into Supabase
npm run seed:demo-jobs

# Wipe jobs then insert 60 demos again (you will still see 60 jobs)
npm run seed:demo-jobs -- --clean

# Delete every job and leave the list empty (keeps talent pool)
npm run reset:jobs

# Delete jobs + applications + all candidates
npm run reset:hiring-data

# Regenerate CSV only (no database)
npm run seed:demo-jobs -- --export
```

## Wrong file?

`demo-candidates-60.csv` is for **talent pool profiles**, not jobs. Uploading it on the Jobs tab will show a missing-columns error.
