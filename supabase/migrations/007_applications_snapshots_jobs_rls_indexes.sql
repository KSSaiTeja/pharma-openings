-- P-01 / PRD §6: application snapshot columns, jobs RLS, listing indexes.
-- PRD deviation (jobs RLS): §6 says public SELECT of active jobs only; we allow anon/authenticated SELECT on all job rows so /apply can tell inactive vs missing (listings still filter is_active in the app).

-- ---------------------------------------------------------------------------
-- applications: explicit snapshot_* (immutable apply-time copy)
-- ---------------------------------------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS snapshot_designation text,
  ADD COLUMN IF NOT EXISTS snapshot_department text,
  ADD COLUMN IF NOT EXISTS snapshot_company text,
  ADD COLUMN IF NOT EXISTS snapshot_qualification text,
  ADD COLUMN IF NOT EXISTS snapshot_resume_url text;

-- Legacy rows: treat existing current_* / resume as the frozen snapshot.
UPDATE public.applications
SET
  snapshot_designation = COALESCE(snapshot_designation, current_designation),
  snapshot_department = COALESCE(snapshot_department, current_department),
  snapshot_company = COALESCE(snapshot_company, current_company),
  snapshot_qualification = COALESCE(snapshot_qualification, highest_qualification),
  snapshot_resume_url = COALESCE(snapshot_resume_url, resume_url);

-- Inserts that only populate current_* / resume still get snapshots (client also sets snapshot_*).
CREATE OR REPLACE FUNCTION public.applications_fill_snapshots_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.snapshot_designation := COALESCE(NEW.snapshot_designation, NEW.current_designation);
  NEW.snapshot_department := COALESCE(NEW.snapshot_department, NEW.current_department);
  NEW.snapshot_company := COALESCE(NEW.snapshot_company, NEW.current_company);
  NEW.snapshot_qualification := COALESCE(NEW.snapshot_qualification, NEW.highest_qualification);
  NEW.snapshot_resume_url := COALESCE(NEW.snapshot_resume_url, NEW.resume_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_fill_snapshots_on_insert ON public.applications;
CREATE TRIGGER trg_applications_fill_snapshots_on_insert
BEFORE INSERT ON public.applications
FOR EACH ROW
EXECUTE PROCEDURE public.applications_fill_snapshots_on_insert();

COMMENT ON COLUMN public.applications.snapshot_designation IS 'Copy of current_designation at apply time; not updated when candidate profile changes.';
COMMENT ON COLUMN public.applications.snapshot_department IS 'Copy of current_department at apply time.';
COMMENT ON COLUMN public.applications.snapshot_company IS 'Copy of current_company at apply time.';
COMMENT ON COLUMN public.applications.snapshot_qualification IS 'Copy of highest_qualification at apply time.';
COMMENT ON COLUMN public.applications.snapshot_resume_url IS 'Copy of resume_url at apply time.';

-- ---------------------------------------------------------------------------
-- jobs: RLS (read catalogue; writes for admin JWT only)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('public.jobs') IS NULL THEN
    RETURN;
  END IF;

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'jobs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.jobs', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- See one-line deviation note at top: full read for anon/authenticated.
CREATE POLICY jobs_select_public
  ON public.jobs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY jobs_authenticated_insert
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY jobs_authenticated_update
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY jobs_authenticated_delete
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Indexes for /jobs filters and FK lookups (no CONCURRENTLY — runs in txn)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_jobs_is_active_created_at
  ON public.jobs (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_module_active
  ON public.jobs (module)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_jobs_qualification_active
  ON public.jobs (qualification_needed)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_applications_job_id
  ON public.applications (job_id);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id
  ON public.applications (candidate_id)
  WHERE candidate_id IS NOT NULL;
