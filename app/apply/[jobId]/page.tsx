"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ApplyPageShell } from "@/app/components/site/ApplyPageShell";
import { ApplyJobForm } from "./ApplyJobForm";
import { useCandidate } from "@/src/context/CandidateContext";
import { setPostAuthRedirect } from "@/src/lib/authSession";
import { formatDateTimeIst } from "@/src/lib/formatDateTimeIst";
import { formatJobReferenceLabel, getJobReference } from "@/src/lib/jobReference";
import { fetchJobForApply } from "@/src/lib/jobs";
import { createSupabaseClient } from "@/src/lib/supabase";
import type { JobRow } from "@/types/database.types";

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

  const applyCrumbs = [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" },
    { label: job?.title ?? "Apply" },
  ];

  if (authLoading || (!isAuthenticated && jobId)) {
    return (
      <ApplyPageShell title="Apply" crumbs={applyCrumbs} centred>
        <p className="po-apply-status">Preparing your application…</p>
      </ApplyPageShell>
    );
  }

  if (!isAuthenticated || !candidate) {
    return null;
  }

  if (jobLoading) {
    return (
      <ApplyPageShell title="Apply" crumbs={applyCrumbs} centred>
        <p className="po-apply-status">Loading role details…</p>
      </ApplyPageShell>
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
      <ApplyPageShell title="Apply" crumbs={applyCrumbs} centred>
        <p className="po-apply-status po-apply-status--emph">{message}</p>
        <Link href="/jobs" className="po-auth-btn po-auth-btn--primary po-auth-btn--link po-auth-btn--block">
          Back to jobs
        </Link>
      </ApplyPageShell>
    );
  }

  if (success) {
    return (
      <ApplyPageShell
        title="Application submitted"
        subtitle={
          job?.title
            ? `Thanks for applying to ${job.title}. We’ll be in touch if there’s a fit.`
            : "Thanks for applying. We’ll be in touch if there’s a fit."
        }
        jobReference={
          job
            ? `Your application reference is ${getJobReference(job)}. Mention this Job ID when you contact the recruiter.`
            : undefined
        }
        crumbs={applyCrumbs}
        centred
      >
        {submitWarning ? <p className="po-apply-status">{submitWarning}</p> : null}
        <Link href="/jobs" className="po-auth-btn po-auth-btn--primary po-auth-btn--link po-auth-btn--block">
          Browse more jobs
        </Link>
      </ApplyPageShell>
    );
  }

  if (dupAppliedAt) {
    return (
      <ApplyPageShell
        title="You’ve already applied"
        subtitle={job?.title}
        crumbs={applyCrumbs}
        centred
      >
        <p className="po-apply-status">
          You submitted your application on {formatDateTimeIst(dupAppliedAt)}.
        </p>
        <Link href="/jobs" className="po-auth-btn po-auth-btn--primary po-auth-btn--link po-auth-btn--block">
          Browse more jobs
        </Link>
      </ApplyPageShell>
    );
  }

  return (
    <ApplyPageShell
      title={job?.title ?? "Apply"}
      subtitle={job?.location}
      jobReference={job ? formatJobReferenceLabel(job) : undefined}
      crumbs={applyCrumbs}
    >
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
    </ApplyPageShell>
  );
}
