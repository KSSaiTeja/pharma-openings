-- P-28: Persist timestamp when application status changes (PRD §8 Data Integrity).

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;

COMMENT ON COLUMN public.applications.status_changed_at IS
  'UTC time of the last change to status; NULL until status is updated after this column exists.';

CREATE OR REPLACE FUNCTION public.applications_touch_status_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := timezone('utc', now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_status_changed_at ON public.applications;
CREATE TRIGGER trg_applications_status_changed_at
BEFORE UPDATE OF status ON public.applications
FOR EACH ROW
EXECUTE PROCEDURE public.applications_touch_status_changed_at();
