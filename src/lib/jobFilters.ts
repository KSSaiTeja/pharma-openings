import type { JobRow } from "@/types/database.types";

export const JOBS_PAGE_SIZE = 20;

type DatePreset = "7d" | "30d" | "all" | "custom";

export type JobsFilterState = {
  q: string;
  modules: string[];
  locations: string[];
  departments: string[];
  types: string[];
  qualifications: string[];
  posted: DatePreset;
  dateFrom: string;
  dateTo: string;
  page: number;
};

export type JobsFilterOptions = {
  modules: string[];
  locations: string[];
  departments: string[];
  types: string[];
  qualifications: string[];
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function getMultiParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const raw = sp[key];
  if (Array.isArray(raw)) {
    return uniqueSorted(raw.flatMap((value) => value.split(",")));
  }
  if (typeof raw === "string") {
    return uniqueSorted(raw.split(","));
  }
  return [];
}

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function parsePreset(value: string | string[] | undefined): DatePreset {
  if (typeof value !== "string") return "all";
  if (value === "7d" || value === "30d" || value === "all" || value === "custom") {
    return value;
  }
  return "all";
}

export function parseJobsFilterState(
  sp: Record<string, string | string[] | undefined>,
): JobsFilterState {
  const posted = parsePreset(sp.posted);
  const dateFrom = typeof sp.dateFrom === "string" ? sp.dateFrom : "";
  const dateTo = typeof sp.dateTo === "string" ? sp.dateTo : "";
  return {
    q: typeof sp.q === "string" ? sp.q : "",
    modules: getMultiParam(sp, "module"),
    locations: getMultiParam(sp, "location"),
    departments: getMultiParam(sp, "department"),
    types: getMultiParam(sp, "type"),
    qualifications: getMultiParam(sp, "qualification"),
    posted,
    dateFrom,
    dateTo,
    page: parsePage(sp.page),
  };
}

export function deriveJobsFilterOptions(jobs: JobRow[]): JobsFilterOptions {
  return {
    modules: uniqueSorted(jobs.map((job) => job.module ?? "")),
    locations: uniqueSorted(jobs.map((job) => job.location)),
    departments: uniqueSorted(jobs.map((job) => job.department ?? "")),
    types: uniqueSorted(jobs.map((job) => job.type ?? "")),
    qualifications: uniqueSorted(jobs.map((job) => job.qualification_needed ?? "")),
  };
}

function isInSelected(selected: string[], value: string | null): boolean {
  if (selected.length === 0) return true;
  if (!value) return false;
  const normalizedValue = normalizeText(value);
  return selected.some((option) => normalizeText(option) === normalizedValue);
}

function toStartOfDay(dateText: string): Date | null {
  if (!dateText) return null;
  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) return null;
  return date;
}

function toEndOfDay(dateText: string): Date | null {
  if (!dateText) return null;
  const date = new Date(`${dateText}T23:59:59.999Z`);
  if (Number.isNaN(date.valueOf())) return null;
  return date;
}

function matchesPostedDate(job: JobRow, state: JobsFilterState): boolean {
  const jobDate = new Date(job.created_at);
  if (Number.isNaN(jobDate.valueOf())) return false;

  if (state.posted === "7d" || state.posted === "30d") {
    const days = state.posted === "7d" ? 7 : 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return jobDate >= from;
  }

  if (state.posted === "custom") {
    const from = toStartOfDay(state.dateFrom);
    const to = toEndOfDay(state.dateTo);
    if (from && jobDate < from) return false;
    if (to && jobDate > to) return false;
  }

  return true;
}

export function filterJobs(jobs: JobRow[], state: JobsFilterState): JobRow[] {
  const qn = normalizeText(state.q);
  return jobs.filter((job) => {
    if (qn) {
      const searchBucket = [
        job.title,
        job.location,
        job.department ?? "",
        job.module ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!searchBucket.includes(qn)) return false;
    }
    if (!isInSelected(state.modules, job.module)) return false;
    if (!isInSelected(state.locations, job.location)) return false;
    if (!isInSelected(state.departments, job.department)) return false;
    if (!isInSelected(state.types, job.type)) return false;
    if (!isInSelected(state.qualifications, job.qualification_needed)) return false;
    if (!matchesPostedDate(job, state)) return false;
    return true;
  });
}

export function getActiveFilterCount(state: JobsFilterState): number {
  let count = 0;
  if (state.q.trim()) count += 1;
  if (state.modules.length) count += 1;
  if (state.locations.length) count += 1;
  if (state.departments.length) count += 1;
  if (state.types.length) count += 1;
  if (state.qualifications.length) count += 1;
  if (state.posted === "7d" || state.posted === "30d") count += 1;
  if (state.posted === "custom" && (state.dateFrom || state.dateTo)) count += 1;
  return count;
}

export function getPagination(totalItems: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / JOBS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * JOBS_PAGE_SIZE;
  const end = start + JOBS_PAGE_SIZE;
  return {
    totalPages,
    currentPage,
    start,
    end,
  };
}

export function buildJobsQueryString(
  state: JobsFilterState,
  overrides?: Partial<JobsFilterState>,
): string {
  const params = new URLSearchParams();
  const next: JobsFilterState = { ...state, ...overrides };

  if (next.q.trim()) params.set("q", next.q.trim());
  next.modules.forEach((value) => params.append("module", value));
  next.locations.forEach((value) => params.append("location", value));
  next.departments.forEach((value) => params.append("department", value));
  next.types.forEach((value) => params.append("type", value));
  next.qualifications.forEach((value) => params.append("qualification", value));

  if (next.posted !== "all") params.set("posted", next.posted);
  if (next.dateFrom) params.set("dateFrom", next.dateFrom);
  if (next.dateTo) params.set("dateTo", next.dateTo);
  if (next.page > 1) params.set("page", String(next.page));

  const query = params.toString();
  return query ? `?${query}` : "";
}
