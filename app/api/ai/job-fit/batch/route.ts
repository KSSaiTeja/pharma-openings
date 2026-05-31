import { NextRequest, NextResponse } from "next/server";

import {
  assertJobFitRateLimits,
  JobFitRateLimitError,
  MAX_BATCH_JOBS,
  scoreJobFitBatch,
} from "@/src/lib/jobFitAi/server";
import type { JobFitBatchPayload } from "@/src/lib/jobFitAi/types";

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

  let payload: JobFitBatchPayload;
  try {
    payload = (await request.json()) as JobFitBatchPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload?.candidate?.id || !Array.isArray(payload.jobs) || payload.jobs.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const jobs = payload.jobs.slice(0, MAX_BATCH_JOBS);

  try {
    assertJobFitRateLimits(getClientIp(request), payload.candidate.id.trim(), 1);
    const scores = await scoreJobFitBatch({
      candidate: payload.candidate,
      jobs,
    });
    return NextResponse.json(
      { scores },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=0, s-maxage=0",
        },
      },
    );
  } catch (error) {
    if (error instanceof JobFitRateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSec) } },
      );
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Groq batch request failed", detail }, { status: 502 });
  }
}
