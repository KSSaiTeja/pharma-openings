-- 011: P-16 talent pool location filter + admin candidate notes

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS preferred_location text;

COMMENT ON COLUMN public.candidates.preferred_location IS
  'Candidate preferred work location for talent-pool filtering and matching.';

CREATE TABLE IF NOT EXISTS public.admin_candidate_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  body text NOT NULL,
  admin_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_candidate_notes_body_not_blank CHECK (char_length(btrim(body)) > 0)
);

COMMENT ON TABLE public.admin_candidate_notes IS
  'Internal admin-only notes attached to candidates in the talent pool.';

CREATE INDEX IF NOT EXISTS idx_admin_candidate_notes_candidate_created
  ON public.admin_candidate_notes (candidate_id, created_at DESC);

ALTER TABLE public.admin_candidate_notes ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_candidate_notes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_candidate_notes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY admin_candidate_notes_authenticated_select
  ON public.admin_candidate_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY admin_candidate_notes_authenticated_insert
  ON public.admin_candidate_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY admin_candidate_notes_authenticated_update
  ON public.admin_candidate_notes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY admin_candidate_notes_authenticated_delete
  ON public.admin_candidate_notes
  FOR DELETE
  TO authenticated
  USING (true);
