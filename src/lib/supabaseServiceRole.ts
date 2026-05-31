import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

let serviceRoleClient: SupabaseClient<Database> | null | undefined;

/** Server-only Supabase client (service role). Never import from client components. */
export function createSupabaseServiceRoleClient(): SupabaseClient<Database> | null {
  if (serviceRoleClient !== undefined) {
    return serviceRoleClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    serviceRoleClient = null;
    return null;
  }

  serviceRoleClient = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serviceRoleClient;
}
