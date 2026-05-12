"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { registerSubmitSchema } from "@/src/lib/schemas/forms";
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

type VerifyOtpResponse = {
  verified?: boolean;
  candidate?: CandidateRow | null;
};

function normalizeMobile(input: string) {
  return input.trim();
}

function isQualification(value: string): value is (typeof QUALIFICATIONS)[number] {
  return (QUALIFICATIONS as readonly string[]).includes(value);
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshCandidate } = useCandidate();
  const initialPendingMobile = getOtpPendingMobile();
  const registrationSource = searchParams.get("source");
  const fromEmptyState =
    registrationSource === "home-empty" ||
    registrationSource === "jobs-empty" ||
    registrationSource === "jobs-filter-empty";

  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState(() => initialPendingMobile ?? "");
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
  const [qualificationCustom, setQualificationCustom] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [preferred, setPreferred] = useState<string[]>(["Others"]);
  const [preferredModulesOthersNote, setPreferredModulesOthersNote] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [otpSentOnce, setOtpSentOnce] = useState(() => Boolean(initialPendingMobile));
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
      setQualificationCustom(draft.qualificationCustom ?? "");
      setNoticePeriod(draft.noticePeriod ?? "");
      setPreferredModulesOthersNote(draft.preferredModulesOthersNote ?? "");
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
        qualificationCustom,
        noticePeriod,
        preferred,
        preferredModulesOthersNote,
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
    qualificationCustom,
    noticePeriod,
    preferred,
    preferredModulesOthersNote,
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

  const onQualificationChange = useCallback((next: string) => {
    setQualification(next);
    if (next !== "Other") {
      setQualificationCustom("");
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

  useEffect(() => {
    if (!preferred.includes("Others")) {
      setPreferredModulesOthersNote("");
    }
  }, [preferred]);

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
    const parsed = registerSubmitSchema.safeParse({
      fullName,
      email,
      mobile: normalizeMobile(mobile),
      department,
      subDepartment,
      designation,
      departmentCustom,
      subDepartmentCustom,
      designationCustom,
      company,
      preferredLocation,
      qualification,
      qualificationCustom,
      noticePeriod,
      preferred,
      preferredModulesOthersNote,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please correct the highlighted fields.");
      return;
    }
    const payload = parsed.data;

    if (!resumeFile) {
      setError("Please upload your resume (PDF or Word, max 5MB).");
      return;
    }

    const taxonomy = resolveCandidateTaxonomySelection({
      department: payload.department,
      subDepartment: payload.subDepartment,
      designation: payload.designation,
      departmentCustom: payload.departmentCustom ?? "",
      subDepartmentCustom: payload.subDepartmentCustom ?? "",
      designationCustom: payload.designationCustom ?? "",
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

    const resumeErr = resumeValidationMessage(resumeFile);
    if (resumeErr) {
      setResumeHint(resumeErr);
      return;
    }

    const highestQualification =
      payload.qualification === "Other"
        ? (payload.qualificationCustom ?? "").trim()
        : payload.qualification;

    const preferredModulesForDb = payload.preferred.map((p) =>
      p === "Others" ? `Others (${(payload.preferredModulesOthersNote ?? "").trim()})` : p,
    );

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
        full_name: payload.fullName,
        email: payload.email,
        current_designation: taxonomy.designation,
        current_department: taxonomy.department,
        current_sub_department: taxonomy.subDepartment,
        department_custom: taxonomy.departmentCustom,
        sub_department_custom: taxonomy.subDepartmentCustom,
        designation_custom: taxonomy.designationCustom,
        current_company: payload.company,
        preferred_location: payload.preferredLocation,
        highest_qualification: highestQualification,
        notice_period: payload.noticePeriod.trim(),
        preferred_modules: preferredModulesForDb,
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

    const ext = resumeFile.name.includes(".") ? resumeFile.name.slice(resumeFile.name.lastIndexOf(".")) : "";
    const path = `${inserted.id}/resume-${Date.now()}${ext}`;
    const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile, {
      cacheControl: "3600",
      upsert: true,
      contentType: inferResumeContentType(resumeFile),
    });
    if (upErr) {
      setBusy(false);
      setError(upErr.message);
      return;
    }

    const { data: pub } = supabase.storage.from("resumes").getPublicUrl(path);
    const resumeUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("candidates")
      .update({ resume_url: resumeUrl })
      .eq("id", inserted.id);
    if (updErr) {
      setBusy(false);
      setError(updErr.message);
      return;
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
    preferredModulesOthersNote,
    qualification,
    qualificationCustom,
    noticePeriod,
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
              ? "We’ll send a one-time code by SMS to confirm your number. Enter it below when it arrives."
              : "Tell us a bit about your background so we can match you to the right roles. When you’re done, we’ll take you to job listings."}
          </p>

          {fromEmptyState ? (
            <div className="mt-4 rounded-2xl border border-[var(--color-po-gold)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]">
              Don&apos;t see a matching role right now? Register your profile and we&apos;ll reach out when the right opportunity comes.
            </div>
          ) : null}

          {restoredDraftBanner ? (
            <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-[var(--color-po-teal)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]">
              <p className="min-w-0 leading-relaxed">
                <span className="font-semibold">Welcome back.</span> We restored your saved details from last time so you
                can finish registering.
              </p>
              <button
                type="button"
                onClick={() => setRestoredDraftBanner(false)}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold text-[var(--color-po-muted)] hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
              >
                Dismiss
              </button>
            </div>
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

          {alreadyRegistered ? (
            <div className="mt-6 rounded-2xl border border-[var(--color-po-gold)]/40 bg-[var(--color-po-lavender)] px-4 py-4 text-sm text-[var(--color-po-navy)]">
              <p className="font-semibold">Already registered.</p>
              <p className="mt-1 text-[var(--color-po-muted)]">Login instead?</p>
              <Link
                href="/login"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
              >
                Go to login
              </Link>
            </div>
          ) : null}

          {!alreadyRegistered && step === 1 ? (
            <div className="mt-8 space-y-4">
              <label className="block text-sm font-semibold text-[var(--color-po-navy)]" htmlFor="register-mobile">
                Mobile number
                <input
                  id="register-mobile"
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
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Sending…" : resendIn > 0 ? `Retry in ${resendIn}s` : "Send OTP"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy || resendIn > 0}
                    onClick={sendOtp}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[var(--color-po-lavender-deep)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:border-[var(--color-po-violet)]/35 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendIn > 0 ? `Resend OTP (${resendIn}s)` : "Resend OTP"}
                  </button>
                )}
              </div>

              {otpSentOnce ? (
                <div>
                  <p id="register-otp-heading" className="text-sm font-semibold text-[var(--color-po-navy)]">
                    Enter OTP
                  </p>
                  <OtpBoxes value={otp} onChange={setOtp} disabled={busy} labelledBy="register-otp-heading" />
                </div>
              ) : null}

              {otpSentOnce ? (
                <button
                  type="button"
                  disabled={!canVerify}
                  onClick={verifyOtp}
                  className="min-h-11 w-full rounded-full bg-[var(--color-po-teal)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
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
                  {!subDepartmentOptions.includes(OTHER_OPTION) ? (
                    <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                  ) : null}
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
                  {!designationOptions.includes(OTHER_OPTION) ? (
                    <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                  ) : null}
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
                Current company <span className="text-[var(--color-po-coral)]">*</span>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  maxLength={120}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                  placeholder="e.g. ABC Pharma Pvt Ltd"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                Preferred location <span className="text-[var(--color-po-coral)]">*</span>
                <input
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  required
                  maxLength={120}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                  placeholder="e.g. Hyderabad, Remote, Bengaluru"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                Notice period <span className="text-[var(--color-po-coral)]">*</span>
                <input
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  required
                  maxLength={120}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                  placeholder="e.g. Immediate, 15 days, 30 days, 2 months"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                Highest qualification <span className="text-[var(--color-po-coral)]">*</span>
                <select
                  value={qualification}
                  onChange={(e) => onQualificationChange(e.target.value)}
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
              {qualification === "Other" ? (
                <label className="block text-sm font-semibold text-[var(--color-po-navy)]">
                  Specify qualification <span className="text-[var(--color-po-coral)]">*</span>
                  <input
                    value={qualificationCustom}
                    onChange={(e) => setQualificationCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                    placeholder="Enter your qualification"
                  />
                </label>
              ) : null}

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
                {preferred.includes("Others") ? (
                  <label className="mt-3 block text-sm font-semibold text-[var(--color-po-navy)]">
                    Describe preferred modules (Others) <span className="text-[var(--color-po-coral)]">*</span>
                    <input
                      value={preferredModulesOthersNote}
                      onChange={(e) => setPreferredModulesOthersNote(e.target.value)}
                      required
                      maxLength={200}
                      className="mt-2 w-full rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white px-4 py-3 text-sm text-[var(--color-po-navy)] outline-none ring-[var(--color-po-violet)]/25 focus:ring-4"
                      placeholder="e.g. Formulation R&D, Clinical supplies"
                    />
                  </label>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-po-navy)]" htmlFor="register-resume">
                  Resume <span className="text-[var(--color-po-coral)]">*</span>{" "}
                  <span className="font-medium text-[var(--color-po-muted)]">(PDF/DOC, max 5MB)</span>
                  <input
                    id="register-resume"
                    ref={resumeInputRef}
                    type="file"
                    required
                    accept={RESUME_ACCEPT_ATTR}
                    onChange={(e) => onResumeSelected(e.target.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm text-[var(--color-po-muted)] file:mr-4 file:min-h-11 file:rounded-full file:border-0 file:bg-[var(--color-po-lavender)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-po-navy)]"
                  />
                </label>
                {resumeHint ? (
                  <p className="mt-2 text-sm text-[var(--color-po-coral)]" role="alert" aria-live="polite">
                    {resumeHint}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="min-h-11 w-full rounded-full bg-[var(--color-po-navy)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving…" : "Create profile"}
              </button>
            </form>
          ) : null}

          <p className="mt-8 text-center text-sm text-[var(--color-po-muted)]">
            Already have an account?{" "}
            <Link
              className="font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
              href="/login"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
