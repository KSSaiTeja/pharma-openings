/** India Standard Time — used in admin UI, exports, and Google Sheets sync. */
export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Human-readable date/time for daily use, always in IST.
 * Example: `11 Apr 2026, 9:24 pm IST`
 */
export function formatDateTimeIst(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).trim();

  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${formatted} IST`;
}
