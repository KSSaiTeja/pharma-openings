-- Scale path: lakhs of applications — indexes, search helpers, and server-side admin RPCs.
-- Safe to run in a transaction (no CONCURRENTLY).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- applications: list ordering + job-scoped admin views + trigram search
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_applications_created_at_desc
  ON public.applications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_job_created_desc
  ON public.applications (job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_status_created_desc
  ON public.applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_full_name_trgm
  ON public.applications USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_applications_email_trgm
  ON public.applications USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_applications_mobile_trgm
  ON public.applications USING gin (mobile gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- candidates: talent pool listing
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_created_at_desc
  ON public.candidates (created_at DESC);

-- ---------------------------------------------------------------------------
-- Public: distinct filter facets for active jobs (no full table scan in app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.active_job_filter_facets()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'modules',
      COALESCE(
        (
          SELECT jsonb_agg(x ORDER BY x)
          FROM (
            SELECT DISTINCT module AS x
            FROM public.jobs
            WHERE is_active = true AND module IS NOT NULL AND btrim(module) <> ''
          ) s
        ),
        '[]'::jsonb
      ),
    'locations',
      COALESCE(
        (
          SELECT jsonb_agg(x ORDER BY x)
          FROM (
            SELECT DISTINCT location AS x
            FROM public.jobs
            WHERE is_active = true AND btrim(location) <> ''
          ) s
        ),
        '[]'::jsonb
      ),
    'departments',
      COALESCE(
        (
          SELECT jsonb_agg(x ORDER BY x)
          FROM (
            SELECT DISTINCT department AS x
            FROM public.jobs
            WHERE is_active = true AND department IS NOT NULL AND btrim(department) <> ''
          ) s
        ),
        '[]'::jsonb
      ),
    'types',
      COALESCE(
        (
          SELECT jsonb_agg(x ORDER BY x)
          FROM (
            SELECT DISTINCT type AS x
            FROM public.jobs
            WHERE is_active = true AND type IS NOT NULL AND btrim(type) <> ''
          ) s
        ),
        '[]'::jsonb
      ),
    'qualifications',
      COALESCE(
        (
          SELECT jsonb_agg(x ORDER BY x)
          FROM (
            SELECT DISTINCT qualification_needed AS x
            FROM public.jobs
            WHERE is_active = true AND qualification_needed IS NOT NULL AND btrim(qualification_needed) <> ''
          ) s
        ),
        '[]'::jsonb
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Admin: talent pool count (candidates with zero applications)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_talent_pool_candidates()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.candidates c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.candidate_id = c.id
  );
$$;

-- ---------------------------------------------------------------------------
-- Admin: paginated talent pool with filters (anti-join applications)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.talent_pool_candidates_page(
  p_limit integer,
  p_offset integer,
  p_module text DEFAULT NULL,
  p_qual text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_rows jsonb;
  v_mod text;
  v_qual text;
  v_loc text;
  v_q text;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 500 THEN
    p_limit := 50;
  END IF;
  IF p_offset IS NULL OR p_offset < 0 THEN
    p_offset := 0;
  END IF;

  v_mod := NULLIF(btrim(COALESCE(p_module, '')), '');
  IF v_mod IS NOT NULL AND lower(v_mod) = 'all' THEN
    v_mod := NULL;
  END IF;

  v_qual := NULLIF(btrim(COALESCE(p_qual, '')), '');
  IF v_qual IS NOT NULL AND lower(v_qual) = 'all' THEN
    v_qual := NULL;
  END IF;

  v_loc := NULLIF(btrim(COALESCE(p_location, '')), '');
  IF v_loc IS NOT NULL AND lower(v_loc) = 'all' THEN
    v_loc := NULL;
  END IF;

  v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

  SELECT COUNT(*) INTO v_total
  FROM public.candidates c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.candidate_id = c.id
  )
    AND (
      v_mod IS NULL
      OR (c.preferred_modules IS NOT NULL AND v_mod = ANY (c.preferred_modules))
    )
    AND (v_qual IS NULL OR COALESCE(c.highest_qualification, '') = v_qual)
    AND (v_loc IS NULL OR COALESCE(btrim(c.preferred_location), '') = v_loc)
    AND (
      v_q IS NULL
      OR c.full_name ILIKE '%' || v_q || '%'
      OR c.email ILIKE '%' || v_q || '%'
      OR c.mobile ILIKE '%' || v_q || '%'
    );

  SELECT COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC NULLS LAST)
      FROM (
        SELECT c.*
        FROM public.candidates c
        WHERE NOT EXISTS (
          SELECT 1 FROM public.applications a
          WHERE a.candidate_id = c.id
        )
          AND (
            v_mod IS NULL
            OR (c.preferred_modules IS NOT NULL AND v_mod = ANY (c.preferred_modules))
          )
          AND (v_qual IS NULL OR COALESCE(c.highest_qualification, '') = v_qual)
          AND (v_loc IS NULL OR COALESCE(btrim(c.preferred_location), '') = v_loc)
          AND (
            v_q IS NULL
            OR c.full_name ILIKE '%' || v_q || '%'
            OR c.email ILIKE '%' || v_q || '%'
            OR c.mobile ILIKE '%' || v_q || '%'
          )
        ORDER BY c.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
      ) t
    ),
    '[]'::jsonb
  ) INTO v_rows;

  RETURN jsonb_build_object('total', v_total, 'rows', v_rows);
END;
$$;

REVOKE ALL ON FUNCTION public.active_job_filter_facets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_job_filter_facets() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.count_talent_pool_candidates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_talent_pool_candidates() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.talent_pool_candidates_page(integer, integer, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.talent_pool_candidates_page(integer, integer, text, text, text, text) TO authenticated, service_role;
