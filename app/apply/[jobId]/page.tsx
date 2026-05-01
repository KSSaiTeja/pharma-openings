"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ApplyJobForm } from "./ApplyJobForm";
import { useCandidate } from "@/src/context/CandidateContext";
import { setPostAuthRedirect } from "@/src/lib/authSession";
import { fetchJobForApply } from "@/src/lib/jobs";
import { createSupabaseClient } from "@/src/lib/supabase";
import type { JobRow } from "@/types/database.types";

function formatAppliedDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export default function ApplyPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const router = useRouter();
  const { candidate, loading: authLoading, isAuthenticated, refreshCandidate } = useCandidate();

  const [job, setJob] = useState<JobRow | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobLoadError, setJobLoadError] = useState<string | null>(null);
  const [dupAppliedAt, setDupAppliedAt] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);

  const handleSubmitted = useCallback((warning?: string | null) => {
    setSubmitWarning(warning ?? null);
    setSuccess(true);
  }, []);

  const handleRequireReauth = useCallback(() => {
    if (!jobId) return;
    setPostAuthRedirect(`/apply/${jobId}`);
    router.replace(`/login?redirect=${encodeURIComponent(`/apply/${jobId}`)}`);
  }, [jobId, router]);

  useEffect(() => {
    if (!jobId) return;
    if (authLoading) return;
    if (!isAuthenticated || !candidate) {
      setPostAuthRedirect(`/apply/${jobId}`);
      router.replace(`/register?redirect=${encodeURIComponent(`/apply/${jobId}`)}`);
    }
  }, [authLoading, candidate, isAuthenticated, jobId, router]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    async function run() {
      setJobLoading(true);
      setJobLoadError(null);
      const { data, error: err } = await fetchJobForApply(jobId);
      if (cancelled) return;
      if (err) {
        setJobLoadError(err.message);
        setJob(null);
        setJobLoading(false);
        return;
      }
      if (!data) {
        setJobLoadError("not_found");
        setJob(null);
        setJobLoading(false);
        return;
      }
      if (!data.is_active) {
        setJobLoadError("inactive");
        setJob(null);
        setJobLoading(false);
        return;
      }
      setJob(data);
      setJobLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    if (!candidate || !jobId) return;
    const client = createSupabaseClient();
    if (!client) return;
    let cancelled = false;
    void client
      .from("applications")
      .select("created_at")
      .eq("candidate_id", candidate.id)
      .eq("job_id", jobId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err || !data?.created_at) {
          setDupAppliedAt(null);
          return;
        }
        setDupAppliedAt(data.created_at);
      });
    return () => {
      cancelled = true;
    };
  }, [candidate, jobId]);

  if (authLoading || (!isAuthenticated && jobId)) {
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="mx-auto w-full max-w-2xl flex-1">
          <p className="text-sm text-[var(--color-po-muted)]">Preparing your application…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!candidate) {
    return null;
  }

  if (jobLoading) {
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="mx-auto w-full max-w-2xl flex-1">
          <p className="text-sm text-[var(--color-po-muted)]">Loading role details…</p>
        </div>
      </main>
    );
  }

  if (jobLoadError) {
    const message =
      jobLoadError === "not_found"
        ? "We couldn’t find that job."
        : jobLoadError === "inactive"
          ? "This position is no longer accepting applications."
          : jobLoadError;
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="mx-auto w-full max-w-2xl flex-1 rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-8 shadow-[0_12px_48px_rgba(30,27,54,0.06)]">
          <h1 className="text-xl font-semibold text-[var(--color-po-navy)]">{message}</h1>
          <Link
            href="/jobs"
            className="mt-6 inline-flex rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px"
          >
            Back to jobs
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="mx-auto w-full max-w-2xl flex-1 rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-8 text-center shadow-[0_12px_48px_rgba(30,27,54,0.06)]">
          <h1 className="text-2xl font-semibold text-[var(--color-po-navy)]">Application submitted!</h1>
          <p className="mt-3 text-sm text-[var(--color-po-muted)]">
            Thanks for applying{job?.title ? ` to ${job.title}` : ""}. We’ll be in touch if there’s a fit.
          </p>
          {submitWarning ? (
            <p className="mt-4 rounded-2xl border border-[var(--color-po-gold)]/45 bg-[var(--color-po-lavender)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-po-navy)]">
              {submitWarning}
            </p>
          ) : null}
          <Link
            href="/jobs"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--color-po-teal)] px-8 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px"
          >
            Browse more jobs
          </Link>
        </div>
      </main>
    );
  }

  if (dupAppliedAt) {
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center">
          <div className="w-full rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/95 p-8 text-center shadow-[0_12px_48px_rgba(30,27,54,0.08)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-po-lavender)] text-xl">
              ✓
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-po-navy)]">
              You&apos;ve already applied
            </h1>
            <p className="mt-2 text-sm font-medium text-[var(--color-po-navy)]">{job?.title}</p>
            <p className="mt-4 rounded-2xl border border-[var(--color-po-lavender-deep)]/70 bg-[var(--color-po-lavender)] px-4 py-3 text-sm leading-relaxed text-[var(--color-po-muted)]">
              You submitted your application on {formatAppliedDate(dupAppliedAt)}.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[var(--color-po-muted)]">
              We will contact you if your profile matches.
            </p>
          <Link
            href="/jobs"
            className="mt-8 inline-flex rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px"
          >
            Browse more jobs
          </Link>
        </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
      <div className="mx-auto w-full max-w-2xl flex-1">
        <div className="rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-6 shadow-[0_12px_48px_rgba(30,27,54,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-po-muted)]">
            Apply
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-po-navy)]">
            {job?.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-po-muted)]">{job?.location}</p>

          {job ? (
            <ApplyJobForm
              key={`${jobId}-${candidate.id}-${candidate.updated_at ?? ""}`}
              candidate={candidate}
              job={job}
              jobId={jobId}
              refreshCandidate={refreshCandidate}
              onSubmitted={handleSubmitted}
              onRequireReauth={handleRequireReauth}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
