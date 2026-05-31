/** Keep in sync with `src/lib/formatDateTimeIst.ts` (Deno edge runtime). */
export const IST_TIMEZONE = "Asia/Kolkata";

export function formatDateTimeIst(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === "") return "";
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
