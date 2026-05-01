"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useCandidate } from "@/src/context/CandidateContext";
import { useSavedJobs } from "@/src/context/SavedJobsContext";
import { setPostAuthRedirect } from "@/src/lib/authSession";

type JobSaveButtonProps = {
  jobId: string;
  variant?: "icon" | "pill";
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M6 3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17.35a1 1 0 0 1-1.53.848L12 17.808l-6.47 4.39A1 1 0 0 1 4 20.351V3z" />
      </svg>
    );
  }
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M6 3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17.35a1 1 0 0 1-1.53.848L12 17.808l-6.47 4.39A1 1 0 0 1 4 20.351V3z" />
    </svg>
  );
}

export function JobSaveButton({ jobId, variant = "icon" }: JobSaveButtonProps) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useCandidate();
  const { isSaved, toggleSave, loading: listLoading } = useSavedJobs();
  const [busy, setBusy] = useState(false);

  const saved = isSaved(jobId);
  const showListSpinner = isAuthenticated && listLoading && !busy;
  const disabled = authLoading || (!!isAuthenticated && (listLoading || busy));

  const onClick = useCallback(async () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      const path =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/jobs";
      setPostAuthRedirect(path);
      router.push("/register");
      return;
    }
    setBusy(true);
    await toggleSave(jobId);
    setBusy(false);
  }, [authLoading, isAuthenticated, jobId, router, toggleSave]);

  if (variant === "pill") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? "Remove saved job" : "Save job"}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm transition-[background-color,border-color,color,transform] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 ${
          saved
            ? "border-[#6d6ae8]/45 bg-[#6d6ae8]/10 text-[#5855d6]"
            : "border-[#ebe7f4] bg-white text-[#1e1b36] hover:border-[#6d6ae8]/35"
        }`}
      >
        <BookmarkIcon filled={saved} />
        {showListSpinner ? "…" : saved ? "Saved" : "Save job"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={saved}
      title={saved ? "Remove from saved jobs" : "Save job"}
      aria-label={saved ? "Remove saved job" : "Save job"}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm transition-[background-color,border-color,color,transform] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 ${
        saved
          ? "border-[#6d6ae8]/45 bg-[#6d6ae8]/10 text-[#5855d6]"
          : "border-[#ebe7f4] bg-white text-[#6b6880] hover:border-[#6d6ae8]/35 hover:text-[#5855d6]"
      }`}
    >
      {showListSpinner ? (
        <span className="h-4 w-4 animate-pulse rounded-full bg-current/25" aria-hidden />
      ) : (
        <BookmarkIcon filled={saved} />
      )}
    </button>
  );
}
