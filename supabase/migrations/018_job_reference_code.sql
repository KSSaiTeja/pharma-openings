-- Human-readable job reference for listings, apply flow, and recruiter lookup (e.g. PO-2026-0001).

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_code text;

COMMENT ON COLUMN public.jobs.job_code IS
  'Public reference ID shown to candidates and recruiters (format PO-YYYY-NNNN).';

-- Backfill existing rows in posted order (per calendar year of created_at).
WITH numbered AS (
  SELECT
    id,
    to_char(created_at AT TIME ZONE 'UTC', 'YYYY') AS yr,
    row_number() OVER (
      PARTITION BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY')
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.jobs
  WHERE job_code IS NULL
)
UPDATE public.jobs AS j
SET job_code = 'PO-' || n.yr || '-' || lpad(n.rn::text, 4, '0')
FROM numbered AS n
WHERE j.id = n.id;

CREATE OR REPLACE FUNCTION public.jobs_assign_job_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  yr text;
  next_num integer;
BEGIN
  IF NEW.job_code IS NOT NULL AND btrim(NEW.job_code) <> '' THEN
    NEW.job_code := upper(btrim(NEW.job_code));
    RETURN NEW;
  END IF;

  yr := to_char(COALESCE(NEW.created_at, timezone('utc', now())) AT TIME ZONE 'UTC', 'YYYY');

  PERFORM pg_advisory_xact_lock(hashtext('jobs_job_code_' || yr));

  SELECT COALESCE(
    max((regexp_match(job_code, '^PO-' || yr || '-([0-9]{4})$'))[1]::integer),
    0
  ) + 1
  INTO next_num
  FROM public.jobs
  WHERE job_code ~ ('^PO-' || yr || '-[0-9]{4}$');

  NEW.job_code := 'PO-' || yr || '-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'jobs_assign_job_code_before_insert'
      AND tgrelid = 'public.jobs'::regclass
  ) THEN
    DROP TRIGGER jobs_assign_job_code_before_insert ON public.jobs;
  END IF;
END;
$$;

CREATE TRIGGER jobs_assign_job_code_before_insert
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.jobs_assign_job_code();

ALTER TABLE public.jobs
  ALTER COLUMN job_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_job_code_unique ON public.jobs (job_code);

CREATE INDEX IF NOT EXISTS jobs_job_code_pattern_idx ON public.jobs (job_code text_pattern_ops);
