#!/usr/bin/env npx tsx
/**
 * Seed 60 demo job postings + write jobs CSV for bulk upload.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run seed:demo-jobs              # insert jobs + write CSV
 *   npm run seed:demo-jobs -- --export  # CSV only
 *   npm run seed:demo-jobs -- --clean   # wipe jobs, then insert 60 demos (list NOT empty after)
 *   npm run reset:jobs                  # delete ALL jobs and leave list empty
 */

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseJobCsv } from "../app/admin/lib/jobCsv";
import { buildDemoJobs, demoJobsToCsv } from "./generateDemoJobs";
import type { Database } from "../types/database.types";

function loadEnvLocal(): void {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const args = new Set(process.argv.slice(2));
  const doClean = args.has("--clean");
  const exportOnly = args.has("--export") && !args.has("--seed");

  const jobs = buildDemoJobs(60);
  const csv = demoJobsToCsv(jobs);
  const outPath = resolve(process.cwd(), "data/demo-jobs-60.csv");
  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(outPath, csv, "utf8");
  console.log(`Wrote ${jobs.length} jobs → ${outPath}`);

  const parsed = parseJobCsv(csv);
  if (parsed.headerError) {
    console.error("CSV validation failed:", parsed.headerError);
    process.exit(1);
  }
  if (parsed.inserted.length !== 60) {
    console.error(`Expected 60 valid rows, got ${parsed.inserted.length}. Skipped: ${parsed.skipped}`);
    process.exit(1);
  }

  if (exportOnly) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (doClean) {
    const { error, count } = await supabase
      .from("jobs")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.error("Clean failed:", error.message);
      process.exit(1);
    }
    console.log(`Removed ${count ?? 0} existing job(s).`);
  }

  const chunk = 25;
  let ok = 0;
  for (let i = 0; i < parsed.inserted.length; i += chunk) {
    const slice = parsed.inserted.slice(i, i + chunk);
    const { error } = await supabase.from("jobs").insert(slice);
    if (error) {
      console.error(`Insert failed after ${ok} rows:`, error.message);
      process.exit(1);
    }
    ok += slice.length;
    console.log(`Inserted ${ok} / ${parsed.inserted.length}…`);
  }

  console.log("\nDone. Upload the same file in Admin → Jobs → Bulk upload CSV, or use the rows already in the database.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
