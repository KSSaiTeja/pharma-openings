-- First-party site analytics (visitor + page view counts for admin dashboard).

CREATE TABLE IF NOT EXISTS public.site_visitors (
  visitor_key text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  visit_count integer NOT NULL DEFAULT 1 CHECK (visit_count >= 1)
);

CREATE TABLE IF NOT EXISTS public.site_page_views (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_key text NOT NULL REFERENCES public.site_visitors (visitor_key) ON DELETE CASCADE,
  path text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_page_views_viewed_at
  ON public.site_page_views (viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_page_views_visitor_viewed
  ON public.site_page_views (visitor_key, viewed_at DESC);

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_views ENABLE ROW LEVEL SECURITY;

-- Called from Next.js API route (service role) to record a page view atomically.
CREATE OR REPLACE FUNCTION public.record_site_page_view(
  p_visitor_key text,
  p_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_visitor_key IS NULL OR btrim(p_visitor_key) = '' THEN
    RAISE EXCEPTION 'visitor_key required';
  END IF;

  IF p_path IS NULL OR btrim(p_path) = '' THEN
    RAISE EXCEPTION 'path required';
  END IF;

  INSERT INTO public.site_visitors (visitor_key, first_seen_at, last_seen_at, visit_count)
  VALUES (p_visitor_key, now(), now(), 1)
  ON CONFLICT (visitor_key) DO UPDATE
    SET last_seen_at = now(),
        visit_count = public.site_visitors.visit_count + 1;

  INSERT INTO public.site_page_views (visitor_key, path, viewed_at)
  VALUES (p_visitor_key, btrim(p_path), now());
END;
$$;

REVOKE ALL ON FUNCTION public.record_site_page_view(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_site_page_view(text, text) TO service_role;

-- Admin dashboard: aggregate traffic (authenticated JWT only).
CREATE OR REPLACE FUNCTION public.get_site_analytics_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH ist_day_start AS (
    SELECT (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata') AS ts
  ),
  week_start AS (
    SELECT now() - interval '7 days' AS ts
  )
  SELECT jsonb_build_object(
    'unique_visitors_total', (SELECT COUNT(*)::bigint FROM public.site_visitors),
    'unique_visitors_today', (
      SELECT COUNT(DISTINCT pv.visitor_key)::bigint
      FROM public.site_page_views pv, ist_day_start d
      WHERE pv.viewed_at >= d.ts
    ),
    'page_views_today', (
      SELECT COUNT(*)::bigint
      FROM public.site_page_views pv, ist_day_start d
      WHERE pv.viewed_at >= d.ts
    ),
    'page_views_total', (SELECT COUNT(*)::bigint FROM public.site_page_views),
    'unique_visitors_this_week', (
      SELECT COUNT(DISTINCT pv.visitor_key)::bigint
      FROM public.site_page_views pv, week_start w
      WHERE pv.viewed_at >= w.ts
    ),
    'page_views_this_week', (
      SELECT COUNT(*)::bigint
      FROM public.site_page_views pv, week_start w
      WHERE pv.viewed_at >= w.ts
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_site_analytics_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_site_analytics_stats() TO authenticated, service_role;

COMMENT ON TABLE public.site_visitors IS
  'Anonymous first-party visitor IDs (cookie-based) for admin traffic analytics.';
COMMENT ON TABLE public.site_page_views IS
  'Page view events recorded by the public site visit tracker.';
