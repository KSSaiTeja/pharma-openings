/**
 * Shared Google Sheets helpers for edge functions.
 * Env: GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_KEY (JSON string).
 */

import { formatDateTimeIst } from "./formatDateTimeIst.ts";

export const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const der = Uint8Array.from(atob(sanitizePem(privateKeyPem)), (c) => c.charCodeAt(0));
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
    await sleep(500 * 2 ** attempt);
    attempt += 1;
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

export function parseGoogleServiceAccount(raw: string): GoogleServiceAccount {
  const parsed = JSON.parse(raw) as GoogleServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key");
  }
  return parsed;
}

export async function getGoogleAccessToken(serviceAccount: GoogleServiceAccount): Promise<string> {
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

export async function googleSheetsRequest(
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

function columnIndexToA1(colIndex0: number): string {
  let n = colIndex0 + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export async function ensureTabExists(
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
        requests: [{ addSheet: { properties: { title: tabName } } }],
      }),
    },
  );
  if (!addRes.ok) {
    const details = await addRes.text().catch(() => "");
    throw new Error(`Failed to create tab "${tabName}" (${addRes.status}): ${details}`);
  }
}

export async function ensureHeaderRow(
  spreadsheetId: string,
  tabName: string,
  headers: string[],
  accessToken: string,
): Promise<void> {
  const lastCol = columnIndexToA1(headers.length - 1);
  const range = encodeURIComponent(`${tabName}!A1:${lastCol}1`);
  const getRes = await googleSheetsRequest(
    accessToken,
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}`,
  );
  const row = getRes.ok
    ? ((await getRes.json()) as { values?: string[][] }).values?.[0]
    : undefined;
  const a1 = row?.[0] != null ? String(row[0]).trim() : "";

  if (a1 === headers[0]) return;

  if (a1 === "") {
    const putRes = await googleSheetsRequest(
      accessToken,
      `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [headers] }),
      },
    );
    if (!putRes.ok) {
      const details = await putRes.text().catch(() => "");
      throw new Error(`Failed to write "${tabName}" header row (${putRes.status}): ${details}`);
    }
    return;
  }

  throw new Error(
    `The "${tabName}" sheet must have "${headers[0]}" in cell A1. Clear the tab or rename it, then try again.`,
  );
}

export async function appendRowsToTab(
  spreadsheetId: string,
  tabName: string,
  rows: string[][],
  accessToken: string,
): Promise<void> {
  if (rows.length === 0) return;
  const range = encodeURIComponent(`${tabName}!A:Z`);
  const url =
    `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const appendRes = await googleSheetsRequest(accessToken, url, {
    method: "POST",
    body: JSON.stringify({ values: rows }),
  });
  if (!appendRes.ok) {
    const details = await appendRes.text().catch(() => "");
    throw new Error(`Failed to append to "${tabName}" (${appendRes.status}): ${details}`);
  }
}

export function formatSubmissionTimestamp(): string {
  return formatDateTimeIst(new Date().toISOString());
}
