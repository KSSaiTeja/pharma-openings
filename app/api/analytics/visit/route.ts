import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { shouldTrackPath, SITE_VISITOR_COOKIE } from "@/src/lib/siteAnalytics";
import { createSupabaseServiceRoleClient } from "@/src/lib/supabaseServiceRole";

export const runtime = "nodejs";

const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type VisitBody = {
  path?: string;
};

function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram/i.test(
    userAgent,
  );
}

export async function POST(request: NextRequest) {
  if (isLikelyBot(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true, skipped: true, reason: "bot" });
  }

  let body: VisitBody;
  try {
    body = (await request.json()) as VisitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.trim() : "";
  if (!shouldTrackPath(path)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Analytics unavailable" }, { status: 503 });
  }

  const existingVisitorKey = request.cookies.get(SITE_VISITOR_COOKIE)?.value?.trim();
  const visitorKey = existingVisitorKey || randomUUID();
  const isNewVisitor = !existingVisitorKey;

  const { error } = await supabase.rpc("record_site_page_view", {
    p_visitor_key: visitorKey,
    p_path: path,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to record visit" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, isNewVisitor });
  if (isNewVisitor) {
    response.cookies.set(SITE_VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: VISITOR_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return response;
}
