-- P-04: otp_codes RLS scoped to x-po-verified-mobile (same helper as candidates/applications).
-- Enables Supabase Realtime postgres_changes without global anon read of OTP rows.
--
-- Security: Realtime is a convenience / secondary channel (e.g. dev). It does not replace SMS
-- or cryptographically prove possession of the handset; SMS-led verification remains the
-- product default at scale. Anon visibility is limited to rows whose mobile matches the
-- browser-supplied session header (same trust model as public.po_request_mobile_header()).

COMMENT ON TABLE public.otp_codes IS
  'OTP storage for Edge Functions (service role). Optional Supabase Realtime may stream row '
  'events to anon clients; RLS restricts visibility to the session mobile header. '
  'Realtime does not replace SMS.';

DO $$
BEGIN
  IF to_regclass('public.otp_codes') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'otp_codes'
  ) THEN
    RETURN;
  END IF;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.otp_codes;
END $$;

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS otp_codes_insert_anon ON public.otp_codes;
DROP POLICY IF EXISTS otp_codes_select_anon ON public.otp_codes;

-- Inserts only from Edge Functions (service role bypasses RLS). No anon/client INSERT.
CREATE POLICY otp_codes_anon_select_own_mobile
  ON public.otp_codes
  FOR SELECT
  TO anon
  USING (
    public.po_request_mobile_header() IS NOT NULL
    AND btrim(mobile) = public.po_request_mobile_header()
  );
