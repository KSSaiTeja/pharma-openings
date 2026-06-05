import { JOB_MODULES, JOB_TYPES, QUALIFICATIONS } from "../admin-constants";

const MODULE_BY_LOWER = new Map(JOB_MODULES.map((m) => [m.toLowerCase(), m]));

/** Normalize one module token (API, OSD, Injectables, …). */
function normalizeModuleToken(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const exact = MODULE_BY_LOWER.get(s.toLowerCase());
  if (exact) return exact;
  const upper = s.toUpperCase();
  if (upper === "API") return "API";
  if (upper === "OSD") return "OSD";
  if (/^injectable/i.test(s)) return "Injectables";
  if (/^other/i.test(s)) return "Others";
  return s;
}

/**
 * CSV/form module field: comma-separated values become "OSD, API" (deduped).
 * Unknown tokens are kept so imports are not silently dropped.
 */
export function normalizeJobModuleField(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Others";

  const segments = trimmed
    .split(/[,;|]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (segments.length === 0) return "Others";

  const normalized = segments.map(normalizeModuleToken).filter(Boolean);
  const unique = [...new Set(normalized)];
  return unique.length > 0 ? unique.join(", ") : "Others";
}

/** Preserve free-text qualifications from CSV; only normalize exact enum matches. */
export function normalizeJobQualificationField(raw: string): string {
  const s = raw.trim();
  if (!s) return "Any";

  const exact = QUALIFICATIONS.find((q) => q.toLowerCase() === s.toLowerCase());
  if (exact) return exact;

  return s;
}

export function normalizeJobTypeField(raw: string): (typeof JOB_TYPES)[number] {
  const s = raw.trim();
  if ((JOB_TYPES as readonly string[]).includes(s)) return s as (typeof JOB_TYPES)[number];
  const lower = s.toLowerCase();
  if (lower === "full time" || lower === "fulltime") return "Full-time";
  if (lower === "part time" || lower === "parttime") return "Part-time";
  if (lower === "contract") return "Contract";
  return "Full-time";
}

export const JOB_MODULE_SUGGESTIONS = [...JOB_MODULES];
export const JOB_QUALIFICATION_SUGGESTIONS = [...QUALIFICATIONS];
