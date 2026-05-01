-- Registration: notice period (candidate availability).

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS notice_period text;

COMMENT ON COLUMN public.candidates.notice_period IS 'Candidate notice period (e.g. immediate, 30 days); collected at registration.';
