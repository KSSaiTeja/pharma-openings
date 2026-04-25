"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCandidate } from "@/src/context/CandidateContext";
import {
  clearOtpPendingMobile,
  clearVerifiedMobile,
  getOtpPendingMobile,
  getVerifiedMobile,
  setOtpPendingMobile,
  setVerifiedMobile,
  takePostAuthRedirect,
} from "@/src/lib/authSession";
import { useRealtimeOtp } from "@/src/lib/realtimeOtp";
import {
  clearRegisterStep2Draft,
  readRegisterStep2Draft,
  writeRegisterStep2Draft,
} from "@/src/lib/registerDraft";
import { OtpBoxes, OTP_DIGIT_COUNT } from "@/components/OtpBoxes";
import { invokeSupabaseFunction } from "@/src/lib/edgeFunctions";
import { createSupabaseClient } from "@/src/lib/supabase";
import {
  DEPARTMENT_OPTIONS,
  OTHER_OPTION,
  getDesignationOptions,
  getSubDepartmentOptions,
  resolveCandidateTaxonomySelection,
} from "@/src/lib/candidateTaxonomy";
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

const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const RESUME_ACCEPT_ATTR =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ALLOWED_RESUME_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type VerifyOtpResponse = {
  verified?: boolean;
  candidate?: CandidateRow | null;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeMobile(input: string) {
  return input.trim();
}

function resumeValidationMessage(file: File): string | null {
  if (file.size > RESUME_MAX_BYTES) {
    return "That file is larger than 5MB. Choose a smaller file or a shorter PDF.";
  }
  const lower = file.name.toLowerCase();
  const extOk = lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx");
  const mime = (file.type || "").trim();
  const mimeOk = mime ? ALLOWED_RESUME_MIME.has(mime) : extOk;
  if (!extOk && !mimeOk) {
    return "Please choose a PDF or Word file (.pdf, .doc, .docx).";
  }
  return null;
}

function isQualification(value: string): value is (typeof QUALIFICATIONS)[number] {
  return (QUALIFICATIONS as readonly string[]).includes(value);
}

export default function RegisterPage() {
  const router = useRouter();
  const { login, refreshCandidate } = useCandidate();

  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [subDepartment, setSubDepartment] = useState("");
  const [designationCustom, setDesignationCustom] = useState("");
  const [departmentCustom, setDepartmentCustom] = useState("");
  const [subDepartmentCustom, setSubDepartmentCustom] = useState("");
  const [company, setCompany] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [qualification, setQualification] = useState<string>(QUALIFICATIONS[0]);
  const [preferred, setPreferred] = useState<string[]>(["Others"]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [otpSentOnce, setOtpSentOnce] = useState(false);
  const [restoredDraftBanner, setRestoredDraftBanner] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const draftSaveTimer = useRef<number | null>(null);

  const applyRealtimeOtpCode = useCallback((code: string) => {
    setOtp(code.replace(/\D/g, "").slice(0, OTP_DIGIT_COUNT));
  }, []);

  useEffect(() => {
    const pending = getOtpPendingMobile();
    if (!pending) return;
    if (normalizeMobile(mobile) !== pending) {
      clearOtpPendingMobile();
    }
  }, [mobile]);

  useRealtimeOtp({
    active: step === 1 && otpSentOnce,
    mobile: normalizeMobile(mobile),
    onCode: applyRealtimeOtpCode,
  });

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    const verified = getVerifiedMobile();
    const draft = readRegisterStep2Draft();
    if (!verified || !draft || draft.mobile !== verified) return;

    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      const mods = draft.preferred.filter((p) => (MODULES as readonly string[]).includes(p));
      setMobile(draft.mobile);
      setFullName(draft.fullName);
      setEmail(draft.email);
      setDesignation(draft.designation);
      setDepartment(draft.department);
      setSubDepartment(draft.subDepartment);
      setDepartmentCustom(draft.departmentCustom);
      setSubDepartmentCustom(draft.subDepartmentCustom);
      setDesignationCustom(draft.designationCustom);
      setCompany(draft.company);
      setPreferredLocation(draft.preferredLocation);
      setQualification(isQualification(draft.qualification) ? draft.qualification : QUALIFICATIONS[0]);
      setPreferred(mods.length ? mods : ["Others"]);
      setOtpSentOnce(true);
      setStep(2);
      setRestoredDraftBanner(true);
    };
    const id = window.setTimeout(apply, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (step !== 2 || alreadyRegistered) return;
    const verified = getVerifiedMobile();
    const m = normalizeMobile(mobile);
    if (!verified || verified !== m) return;

    if (draftSaveTimer.current) window.clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = window.setTimeout(() => {
      writeRegisterStep2Draft({
        v: 1,
        mobile: m,
        fullName,
        email,
        designation,
        department,
        subDepartment,
        departmentCustom,
        subDepartmentCustom,
        designationCustom,
        company,
        preferredLocation,
        qualification,
        preferred,
      });
    }, 450);

    return () => {
      if (draftSaveTimer.current) window.clearTimeout(draftSaveTimer.current);
    };
  }, [
    alreadyRegistered,
    step,
    mobile,
    fullName,
    email,
    designation,
    department,
    subDepartment,
    departmentCustom,
    subDepartmentCustom,
    designationCustom,
    company,
    preferredLocation,
    qualification,
    preferred,
  ]);

  const canSendOtp = useMemo(() => normalizeMobile(mobile).length >= 8, [mobile]);
  const subDepartmentOptions = useMemo(() => getSubDepartmentOptions(department), [department]);
  const designationOptions = useMemo(() => getDesignationOptions(department), [department]);
  const onDepartmentChange = useCallback((nextDepartment: string) => {
    setDepartment(nextDepartment);
    setSubDepartment("");
    setDesignation("");
    setSubDepartmentCustom("");
    setDesignationCustom("");
    if (nextDepartment !== OTHER_OPTION) {
      setDepartmentCustom("");
    }
  }, []);

  const onSubDepartmentChange = useCallback((nextSubDepartment: string) => {
    setSubDepartment(nextSubDepartment);
    if (nextSubDepartment !== OTHER_OPTION) {
      setSubDepartmentCustom("");
    }
  }, []);

  const onDesignationChange = useCallback((nextDesignation: string) => {
    setDesignation(nextDesignation);
    if (nextDesignation !== OTHER_OPTION) {
      setDesignationCustom("");
    }
  }, []);

  const sendOtp = useCallback(async () => {
    setError(null);
    setBusy(true);
    let fnError: string | null = null;
    try {
      const out = await invokeSupabaseFunction<{ success?: boolean }>("send-otp", {
        mobile: normalizeMobile(mobile),
      });
      fnError = out.error;
    } catch {
      fnError = "We couldn’t reach the server. Check your connection, then tap Retry.";
    }
    setBusy(false);
    setResendIn(30);
    if (fnError) {
      setError(fnError);
      return;
    }
    setOtpPendingMobile(normalizeMobile(mobile));
    setOtpSentOnce(true);
    setOtp("");
  }, [mobile]);

  const canVerify = otpSentOnce && otp.replace(/\D/g, "").length === OTP_DIGIT_COUNT && !busy;

  const verifyOtp = useCallback(async () => {
    setError(null);
    setAlreadyRegistered(false);
    setBusy(true);
    let data: VerifyOtpResponse | null = null;
    let fnError: string | null = null;
    try {
      const out = await invokeSupabaseFunction<VerifyOtpResponse>("verify-otp", {
        mobile: normalizeMobile(mobile),
        otp: otp.replace(/\D/g, "").slice(0, OTP_DIGIT_COUNT),
      });
      data = out.data;
      fnError = out.error;
    } catch {
      fnError = "We couldn’t reach the server. Check your connection and try again.";
    }
    setBusy(false);
    if (fnError || !data?.verified) {
      setError(fnError ?? "Verification failed");
      return;
    }

    if (data.candidate) {
      clearRegisterStep2Draft();
      clearOtpPendingMobile();
      setAlreadyRegistered(true);
      return;
    }

    clearOtpPendingMobile();
    setVerifiedMobile(normalizeMobile(mobile));
    await refreshCandidate();
    setStep(2);
  }, [mobile, otp, refreshCandidate]);

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

  const submitProfile = useCallback(async () => {
    setError(null);
    setResumeHint(null);

    const name = fullName.trim();
    if (!name || name.length > 100) {
      setError("Full name is required (max 100 characters).");
      return;
    }

    const mail = email.trim();
    if (!mail || !isValidEmail(mail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const taxonomy = resolveCandidateTaxonomySelection({
      department,
      subDepartment,
      designation,
      departmentCustom,
      subDepartmentCustom,
      designationCustom,
    });

    if (!taxonomy.department) {
      setError("Please select your department.");
      return;
    }
    if (taxonomy.department === OTHER_OPTION && !taxonomy.departmentCustom) {
      setError("Please enter your department when selecting Other.");
      return;
    }
    if (!taxonomy.subDepartment) {
      setError("Please select your sub-department.");
      return;
    }
    if (taxonomy.subDepartment === OTHER_OPTION && !taxonomy.subDepartmentCustom) {
      setError("Please enter your sub-department when selecting Other.");
      return;
    }
    if (!taxonomy.designation) {
      setError("Please select your current designation.");
      return;
    }
    if (taxonomy.designation === OTHER_OPTION && !taxonomy.designationCustom) {
      setError("Please enter your designation when selecting Other.");
      return;
    }

    if (!qualification) {
      setError("Please select your highest qualification.");
      return;
    }

    if (!preferred.length) {
      setError("Please select at least one preferred module.");
      return;
    }

    if (resumeFile) {
      const resumeErr = resumeValidationMessage(resumeFile);
      if (resumeErr) {
        setResumeHint(resumeErr);
        return;
      }
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);

    const { data: inserted, error: insertError } = await supabase
      .from("candidates")
      .insert({
        mobile: normalizeMobile(mobile),
        full_name: name,
        email: mail,
        current_designation: taxonomy.designation,
        current_department: taxonomy.department,
        current_sub_department: taxonomy.subDepartment,
        department_custom: taxonomy.departmentCustom,
        sub_department_custom: taxonomy.subDepartmentCustom,
        designation_custom: taxonomy.designationCustom,
        current_company: company.trim() || null,
        preferred_location: preferredLocation.trim() || null,
        highest_qualification: qualification,
        preferred_modules: preferred,
        otp_verified: true,
        resume_url: null,
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      setBusy(false);
      if ("code" in insertError && insertError.code === "23505") {
        clearRegisterStep2Draft();
        clearOtpPendingMobile();
        clearVerifiedMobile();
        await refreshCandidate();
        setAlreadyRegistered(true);
        setError("That mobile number is already registered.");
        return;
      }
      setError(insertError.message);
      return;
    }

    if (!inserted?.id) {
      setBusy(false);
      setError("Could not create your profile.");
      return;
    }

    let resumeUrl: string | null = null;
    if (resumeFile) {
      const ext = resumeFile.name.includes(".")
        ? resumeFile.name.slice(resumeFile.name.lastIndexOf("."))
        : "";
      const path = `${inserted.id}/resume-${Date.now()}${ext}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: resumeFile.type || undefined,
      });
      if (upErr) {
        setBusy(false);
        setError(upErr.message);
        return;
      }

      const { data: pub } = supabase.storage.from("resumes").getPublicUrl(path);
      resumeUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("candidates")
        .update({ resume_url: resumeUrl })
        .eq("id", inserted.id);
      if (updErr) {
        setBusy(false);
        setError(updErr.message);
        return;
      }
    }

    clearRegisterStep2Draft();
    await login(normalizeMobile(mobile));
    setBusy(false);

    const next = takePostAuthRedirect();
    router.replace(next ?? "/jobs");
  }, [
    company,
    preferredLocation,
    department,
    departmentCustom,
    designation,
    designationCustom,
    email,
    fullName,
    login,
    mobile,
    preferred,
    qualification,
    refreshCandidate,
    resumeFile,
    router,
    subDepartment,
    subDepartmentCustom,
  ]);

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
      <div className="mx-auto w-full max-w-xl flex-1">
        <div className="rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-6 shadow-[0_12px_48px_rgba(30,27,54,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-po-muted)]">
            Candidate registration
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-po-navy)]">
            {step === 1 ? "Verify your mobile" : "Complete your profile"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-po-muted)]">
            {step === 1
              ? "We’ll send a one-time code to confirm your number. Demo tip: you can use 1234 as the OTP."
              : "Tell us a bit about your background so we can match you to the right roles. When you’re done, we’ll take you to job listings."}
          </p>

          {restoredDraftBanner ? (
            <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-[var(--color-po-teal)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]">
              <p className="min-w-0 leading-relaxed">
                <span className="font-semibold">Welcome back.</span> We restored your saved details from last time so you
                can finish registering.
              </p>
              <button
                type="button"
                onClick={() => setRestoredDraftBanner(false)}
                className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-[var(--color-po-muted)] hover:bg-white/70"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]">
              {error}
            </p>
          ) : null}

          {alreadyRegistered ? (
            <div className="mt-6 rounded-2xl border border-[var(--color-po-gold)]/40 bg-[var(--color-po-lavender)] px-4 py-4 text-sm text-[var(--color-po-navy)]">
              <p className="font-semibold">Already registered.</p>
              <p className="mt-1 text-[var(--color-po-muted)]">Login instead?</p>
              <Link
                href="/login"
                className="mt-3 inline-flex text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline"
              >
                Go to login
              </Link>
            </div>
          ) : null}

          {!alreadyRegistered && step === 1 ? (
            <div className="mt-8 space-y-4">
              <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                Mobile number
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                  placeholder="+91 98765 43210"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {!otpSentOnce ? (
                  <button
                    type="button"
                    disabled={!canSendOtp || busy || resendIn > 0}
                    onClick={sendOtp}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Sending…" : resendIn > 0 ? `Retry in ${resendIn}s` : "Send OTP"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy || resendIn > 0}
                    onClick={sendOtp}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--color-po-lavender-deep)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:border-[var(--color-po-violet)]/35 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendIn > 0 ? `Resend OTP (${resendIn}s)` : "Resend OTP"}
                  </button>
                )}
              </div>

              {otpSentOnce ? (
                <div>
                  <p className="text-sm font-semibold text-[var(--color-po-navy)]">Enter OTP</p>
                  <OtpBoxes value={otp} onChange={setOtp} disabled={busy} />
                </div>
              ) : null}

              {otpSentOnce ? (
                <button
                  type="button"
                  disabled={!canVerify}
                  onClick={verifyOtp}
                  className="w-full rounded-full bg-[var(--color-po-teal)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Verifying…" : "Verify & continue"}
                </button>
              ) : null}
            </div>
          ) : null}

          {!alreadyRegistered && step === 2 ? (
            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submitProfile();
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
                  value={normalizeMobile(mobile)}
                  readOnly
                  tabIndex={-1}
                  aria-readonly="true"
                  className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[var(--color-po-lavender-deep)] bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-muted)]"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                Department <span className="text-[var(--color-po-coral)]">*</span>
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
                  Enter department <span className="text-[var(--color-po-coral)]">*</span>
                  <input
                    value={departmentCustom}
                    onChange={(e) => setDepartmentCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                  />
                </label>
              ) : null}

              <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                Sub-department <span className="text-[var(--color-po-coral)]">*</span>
                <select
                  value={subDepartment}
                  onChange={(e) => onSubDepartmentChange(e.target.value)}
                  required
                  disabled={!department}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4 disabled:cursor-not-allowed disabled:bg-[var(--color-po-lavender)]"
                >
                  <option value="">
                    {department ? "Select sub-department" : "Select department first"}
                  </option>
                  {subDepartmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {subDepartment === OTHER_OPTION ? (
                <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                  Enter sub-department <span className="text-[var(--color-po-coral)]">*</span>
                  <input
                    value={subDepartmentCustom}
                    onChange={(e) => setSubDepartmentCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                  />
                </label>
              ) : null}

              <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                Current designation <span className="text-[var(--color-po-coral)]">*</span>
                <select
                  value={designation}
                  onChange={(e) => onDesignationChange(e.target.value)}
                  required
                  disabled={!department}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4 disabled:cursor-not-allowed disabled:bg-[var(--color-po-lavender)]"
                >
                  <option value="">
                    {department ? "Select designation" : "Select department first"}
                  </option>
                  {designationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {designation === OTHER_OPTION ? (
                <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                  Enter designation <span className="text-[var(--color-po-coral)]">*</span>
                  <input
                    value={designationCustom}
                    onChange={(e) => setDesignationCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                  />
                </label>
              ) : null}

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
                Preferred location{" "}
                <span className="font-medium text-[var(--color-po-muted)]">(optional)</span>
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
                        onClick={() => toggleModule(m)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
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
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving…" : "Create profile"}
              </button>
            </form>
          ) : null}

          <p className="mt-8 text-center text-sm text-[var(--color-po-muted)]">
            Already have an account?{" "}
            <Link className="font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline" href="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
