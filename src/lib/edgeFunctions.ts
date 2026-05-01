type JsonRecord = Record<string, unknown>;

function getAnonKey(): string | null {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return key?.trim() ? key.trim() : null;
}

export function getSupabaseFunctionUrl(name: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/functions/v1/${name}`;
}

type InvokeOptions = {
  accessToken?: string;
  signal?: AbortSignal;
};

export async function invokeSupabaseFunction<T extends JsonRecord>(
  name: string,
  body: JsonRecord,
  options: InvokeOptions = {},
): Promise<{ data: T | null; error: string | null; status: number | null }> {
  const url = getSupabaseFunctionUrl(name);
  const anon = getAnonKey();
  if (!url) {
    return { data: null, error: "Supabase is not configured", status: null };
  }
  if (!options.accessToken && !anon) {
    return { data: null, error: "Supabase is not configured", status: null };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  } else if (anon) {
    headers.Authorization = `Bearer ${anon}`;
  }
  if (anon) {
    headers.apikey = anon;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    return { data: null, error: message, status: null };
  }

  const json = (await res.json().catch(() => null)) as
    | T
    | { error?: string; detail?: string }
    | null;
  if (!res.ok) {
    const base =
      json && typeof json === "object" && "error" in json && typeof json.error === "string"
        ? json.error
        : `Request failed (${res.status})`;
    const detail =
      json && typeof json === "object" && "detail" in json && typeof json.detail === "string"
        ? json.detail
        : null;
    const message = detail ? `${base} (${detail})` : base;
    return { data: null, error: message, status: res.status };
  }

  return { data: json as T, error: null, status: res.status };
}
