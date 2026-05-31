import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getMobileForPoClientHeader } from "@/src/lib/authSession";
import { PO_VERIFIED_MOBILE_HEADER } from "@/src/lib/poClientHeaders";
import type { Database } from "@/types/database.types";

/** In-memory auth storage so this client never picks up Admin JWT from `localStorage`. */
function createEphemeralAuthStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} {
  const store = new Map<string, string>();
  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

/**
 * Public / candidate flows (register, apply, jobs): always uses the **anon** JWT.
 * - Isolated auth storage (no admin session).
 * - Custom `fetch` always sends `Authorization: Bearer <anon key>` so PostgREST never
 *   receives a stray **authenticated** JWT from another tab or legacy storage keys.
 */
const publicClientGlobal = globalThis as typeof globalThis & {
  __PO_SUPABASE_PUBLIC__?: SupabaseClient<Database> | null;
};

export function createSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    return null;
  }
  if (typeof window !== "undefined" && publicClientGlobal.__PO_SUPABASE_PUBLIC__) {
    return publicClientGlobal.__PO_SUPABASE_PUBLIC__;
  }
  const safeUrl = url.trim();
  const anonKey = key.trim();
  const fetchWithAnonRole: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers ?? undefined);
    headers.set("Authorization", `Bearer ${anonKey}`);
    headers.set("apikey", anonKey);
    const headerMobile = getMobileForPoClientHeader() ?? undefined;
    if (headerMobile) {
      headers.set(PO_VERIFIED_MOBILE_HEADER, headerMobile);
    }
    return fetch(input, { ...init, headers });
  };

  const client = createClient<Database>(safeUrl, anonKey, {
    global: { fetch: fetchWithAnonRole },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: createEphemeralAuthStorage(),
      storageKey: "po-public-supabase-auth",
    },
  });
  if (typeof window !== "undefined") {
    publicClientGlobal.__PO_SUPABASE_PUBLIC__ = client;
  }
  return client;
}

/** Clear invalid admin auth session (e.g. stale refresh token). */
export async function clearInvalidAdminSession(
  supabase: SupabaseClient<Database>,
): Promise<void> {
  try {
    const { error } = await supabase.auth.getSession();
    if (error?.message?.includes("Refresh Token")) {
      await supabase.auth.signOut();
    }
  } catch {
    await supabase.auth.signOut();
  }
}

const adminBrowserGlobal = globalThis as typeof globalThis & {
  __PO_SUPABASE_ADMIN_BROWSER__?: SupabaseClient<Database> | null;
};

/**
 * Admin dashboard: email/password session persisted under its own storage key.
 * Reuses one client per tab so GoTrue does not warn about duplicate instances
 * for the same `storageKey` (e.g. when hooks/effects call this many times).
 */
export function createSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    return null;
  }
  if (typeof window === "undefined") {
    return null;
  }
  const g = adminBrowserGlobal;
  if (!g.__PO_SUPABASE_ADMIN_BROWSER__) {
    g.__PO_SUPABASE_ADMIN_BROWSER__ = createClient<Database>(url.trim(), key.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "po-admin-supabase-auth",
      },
    });
  }
  return g.__PO_SUPABASE_ADMIN_BROWSER__;
}
