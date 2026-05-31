"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { candidateToFitInput, jobRowToFitInput } from "@/src/lib/jobFitAi/client";
import type { JobFitScoreMap } from "@/src/lib/jobFitAi/types";
import type { JobFitScoreResult } from "@/src/lib/jobFitScore.mock";
import { useCandidate } from "@/src/context/CandidateContext";
import type { JobRow } from "@/types/database.types";

type JobFitScoresContextValue = {
  enabled: boolean;
  loading: boolean;
  scores: JobFitScoreMap;
  getScore: (jobId: string) => JobFitScoreResult | null;
};

const JobFitScoresContext = createContext<JobFitScoresContextValue | undefined>(undefined);

function batchCacheKey(candidateId: string, profileVersion: string, jobIds: string[]): string {
  return `po_job_fit_batch:v1:${candidateId}:${profileVersion}:${jobIds.join(",")}`;
}

export function JobFitScoresProvider({
  jobs,
  children,
}: {
  jobs: JobRow[];
  children: React.ReactNode;
}) {
  const { candidate, isAuthenticated, loading: authLoading } = useCandidate();
  const [scores, setScores] = useState<JobFitScoreMap>({});
  const [loading, setLoading] = useState(false);

  const enabled = Boolean(!authLoading && isAuthenticated && candidate && jobs.length > 0);
  const jobIdsKey = useMemo(() => jobs.map((j) => j.id).join(","), [jobs]);

  useEffect(() => {
    if (!enabled || !candidate) {
      setScores({});
      setLoading(false);
      return;
    }

    const cacheKey = batchCacheKey(candidate.id, candidate.updated_at, jobs.map((j) => j.id));
    if (typeof window !== "undefined") {
      const cachedRaw = window.sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw) as JobFitScoreMap;
          if (parsed && typeof parsed === "object") {
            setScores(parsed);
          }
        } catch {
          // Ignore invalid cache.
        }
      }
    }

    const controller = new AbortController();
    setLoading(true);

    const run = async () => {
      try {
        const response = await fetch("/api/ai/job-fit/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            candidate: candidateToFitInput(candidate),
            jobs: jobs.map(jobRowToFitInput),
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { scores?: JobFitScoreMap };
        if (!data?.scores || typeof data.scores !== "object") return;

        setScores(data.scores);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(cacheKey, JSON.stringify(data.scores));
        }
      } catch {
        // Keep existing scores/mock fallback per card.
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => controller.abort();
  }, [candidate, enabled, jobIdsKey, jobs]);

  const getScore = useCallback((jobId: string) => scores[jobId] ?? null, [scores]);

  const value = useMemo(
    () => ({
      enabled,
      loading,
      scores,
      getScore,
    }),
    [enabled, getScore, loading, scores],
  );

  return <JobFitScoresContext.Provider value={value}>{children}</JobFitScoresContext.Provider>;
}

export function useJobFitScores() {
  const ctx = useContext(JobFitScoresContext);
  if (!ctx) {
    throw new Error("useJobFitScores must be used within JobFitScoresProvider");
  }
  return ctx;
}

export function useJobFitScoresOptional() {
  return useContext(JobFitScoresContext);
}
