export const SITE_VISITOR_COOKIE = "po_vid";

export type SiteAnalyticsStats = {
  uniqueVisitorsTotal: number;
  uniqueVisitorsToday: number;
  pageViewsToday: number;
  pageViewsTotal: number;
  uniqueVisitorsThisWeek: number;
  pageViewsThisWeek: number;
};

export function emptySiteAnalyticsStats(): SiteAnalyticsStats {
  return {
    uniqueVisitorsTotal: 0,
    uniqueVisitorsToday: 0,
    pageViewsToday: 0,
    pageViewsTotal: 0,
    uniqueVisitorsThisWeek: 0,
    pageViewsThisWeek: 0,
  };
}

export function parseSiteAnalyticsStats(raw: unknown): SiteAnalyticsStats {
  if (!raw || typeof raw !== "object") {
    return emptySiteAnalyticsStats();
  }

  const row = raw as Record<string, unknown>;
  const num = (key: string) => {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return 0;
  };

  return {
    uniqueVisitorsTotal: num("unique_visitors_total"),
    uniqueVisitorsToday: num("unique_visitors_today"),
    pageViewsToday: num("page_views_today"),
    pageViewsTotal: num("page_views_total"),
    uniqueVisitorsThisWeek: num("unique_visitors_this_week"),
    pageViewsThisWeek: num("page_views_this_week"),
  };
}

export function shouldTrackPath(path: string): boolean {
  if (!path || path === "/_not-found") return false;
  if (path.startsWith("/admin")) return false;
  if (path.startsWith("/api")) return false;
  return true;
}
