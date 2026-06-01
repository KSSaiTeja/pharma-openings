/** GoatCounter analytics — server-side API client (see goatcounter.com/help/api). */

export type GoatCounterDashboardStats = {
  pageViewsToday: number;
  visitorsToday: number;
  pageViewsWeek: number;
  pageViewsTotal: number;
  activeRecent: number;
  topPages: { path: string; pageViews: number }[];
};

type GoatCounterTotalResponse = {
  total?: number;
  total_utc?: number;
};

type GoatCounterHitsResponse = {
  hits?: Array<{
    path?: string;
    count?: number;
    pageviews?: number;
  }>;
};

function apiOrigin(): string | null {
  const explicit = process.env.GOATCOUNTER_API_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const site = process.env.NEXT_PUBLIC_GOATCOUNTER_SITE?.trim();
  if (!site) return null;
  if (site.startsWith("http://") || site.startsWith("https://")) {
    return site.replace(/\/$/, "").replace(/\/count$/, "");
  }
  return `https://${site}.goatcounter.com`;
}

function apiToken(): string | null {
  return process.env.GOATCOUNTER_API_TOKEN?.trim() || null;
}

export function isGoatCounterApiConfigured(): boolean {
  return Boolean(apiOrigin() && apiToken());
}

/** @deprecated use isGoatCounterApiConfigured */
export function isGoatCounterConfigured(): boolean {
  return isGoatCounterApiConfigured();
}

export function isGoatCounterTrackingConfigured(): boolean {
  return Boolean(goatCounterCountEndpoint());
}

/** Public count endpoint for the site script, e.g. https://code.goatcounter.com/count */
export function goatCounterCountEndpoint(): string | null {
  const site = process.env.NEXT_PUBLIC_GOATCOUNTER_SITE?.trim();
  if (!site) return null;
  if (site.startsWith("http://") || site.startsWith("https://")) {
    return site.endsWith("/count") ? site : `${site.replace(/\/$/, "")}/count`;
  }
  return `https://${site}.goatcounter.com/count`;
}

function toHourIso(date: Date): string {
  const copy = new Date(date);
  copy.setMinutes(0, 0, 0);
  return copy.toISOString();
}

function istDayStartUtc(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return new Date(`${year}-${month}-${day}T00:00:00+05:30`);
}

async function goatCounterGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const origin = apiOrigin();
  const token = apiToken();
  if (!origin || !token) return null;

  const url = new URL(`${origin}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function fetchTotalBetween(start: Date, end: Date): Promise<number> {
  const data = await goatCounterGet<GoatCounterTotalResponse>("/api/v0/stats/total", {
    start: toHourIso(start),
    end: toHourIso(end),
  });
  return data?.total ?? 0;
}

async function fetchTopPages(start: Date, end: Date, limit = 5): Promise<GoatCounterDashboardStats["topPages"]> {
  const data = await goatCounterGet<GoatCounterHitsResponse>("/api/v0/stats/hits", {
    start: toHourIso(start),
    end: toHourIso(end),
    limit: String(limit),
  });

  return (data?.hits ?? [])
    .map((hit) => ({
      path: hit.path?.trim() || "/",
      pageViews: hit.pageviews ?? hit.count ?? 0,
    }))
    .filter((hit) => hit.pageViews > 0);
}

export async function fetchGoatCounterDashboardStats(): Promise<GoatCounterDashboardStats | null> {
  if (!isGoatCounterApiConfigured()) return null;

  const now = new Date();
  const todayStart = istDayStartUtc(now);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const allTimeStart = new Date("2020-01-01T00:00:00.000Z");
  const recentStart = new Date(now.getTime() - 10 * 60 * 1000);

  const [pageViewsToday, pageViewsWeek, pageViewsTotal, activeRecent, topPages] = await Promise.all([
    fetchTotalBetween(todayStart, now),
    fetchTotalBetween(weekStart, now),
    fetchTotalBetween(allTimeStart, now),
    fetchTotalBetween(recentStart, now),
    fetchTopPages(todayStart, now),
  ]);

  return {
    pageViewsToday,
    visitorsToday: pageViewsToday,
    pageViewsWeek,
    pageViewsTotal,
    activeRecent,
    topPages,
  };
}

