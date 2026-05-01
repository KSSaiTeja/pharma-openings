/** Shared filter logic for admin applications list + CSV export (server-side). */

export const ADMIN_APPLICATIONS_PAGE_SIZE = 50;

export function sanitizeAdminIlikeSearch(raw: string): string {
  return raw.replace(/[%_\\]/g, " ").trim();
}

export function adminApplicationsSelect(moduleFilterSize: number): string {
  return moduleFilterSize > 0
    ? "*, jobs!inner(title, module, location)"
    : "*, jobs(title, module, location)";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyAdminApplicationsFilters(q: any, params: {
  jobFilter: string;
  statusFilter: Set<string>;
  moduleFilter: Set<string>;
  dateFrom: string;
  dateTo: string;
  search: string;
  startOfDayIso: (d: string) => string;
  endOfDayIso: (d: string) => string;
}) {
  let x = q;
  if (params.jobFilter !== "all") x = x.eq("job_id", params.jobFilter);
  if (params.statusFilter.size > 0) {
    x = x.in("status", Array.from(params.statusFilter));
  }
  if (params.dateFrom) x = x.gte("created_at", params.startOfDayIso(params.dateFrom));
  if (params.dateTo) x = x.lte("created_at", params.endOfDayIso(params.dateTo));
  const safe = sanitizeAdminIlikeSearch(params.search);
  if (safe) {
    const pat = `%${safe}%`;
    x = x.or(`full_name.ilike.${pat},email.ilike.${pat},mobile.ilike.${pat}`);
  }
  if (params.moduleFilter.size > 0) {
    x = x.in("jobs.module", Array.from(params.moduleFilter));
  }
  return x;
}
