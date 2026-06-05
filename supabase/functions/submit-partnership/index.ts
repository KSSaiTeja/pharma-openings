/**
 * Appends employer partnership enquiries to the "Partnerships" tab in Google Sheets.
 * Env: SUPABASE_URL (optional), GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_KEY
 */

import {
  appendRowsToTab,
  ensureHeaderRow,
  ensureTabExists,
  formatSubmissionTimestamp,
  getGoogleAccessToken,
  parseGoogleServiceAccount,
} from "../_shared/googleSheets.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PARTNERSHIPS_TAB = "Partnerships";

const PARTNERSHIPS_HEADERS = [
  "Timestamp",
  "Company Name",
  "Contact Name",
  "Work Email",
  "Phone",
  "Company Type",
  "Headquarters City",
  "Hiring Needs",
] as const;

const MAX_FIELD_LEN = 500;
const MAX_NEEDS_LEN = 2000;

type PartnershipBody = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  companyType?: string;
  city?: string;
  hiringNeeds?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function trimField(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const spreadsheetId = Deno.env.get("GOOGLE_SHEETS_SPREADSHEET_ID") ?? "";
  const serviceAccountRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY") ?? "";

  if (!spreadsheetId || !serviceAccountRaw) {
    return json({ success: false, error: "Partnership sync is not configured" }, 500);
  }

  let body: PartnershipBody;
  try {
    body = (await req.json()) as PartnershipBody;
  } catch {
    return json({ success: false, error: "Invalid request body" }, 400);
  }

  const companyName = trimField(body.companyName, MAX_FIELD_LEN);
  const contactName = trimField(body.contactName, MAX_FIELD_LEN);
  const email = trimField(body.email, MAX_FIELD_LEN).toLowerCase();
  const phone = trimField(body.phone, MAX_FIELD_LEN);
  const companyType = trimField(body.companyType, MAX_FIELD_LEN);
  const city = trimField(body.city, MAX_FIELD_LEN);
  const hiringNeeds = trimField(body.hiringNeeds, MAX_NEEDS_LEN);

  if (!companyName || !contactName || !email) {
    return json({
      success: false,
      error: "Company name, your name, and work email are required.",
    }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ success: false, error: "Please enter a valid work email address." }, 400);
  }

  try {
    const serviceAccount = parseGoogleServiceAccount(serviceAccountRaw);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    await ensureTabExists(spreadsheetId, PARTNERSHIPS_TAB, accessToken);
    await ensureHeaderRow(
      spreadsheetId,
      PARTNERSHIPS_TAB,
      [...PARTNERSHIPS_HEADERS],
      accessToken,
    );

    const row = [
      formatSubmissionTimestamp(),
      companyName,
      contactName,
      email,
      phone,
      companyType,
      city,
      hiringNeeds,
    ];

    await appendRowsToTab(spreadsheetId, PARTNERSHIPS_TAB, [row], accessToken);

    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save your request";
    console.error("submit-partnership failed", message);
    return json({ success: false, error: message }, 500);
  }
});
