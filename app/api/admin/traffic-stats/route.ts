import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
  fetchGoatCounterDashboardStats,
  isGoatCounterApiConfigured,
  isGoatCounterTrackingConfigured,
} from "@/src/lib/goatcounter";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return false;

  const supabase = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  return !error && Boolean(data.user);
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoatCounterTrackingConfigured()) {
    return NextResponse.json(
      {
        error: "GoatCounter is not configured. Set NEXT_PUBLIC_GOATCOUNTER_SITE=pharma-openings in env.",
      },
      { status: 503 },
    );
  }

  if (!isGoatCounterApiConfigured()) {
    return NextResponse.json(
      {
        error:
          "GoatCounter API is not configured. Set GOATCOUNTER_API_TOKEN (Read statistics) in env alongside NEXT_PUBLIC_GOATCOUNTER_SITE.",
      },
      { status: 503 },
    );
  }

  const stats = await fetchGoatCounterDashboardStats();
  if (!stats) {
    return NextResponse.json({ error: "Could not load analytics from GoatCounter." }, { status: 502 });
  }

  return NextResponse.json(stats);
}
