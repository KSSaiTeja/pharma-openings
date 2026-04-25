-- 002: candidates, OTP, job/application schema updates
-- Run manually after review. Adjust if prior migrations already define helpers with the same names.

-- ---------------------------------------------------------------------------
-- Jobs: new columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS module text NOT NULL DEFAULT 'Others',
  ADD COLUMN IF NOT EXISTS qualification_needed text NOT NULL DEFAULT 'Any';

COMMENT ON COLUMN public.jobs.module IS 'One of: API, Injectables, OSD, Others';
COMMENT ON COLUMN public.jobs.qualification_needed IS 'Minimum qualification label for the role';

-- ---------------------------------------------------------------------------
-- updated_at helper (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Candidates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  current_designation text,
  current_department text,
  current_company text,
  highest_qualification text NOT NULL DEFAULT 'Any',
  preferred_modules text[] NOT NULL DEFAULT ARRAY['Others']::text[],
  resume_url text,
  otp_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON public.candidates;
CREATE TRIGGER trg_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Policies: drop first so `supabase db push` is safe when policies already exist (e.g. manual SQL).
DROP POLICY IF EXISTS candidates_insert_anon ON public.candidates;
CREATE POLICY candidates_insert_anon
  ON public.candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS candidates_insert_authenticated ON public.candidates;
CREATE POLICY candidates_insert_authenticated
  ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS candidates_select_authenticated ON public.candidates;
CREATE POLICY candidates_select_authenticated
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS candidates_update_authenticated ON public.candidates;
CREATE POLICY candidates_update_authenticated
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon key: demo-friendly access for the custom OTP + sessionStorage flow.
-- Production should tie rows to auth.users() or route sensitive reads/writes through Edge Functions.
DROP POLICY IF EXISTS candidates_select_anon ON public.candidates;
CREATE POLICY candidates_select_anon
  ON public.candidates
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS candidates_update_anon ON public.candidates;
CREATE POLICY candidates_update_anon
  ON public.candidates
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- OTP codes (custom / demo)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS otp_codes_insert_anon ON public.otp_codes;
CREATE POLICY otp_codes_insert_anon
  ON public.otp_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Demo: anon clients may read OTP rows (tighten to service-role-only in production).
DROP POLICY IF EXISTS otp_codes_select_anon ON public.otp_codes;
CREATE POLICY otp_codes_select_anon
  ON public.otp_codes
  FOR SELECT
  TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- Applications: candidate link + snapshots, drop cover letter, uniqueness
-- ---------------------------------------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES public.candidates (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_designation text,
  ADD COLUMN IF NOT EXISTS current_department text,
  ADD COLUMN IF NOT EXISTS current_company text,
  ADD COLUMN IF NOT EXISTS highest_qualification text;

ALTER TABLE public.applications
  DROP COLUMN IF EXISTS cover_letter;

-- Resume column name differs across projects; ensure a nullable `resume_url` when missing.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS resume_url text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name = 'resume_url'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.applications ALTER COLUMN resume_url DROP NOT NULL;
  END IF;
END $$;

-- Prevent duplicate applications per candidate/job when candidate_id is set.
CREATE UNIQUE INDEX IF NOT EXISTS applications_candidate_job_unique
  ON public.applications (candidate_id, job_id)
  WHERE candidate_id IS NOT NULL;
