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

export async function invokeSupabaseFunction<T extends JsonRecord>(
  name: string,
  body: JsonRecord,
): Promise<{ data: T | null; error: string | null }> {
  const url = getSupabaseFunctionUrl(name);
  const anon = getAnonKey();
  if (!url || !anon) {
    return { data: null, error: "Supabase is not configured" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anon}`,
      apikey: anon,
    },
    body: JSON.stringify(body),
  });

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
    return { data: null, error: message };
  }

  return { data: json as T, error: null };
}
