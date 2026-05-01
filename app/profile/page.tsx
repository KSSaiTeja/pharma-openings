"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  applicationStatusBadgeClass,
  applicationStatusDisplayLabel,
} from "@/app/admin/admin-constants";
import { useCandidate } from "@/src/context/CandidateContext";
import { useSavedJobs } from "@/src/context/SavedJobsContext";
import { setPostAuthRedirect } from "@/src/lib/authSession";
import { profileUpdateSchema } from "@/src/lib/schemas/forms";
import { createSupabaseClient } from "@/src/lib/supabase";
import {
  RESUME_ACCEPT_ATTR,
  inferResumeContentType,
  resumeValidationMessage,
} from "@/src/lib/resumeUpload";
import type { CandidateRow } from "@/types/database.types";

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
] as const;

const MODULES = ["API", "Injectables", "OSD", "Others"] as const;

function isQualification(value: string): value is (typeof QUALIFICATIONS)[number] {
  return (QUALIFICATIONS as readonly string[]).includes(value);
}

function formatAppDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type ApplicationRow = {
  id: string;
  created_at: string;
  status: string;
  job_id: string;
  jobs: { title: string } | null;
};

function initialQualification(candidate: CandidateRow) {
  const q = candidate.highest_qualification ?? "";
  return isQualification(q) ? q : QUALIFICATIONS[0];
}

function initialPreferred(candidate: CandidateRow) {
  const mods = (candidate.preferred_modules ?? []).filter((p) =>
    (MODULES as readonly string[]).includes(p),
  );
  return mods.length ? mods : ["Others"];
}

function ProfileSavedJobsSection() {
  const { savedEntries, loading, toggleSave } = useSavedJobs();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onRemove = async (jobId: string) => {
    setBusyId(jobId);
    await toggleSave(jobId);
    setBusyId(null);
  };

  return (
    <div className="rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-6 shadow-[0_12px_48px_rgba(30,27,54,0.06)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-po-muted)]">
        Saved jobs
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-po-navy)]">
        Roles you bookmarked
      </h2>
      <p className="mt-2 text-sm text-[var(--color-po-muted)]">
        Saved jobs stay here until you remove them or the listing is withdrawn.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-[var(--color-po-muted)]">Loading saved jobs…</p>
      ) : (savedEntries?.length ?? 0) === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-[var(--color-po-navy)]">No saved jobs yet</p>
          <p className="mt-2 text-sm text-[var(--color-po-muted)]">
            Use the bookmark on a job card or job page to save roles you want to revisit.
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
          >
            Browse open roles
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-po-lavender-deep)] rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white">
          {savedEntries.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-po-navy)]">
                  {row.jobs?.title ?? "Role"}
                  {row.jobs && !row.jobs.is_active ? (
                    <span className="ml-2 text-xs font-medium text-[var(--color-po-muted)]">
                      (Inactive)
                    </span>
                  ) : null}
                </p>
                {row.jobs?.location ? (
                  <p className="mt-1 text-xs text-[var(--color-po-muted)]">{row.jobs.location}</p>
                ) : null}
                <p className="mt-1 text-xs text-[var(--color-po-muted)]">
                  Saved {formatAppDate(row.created_at)}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <Link
                  href={`/jobs/${row.job_id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-po-lavender-deep)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:border-[var(--color-po-violet)]/35 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
                >
                  View job
                </Link>
                <button
                  type="button"
                  disabled={busyId === row.job_id}
                  onClick={() => void onRemove(row.job_id)}
                  className="inline-flex min-h-11 items-center rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyId === row.job_id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileApplicationHistory({ candidateId }: { candidateId: string }) {
  const [applications, setApplications] = useState<ApplicationRow[] | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setApplicationsLoading(true);
      setApplicationsError(null);

      const supabase = createSupabaseClient();
      if (!supabase) {
        if (!cancelled) {
          setApplicationsError("Supabase is not configured.");
          setApplicationsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          created_at,
          status,
          job_id,
          jobs (
            title
          )
        `,
        )
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setApplicationsError(error.message);
      } else {
        setApplications((data as ApplicationRow[]) ?? []);
      }
      setApplicationsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  return (
    <div className="rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-6 shadow-[0_12px_48px_rgba(30,27,54,0.06)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-po-muted)]">
        Application history
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-po-navy)]">
        Your applications
      </h2>
      <p className="mt-2 text-sm text-[var(--color-po-muted)]">
        Status is set by the hiring team and is read-only here.
      </p>

      {applicationsError ? (
        <p
          className="mt-4 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]"
          role="alert"
          aria-live="assertive"
        >
          {applicationsError}
        </p>
      ) : applicationsLoading ? (
        <p className="mt-6 text-sm text-[var(--color-po-muted)]">Loading applications…</p>
      ) : (applications?.length ?? 0) === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-[var(--color-po-navy)]">No applications yet</p>
          <p className="mt-2 text-sm text-[var(--color-po-muted)]">
            When you apply to a role, it will show up here with the latest status.
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
          >
            Browse open roles
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-po-lavender-deep)] rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white">
          {(applications ?? []).map((row) => (
            <li key={row.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-po-navy)]">{row.jobs?.title ?? "Role"}</p>
                <p className="mt-1 text-xs text-[var(--color-po-muted)]">{formatAppDate(row.created_at)}</p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
                <span className={applicationStatusBadgeClass(row.status)}>
                  {applicationStatusDisplayLabel(row.status)}
                </span>
                <Link
                  href={`/jobs/${row.job_id}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
                >
                  View job
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileEditCard({
  candidate,
  refreshCandidate,
  router,
  logout,
}: {
  candidate: CandidateRow;
  refreshCandidate: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
  logout: () => void;
}) {
  const [fullName, setFullName] = useState(candidate.full_name);
  const [email, setEmail] = useState(candidate.email);
  const [designation, setDesignation] = useState(candidate.current_designation ?? "");
  const [department, setDepartment] = useState(candidate.current_department ?? "");
  const [company, setCompany] = useState(candidate.current_company ?? "");
  const [preferredLocation, setPreferredLocation] = useState(candidate.preferred_location ?? "");
  const [qualification, setQualification] = useState<string>(() => initialQualification(candidate));
  const [preferred, setPreferred] = useState(() => initialPreferred(candidate));
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const toggleModule = useCallback((m: string) => {
    setPreferred((prev) => {
      const has = prev.includes(m);
      if (has) {
        const next = prev.filter((x) => x !== m);
        return next.length ? next : prev;
      }
      return Array.from(new Set([...prev, m]));
    });
  }, []);

  const onResumeSelected = useCallback((file: File | null) => {
    setResumeHint(null);
    if (!file) {
      setResumeFile(null);
      return;
    }
    const msg = resumeValidationMessage(file);
    if (msg) {
      setResumeHint(msg);
      setResumeFile(null);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      return;
    }
    setResumeFile(file);
  }, []);

  const saveProfile = useCallback(async () => {
    setFormError(null);
    setResumeHint(null);
    const parsed = profileUpdateSchema.safeParse({
      fullName,
      email,
      designation,
      department,
      company,
      preferredLocation,
      qualification,
      preferred,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Please review your profile details.");
      return;
    }
    const payload = parsed.data;

    if (resumeFile) {
      const resumeErr = resumeValidationMessage(resumeFile);
      if (resumeErr) {
        setResumeHint(resumeErr);
        return;
      }
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setFormError("Supabase is not configured.");
      return;
    }

    setSaveBusy(true);

    let resumeUrl = candidate.resume_url;
    if (resumeFile) {
      const ext = resumeFile.name.includes(".")
        ? resumeFile.name.slice(resumeFile.name.lastIndexOf("."))
        : "";
      const path = `${candidate.id}/resume-${Date.now()}${ext}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: inferResumeContentType(resumeFile),
      });
      if (upErr) {
        setSaveBusy(false);
        setFormError(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from("resumes").getPublicUrl(path);
      resumeUrl = pub.publicUrl;
    }

    const { error: updErr } = await supabase
      .from("candidates")
      .update({
        full_name: payload.fullName,
        email: payload.email,
        current_designation: payload.designation ?? null,
        current_department: payload.department ?? null,
        current_company: payload.company ?? null,
        preferred_location: payload.preferredLocation ?? null,
        highest_qualification: payload.qualification,
        preferred_modules: payload.preferred,
        resume_url: resumeUrl,
      })
      .eq("id", candidate.id);

    if (updErr) {
      setSaveBusy(false);
      setFormError(updErr.message);
      return;
    }

    await refreshCandidate();
    setResumeFile(null);
    if (resumeInputRef.current) resumeInputRef.current.value = "";
    setSaveBusy(false);
  }, [
    candidate,
    company,
    preferredLocation,
    department,
    designation,
    email,
    fullName,
    preferred,
    qualification,
    refreshCandidate,
    resumeFile,
  ]);

  return (
    <div className="rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-6 shadow-[0_12px_48px_rgba(30,27,54,0.06)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-po-muted)]">
        Your profile
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-po-navy)]">
        Edit details
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-po-muted)]">
        Updates here are saved to your account. The next time you apply, your application will use the
        latest information for new snapshots.
      </p>

      {formError ? (
        <p
          className="mt-4 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]"
          role="alert"
          aria-live="assertive"
        >
          {formError}
        </p>
      ) : null}

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void saveProfile();
        }}
      >
        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Full name
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            required
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Mobile
          <input
            value={candidate.mobile}
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current designation{" "}
          <span className="font-medium text-[var(--color-po-muted)]">(optional)</span>
          <input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current department{" "}
          <span className="font-medium text-[var(--color-po-muted)]">(optional)</span>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current company{" "}
          <span className="font-medium text-[var(--color-po-muted)]">(optional)</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Preferred location <span className="font-medium text-[var(--color-po-muted)]">(optional)</span>
          <input
            value={preferredLocation}
            onChange={(e) => setPreferredLocation(e.target.value)}
            maxLength={120}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
            placeholder="e.g. Hyderabad, Remote, Bengaluru"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Highest qualification <span className="text-[var(--color-po-coral)]">*</span>
          <select
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          >
            {QUALIFICATIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-semibold text-[var(--color-po-navy)]">
            Preferred modules <span className="text-[var(--color-po-coral)]">*</span>
          </p>
          <p className="mt-1 text-xs text-[var(--color-po-muted)]">Select all that apply.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MODULES.map((m) => {
              const active = preferred.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleModule(m)}
                  className={`min-h-11 rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet ${
                    active
                      ? "border-[var(--color-po-violet)] bg-[var(--color-po-lavender)] text-[var(--color-po-navy)]"
                      : "border-[var(--color-po-lavender-deep)] bg-white text-[var(--color-po-muted)] hover:border-[var(--color-po-violet)]/35"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
            Resume{" "}
            <span className="font-medium text-[var(--color-po-muted)]">(optional, PDF/DOC, max 5MB)</span>
            {candidate.resume_url ? (
              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline"
              >
                View current resume
              </a>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-po-muted)]">No resume on file yet.</p>
            )}
            <input
              ref={resumeInputRef}
              type="file"
              accept={RESUME_ACCEPT_ATTR}
              onChange={(e) => onResumeSelected(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-[var(--color-po-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-po-lavender)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-po-navy)]"
            />
          </label>
          {resumeHint ? (
            <p className="mt-2 text-sm text-[var(--color-po-coral)]" role="alert">
              {resumeHint}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--color-po-muted)]">
            Choose a file only when you want to replace your stored resume.
          </p>
        </div>

        <button
          type="submit"
          disabled={saveBusy}
          className="min-h-11 w-full rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveBusy ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/jobs"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[var(--color-po-lavender-deep)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:border-[var(--color-po-violet)]/35 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
        >
          Browse jobs
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/");
          }}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[var(--color-po-lavender-deep)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:border-[var(--color-po-violet)]/35 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { candidate, loading, logout, isAuthenticated, refreshCandidate } = useCandidate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setPostAuthRedirect("/profile");
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="mx-auto w-full max-w-2xl flex-1">
          <p className="text-sm text-[var(--color-po-muted)]">Loading your profile…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !candidate) {
    return null;
  }

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8">
        <ProfileEditCard
          key={`${candidate.id}-${candidate.updated_at}`}
          candidate={candidate}
          refreshCandidate={refreshCandidate}
          router={router}
          logout={logout}
        />
        <ProfileSavedJobsSection />
        <ProfileApplicationHistory candidateId={candidate.id} />
      </div>
    </main>
  );
}
