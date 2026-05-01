import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APPLICATIONS_TAB = "Applications";
const TALENT_POOL_TAB = "Talent Pool";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

const APPLICATION_ID_HEADER = "Application ID";

const APPLICATIONS_HEADERS = [
  APPLICATION_ID_HEADER,
  "Timestamp",
  "Full Name",
  "Email",
  "Mobile",
  "Current Designation",
  "Current Dept",
  "Current Company",
  "Highest Qualification",
  "Module",
  "Applied For (Job Title)",
  "Job Location",
  "Status",
  "Resume Link",
];

const CANDIDATE_ID_HEADER = "Candidate ID";

const TALENT_POOL_HEADERS = [
  CANDIDATE_ID_HEADER,
  "Registered Date",
  "Full Name",
  "Email",
  "Mobile",
  "Current Designation",
  "Current Dept",
  "Current Company",
  "Highest Qualification",
  "Preferred Modules",
  "Resume Link",
];

const FETCH_IDS_CHUNK = 200;

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
};

type ApplicationRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  mobile: string;
  current_designation: string | null;
  current_department: string | null;
  current_company: string | null;
  highest_qualification: string | null;
  resume_url: string | null;
  snapshot_designation: string | null;
  snapshot_department: string | null;
  snapshot_company: string | null;
  snapshot_qualification: string | null;
  snapshot_resume_url: string | null;
  status: string;
  jobs:
    | {
        title: string | null;
        location: string | null;
        module: string | null;
      }
    | {
        title: string | null;
        location: string | null;
        module: string | null;
      }[]
    | null;
  candidates:
    | {
        current_designation: string | null;
        current_department: string | null;
        current_company: string | null;
        highest_qualification: string | null;
        resume_url: string | null;
      }
    | {
        current_designation: string | null;
        current_department: string | null;
        current_company: string | null;
        highest_qualification: string | null;
        resume_url: string | null;
      }[]
    | null;
};

type TalentPoolCandidateRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  mobile: string;
  current_designation: string | null;
  current_department: string | null;
  current_company: string | null;
  highest_qualification: string | null;
  preferred_modules: string[] | null;
  resume_url: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function classifySyncError(message: string): "rate_limit" | "partial_sync" | "network" | "unknown" {
  const normalized = message.toLowerCase();
  if (normalized.includes("429") || normalized.includes("rate limit")) return "rate_limit";
  if (normalized.includes("partial")) return "partial_sync";
  if (normalized.includes("network") || normalized.includes("timeout") || normalized.includes("failed to fetch")) {
    return "network";
  }
  return "unknown";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDisplay(value: string | null | undefined): string {
  return typeof value === "string" ? value : "";
}

/** Normalize application UUIDs for dedupe (Postgres may return mixed case). */
function normalizeAppId(id: string): string {
  return id.trim().toLowerCase();
}

function isApplicationUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

function sanitizePem(pem: string): string {
  return pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeText(text: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(text));
}

async function signRs256(message: string, privateKeyPem: string): Promise<string> {
  const der = Uint8Array.from(atob(sanitizePem(privateKeyPem)), (c) =>
    c.charCodeAt(0)
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(message),
  );
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

async function buildGoogleJwt(serviceAccount: GoogleServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const encodedHeader = base64UrlEncodeText(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await signRs256(toSign, serviceAccount.private_key);
  return `${toSign}.${signature}`;
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(input, init);
      if (response.status !== 429 && (response.status < 500 || response.status > 599)) {
        return response;
      }
      if (attempt === maxRetries) return response;
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
    }

    const backoffMs = 500 * 2 ** attempt;
    await sleep(backoffMs);
    attempt += 1;
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

async function getGoogleAccessToken(serviceAccount: GoogleServiceAccount): Promise<string> {
  const assertion = await buildGoogleJwt(serviceAccount);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetchWithRetry(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Failed to get Google access token (${res.status}): ${details}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google auth response missing access_token");
  }
  return data.access_token;
}

async function googleSheetsRequest(
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetchWithRetry(url, { ...init, headers });
}

async function ensureTabExists(
  spreadsheetId: string,
  tabName: string,
  accessToken: string,
): Promise<void> {
  const getRes = await googleSheetsRequest(
    accessToken,
    `${GOOGLE_SHEETS_API}/${spreadsheetId}?fields=sheets.properties.title`,
  );

  if (getRes.status === 404) {
    throw new Error("Spreadsheet not found. Check GOOGLE_SHEETS_SPREADSHEET_ID.");
  }
  if (!getRes.ok) {
    const details = await getRes.text().catch(() => "");
    throw new Error(`Failed to read spreadsheet metadata (${getRes.status}): ${details}`);
  }

  const meta = (await getRes.json()) as {
    sheets?: { properties?: { title?: string } }[];
  };

  const exists = (meta.sheets ?? []).some((sheet) => sheet.properties?.title === tabName);
  if (exists) return;

  const addRes = await googleSheetsRequest(
    accessToken,
    `${GOOGLE_SHEETS_API}/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: tabName },
            },
          },
        ],
      }),
    },
  );
  if (!addRes.ok) {
    const details = await addRes.text().catch(() => "");
    throw new Error(`Failed to create missing tab "${tabName}" (${addRes.status}): ${details}`);
  }
}

async function ensureApplicationsHeaderRow(
  spreadsheetId: string,
  accessToken: string,
): Promise<void> {
  const range = encodeURIComponent(`${APPLICATIONS_TAB}!A1:M1`);
  const getRes = await googleSheetsRequest(
    accessToken,
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}`,
  );
  const row = getRes.ok
    ? ((await getRes.json()) as { values?: string[][] }).values?.[0]
    : undefined;
  const a1 = row?.[0] != null ? String(row[0]).trim() : "";

  if (a1 === APPLICATION_ID_HEADER) return;

  if (a1 === "") {
    const putRes = await googleSheetsRequest(
      accessToken,
      `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [APPLICATIONS_HEADERS] }),
      },
    );
    if (!putRes.ok) {
      const details = await putRes.text().catch(() => "");
      throw new Error(`Failed to write header row (${putRes.status}): ${details}`);
    }
    return;
  }

  throw new Error(
    `The "${APPLICATIONS_TAB}" sheet must use the new header with "${APPLICATION_ID_HEADER}" in cell A1. ` +
      "Clear this tab (or use a new spreadsheet), then sync again. Old sheets started with Timestamp in A1 are not compatible.",
  );
}

async function readExistingApplicationIdsFromSheet(
  spreadsheetId: string,
  accessToken: string,
): Promise<Set<string>> {
  const range = encodeURIComponent(`${APPLICATIONS_TAB}!A2:A`);
  const getRes = await googleSheetsRequest(
    accessToken,
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}`,
  );
  if (!getRes.ok) {
    const details = await getRes.text().catch(() => "");
    throw new Error(`Failed to read existing Application IDs (${getRes.status}): ${details}`);
  }
  const body = (await getRes.json()) as { values?: string[][] };
  const set = new Set<string>();
  for (const row of body.values ?? []) {
    const cell = row[0];
    if (typeof cell === "string" && isApplicationUuid(cell)) {
      set.add(normalizeAppId(cell));
    }
  }
  return set;
}

async function appendApplicationsRows(
  spreadsheetId: string,
  rows: string[][],
  accessToken: string,
): Promise<void> {
  if (rows.length === 0) return;
  const range = encodeURIComponent(`${APPLICATIONS_TAB}!A:Z`);
  const url =
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const appendRes = await googleSheetsRequest(accessToken, url, {
    method: "POST",
    body: JSON.stringify({ values: rows }),
  });
  if (!appendRes.ok) {
    const details = await appendRes.text().catch(() => "");
    throw new Error(`Failed to append Applications rows (${appendRes.status}): ${details}`);
  }
}

async function ensureTalentPoolHeaderRow(
  spreadsheetId: string,
  accessToken: string,
): Promise<void> {
  const range = encodeURIComponent(`${TALENT_POOL_TAB}!A1:K1`);
  const getRes = await googleSheetsRequest(
    accessToken,
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}`,
  );
  const row = getRes.ok
    ? ((await getRes.json()) as { values?: string[][] }).values?.[0]
    : undefined;
  const a1 = row?.[0] != null ? String(row[0]).trim() : "";

  if (a1 === CANDIDATE_ID_HEADER) return;

  if (a1 === "") {
    const putRes = await googleSheetsRequest(
      accessToken,
      `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [TALENT_POOL_HEADERS] }),
      },
    );
    if (!putRes.ok) {
      const details = await putRes.text().catch(() => "");
      throw new Error(`Failed to write Talent Pool header row (${putRes.status}): ${details}`);
    }
    return;
  }

  throw new Error(
    `The "${TALENT_POOL_TAB}" sheet must use the new header with "${CANDIDATE_ID_HEADER}" in cell A1. ` +
      "Clear this tab (or use a new spreadsheet), then sync again. Old sheets started with Registered Date in A1 are not compatible.",
  );
}

async function readExistingCandidateIdsFromSheet(
  spreadsheetId: string,
  accessToken: string,
): Promise<Set<string>> {
  const range = encodeURIComponent(`${TALENT_POOL_TAB}!A2:A`);
  const getRes = await googleSheetsRequest(
    accessToken,
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}`,
  );
  if (!getRes.ok) {
    const details = await getRes.text().catch(() => "");
    throw new Error(`Failed to read existing Candidate IDs (${getRes.status}): ${details}`);
  }
  const body = (await getRes.json()) as { values?: string[][] };
  const set = new Set<string>();
  for (const row of body.values ?? []) {
    const cell = row[0];
    if (typeof cell === "string" && isApplicationUuid(cell)) {
      set.add(normalizeAppId(cell));
    }
  }
  return set;
}

async function appendTalentPoolRows(
  spreadsheetId: string,
  rows: string[][],
  accessToken: string,
): Promise<void> {
  if (rows.length === 0) return;
  const range = encodeURIComponent(`${TALENT_POOL_TAB}!A:Z`);
  const url =
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const appendRes = await googleSheetsRequest(accessToken, url, {
    method: "POST",
    body: JSON.stringify({ values: rows }),
  });
  if (!appendRes.ok) {
    const details = await appendRes.text().catch(() => "");
    throw new Error(`Failed to append Talent Pool rows (${appendRes.status}): ${details}`);
  }
}

function talentPoolCandidateToValues(c: TalentPoolCandidateRow): string[] {
  return [
    toDisplay(c.id),
    toDisplay(c.created_at),
    toDisplay(c.full_name),
    toDisplay(c.email),
    toDisplay(c.mobile),
    toDisplay(c.current_designation),
    toDisplay(c.current_department),
    toDisplay(c.current_company),
    toDisplay(c.highest_qualification),
    (c.preferred_modules ?? []).join(", "),
    toDisplay(c.resume_url),
  ];
}

function applicationToValues(app: ApplicationRow): string[] {
  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  const candidate = Array.isArray(app.candidates) ? app.candidates[0] : app.candidates;
  const designation = app.current_designation ?? app.snapshot_designation ?? candidate?.current_designation ?? "";
  const dept = app.current_department ?? app.snapshot_department ?? candidate?.current_department ?? "";
  const company = app.current_company ?? app.snapshot_company ?? candidate?.current_company ?? "";
  const qualification = app.highest_qualification ?? app.snapshot_qualification ?? candidate?.highest_qualification ?? "";
  const resume = app.resume_url ?? app.snapshot_resume_url ?? candidate?.resume_url ?? "";

  return [
    toDisplay(app.id),
    toDisplay(app.created_at),
    toDisplay(app.full_name),
    toDisplay(app.email),
    toDisplay(app.mobile),
    toDisplay(designation),
    toDisplay(dept),
    toDisplay(company),
    toDisplay(qualification),
    toDisplay(job?.module ?? ""),
    toDisplay(job?.title ?? ""),
    toDisplay(job?.location ?? ""),
    toDisplay(app.status),
    toDisplay(resume),
  ];
}

async function parseServiceAccount(raw: string): Promise<GoogleServiceAccount> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY must be valid JSON.");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { client_email?: unknown }).client_email !== "string" ||
    typeof (parsed as { private_key?: unknown }).private_key !== "string"
  ) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email/private_key.");
  }
  return {
    client_email: (parsed as { client_email: string }).client_email,
    private_key: (parsed as { private_key: string }).private_key,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const spreadsheetId = Deno.env.get("GOOGLE_SHEETS_SPREADSHEET_ID") ?? "";
  const serviceAccountRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !spreadsheetId || !serviceAccountRaw) {
    return json({ success: false, error: "Server misconfigured for sheets sync" }, 500);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const scope: "applications" | "talent_pool" = body.scope === "talent_pool" ? "talent_pool" : "applications";

  const pageRaw = body.page;
  const page =
    typeof pageRaw === "number" && Number.isFinite(pageRaw) && pageRaw >= 1
      ? Math.floor(pageRaw)
      : typeof pageRaw === "string" && /^\d+$/.test(pageRaw.trim())
        ? Math.max(1, parseInt(pageRaw.trim(), 10))
        : null;

  try {
    const serviceAccount = await parseServiceAccount(serviceAccountRaw);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    if (scope === "talent_pool") {
      const rawCandidateIds = body.candidate_ids;
      if (!Array.isArray(rawCandidateIds) || rawCandidateIds.length === 0) {
        return json(
          {
            success: false,
            error: "candidate_ids must be a non-empty array (current talent pool page).",
          },
          400,
        );
      }

      const candidateIds = rawCandidateIds.filter((x): x is string => typeof x === "string" && x.length > 0);
      if (candidateIds.length === 0) {
        return json({ success: false, error: "No valid candidate ids in candidate_ids." }, 400);
      }

      const candidateSelect = `
        id,
        created_at,
        full_name,
        email,
        mobile,
        current_designation,
        current_department,
        current_company,
        highest_qualification,
        preferred_modules,
        resume_url
      `;

      const byCand = new Map<string, TalentPoolCandidateRow>();
      for (let i = 0; i < candidateIds.length; i += FETCH_IDS_CHUNK) {
        const chunk = candidateIds.slice(i, i + FETCH_IDS_CHUNK);
        const { data, error: qErr } = await supabase
          .from("candidates")
          .select(candidateSelect)
          .in("id", chunk);
        if (qErr) {
          throw new Error(`Failed to load candidates: ${qErr.message}`);
        }
        for (const row of (data ?? []) as TalentPoolCandidateRow[]) {
          byCand.set(row.id, row);
        }
      }

      const orderedCandidates: TalentPoolCandidateRow[] = [];
      for (const id of candidateIds) {
        const row = byCand.get(id);
        if (row) orderedCandidates.push(row);
      }

      if (orderedCandidates.length === 0) {
        return json({ success: false, error: "No matching candidates found for the given ids." }, 404);
      }

      await ensureTabExists(spreadsheetId, TALENT_POOL_TAB, accessToken);
      await ensureTalentPoolHeaderRow(spreadsheetId, accessToken);
      const existingCand = await readExistingCandidateIdsFromSheet(spreadsheetId, accessToken);

      const toAppendCand = orderedCandidates.filter((c) => !existingCand.has(normalizeAppId(c.id)));
      const skippedCand = orderedCandidates.length - toAppendCand.length;
      const talentRows = toAppendCand.map(talentPoolCandidateToValues);

      await appendTalentPoolRows(spreadsheetId, talentRows, accessToken);

      return json({
        success: true,
        scope: "talent_pool",
        talent_pool_synced: talentRows.length,
        talent_pool_skipped_duplicates: skippedCand,
        talent_pool_on_page: orderedCandidates.length,
        page,
        applications_synced: 0,
        applications_skipped_duplicates: 0,
      });
    }

    const rawIds = body.application_ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return json(
        {
          success: false,
          error: "application_ids must be a non-empty array (current applications page).",
        },
        400,
      );
    }

    const applicationIds = rawIds.filter((x): x is string => typeof x === "string" && x.length > 0);
    if (applicationIds.length === 0) {
      return json({ success: false, error: "No valid application ids in application_ids." }, 400);
    }

    const select = `
        id,
        created_at,
        full_name,
        email,
        mobile,
        current_designation,
        current_department,
        current_company,
        highest_qualification,
        resume_url,
        snapshot_designation,
        snapshot_department,
        snapshot_company,
        snapshot_qualification,
        snapshot_resume_url,
        status,
        jobs (title, location, module),
        candidates (current_designation, current_department, current_company, highest_qualification, resume_url)
      `;

    const byId = new Map<string, ApplicationRow>();
    for (let i = 0; i < applicationIds.length; i += FETCH_IDS_CHUNK) {
      const chunk = applicationIds.slice(i, i + FETCH_IDS_CHUNK);
      const { data, error: qErr } = await supabase
        .from("applications")
        .select(select)
        .in("id", chunk);
      if (qErr) {
        throw new Error(`Failed to load applications: ${qErr.message}`);
      }
      for (const row of (data ?? []) as ApplicationRow[]) {
        byId.set(row.id, row);
      }
    }

    const ordered: ApplicationRow[] = [];
    for (const id of applicationIds) {
      const row = byId.get(id);
      if (row) ordered.push(row);
    }

    if (ordered.length === 0) {
      return json({ success: false, error: "No matching applications found for the given ids." }, 404);
    }

    await ensureTabExists(spreadsheetId, APPLICATIONS_TAB, accessToken);
    await ensureApplicationsHeaderRow(spreadsheetId, accessToken);
    const existingIds = await readExistingApplicationIdsFromSheet(spreadsheetId, accessToken);

    const toAppend = ordered.filter((app) => !existingIds.has(normalizeAppId(app.id)));
    const skippedDuplicates = ordered.length - toAppend.length;
    const valueRows = toAppend.map(applicationToValues);

    await appendApplicationsRows(spreadsheetId, valueRows, accessToken);

    return json({
      success: true,
      scope: "applications",
      applications_synced: valueRows.length,
      applications_skipped_duplicates: skippedDuplicates,
      applications_on_page: ordered.length,
      page,
      talent_pool_synced: 0,
      talent_pool_skipped_duplicates: 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sync failed. Google services unavailable. Retry later.";
    const kind = classifySyncError(message);
    const status = kind === "rate_limit" ? 429 : 500;
    console.error("sync-to-sheets failed", message);
    return json({ success: false, error: message, kind }, status);
  }
});
