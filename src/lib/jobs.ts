import type { Json } from "@/types/database.types";
import type { JobRow } from "@/types/database.types";

import {
  EMPTY_JOBS_FILTER_OPTIONS,
  JOBS_PAGE_SIZE,
  type JobsFilterOptions,
  type JobsFilterState,
} from "./jobFilters";
import { createSupabaseClient } from "./supabase";

/** How many newest active jobs to surface on the marketing homepage. */
export const HOME_PAGE_JOBS_LIMIT = 8;

/**
 * Chip labels for live JobCard rows (PRD §5.2): Department, Type, Module.
 */
export function jobCardTagsFromRow(job: JobRow): string[] {
  const tags: string[] = [];
  const dept = job.department?.trim();
  const jobType = job.type?.trim();
  const mod = job.module?.trim();
  if (dept) tags.push(`Department: ${dept}`);
  if (jobType) tags.push(`Type: ${jobType}`);
  if (mod) tags.push(`Module: ${mod}`);
  return tags;
}

const DESCRIPTION_PREVIEW_MAX = 200;

/**
 * Collapses whitespace and truncates on a word boundary when reasonable
 * so previews stay readable and avoid splitting UTF-16 surrogate pairs mid-codepoint.
 */
export function truncateJobDescription(
  text: string,
  maxChars: number = DESCRIPTION_PREVIEW_MAX,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const codepoints = [...normalized];
  if (codepoints.length <= maxChars) return normalized;
  const slice = codepoints.slice(0, maxChars).join("");
  const lastSpace = slice.lastIndexOf(" ");
  const base =
    lastSpace > Math.floor(maxChars * 0.35) ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}…`;
}

export async function fetchRecentActiveJobs(
  limit: number,
): Promise<{
  data: JobRow[] | null;
  error: Error | null;
}> {
  const normalizedLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  const supabase = createSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(normalizedLimit);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as JobRow[], error: null };
}

export async function fetchFeaturedJobs(): Promise<{
  data: JobRow[] | null;
  error: Error | null;
}> {
  return fetchRecentActiveJobs(6);
}

/** Strip ILIKE wildcards from user input to avoid overly broad scans. */
function sanitizeIlikeQuery(q: string): string {
  return q.replace(/[%_\\]/g, " ").trim();
}

function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function parseActiveJobFacets(payload: Json): JobsFilterOptions {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ...EMPTY_JOBS_FILTER_OPTIONS };
  }
  const o = payload as Record<string, unknown>;
  return {
    modules: jsonStringArray(o.modules),
    locations: jsonStringArray(o.locations),
    departments: jsonStringArray(o.departments),
    types: jsonStringArray(o.types),
    qualifications: jsonStringArray(o.qualifications),
  };
}

/**
 * Distinct facet values for active jobs — backed by `active_job_filter_facets` RPC when deployed.
 */
export async function fetchActiveJobFilterOptions(): Promise<{
  data: JobsFilterOptions | null;
  error: Error | null;
}> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const { data, error } = await supabase.rpc("active_job_filter_facets");
  if (!error && data != null) {
    return { data: parseActiveJobFacets(data as Json), error: null };
  }

  const { data: rows, error: fbErr } = await supabase
    .from("jobs")
    .select("module, location, department, type, qualification_needed")
    .eq("is_active", true)
    .limit(50_000);

  if (fbErr) {
    return {
      data: null,
      error: new Error(error?.message ?? fbErr.message),
    };
  }

  const list = (rows ?? []) as Pick<
    JobRow,
    "module" | "location" | "department" | "type" | "qualification_needed"
  >[];
  const modules = new Set<string>();
  const locations = new Set<string>();
  const departments = new Set<string>();
  const types = new Set<string>();
  const qualifications = new Set<string>();
  for (const r of list) {
    const m = r.module?.trim();
    if (m) modules.add(m);
    const loc = r.location?.trim();
    if (loc) locations.add(loc);
    const d = r.department?.trim();
    if (d) departments.add(d);
    const t = r.type?.trim();
    if (t) types.add(t);
    const qn = r.qualification_needed?.trim();
    if (qn) qualifications.add(qn);
  }
  const sort = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return {
    data: {
      modules: sort(modules),
      locations: sort(locations),
      departments: sort(departments),
      types: sort(types),
      qualifications: sort(qualifications),
    },
    error: null,
  };
}

function toStartOfDayUtcIso(dateText: string): string {
  const d = new Date(`${dateText}T00:00:00.000Z`);
  return d.toISOString();
}

function toEndOfDayUtcIso(dateText: string): string {
  const d = new Date(`${dateText}T23:59:59.999Z`);
  return d.toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyActiveJobListingFilters(q: any, state: JobsFilterState) {
  let x = q.eq("is_active", true);
  const qn = sanitizeIlikeQuery(state.q);
  if (qn) {
    const pat = `%${qn}%`;
    x = x.or(`title.ilike.${pat},location.ilike.${pat},department.ilike.${pat},module.ilike.${pat}`);
  }
  if (state.modules.length) x = x.in("module", state.modules);
  if (state.locations.length) x = x.in("location", state.locations);
  if (state.departments.length) x = x.in("department", state.departments);
  if (state.types.length) x = x.in("type", state.types);
  if (state.qualifications.length) x = x.in("qualification_needed", state.qualifications);
  if (state.posted === "7d") {
    x = x.gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
  } else if (state.posted === "30d") {
    x = x.gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());
  } else if (state.posted === "custom") {
    if (state.dateFrom) x = x.gte("created_at", toStartOfDayUtcIso(state.dateFrom));
    if (state.dateTo) x = x.lte("created_at", toEndOfDayUtcIso(state.dateTo));
  }
  return x;
}

/**
 * Server-side filtered + paged active jobs (PostgREST range + exact count).
 * Keeps P-10 URL filter contract; uses one round-trip when the requested page is valid.
 *
 * DB indexes (P-01 + P-27): `007_*` (`idx_jobs_is_active_created_at`, module, qualification),
 * `013_p27_jobs_filter_indexes.sql` (location, department, type, title trigram).
 */
export async function fetchActiveJobsListingPage(
  state: JobsFilterState,
): Promise<{ data: JobRow[] | null; count: number | null; error: Error | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return { data: null, count: null, error: new Error("Supabase is not configured") };
  }

  const requestedPage = Math.max(1, state.page);

  const fetchPage = async (page: number, includeTotalCount: boolean) => {
    const start = (page - 1) * JOBS_PAGE_SIZE;
    const end = start + JOBS_PAGE_SIZE - 1;
    let q = supabase
      .from("jobs")
      .select("*", includeTotalCount ? { count: "exact" } : undefined);
    q = applyActiveJobListingFilters(q, state);
    q = q.order("created_at", { ascending: false }).range(start, end);
    return q;
  };

  const first = await fetchPage(requestedPage, true);
  if (first.error) {
    return { data: null, count: null, error: new Error(first.error.message) };
  }

  const total = first.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  if (total > 0 && page !== requestedPage) {
    const second = await fetchPage(page, false);
    if (second.error) {
      return { data: null, count: null, error: new Error(second.error.message) };
    }
    return { data: second.data as JobRow[], count: total, error: null };
  }

  return { data: first.data as JobRow[], count: total, error: null };
}

/** PRD §9 / P-27 — alias for {@link fetchActiveJobsListingPage}. */
export const fetchJobsPage = fetchActiveJobsListingPage;

/** @deprecated Prefer fetchJobsPage + fetchActiveJobFilterOptions for listings. */
export async function fetchAllActiveJobs(): Promise<{
  data: JobRow[] | null;
  error: Error | null;
}> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50_000);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as JobRow[], error: null };
}

const SITEMAP_JOBS_MAX = 50_000;

/** Slim rows for sitemap generation (caps URL count for very large catalogs). */
export async function fetchActiveJobSitemapRows(): Promise<{
  data: Pick<JobRow, "id" | "created_at">[] | null;
  error: Error | null;
}> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("id, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(SITEMAP_JOBS_MAX);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as Pick<JobRow, "id" | "created_at">[], error: null };
}

export async function fetchJobById(
  id: string,
): Promise<{ data: JobRow | null; error: Error | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  if (!data) {
    return { data: null, error: null };
  }
  return { data: data as JobRow, error: null };
}

export async function fetchJobForApply(id: string): Promise<{
  data: JobRow | null;
  error: Error | null;
}> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  if (!data) {
    return { data: null, error: null };
  }
  return { data: data as JobRow, error: null };
}
