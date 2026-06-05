#!/usr/bin/env npx tsx
/**
 * Delete ALL jobs, applications, and candidates (talent pool) for a fresh start.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run reset:hiring-data
 *   npm run reset:hiring-data -- --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

async function deleteAll(
  supabase: ReturnType<typeof createClient<Database>>,
  table: "saved_jobs" | "applications" | "admin_candidate_notes" | "candidates" | "jobs",
  dryRun: boolean,
): Promise<number> {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true });

  if (dryRun) {
    console.log(`  ${table}: would delete ${count ?? 0} row(s)`);
    return count ?? 0;
  }

  const { error, count: deleted } = await supabase.from(table).delete({ count: "exact" }).neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }

  console.log(`  ${table}: deleted ${deleted ?? 0} row(s)`);
  return deleted ?? 0;
}

async function main(): Promise<void> {
  loadEnvLocal();
  const dryRun = process.argv.includes("--dry-run");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(dryRun ? "Dry run — no rows will be deleted:\n" : "Resetting hiring data…\n");

  // FK-safe order
  await deleteAll(supabase, "saved_jobs", dryRun);
  await deleteAll(supabase, "applications", dryRun);
  await deleteAll(supabase, "admin_candidate_notes", dryRun);
  await deleteAll(supabase, "candidates", dryRun);
  await deleteAll(supabase, "jobs", dryRun);

  console.log(dryRun ? "\nRe-run without --dry-run to apply." : "\nDone. Jobs, applications, and talent pool are empty.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
