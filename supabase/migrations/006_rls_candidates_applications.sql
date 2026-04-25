-- 006: Enterprise RLS for candidates + applications (cursor-steps Phase 1).
-- Anon candidate flows send `x-po-verified-mobile` (see src/lib/supabase.ts + poClientHeaders.ts).
-- Service role / Edge Functions bypass RLS and are unchanged.

-- ---------------------------------------------------------------------------
-- Helper: verified mobile from PostgREST request headers (browser-injected).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.po_request_mobile_header()
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  raw text;
  parsed json;
  v text;
BEGIN
  raw := current_setting('request.headers', true);
  IF raw IS NULL OR btrim(raw) = '' THEN
    RETURN NULL;
  END IF;

  BEGIN
    parsed := raw::json;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;

  v := parsed ->> 'x-po-verified-mobile';
  IF v IS NULL OR btrim(v) = '' THEN
    RETURN NULL;
  END IF;

  RETURN btrim(v);
END;
$$;

COMMENT ON FUNCTION public.po_request_mobile_header() IS
  'Returns trimmed x-po-verified-mobile from PostgREST request.headers JSON. Used by anon RLS to scope rows to the OTP-verified session; treat like session state, not cryptographic proof.';

REVOKE ALL ON FUNCTION public.po_request_mobile_header() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.po_request_mobile_header() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- candidates: replace policies
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('public.candidates') IS NULL THEN
    RETURN;
  END IF;

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'candidates'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.candidates', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Anyone can register (anon + authenticated).
CREATE POLICY candidates_anon_insert
  ON public.candidates
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY candidates_authenticated_insert
  ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anon: only the row whose mobile matches the verified-session header.
CREATE POLICY candidates_anon_select_self
  ON public.candidates
  FOR SELECT
  TO anon
  USING (
    public.po_request_mobile_header() IS NOT NULL
    AND btrim(mobile) = public.po_request_mobile_header()
  );

-- Authenticated (admin dashboard JWT): full read.
CREATE POLICY candidates_authenticated_select_all
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Anon: update own profile only (same mobile as header).
CREATE POLICY candidates_anon_update_self
  ON public.candidates
  FOR UPDATE
  TO anon
  USING (
    public.po_request_mobile_header() IS NOT NULL
    AND btrim(mobile) = public.po_request_mobile_header()
  )
  WITH CHECK (
    public.po_request_mobile_header() IS NOT NULL
    AND btrim(mobile) = public.po_request_mobile_header()
  );

-- Admin/support: full candidate updates (optional tooling).
CREATE POLICY candidates_authenticated_update_all
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- applications: RLS aligned with step 3 + anon "own applications" reads
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('public.applications') IS NULL THEN
    RETURN;
  END IF;

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'applications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.applications', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Step 3: anon + authenticated may INSERT; anon rows must belong to verified mobile.
CREATE POLICY applications_anon_insert_verified
  ON public.applications
  FOR INSERT
  TO anon
  WITH CHECK (
    candidate_id IS NOT NULL
    AND public.po_request_mobile_header() IS NOT NULL
    AND btrim(mobile) = public.po_request_mobile_header()
    AND EXISTS (
      SELECT 1
      FROM public.candidates c
      WHERE c.id = candidate_id
        AND btrim(c.mobile) = public.po_request_mobile_header()
    )
  );

CREATE POLICY applications_authenticated_insert
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin: list / aggregate / export all applications.
CREATE POLICY applications_authenticated_select_all
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Candidate site: duplicate-application check (apply page) without exposing others' rows.
CREATE POLICY applications_anon_select_own
  ON public.applications
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

-- Step 3: status changes from admin only.
CREATE POLICY applications_authenticated_update_all
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
