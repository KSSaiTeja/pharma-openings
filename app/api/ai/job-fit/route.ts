import { NextRequest, NextResponse } from "next/server";

import {
  assertJobFitRateLimits,
  JobFitRateLimitError,
  normalizeJobFitPayload,
  scoreJobFit,
} from "@/src/lib/jobFitAi/server";
import type { JobFitAiPayload } from "@/src/lib/jobFitAi/types";

export const runtime = "nodejs";

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 503 });
  }

  let payload: JobFitAiPayload;
  try {
    payload = (await request.json()) as JobFitAiPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload?.candidate?.id || !payload?.job?.jobId || !payload?.job?.title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalized = normalizeJobFitPayload(payload);

  try {
    assertJobFitRateLimits(getClientIp(request), normalized.candidate.id, 1);
    const { result, cache } = await scoreJobFit(normalized);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=0",
        "X-Fit-Cache": cache,
      },
    });
  } catch (error) {
    if (error instanceof JobFitRateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSec) } },
      );
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Groq request failed", detail }, { status: 502 });
  }
}
