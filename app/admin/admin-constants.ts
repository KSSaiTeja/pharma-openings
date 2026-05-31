export const JOB_MODULES = ["API", "Injectables", "OSD", "Others"] as const;
export type JobModule = (typeof JOB_MODULES)[number];

export const JOB_TYPES = ["Full-time", "Part-time", "Contract"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const QUALIFICATIONS = [
  "B.Pharm",
  "M.Pharm",
  "B.Sc",
  "M.Sc",
  "PhD",
  "D.Pharm",
  "ITI",
  "Diploma",
  "Any",
] as const;
export type Qualification = (typeof QUALIFICATIONS)[number];

/** Display labels — stored lowercase in `applications.status`. */
export const APPLICATION_STATUS_LABELS = ["New", "Reviewed", "Shortlisted", "Rejected"] as const;
export type ApplicationStatusLabel = (typeof APPLICATION_STATUS_LABELS)[number];

export function statusToDb(label: string): string {
  return label.trim().toLowerCase();
}

export function statusFromDb(raw: string): ApplicationStatusLabel {
  const n = raw?.trim().toLowerCase();
  const map: Record<string, ApplicationStatusLabel> = {
    new: "New",
    reviewed: "Reviewed",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
  };
  return map[n] ?? "New";
}

/** Label for candidate-facing UI: known DB values match admin; others stay readable. */
export function applicationStatusDisplayLabel(raw: string): string {
  const n = raw?.trim().toLowerCase() ?? "";
  if (!n) return "—";
  if (["new", "reviewed", "shortlisted", "rejected"].includes(n)) {
    return statusFromDb(raw);
  }
  const s = raw.trim();
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

/** Same semantic palette as `applicationStatusSelectTriggerClass`, for read-only pills. */
export function applicationStatusBadgeClass(raw: string): string {
  const s = raw?.trim().toLowerCase() ?? "";
  const base = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium";
  switch (s) {
    case "new":
      return `${base} border-sky-200/90 bg-sky-50/90 text-sky-950 dark:border-sky-800/70 dark:bg-sky-950/45 dark:text-sky-50`;
    case "reviewed":
      return `${base} border-amber-200/90 bg-amber-50/80 text-amber-950 dark:border-amber-900/55 dark:bg-amber-950/35 dark:text-amber-50`;
    case "shortlisted":
      return `${base} border-emerald-200/90 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/55 dark:bg-emerald-950/35 dark:text-emerald-50`;
    case "rejected":
      return `${base} border-rose-200/90 bg-rose-50/80 text-rose-950 dark:border-rose-900/55 dark:bg-rose-950/35 dark:text-rose-50`;
    default:
      return `${base} border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100`;
  }
}

/** Muted semantic tints for the status `<SelectTrigger>` (light + dark). */
export function applicationStatusSelectTriggerClass(raw: string): string {
  const s = raw?.trim().toLowerCase() ?? "";
  const base =
    "h-8 w-full min-w-0 border px-2 text-xs font-medium shadow-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-0 [&>span]:line-clamp-1";
  switch (s) {
    case "new":
      return `${base} border-sky-200/90 bg-sky-50/90 text-sky-950 hover:bg-sky-50 focus-visible:ring-sky-400/55 dark:border-sky-800/70 dark:bg-sky-950/45 dark:text-sky-50 dark:hover:bg-sky-950/60 dark:focus-visible:ring-sky-500/45`;
    case "reviewed":
      return `${base} border-amber-200/90 bg-amber-50/80 text-amber-950 hover:bg-amber-50 focus-visible:ring-amber-400/45 dark:border-amber-900/55 dark:bg-amber-950/35 dark:text-amber-50 dark:hover:bg-amber-950/50 dark:focus-visible:ring-amber-500/35`;
    case "shortlisted":
      return `${base} border-emerald-200/90 bg-emerald-50/80 text-emerald-950 hover:bg-emerald-50 focus-visible:ring-emerald-400/45 dark:border-emerald-900/55 dark:bg-emerald-950/35 dark:text-emerald-50 dark:hover:bg-emerald-950/50 dark:focus-visible:ring-emerald-500/35`;
    case "rejected":
      return `${base} border-rose-200/90 bg-rose-50/80 text-rose-950 hover:bg-rose-50 focus-visible:ring-rose-400/45 dark:border-rose-900/55 dark:bg-rose-950/35 dark:text-rose-50 dark:hover:bg-rose-950/50 dark:focus-visible:ring-rose-500/35`;
    default:
      return `${base} border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-400/35 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/80 dark:focus-visible:ring-zinc-500/40`;
  }
}

export { formatDateTimeIst as formatAppliedAt } from "@/src/lib/formatDateTimeIst";

export function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
