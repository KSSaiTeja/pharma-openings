import { createSupabaseClient } from "./supabase";
import type { JobRow } from "@/types/database.types";

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
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as JobRow[], error: null };
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
