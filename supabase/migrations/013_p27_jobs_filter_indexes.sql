-- P-27 / PRD §9: indexes for /jobs filters + text search on active rows.
-- Complements P-01 (007): idx_jobs_is_active_created_at, module, qualification_needed.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_jobs_location_active
  ON public.jobs (location)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_jobs_department_active
  ON public.jobs (department)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_jobs_type_active
  ON public.jobs (type)
  WHERE is_active = true;

-- Speeds ILIKE / similarity on title for the public job search box.
CREATE INDEX IF NOT EXISTS idx_jobs_title_search_trgm
  ON public.jobs
  USING gin (title gin_trgm_ops)
  WHERE is_active = true;
