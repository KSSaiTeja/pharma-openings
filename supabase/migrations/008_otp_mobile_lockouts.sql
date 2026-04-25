-- Per PRD §8: lock mobile for 5 minutes after 3 wrong OTP attempts (non-demo).
-- Accessed only from Edge Functions using the service role.

CREATE TABLE IF NOT EXISTS public.otp_mobile_lockouts (
  mobile text PRIMARY KEY,
  locked_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.otp_mobile_lockouts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.otp_mobile_lockouts IS
  'Short lockout after repeated wrong OTP; written/read by verify-otp/send-otp (service role).';
