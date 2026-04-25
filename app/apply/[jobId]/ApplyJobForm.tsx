"use client";

import { useCallback, useMemo, useState } from "react";

import { createSupabaseClient } from "@/src/lib/supabase";
import type { CandidateRow, JobRow } from "@/types/database.types";

const QUALIFICATIONS = [
  "B.Pharm",
  "M.Pharm",
  "B.Sc",
  "M.Sc",
  "PhD",
  "D.Pharm",
  "ITI",
  "Diploma",
  "Other",
  "Any",
] as const;

type ApplyJobFormProps = {
  candidate: CandidateRow;
  job: JobRow;
  jobId: string;
  refreshCandidate: () => Promise<void>;
  onSubmitted: (warning?: string | null) => void;
};

export function ApplyJobForm({
  candidate,
  job,
  jobId,
  refreshCandidate,
  onSubmitted,
}: ApplyJobFormProps) {
  const moduleLabel = useMemo(() => {
    const raw = job.module?.trim();
    return raw && raw.length ? raw : "Others";
  }, [job]);

  const [designation, setDesignation] = useState(() => candidate.current_designation ?? "");
  const [department, setDepartment] = useState(() => candidate.current_department ?? "");
  const [company, setCompany] = useState(() => candidate.current_company ?? "");
  const [qualification, setQualification] = useState(
    () => candidate.highest_qualification || QUALIFICATIONS[0],
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    setWarning(null);
    setClosed(false);

    if (resumeFile) {
      if (resumeFile.size > 5 * 1024 * 1024) {
        setError("Resume must be 5MB or smaller.");
        return;
      }
      const allowed = new Set([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);
      if (!allowed.has(resumeFile.type)) {
        setError("Resume must be a PDF or Word document.");
        return;
      }
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);
    let uploadWarning: string | null = null;

    const { data: live, error: liveErr } = await supabase
      .from("jobs")
      .select("is_active")
      .eq("id", jobId)
      .maybeSingle();

    if (liveErr || !live) {
      setBusy(false);
      setError(liveErr?.message ?? "Could not verify this role.");
      return;
    }

    if (!live.is_active) {
      setBusy(false);
      setClosed(true);
      return;
    }

    let resumeUrl = candidate.resume_url;
    if (resumeFile) {
      const ext = resumeFile.name.includes(".")
        ? resumeFile.name.slice(resumeFile.name.lastIndexOf("."))
        : "";
      const path = `${candidate.id}/apply-${jobId}-${Date.now()}${ext}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: resumeFile.type || undefined,
      });
      if (upErr) {
        uploadWarning = "Application submitted without resume. You can upload it from your profile.";
        setWarning(uploadWarning);
      } else {
        const { data: pub } = supabase.storage.from("resumes").getPublicUrl(path);
        resumeUrl = pub.publicUrl;
      }
    }

    const des = designation.trim() || null;
    const dept = department.trim() || null;
    const comp = company.trim() || null;
    const qual = qualification.trim() || null;

    const { error: appErr } = await supabase.from("applications").insert({
      job_id: jobId,
      full_name: candidate.full_name,
      email: candidate.email,
      mobile: candidate.mobile,
      resume_url: resumeUrl,
      status: "new",
      candidate_id: candidate.id,
      current_designation: des,
      current_department: dept,
      current_company: comp,
      highest_qualification: qual,
      snapshot_designation: des,
      snapshot_department: dept,
      snapshot_company: comp,
      snapshot_qualification: qual,
      snapshot_resume_url: resumeUrl,
    });

    if (appErr) {
      setBusy(false);
      if ("code" in appErr && appErr.code === "23505") {
        const { data: existing } = await supabase
          .from("applications")
          .select("created_at")
          .eq("candidate_id", candidate.id)
          .eq("job_id", jobId)
          .maybeSingle();
        if (existing?.created_at) {
          const date = new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(new Date(existing.created_at));
          setError(`You’ve already applied for this position on ${date}.`);
        } else {
          setError("You’ve already applied for this position.");
        }
        return;
      }
      setError(appErr.message);
      return;
    }

    const { error: candErr } = await supabase
      .from("candidates")
      .update({
        current_designation: designation.trim() || null,
        current_department: department.trim() || null,
        current_company: company.trim() || null,
        highest_qualification: qualification.trim(),
        resume_url: resumeUrl,
      })
      .eq("id", candidate.id);

    if (candErr) {
      setBusy(false);
      setError(candErr.message);
      return;
    }

    await refreshCandidate();
    setBusy(false);
    onSubmitted(uploadWarning);
  }, [
    candidate,
    company,
    department,
    designation,
    jobId,
    onSubmitted,
    qualification,
    refreshCandidate,
    resumeFile,
  ]);

  return (
    <>
      {closed ? (
        <p className="mt-6 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm font-semibold text-[var(--color-po-navy)]">
          This position has been closed. Browse other openings.
        </p>
      ) : null}

      {warning ? (
        <p className="mt-4 rounded-2xl border border-[var(--color-po-gold)]/45 bg-[var(--color-po-lavender)] px-4 py-3 text-sm font-semibold text-[var(--color-po-navy)]">
          {warning}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]">
          {error}
        </p>
      ) : null}

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Full name
          <input
            readOnly
            value={candidate.full_name}
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Email
          <input
            readOnly
            value={candidate.email}
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Mobile
          <input
            readOnly
            value={candidate.mobile}
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current designation
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current department
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current company
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Highest qualification
          <select
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          >
            {QUALIFICATIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-po-muted)]">
            Module
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-po-navy)]">{moduleLabel}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-po-navy)]">Resume</p>
          <p className="mt-1 text-xs text-[var(--color-po-muted)]">
            We&apos;ll use your profile resume unless you upload a new file (PDF/DOC, max 5MB).
          </p>
          {candidate.resume_url ? (
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline"
            >
              View current resume
            </a>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-po-muted)]">No resume on file yet.</p>
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-[var(--color-po-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-po-navy)]"
          />
        </div>

        <button
          type="submit"
          disabled={busy || closed}
          className="w-full rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </>
  );
}
