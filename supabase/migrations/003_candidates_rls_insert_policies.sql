-- Idempotent: ensure anon + authenticated can INSERT candidates (registration + admin tooling).
-- Run in Supabase SQL Editor if you still see RLS errors after deploying the app storage fix.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'candidates') THEN
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
  END IF;
END $$;
