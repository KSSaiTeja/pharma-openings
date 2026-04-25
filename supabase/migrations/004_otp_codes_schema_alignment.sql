-- Align otp_codes with app + generated types: `code`, optional `attempts`.
-- Safe if you already use `code` or have both. No-op if `otp_codes` does not exist yet.

DO $$
BEGIN
  IF to_regclass('public.otp_codes') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.otp_codes
    ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'otp_codes'
      AND column_name = 'otp_code'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'otp_codes'
      AND column_name = 'code'
  ) THEN
    ALTER TABLE public.otp_codes RENAME COLUMN otp_code TO code;
  END IF;
END $$;
