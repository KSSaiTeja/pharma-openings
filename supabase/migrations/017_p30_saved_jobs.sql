-- P-30: Saved jobs (bookmarks) per candidate; RLS mirrors applications anon verified-mobile pattern (006).

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates (id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_jobs_candidate_job_unique UNIQUE (candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate_created_desc
  ON public.saved_jobs (candidate_id, created_at DESC);

COMMENT ON TABLE public.saved_jobs IS
  'Candidate bookmarks for jobs; anon access scoped via x-po-verified-mobile like applications.';

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_jobs_anon_insert_verified
  ON public.saved_jobs
  FOR INSERT
  TO anon
  WITH CHECK (
    candidate_id IS NOT NULL
    AND public.po_request_mobile_header() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.candidates c
      WHERE c.id = candidate_id
        AND btrim(c.mobile) = public.po_request_mobile_header()
    )
  );

CREATE POLICY saved_jobs_anon_select_own
  ON public.saved_jobs
  FOR SELECT
  TO anon
  USING (
    candidate_id IS NOT NULL
    AND public.po_request_mobile_header() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.candidates c
      WHERE c.id = candidate_id
        AND btrim(c.mobile) = public.po_request_mobile_header()
    )
  );

CREATE POLICY saved_jobs_anon_delete_own
  ON public.saved_jobs
  FOR DELETE
  TO anon
  USING (
    candidate_id IS NOT NULL
    AND public.po_request_mobile_header() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.candidates c
      WHERE c.id = candidate_id
        AND btrim(c.mobile) = public.po_request_mobile_header()
    )
  );

CREATE POLICY saved_jobs_authenticated_select_all
  ON public.saved_jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY saved_jobs_authenticated_delete_all
  ON public.saved_jobs
  FOR DELETE
  TO authenticated
  USING (true);
