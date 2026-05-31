import { createHash } from "node:crypto";

import type { JobFitScoreResult, JobFitScoreTier } from "@/src/lib/jobFitScore.mock";

import type {
  JobFitAiPayload,
  JobFitBatchPayload,
  JobFitCacheStatus,
  JobFitScoreMap,
  JobFitScoreResponse,
} from "./types";

type RawGroqResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type CachedValue = {
  value: JobFitScoreResult;
  expiresAt: number;
};

type CounterValue = {
  count: number;
  windowStart: number;
};

const FIT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const MAX_PROMPT_JOB_DESC_CHARS = 1400;
const MAX_PROMPT_TEXT_CHARS = 120;
const REQUEST_TIMEOUT_MS = 9000;
const RATE_IP_WINDOW_MS = 60_000;
const RATE_IP_MAX = 24;
const RATE_CANDIDATE_WINDOW_MS = 60_000;
const RATE_CANDIDATE_MAX = 16;
const MAX_BATCH_JOBS = 24;

const fitCache = new Map<string, CachedValue>();
const inflight = new Map<string, Promise<JobFitScoreResult>>();
const ipCounters = new Map<string, CounterValue>();
const candidateCounters = new Map<string, CounterValue>();

export class JobFitRateLimitError extends Error {
  retryAfterSec: number;

  constructor(message: string, retryAfterSec: number) {
    super(message);
    this.name = "JobFitRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 60;
  return Math.min(98, Math.max(35, Math.round(value)));
}

function trimText(value: string | null | undefined, max = MAX_PROMPT_TEXT_CHARS): string | null {
  const v = value?.trim();
  if (!v) return null;
  return v.length > max ? `${v.slice(0, max)}…` : v;
}

export function normalizeJobFitPayload(payload: JobFitAiPayload): JobFitAiPayload {
  return {
    candidate: {
      id: payload.candidate.id.trim(),
      profileVersion: trimText(payload.candidate.profileVersion, 40),
      highestQualification: trimText(payload.candidate.highestQualification),
      currentDesignation: trimText(payload.candidate.currentDesignation),
      currentDepartment: trimText(payload.candidate.currentDepartment),
      currentSubDepartment: trimText(payload.candidate.currentSubDepartment),
      currentCompany: trimText(payload.candidate.currentCompany, 80),
      preferredLocation: trimText(payload.candidate.preferredLocation),
      preferredModules: Array.isArray(payload.candidate.preferredModules)
        ? payload.candidate.preferredModules
            .map((v) => trimText(v, 36))
            .filter((v): v is string => Boolean(v))
            .slice(0, 6)
        : null,
      noticePeriod: trimText(payload.candidate.noticePeriod, 36),
      hasResume: Boolean(payload.candidate.hasResume),
    },
    job: {
      jobId: payload.job.jobId.trim(),
      title: trimText(payload.job.title, 90) ?? payload.job.title,
      department: trimText(payload.job.department),
      module: trimText(payload.job.module),
      qualification: trimText(payload.job.qualification),
      location: trimText(payload.job.location),
      jobType: trimText(payload.job.jobType, 40),
      description: trimText(payload.job.description, MAX_PROMPT_JOB_DESC_CHARS),
    },
  };
}

function payloadCacheKey(payload: JobFitAiPayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function nowMs(): number {
  return Date.now();
}

function incrementRate(
  counterMap: Map<string, CounterValue>,
  key: string,
  limit: number,
  windowMs: number,
  incrementBy = 1,
): { allowed: boolean; retryAfterSec: number } {
  const now = nowMs();
  const current = counterMap.get(key);
  if (!current || now - current.windowStart >= windowMs) {
    counterMap.set(key, { count: incrementBy, windowStart: now });
    return { allowed: true, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  current.count += incrementBy;
  counterMap.set(key, current);
  if (current.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - current.windowStart)) / 1000));
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true, retryAfterSec: 1 };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out")), timeoutMs);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

function getCached(cacheKey: string): JobFitScoreResult | null {
  const entry = fitCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    fitCache.delete(cacheKey);
    return null;
  }
  return entry.value;
}

function setCached(cacheKey: string, value: JobFitScoreResult): void {
  fitCache.set(cacheKey, { value, expiresAt: nowMs() + FIT_CACHE_TTL_MS });
}

function normalizeTier(score: number, rawTier?: string): JobFitScoreTier {
  if (rawTier === "strong" || rawTier === "good" || rawTier === "fair" || rawTier === "low") {
    return rawTier;
  }
  if (score >= 80) return "strong";
  if (score >= 65) return "good";
  if (score >= 50) return "fair";
  return "low";
}

function sanitizeImprovements(raw: unknown): JobFitScoreResult["improvements"] {
  if (!Array.isArray(raw)) {
    return [
      {
        id: "profile-completion",
        title: "Complete profile details",
        detail: "Fill all profile fields to improve matching confidence.",
        pointsGain: 5,
      },
      {
        id: "qualification",
        title: "Review qualification details",
        detail: "Confirm your qualification and specialization are up to date.",
        pointsGain: 4,
      },
      {
        id: "module",
        title: "Add relevant preferred modules",
        detail: "Include the modules you are open to for better ranking.",
        pointsGain: 4,
      },
    ];
  }

  const cleaned = raw
    .map((item, idx) => {
      const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
      const title = typeof obj?.title === "string" ? obj.title.trim() : "";
      const detail = typeof obj?.detail === "string" ? obj.detail.trim() : "";
      const idRaw = typeof obj?.id === "string" ? obj.id.trim() : `improvement-${idx + 1}`;
      const pointsRaw = typeof obj?.pointsGain === "number" ? obj.pointsGain : 4;
      if (!title) return null;
      return {
        id: idRaw || `improvement-${idx + 1}`,
        title,
        detail: detail || "Update this section in your profile to increase role match quality.",
        pointsGain: Math.min(12, Math.max(1, Math.round(pointsRaw))),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 3);

  while (cleaned.length < 3) {
    cleaned.push({
      id: `fallback-${cleaned.length + 1}`,
      title: "Improve profile completeness",
      detail: "Add missing profile data for a more accurate role match.",
      pointsGain: 3,
    });
  }

  return [cleaned[0], cleaned[1], cleaned[2]];
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // Continue with extraction fallback.
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  return null;
}

function buildPrompt(payload: JobFitAiPayload): string {
  const { candidate, job } = payload;
  return [
    "Score candidate-job fit for a pharma hiring platform.",
    "Return strict JSON with this shape only:",
    '{ "score": number, "tier": "strong"|"good"|"fair"|"low", "improvements": [{ "id": string, "title": string, "detail": string, "pointsGain": number }] }',
    "Scoring rubric (use full range; avoid giving similar scores to different jobs):",
    "- 85-96: strong match on department, module, location, qualification, sub-department, and role focus",
    "- 65-82: partial match with clear gaps",
    "- 45-64: weak match (1-2 dimensions only)",
    "- 35-44: poor match (wrong department/module/location or unrelated function)",
    "Differentiate jobs clearly. If department/module/location conflict, score must be <= 55.",
    "If profile aligns with job description keywords and validation/GxP scope, score higher.",
    "Rules:",
    "- score between 35 and 98",
    "- exactly 3 improvements",
    "- improvements must be specific to THIS job vs candidate gaps",
    "- pointsGain between 1 and 12",
    "- short titles only",
    "- JSON only, no markdown",
    "",
    "Candidate profile:",
    JSON.stringify(candidate),
    "",
    "Job context:",
    JSON.stringify(job),
  ].join("\n");
}

async function callGroq(normalizedPayload: JobFitAiPayload): Promise<JobFitScoreResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  const groqRes = await withTimeout(
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        max_tokens: 280,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a strict pharma recruitment scoring engine. Penalize department/module/location mismatches heavily. Reward exact profile alignment. Return JSON only.",
          },
          {
            role: "user",
            content: buildPrompt(normalizedPayload),
          },
        ],
      }),
    }),
    REQUEST_TIMEOUT_MS,
  );

  if (!groqRes.ok) {
    throw new Error(await groqRes.text());
  }

  const groqJson = (await groqRes.json()) as RawGroqResponse;
  const content = groqJson.choices?.[0]?.message?.content ?? "";
  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error("Invalid AI response format");
  }

  const rawScore = typeof parsed.score === "number" ? parsed.score : 60;
  const score = clampScore(rawScore);
  const tier = normalizeTier(score, typeof parsed.tier === "string" ? parsed.tier : undefined);
  const improvements = sanitizeImprovements(parsed.improvements);
  return { score, tier, improvements };
}

export function assertJobFitRateLimits(ip: string, candidateId: string, weight = 1): void {
  const ipRate = incrementRate(ipCounters, ip, RATE_IP_MAX, RATE_IP_WINDOW_MS, weight);
  if (!ipRate.allowed) {
    throw new JobFitRateLimitError("Rate limit exceeded for IP", ipRate.retryAfterSec);
  }

  const candidateRate = incrementRate(
    candidateCounters,
    candidateId,
    RATE_CANDIDATE_MAX,
    RATE_CANDIDATE_WINDOW_MS,
    weight,
  );
  if (!candidateRate.allowed) {
    throw new JobFitRateLimitError("Rate limit exceeded for candidate", candidateRate.retryAfterSec);
  }
}

export async function scoreJobFit(payload: JobFitAiPayload): Promise<JobFitScoreResponse> {
  const normalizedPayload = normalizeJobFitPayload(payload);
  const cacheKey = payloadCacheKey(normalizedPayload);
  const cached = getCached(cacheKey);
  if (cached) {
    return { result: cached, cache: "HIT" };
  }

  if (inflight.has(cacheKey)) {
    const joined = await inflight.get(cacheKey)!;
    return { result: joined, cache: "DEDUPED" };
  }

  const promise = callGroq(normalizedPayload);
  inflight.set(cacheKey, promise);

  try {
    const result = await promise;
    setCached(cacheKey, result);
    return { result, cache: "MISS" };
  } finally {
    inflight.delete(cacheKey);
  }
}

export async function scoreJobFitBatch(payload: JobFitBatchPayload): Promise<JobFitScoreMap> {
  const jobs = payload.jobs.slice(0, MAX_BATCH_JOBS);
  const scores: JobFitScoreMap = {};

  await Promise.all(
    jobs.map(async (job) => {
      try {
        const { result } = await scoreJobFit({
          candidate: payload.candidate,
          job,
        });
        scores[job.jobId] = result;
      } catch {
        // Skip failed job scores; client falls back to mock per card.
      }
    }),
  );

  return scores;
}

export { MAX_BATCH_JOBS };
