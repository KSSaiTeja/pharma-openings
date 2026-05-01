"use client";

import { FileText, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEPARTMENT_OPTIONS,
  OTHER_OPTION,
  getDesignationOptions,
  getSubDepartmentOptions,
  resolveCandidateTaxonomySelection,
} from "@/src/lib/candidateTaxonomy";
import {
  APPLY_QUALIFICATIONS,
  applyJobFormSchema,
} from "@/src/lib/schemas/forms";
import {
  RESUME_ACCEPT_ATTR,
  inferResumeContentType,
  resumeValidationMessage,
} from "@/src/lib/resumeUpload";
import { createSupabaseClient } from "@/src/lib/supabase";
import type { CandidateRow, JobRow } from "@/types/database.types";

type ApplyJobFormProps = {
  candidate: CandidateRow;
  job: JobRow;
  jobId: string;
  refreshCandidate: () => Promise<void>;
  onSubmitted: (warning?: string | null) => void;
  onRequireReauth: () => void;
};

type ApplyDraft = {
  designation: string;
  subDepartment: string;
  department: string;
  company: string;
  qualification: string;
  designationCustom: string;
  departmentCustom: string;
  subDepartmentCustom: string;
  qualificationCustom: string;
};

type ApplyFormFields = ApplyDraft;

const APPLY_DRAFT_PREFIX = "po_apply_draft:";

function isApplyQualification(value: string): value is (typeof APPLY_QUALIFICATIONS)[number] {
  return (APPLY_QUALIFICATIONS as readonly string[]).includes(value);
}

function applyDraftKey(jobId: string, candidateId: string) {
  return `${APPLY_DRAFT_PREFIX}${candidateId}:${jobId}`;
}

function readApplyDraft(jobId: string, candidateId: string): ApplyDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(applyDraftKey(jobId, candidateId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ApplyDraft>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      designation: typeof parsed.designation === "string" ? parsed.designation : "",
      subDepartment: typeof parsed.subDepartment === "string" ? parsed.subDepartment : "",
      department: typeof parsed.department === "string" ? parsed.department : "",
      company: typeof parsed.company === "string" ? parsed.company : "",
      qualification: typeof parsed.qualification === "string" ? parsed.qualification : "",
      designationCustom: typeof parsed.designationCustom === "string" ? parsed.designationCustom : "",
      departmentCustom: typeof parsed.departmentCustom === "string" ? parsed.departmentCustom : "",
      subDepartmentCustom: typeof parsed.subDepartmentCustom === "string" ? parsed.subDepartmentCustom : "",
      qualificationCustom: typeof parsed.qualificationCustom === "string" ? parsed.qualificationCustom : "",
    };
  } catch {
    return null;
  }
}

function writeApplyDraft(jobId: string, candidateId: string, draft: ApplyDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(applyDraftKey(jobId, candidateId), JSON.stringify(draft));
}

function clearApplyDraft(jobId: string, candidateId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(applyDraftKey(jobId, candidateId));
}

function normalizeDraftDepartment(d: ApplyDraft): { department: string; departmentCustom: string } {
  const dept = d.department.trim();
  const custom = d.departmentCustom.trim();
  if (!dept) return { department: "", departmentCustom: custom };
  if (DEPARTMENT_OPTIONS.includes(dept) || dept === OTHER_OPTION) {
    return { department: dept, departmentCustom: custom };
  }
  return { department: OTHER_OPTION, departmentCustom: dept };
}

function normalizeDraftSubDepartment(
  d: ApplyDraft,
  department: string,
): { subDepartment: string; subDepartmentCustom: string } {
  const sub = d.subDepartment.trim();
  const custom = d.subDepartmentCustom.trim();
  if (!department) return { subDepartment: "", subDepartmentCustom: custom };
  if (!sub) return { subDepartment: "", subDepartmentCustom: custom };
  const options = getSubDepartmentOptions(department);
  if (options.includes(sub) || sub === OTHER_OPTION) {
    return { subDepartment: sub, subDepartmentCustom: custom };
  }
  return { subDepartment: OTHER_OPTION, subDepartmentCustom: sub };
}

function normalizeDraftDesignation(
  d: ApplyDraft,
  department: string,
): { designation: string; designationCustom: string } {
  const des = d.designation.trim();
  const custom = d.designationCustom.trim();
  if (!department) return { designation: "", designationCustom: custom };
  if (!des) return { designation: "", designationCustom: custom };
  const options = getDesignationOptions(department);
  if (options.includes(des) || des === OTHER_OPTION) {
    return { designation: des, designationCustom: custom };
  }
  return { designation: OTHER_OPTION, designationCustom: des };
}

function qualificationFromCandidateAndDraft(
  candidate: CandidateRow,
  d: ApplyDraft,
): { qualification: string; qualificationCustom: string } {
  if (d.qualification && isApplyQualification(d.qualification)) {
    return {
      qualification: d.qualification,
      qualificationCustom: d.qualification === "Other" ? d.qualificationCustom.trim() : "",
    };
  }
  const hq = (candidate.highest_qualification ?? "").trim();
  if (!hq) return { qualification: APPLY_QUALIFICATIONS[0], qualificationCustom: "" };
  if (isApplyQualification(hq)) return { qualification: hq, qualificationCustom: "" };
  return { qualification: "Other", qualificationCustom: hq };
}

function hydrateFromCandidate(candidate: CandidateRow): ApplyFormFields {
  const d = (candidate.current_department ?? "").trim();
  let department = "";
  let departmentCustom = (candidate.department_custom ?? "").trim();
  if (!d) {
    department = "";
  } else if (DEPARTMENT_OPTIONS.includes(d) || d === OTHER_OPTION) {
    department = d;
  } else {
    department = OTHER_OPTION;
    departmentCustom = d;
  }

  const s = (candidate.current_sub_department ?? "").trim();
  let subDepartment = "";
  let subDepartmentCustom = (candidate.sub_department_custom ?? "").trim();
  if (department) {
    const subOpts = getSubDepartmentOptions(department);
    if (!s) {
      subDepartment = "";
    } else if (subOpts.includes(s) || s === OTHER_OPTION) {
      subDepartment = s;
    } else {
      subDepartment = OTHER_OPTION;
      subDepartmentCustom = s;
    }
  }

  const des = (candidate.current_designation ?? "").trim();
  let designation = "";
  let designationCustom = (candidate.designation_custom ?? "").trim();
  if (department) {
    const desOpts = getDesignationOptions(department);
    if (!des) {
      designation = "";
    } else if (desOpts.includes(des) || des === OTHER_OPTION) {
      designation = des;
    } else {
      designation = OTHER_OPTION;
      designationCustom = des;
    }
  }

  const { qualification, qualificationCustom } = qualificationFromCandidateAndDraft(candidate, {
    designation,
    subDepartment,
    department,
    company: "",
    qualification: "",
    designationCustom,
    departmentCustom,
    subDepartmentCustom,
    qualificationCustom: "",
  });

  return {
    department,
    departmentCustom,
    subDepartment,
    subDepartmentCustom,
    designation,
    designationCustom,
    company: candidate.current_company ?? "",
    qualification,
    qualificationCustom,
  };
}

function mergeDraftOrCandidate(jobId: string, candidate: CandidateRow): ApplyFormFields {
  const draft = readApplyDraft(jobId, candidate.id);
  if (!draft) return hydrateFromCandidate(candidate);

  const { department, departmentCustom } = normalizeDraftDepartment(draft);
  const { subDepartment, subDepartmentCustom } = normalizeDraftSubDepartment(draft, department);
  const { designation, designationCustom } = normalizeDraftDesignation(draft, department);
  const { qualification, qualificationCustom } = qualificationFromCandidateAndDraft(candidate, {
    ...draft,
    department,
    departmentCustom,
    subDepartment,
    subDepartmentCustom,
    designation,
    designationCustom,
  });

  return {
    department,
    departmentCustom,
    subDepartment,
    subDepartmentCustom,
    designation,
    designationCustom,
    company: draft.company.trim() || (candidate.current_company ?? ""),
    qualification,
    qualificationCustom,
  };
}

function resolvedTaxonomySnapshot(
  taxonomy: ReturnType<typeof resolveCandidateTaxonomySelection>,
): { designation: string | null; department: string | null } {
  const des =
    taxonomy.designation === OTHER_OPTION
      ? taxonomy.designationCustom?.trim() || null
      : taxonomy.designation || null;
  const deptPart =
    taxonomy.department === OTHER_OPTION
      ? taxonomy.departmentCustom?.trim() || null
      : taxonomy.department || null;
  const subPart =
    taxonomy.subDepartment === OTHER_OPTION
      ? taxonomy.subDepartmentCustom?.trim() || null
      : taxonomy.subDepartment || null;
  const department =
    deptPart && subPart ? `${deptPart} · ${subPart}` : deptPart ?? subPart ?? null;
  return { designation: des, department };
}

function qualificationForDb(qualification: string, qualificationCustom: string): string {
  if (qualification === "Other") return qualificationCustom.trim();
  return qualification;
}

function isAuthExpiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; code?: unknown };
  const message = typeof maybe.message === "string" ? maybe.message.toLowerCase() : "";
  const code = typeof maybe.code === "string" ? maybe.code.toLowerCase() : "";
  return (
    code.includes("jwt") ||
    message.includes("jwt") ||
    message.includes("expired") ||
    message.includes("session")
  );
}

export function ApplyJobForm({
  candidate,
  job,
  jobId,
  refreshCandidate,
  onSubmitted,
  onRequireReauth,
}: ApplyJobFormProps) {
  const moduleLabel = useMemo(() => {
    const raw = job.module?.trim();
    return raw && raw.length ? raw : "Others";
  }, [job]);

  const [form, setForm] = useState(() => mergeDraftOrCandidate(jobId, candidate));
  const {
    department,
    subDepartment,
    designation,
    designationCustom,
    departmentCustom,
    subDepartmentCustom,
    company,
    qualification,
    qualificationCustom,
  } = form;
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [restoredDraftNotice] = useState(() => Boolean(readApplyDraft(jobId, candidate.id)));

  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const subDepartmentOptions = useMemo(() => getSubDepartmentOptions(department), [department]);
  const designationOptions = useMemo(() => getDesignationOptions(department), [department]);

  const onDepartmentChange = useCallback((nextDepartment: string) => {
    setForm((prev) => ({
      ...prev,
      department: nextDepartment,
      subDepartment: "",
      designation: "",
      subDepartmentCustom: "",
      designationCustom: "",
      departmentCustom: nextDepartment !== OTHER_OPTION ? "" : prev.departmentCustom,
    }));
  }, []);

  const onSubDepartmentChange = useCallback((nextSubDepartment: string) => {
    setForm((prev) => ({
      ...prev,
      subDepartment: nextSubDepartment,
      subDepartmentCustom: nextSubDepartment !== OTHER_OPTION ? "" : prev.subDepartmentCustom,
    }));
  }, []);

  const onDesignationChange = useCallback((nextDesignation: string) => {
    setForm((prev) => ({
      ...prev,
      designation: nextDesignation,
      designationCustom: nextDesignation !== OTHER_OPTION ? "" : prev.designationCustom,
    }));
  }, []);

  const onQualificationChange = useCallback((next: string) => {
    setForm((prev) => ({
      ...prev,
      qualification: next,
      qualificationCustom: next !== "Other" ? "" : prev.qualificationCustom,
    }));
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

  const clearResumeSelection = useCallback(() => {
    setResumeFile(null);
    setResumeHint(null);
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  }, []);

  useEffect(() => {
    writeApplyDraft(jobId, candidate.id, form);
  }, [candidate.id, form, jobId]);

  const submit = useCallback(async () => {
    setError(null);
    setWarning(null);
    setClosed(false);
    setResumeHint(null);

    if (resumeFile) {
      const resumeErr = resumeValidationMessage(resumeFile);
      if (resumeErr) {
        setResumeHint(resumeErr);
        return;
      }
    }

    const parsed = applyJobFormSchema.safeParse({
      department: form.department,
      subDepartment: form.subDepartment,
      designation: form.designation,
      departmentCustom: form.departmentCustom,
      subDepartmentCustom: form.subDepartmentCustom,
      designationCustom: form.designationCustom,
      company: form.company,
      qualification: form.qualification,
      qualificationCustom: form.qualificationCustom,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please review your application details.");
      return;
    }
    const payload = parsed.data;

    const taxonomy = resolveCandidateTaxonomySelection({
      department: payload.department,
      subDepartment: payload.subDepartment,
      designation: payload.designation,
      departmentCustom: payload.departmentCustom ?? "",
      subDepartmentCustom: payload.subDepartmentCustom ?? "",
      designationCustom: payload.designationCustom ?? "",
    });

    const { designation: snapDes, department: snapDept } = resolvedTaxonomySnapshot(taxonomy);
    const qualStored = qualificationForDb(payload.qualification, payload.qualificationCustom ?? "");
    const comp = payload.company.trim();

    const supabase = createSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);

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
        contentType: inferResumeContentType(resumeFile),
      });
      if (upErr) {
        setBusy(false);
        setError(upErr.message || "Could not upload resume. Please try again.");
        return;
      }
      const { data: pub } = supabase.storage.from("resumes").getPublicUrl(path);
      resumeUrl = pub.publicUrl;
    }

    const { error: appErr } = await supabase.from("applications").insert({
      job_id: jobId,
      full_name: candidate.full_name,
      email: candidate.email,
      mobile: candidate.mobile,
      resume_url: resumeUrl,
      status: "new",
      candidate_id: candidate.id,
      current_designation: snapDes,
      current_department: snapDept,
      current_company: comp,
      highest_qualification: qualStored,
      snapshot_designation: snapDes,
      snapshot_department: snapDept,
      snapshot_company: comp,
      snapshot_qualification: qualStored,
      snapshot_resume_url: resumeUrl,
    });

    if (appErr) {
      setBusy(false);
      if (isAuthExpiredError(appErr)) {
        setError("Your session expired. Re-authenticate to continue, and we will restore your draft.");
        onRequireReauth();
        return;
      }
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
        current_designation: taxonomy.designation,
        current_department: taxonomy.department,
        current_sub_department: taxonomy.subDepartment,
        department_custom: taxonomy.departmentCustom,
        sub_department_custom: taxonomy.subDepartmentCustom,
        designation_custom: taxonomy.designationCustom,
        current_company: comp,
        highest_qualification: qualStored,
        resume_url: resumeUrl,
      })
      .eq("id", candidate.id);

    if (candErr) {
      setBusy(false);
      if (isAuthExpiredError(candErr)) {
        setError("Your session expired. Re-authenticate to continue, and we will restore your draft.");
        onRequireReauth();
        return;
      }
      setError(candErr.message);
      return;
    }

    await refreshCandidate();
    clearApplyDraft(jobId, candidate.id);
    setBusy(false);
    onSubmitted(null);
  }, [candidate, form, jobId, onRequireReauth, onSubmitted, refreshCandidate, resumeFile]);

  return (
    <>
      {restoredDraftNotice ? (
        <p
          className="mt-4 rounded-2xl border border-[var(--color-po-teal)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]"
          role="status"
          aria-live="polite"
        >
          We restored your in-progress application details from your last session.
        </p>
      ) : null}
      {closed ? (
        <p
          className="mt-6 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm font-semibold text-[var(--color-po-navy)]"
          role="alert"
          aria-live="assertive"
        >
          This position has been closed. Browse other openings.
        </p>
      ) : null}

      {warning ? (
        <p
          className="mt-4 rounded-2xl border border-[var(--color-po-gold)]/45 bg-[var(--color-po-lavender)] px-4 py-3 text-sm font-semibold text-[var(--color-po-navy)]"
          role="status"
          aria-live="polite"
        >
          {warning}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-4 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]"
          role="alert"
          aria-live="assertive"
        >
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
        <label className="block text-sm font-semibold text-[var(--color-po-navy)]" htmlFor="apply-full-name">
          Full name
          <input
            id="apply-full-name"
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            value={candidate.full_name}
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]" htmlFor="apply-email">
          Email
          <input
            id="apply-email"
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            value={candidate.email}
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]" htmlFor="apply-mobile">
          Mobile
          <input
            id="apply-mobile"
            readOnly
            tabIndex={-1}
            aria-readonly="true"
            value={candidate.mobile}
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Department
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          >
            <option value="">Select department</option>
            {DEPARTMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
          </select>
        </label>
        {department === OTHER_OPTION ? (
          <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
            Enter department
            <input
              value={departmentCustom}
              onChange={(e) => setForm((p) => ({ ...p, departmentCustom: e.target.value }))}
              required
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
            />
          </label>
        ) : null}

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Sub-department
          <select
            value={subDepartment}
            onChange={(e) => onSubDepartmentChange(e.target.value)}
            required
            disabled={!department}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4 disabled:cursor-not-allowed disabled:bg-[var(--color-po-lavender)]"
          >
            <option value="">{department ? "Select sub-department" : "Select department first"}</option>
            {subDepartmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {!subDepartmentOptions.includes(OTHER_OPTION) ? (
              <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
            ) : null}
          </select>
        </label>
        {subDepartment === OTHER_OPTION ? (
          <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
            Enter sub-department
            <input
              value={subDepartmentCustom}
              onChange={(e) => setForm((p) => ({ ...p, subDepartmentCustom: e.target.value }))}
              required
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
            />
          </label>
        ) : null}

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current designation
          <select
            value={designation}
            onChange={(e) => onDesignationChange(e.target.value)}
            required
            disabled={!department}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4 disabled:cursor-not-allowed disabled:bg-[var(--color-po-lavender)]"
          >
            <option value="">{department ? "Select designation" : "Select department first"}</option>
            {designationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {!designationOptions.includes(OTHER_OPTION) ? (
              <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
            ) : null}
          </select>
        </label>
        {designation === OTHER_OPTION ? (
          <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
            Enter designation
            <input
              value={designationCustom}
              onChange={(e) => setForm((p) => ({ ...p, designationCustom: e.target.value }))}
              required
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
            />
          </label>
        ) : null}

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Current company
          <input
            value={company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            required
            maxLength={120}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
            placeholder="e.g. ABC Pharma Pvt Ltd"
          />
        </label>

        <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
          Highest qualification
          <select
            value={qualification}
            onChange={(e) => onQualificationChange(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
          >
            {APPLY_QUALIFICATIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>
        {qualification === "Other" ? (
          <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
            Specify qualification
            <input
              value={qualificationCustom}
              onChange={(e) => setForm((p) => ({ ...p, qualificationCustom: e.target.value }))}
              required
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
              placeholder="Enter your qualification"
            />
          </label>
        ) : null}

        <div className="rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-po-muted)]">
            Module
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-po-navy)]">{moduleLabel}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-po-navy)]">Resume</p>
          <p id="apply-resume-hint" className="mt-1 text-xs text-[var(--color-po-muted)]">
            We&apos;ll use your profile resume unless you upload a new file (PDF/DOC, max 5MB).
          </p>
          {candidate.resume_url ? (
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
            >
              View current resume
            </a>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-po-muted)]">No resume on file yet.</p>
          )}

          <input
            id="apply-resume-file"
            ref={resumeInputRef}
            type="file"
            accept={RESUME_ACCEPT_ATTR}
            aria-describedby="apply-resume-hint"
            onChange={(e) => onResumeSelected(e.target.files?.[0] ?? null)}
            className="sr-only"
          />

          <div className="mt-3 flex flex-col gap-2">
            {!resumeFile ? (
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                className="min-h-11 w-full rounded-full border border-[var(--color-po-lavender-deep)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:border-[var(--color-po-violet)]/40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
              >
                Choose file
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-3 py-2.5 pr-2 shadow-sm">
                <FileText
                  className="h-5 w-5 shrink-0 text-[var(--color-po-violet)]"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-po-navy)]">
                  {resumeFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearResumeSelection}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-po-muted)] transition-colors hover:bg-[var(--color-po-lavender)] hover:text-[var(--color-po-navy)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
            )}
          </div>
          {resumeHint ? (
            <p className="mt-2 text-sm text-[var(--color-po-coral)]" role="alert" aria-live="polite">
              {resumeHint}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={busy || closed}
          className="min-h-11 w-full rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </>
  );
}
