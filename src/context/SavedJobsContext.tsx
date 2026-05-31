"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useCandidate } from "@/src/context/CandidateContext";
import { createSupabaseClient } from "@/src/lib/supabase";

export type SavedJobListEntry = {
  id: string;
  job_id: string;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    location: string;
    is_active: boolean;
  } | null;
};

type SavedJobsContextValue = {
  savedEntries: SavedJobListEntry[];
  savedJobIds: ReadonlySet<string>;
  loading: boolean;
  refreshSavedJobs: () => Promise<void>;
  toggleSave: (jobId: string) => Promise<{ ok: boolean; error?: string }>;
  isSaved: (jobId: string) => boolean;
};

const SavedJobsContext = createContext<SavedJobsContextValue | undefined>(undefined);

function isMissingSavedJobsTable(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    (error.message?.includes("saved_jobs") && error.message?.includes("schema cache"))
  );
}

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const { candidate, isAuthenticated } = useCandidate();
  const [savedEntries, setSavedEntries] = useState<SavedJobListEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshSavedJobs = useCallback(async () => {
    if (!candidate?.id) {
      setSavedEntries([]);
      return;
    }
    const supabase = createSupabaseClient();
    if (!supabase) {
      setSavedEntries([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_jobs")
      .select(
        `
        id,
        job_id,
        created_at,
        jobs (
          id,
          title,
          location,
          is_active
        )
      `,
      )
      .eq("candidate_id", candidate.id)
      .order("created_at", { ascending: false });

    if (error) {
      if (!isMissingSavedJobsTable(error)) {
        console.error(error);
      }
      setSavedEntries([]);
    } else {
      setSavedEntries((data as SavedJobListEntry[]) ?? []);
    }
    setLoading(false);
  }, [candidate?.id]);

  useEffect(() => {
    if (!isAuthenticated || !candidate?.id) {
      setSavedEntries([]);
      setLoading(false);
      return;
    }
    void refreshSavedJobs();
  }, [isAuthenticated, candidate?.id, refreshSavedJobs]);

  const savedJobIds = useMemo(
    () => new Set(savedEntries.map((e) => e.job_id)),
    [savedEntries],
  );

  const isSaved = useCallback(
    (jobId: string) => savedJobIds.has(jobId),
    [savedJobIds],
  );

  const toggleSave = useCallback(
    async (jobId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!candidate?.id) {
        return { ok: false, error: "Not signed in" };
      }
      const supabase = createSupabaseClient();
      if (!supabase) {
        return { ok: false, error: "Supabase is not configured." };
      }

      const currently = savedJobIds.has(jobId);

      if (currently) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("candidate_id", candidate.id)
          .eq("job_id", jobId);
        if (error) {
          if (isMissingSavedJobsTable(error)) {
            return { ok: false, error: "Saved jobs is not available yet." };
          }
          return { ok: false, error: error.message };
        }
        setSavedEntries((prev) => prev.filter((e) => e.job_id !== jobId));
        return { ok: true };
      }

      const { data, error } = await supabase
        .from("saved_jobs")
        .insert({ candidate_id: candidate.id, job_id: jobId })
        .select(
          `
          id,
          job_id,
          created_at,
          jobs (
            id,
            title,
            location,
            is_active
          )
        `,
        )
        .single();

      if (error) {
        if (isMissingSavedJobsTable(error)) {
          return { ok: false, error: "Saved jobs is not available yet." };
        }
        return { ok: false, error: error.message };
      }
      const row = data as SavedJobListEntry;
      setSavedEntries((prev) => [row, ...prev.filter((e) => e.job_id !== jobId)]);
      return { ok: true };
    },
    [candidate?.id, savedJobIds],
  );

  const value = useMemo(
    () => ({
      savedEntries,
      savedJobIds,
      loading,
      refreshSavedJobs,
      toggleSave,
      isSaved,
    }),
    [savedEntries, savedJobIds, loading, refreshSavedJobs, toggleSave, isSaved],
  );

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>;
}

export function useSavedJobs() {
  const ctx = useContext(SavedJobsContext);
  if (!ctx) {
    throw new Error("useSavedJobs must be used within SavedJobsProvider");
  }
  return ctx;
}
