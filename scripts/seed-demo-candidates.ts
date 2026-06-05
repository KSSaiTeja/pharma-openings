#!/usr/bin/env npx tsx
/**
 * Seed 60 demo candidate profiles into Supabase (Talent Pool).
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run seed:demo-candidates              # insert (skip existing mobiles)
 *   npm run seed:demo-candidates -- --clean   # delete demo rows first, then insert
 *   npm run seed:demo-candidates -- --export  # write data/demo-candidates-60.csv only
 *   npm run seed:demo-candidates -- --dry-run # print summary, no DB writes
 */

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildDemoCandidates, demoCandidatesToCsv } from "./generateDemoCandidates";
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

const args = new Set(process.argv.slice(2));
const doClean = args.has("--clean");
const doExport = args.has("--export");
const dryRun = args.has("--dry-run");

async function main(): Promise<void> {
  loadEnvLocal();

  const profiles = buildDemoCandidates(60);

  if (doExport || dryRun) {
    const csv = demoCandidatesToCsv(profiles);
    const outPath = resolve(process.cwd(), "data/demo-candidates-60.csv");
    mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
    writeFileSync(outPath, csv, "utf8");
    console.log(`Wrote ${profiles.length} profiles → ${outPath}`);
  }

  if (dryRun && !args.has("--export")) {
    console.log("\nSample (first 5):");
    profiles.slice(0, 5).forEach((p, i) => {
      console.log(
        `  ${i + 1}. ${p.full_name} · ${p.current_department} / ${p.current_sub_department} · ${p.preferred_modules.join(", ")} · ${p.preferred_location}`,
      );
    });
    console.log(`\nTotal: ${profiles.length} demo profiles (mobiles 9900100001–9900100060)`);
    return;
  }

  if (doExport && !args.has("--seed")) {
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const demoEmails = profiles.map((p) => p.email);

  if (doClean) {
    const { error: delErr, count } = await supabase
      .from("candidates")
      .delete({ count: "exact" })
      .like("email", "demo.profile.%@pharmaopenings.demo");
    if (delErr) {
      console.error("Clean failed:", delErr.message);
      process.exit(1);
    }
    console.log(`Removed ${count ?? 0} existing demo candidate(s).`);
  }

  const { data: existing } = await supabase.from("candidates").select("mobile, email").in("email", demoEmails);

  const existingEmails = new Set((existing ?? []).map((r) => r.email));
  const toInsert = profiles.filter((p) => !existingEmails.has(p.email));

  if (toInsert.length === 0) {
    console.log("All 60 demo profiles already exist. Use --clean to replace them.");
    return;
  }

  const rows = toInsert.map((p) => ({
    mobile: p.mobile,
    full_name: p.full_name,
    email: p.email,
    current_department: p.current_department,
    current_sub_department: p.current_sub_department,
    current_designation: p.current_designation,
    current_company: p.current_company,
    highest_qualification: p.highest_qualification,
    preferred_modules: p.preferred_modules,
    preferred_location: p.preferred_location,
    notice_period: p.notice_period,
    otp_verified: true,
    resume_url: null,
    department_custom: null,
    sub_department_custom: null,
    designation_custom: null,
  }));

  const chunk = 20;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supabase.from("candidates").insert(slice);
    if (error) {
      console.error(`Insert failed at row ${i + 1}:`, error.message);
      process.exit(1);
    }
    inserted += slice.length;
    console.log(`Inserted ${inserted} / ${rows.length}…`);
  }

  console.log(`\nDone. ${inserted} demo candidate(s) added to Talent Pool.`);
  console.log("Open Admin → Dashboard → Talent Pool and filter by module / qualification.");
  console.log("Demo mobiles: 9900100001–9900100060 · emails: demo.profile.*@pharmaopenings.demo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
