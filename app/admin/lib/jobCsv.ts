import type { TablesInsert } from "@/types/database.types";

import { JOB_MODULES, JOB_TYPES, QUALIFICATIONS, type JobModule, type JobType, type Qualification } from "../admin-constants";
import { jobCsvMappedOutputSchema, type JobCsvMappedOutput } from "@/src/lib/schemas/csv";

export const JOB_CSV_TEMPLATE_HEADERS =
  "Title,Location,Department,Type,Module,Qualification Needed,Description";

function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, "");
}

/** Minimal CSV parser: supports quoted fields and commas inside quotes. */
export function parseCsvRows(text: string): string[][] {
  const t = stripBom(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '"') {
      if (inQuotes && t[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ",") {
      row.push(cur);
      cur = "";
      continue;
    }
    if (!inQuotes && (c === "\n" || c === "\r")) {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }
    cur += c;
  }
  row.push(cur);
  if (row.some((cell) => cell.trim().length > 0)) {
    rows.push(row);
  }
  return rows;
}

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

const HEADER_ALIASES: Record<string, keyof JobCsvMapped> = {
  title: "title",
  "job title": "title",
  location: "location",
  department: "department",
  type: "type",
  module: "module",
  "qualification needed": "qualificationNeeded",
  qualification: "qualificationNeeded",
  "qualification required": "qualificationNeeded",
  description: "description",
};

export type JobCsvMapped = JobCsvMappedOutput;

const MODULE_SET = new Set<string>(JOB_MODULES);
const TYPE_SET = new Set<string>(JOB_TYPES);
const QUAL_SET = new Set<string>(QUALIFICATIONS);

function normalizeModule(raw: string): JobModule {
  const s = raw.trim();
  if (MODULE_SET.has(s)) return s as JobModule;
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (MODULE_SET.has(cap)) return cap as JobModule;
  return "Others";
}

function normalizeType(raw: string): JobType {
  const s = raw.trim();
  if (TYPE_SET.has(s)) return s as JobType;
  const lower = s.toLowerCase();
  if (lower === "full time" || lower === "fulltime") return "Full-time";
  if (lower === "part time" || lower === "parttime") return "Part-time";
  if (lower === "contract") return "Contract";
  return "Full-time";
}

function normalizeQual(raw: string): Qualification {
  const s = raw.trim();
  if (QUAL_SET.has(s)) return s as Qualification;
  const found = QUALIFICATIONS.find((q) => q.toLowerCase() === s.toLowerCase());
  if (found) return found;
  return "Any";
}

export type JobCsvRowResult =
  | { ok: true; row: TablesInsert<"jobs"> }
  | { ok: false; reason: "empty_row" }
  | {
      ok: false;
      reason: "missing_required";
      missingFields: Array<"title" | "location" | "description">;
    }
  | {
      ok: false;
      reason: "invalid_data";
      message: string;
    };

type JobCsvSkipReason = "missing_required" | "empty_row" | "invalid_data";

export type JobCsvRowError = {
  rowNumber: number;
  reason: JobCsvSkipReason;
  message: string;
};

export type JobCsvParseSummary = {
  inserted: TablesInsert<"jobs">[];
  totalRows: number;
  skipped: number;
  skipReasons: { missing_required: number; empty_row: number; invalid_data: number };
  rowErrors: JobCsvRowError[];
  headerError: string | null;
};

export function mapCsvHeaders(headerRow: string[]): Record<number, keyof JobCsvMapped | null> {
  const map: Record<number, keyof JobCsvMapped | null> = {};
  headerRow.forEach((h, idx) => {
    const key = HEADER_ALIASES[normHeader(h)] ?? null;
    map[idx] = key;
  });
  return map;
}

export function rowToJobInsert(
  cells: string[],
  colMap: Record<number, keyof JobCsvMapped | null>,
): JobCsvRowResult {
  const acc: Partial<Record<keyof JobCsvMapped, string>> = {};
  cells.forEach((cell, i) => {
    const k = colMap[i];
    if (k) acc[k] = cell?.trim() ?? "";
  });
  const title = acc.title?.trim() ?? "";
  const location = acc.location?.trim() ?? "";
  const description = acc.description?.trim() ?? "";
  if (!title && !location && !description && !Object.values(acc).some((v) => v && String(v).trim())) {
    return { ok: false, reason: "empty_row" };
  }
  const missingFields: Array<"title" | "location" | "description"> = [];
  if (!title) missingFields.push("title");
  if (!location) missingFields.push("location");
  if (!description) missingFields.push("description");
  if (missingFields.length > 0) {
    return { ok: false, reason: "missing_required", missingFields };
  }
  const mapped = jobCsvMappedOutputSchema.safeParse({
    title,
    location,
    department: acc.department ?? "",
    type: normalizeType(acc.type ?? "Full-time"),
    module: normalizeModule(acc.module ?? "Others"),
    qualificationNeeded: normalizeQual(acc.qualificationNeeded ?? "Any"),
    description,
  });
  if (!mapped.success) {
    return { ok: false, reason: "invalid_data", message: mapped.error.issues[0]?.message ?? "Invalid row data" };
  }
  const normalized = mapped.data;
  return {
    ok: true,
    row: {
      title: normalized.title,
      location: normalized.location,
      department: normalized.department || null,
      type: normalized.type as JobType,
      module: normalized.module as JobModule,
      qualification_needed: normalized.qualificationNeeded as Qualification,
      description: normalized.description,
      is_active: true,
    },
  };
}

export function parseJobCsv(text: string): JobCsvParseSummary {
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    return {
      inserted: [],
      totalRows: 0,
      skipped: 0,
      skipReasons: { missing_required: 0, empty_row: 0, invalid_data: 0 },
      rowErrors: [],
      headerError: null,
    };
  }
  const header = rows[0];
  const colMap = mapCsvHeaders(header);
  const requiredColumns: Array<{ key: "title" | "location" | "description"; label: string }> = [
    { key: "title", label: "Title" },
    { key: "location", label: "Location" },
    { key: "description", label: "Description" },
  ];
  const mappedHeaderKeys = new Set(Object.values(colMap).filter((v): v is keyof JobCsvMapped => Boolean(v)));
  const missingRequiredColumns = requiredColumns.filter(({ key }) => !mappedHeaderKeys.has(key));
  if (missingRequiredColumns.length > 0) {
    const labels = missingRequiredColumns.map((c) => `'${c.label}'`).join(", ");
    return {
      inserted: [],
      totalRows: Math.max(rows.length - 1, 0),
      skipped: 0,
      skipReasons: { missing_required: 0, empty_row: 0, invalid_data: 0 },
      rowErrors: [],
      headerError: `Missing required column${missingRequiredColumns.length > 1 ? "s" : ""}: ${labels}.`,
    };
  }

  const inserted: TablesInsert<"jobs">[] = [];
  let skipped = 0;
  let missing_required = 0;
  let empty_row = 0;
  let invalid_data = 0;
  const rowErrors: JobCsvRowError[] = [];
  const fieldLabels: Record<"title" | "location" | "description", string> = {
    title: "Title",
    location: "Location",
    description: "Description",
  };
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const res = rowToJobInsert(cells, colMap);
    if (!res.ok) {
      if (res.reason === "missing_required") {
        skipped++;
        missing_required++;
        rowErrors.push({
          rowNumber: r + 1,
          reason: "missing_required",
          message: `Missing required field(s): ${res.missingFields.map((f) => fieldLabels[f]).join(", ")}`,
        });
      } else if (res.reason === "empty_row") {
        skipped++;
        empty_row++;
        rowErrors.push({
          rowNumber: r + 1,
          reason: "empty_row",
          message: "Empty row",
        });
      } else if (res.reason === "invalid_data") {
        skipped++;
        invalid_data++;
        rowErrors.push({
          rowNumber: r + 1,
          reason: "invalid_data",
          message: res.message,
        });
      }
      continue;
    }
    inserted.push(res.row);
  }
  return {
    inserted,
    totalRows: Math.max(rows.length - 1, 0),
    skipped,
    skipReasons: { missing_required, empty_row, invalid_data },
    rowErrors,
    headerError: null,
  };
}
