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
import { AuthAlert, AuthButton, AuthField, AuthInput, AuthMobileInput, AuthSelect } from "@/app/components/auth/AuthUi";
import { AuthPageShell } from "@/app/components/site/AuthPageShell";
import { OtpBoxes, OTP_DIGIT_COUNT } from "@/components/OtpBoxes";
import { invokeSupabaseFunction } from "@/src/lib/edgeFunctions";
import {
  formatIndianMobileHint,
  INVALID_INDIAN_MOBILE_MESSAGE,
  normalizeIndianMobile,
} from "@/src/lib/mobile";
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

function isQualification(value: string): value is (typeof QUALIFICATIONS)[number] {
  return (QUALIFICATIONS as readonly string[]).includes(value);
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshCandidate } = useCandidate();
  const registrationSource = searchParams.get("source");
  const fromEmptyState =
    registrationSource === "home-empty" ||
    registrationSource === "jobs-empty" ||
    registrationSource === "jobs-filter-empty";

  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState(() => getOtpPendingMobile() ?? "");
  const canonicalMobile = useMemo(() => normalizeIndianMobile(mobile), [mobile]);
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
  const [otpSentOnce, setOtpSentOnce] = useState(() => Boolean(getOtpPendingMobile()));
  const [restoredDraftBanner, setRestoredDraftBanner] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const draftSaveTimer = useRef<number | null>(null);

  const applyRealtimeOtpCode = useCallback((code: string) => {
    setOtp(code.replace(/\D/g, "").slice(0, OTP_DIGIT_COUNT));
  }, []);

  useEffect(() => {
    const pending = getOtpPendingMobile();
    if (!pending) return;
    if (canonicalMobile !== pending) {
      clearOtpPendingMobile();
    }
  }, [canonicalMobile, mobile]);

  useRealtimeOtp({
    active: step === 1 && otpSentOnce,
    mobile: canonicalMobile ?? mobile,
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
      setMobile(normalizeIndianMobile(draft.mobile) ?? draft.mobile.replace(/\D/g, "").slice(0, 10));
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
    const m = canonicalMobile;
    if (!verified || !m || verified !== m) return;

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
    canonicalMobile,
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

  const canSendOtp = useMemo(() => canonicalMobile !== null, [canonicalMobile]);
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
    if (!canonicalMobile) {
      setError(INVALID_INDIAN_MOBILE_MESSAGE);
      return;
    }
    setBusy(true);
    let fnError: string | null = null;
    try {
      const out = await invokeSupabaseFunction<{ success?: boolean }>("send-otp", {
        mobile: canonicalMobile,
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
    setOtpPendingMobile(canonicalMobile);
    setOtpSentOnce(true);
    setOtp("");
  }, [canonicalMobile]);

  const canVerify = otpSentOnce && otp.replace(/\D/g, "").length === OTP_DIGIT_COUNT && !busy;

  const verifyOtp = useCallback(async () => {
    setError(null);
    setAlreadyRegistered(false);
    if (!canonicalMobile) {
      setError(INVALID_INDIAN_MOBILE_MESSAGE);
      return;
    }
    setBusy(true);
    let data: VerifyOtpResponse | null = null;
    let fnError: string | null = null;
    try {
      const out = await invokeSupabaseFunction<VerifyOtpResponse>("verify-otp", {
        mobile: canonicalMobile,
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
    setVerifiedMobile(canonicalMobile);
    await refreshCandidate();
    setStep(2);
  }, [canonicalMobile, otp, refreshCandidate]);

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
      mobile: canonicalMobile ?? mobile,
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
        mobile: payload.mobile,
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
    await login(payload.mobile);
    setBusy(false);

    const next = takePostAuthRedirect();
    router.replace(next ?? "/jobs");
  }, [
    canonicalMobile,
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
    <AuthPageShell
      authMode="register"
      cardSize={step === 2 ? "wide" : "default"}
      title="Create your profile"
      step={step}
      totalSteps={2}
      subtitle={
        step === 1
          ? "We’ll text a one-time code to confirm your mobile number."
          : "Share your background so we can match you to the right pharma roles."
      }
    >
      {fromEmptyState ? (
        <AuthAlert variant="info">
          Don&apos;t see a matching role right now? Register and we&apos;ll reach out when the right opportunity
          appears.
        </AuthAlert>
      ) : null}

      {restoredDraftBanner ? (
        <AuthAlert variant="success">
          <span className="po-auth-alert__row">
            <span>
              <strong>Welcome back.</strong> We restored your saved details so you can finish registering.
            </span>
            <button type="button" onClick={() => setRestoredDraftBanner(false)} className="po-auth-alert__dismiss">
              Dismiss
            </button>
          </span>
        </AuthAlert>
      ) : null}

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {alreadyRegistered ? (
        <div className="po-auth-panel">
          <p className="po-auth-panel__title">Already registered</p>
          <p className="po-auth-panel__text">This number already has a profile.</p>
          <Link href="/login" className="po-auth-btn po-auth-btn--primary po-auth-btn--link">
            Go to sign in
          </Link>
        </div>
      ) : null}

      {!alreadyRegistered && step === 1 ? (
        <div className="po-auth-stack">
          <AuthField
            label="Mobile number"
            htmlFor="register-mobile"
            required
            hint="India (+91) · 10 digits, no country code"
          >
            <AuthMobileInput id="register-mobile" value={mobile} onChange={setMobile} required />
          </AuthField>

          <div className="po-auth-actions po-auth-actions--split">
            {!otpSentOnce ? (
              <AuthButton
                variant="primary"
                disabled={!canSendOtp || busy || resendIn > 0}
                onClick={sendOtp}
                className="po-auth-btn--grow"
              >
                {busy ? "Sending…" : resendIn > 0 ? `Retry in ${resendIn}s` : "Send OTP"}
              </AuthButton>
            ) : (
              <AuthButton
                variant="secondary"
                disabled={busy || resendIn > 0}
                onClick={sendOtp}
                className="po-auth-btn--grow"
              >
                {resendIn > 0 ? `Resend OTP (${resendIn}s)` : "Resend OTP"}
              </AuthButton>
            )}
          </div>

          {otpSentOnce ? (
            <div className="po-auth-otp-block">
              <p id="register-otp-heading" className="po-auth-otp-label">
                Enter the {OTP_DIGIT_COUNT}-digit code
              </p>
              <p className="po-auth-otp-hint">
                Sent to {canonicalMobile ? formatIndianMobileHint(canonicalMobile) : mobile}
              </p>
              <OtpBoxes value={otp} onChange={setOtp} disabled={busy} labelledBy="register-otp-heading" />
              <AuthButton variant="accent" disabled={!canVerify} onClick={verifyOtp} className="po-auth-btn--block">
                {busy ? "Verifying…" : "Verify & continue"}
              </AuthButton>
            </div>
          ) : null}
        </div>
      ) : null}

      {!alreadyRegistered && step === 2 ? (
            <form
              className="po-auth-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void submitProfile();
              }}
            >
              <label className="po-auth-label-block">
                Full name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                  required
                  className="po-auth-input"
                  placeholder="e.g. Priya Sharma"
                />
              </label>

              <label className="po-auth-label-block">
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className="po-auth-input"
                  placeholder="e.g. you@company.com"
                />
              </label>

              <label className="po-auth-label-block">
                Mobile
                <input
                  value={canonicalMobile ?? mobile}
                  readOnly
                  tabIndex={-1}
                  aria-readonly="true"
                  className="po-auth-input po-auth-input--readonly"
                />
              </label>

              <label className="po-auth-label-block">
                Department <span className="po-auth-required">*</span>
                <AuthSelect value={department} onChange={(e) => onDepartmentChange(e.target.value)} required>
                  <option value="">Select department</option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                </AuthSelect>
              </label>
              {department === OTHER_OPTION ? (
                <label className="po-auth-label-block">
                  Enter department <span className="po-auth-required">*</span>
                  <input
                    value={departmentCustom}
                    onChange={(e) => setDepartmentCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="po-auth-input"
                    placeholder="e.g. Quality Assurance"
                  />
                </label>
              ) : null}

              <label className="po-auth-label-block">
                Sub-department <span className="po-auth-required">*</span>
                <AuthSelect
                  value={subDepartment}
                  onChange={(e) => onSubDepartmentChange(e.target.value)}
                  required
                  disabled={!department}
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
                </AuthSelect>
              </label>
              {subDepartment === OTHER_OPTION ? (
                <label className="po-auth-label-block">
                  Enter sub-department <span className="po-auth-required">*</span>
                  <input
                    value={subDepartmentCustom}
                    onChange={(e) => setSubDepartmentCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="po-auth-input"
                    placeholder="e.g. Analytical QC"
                  />
                </label>
              ) : null}

              <label className="po-auth-label-block">
                Current designation <span className="po-auth-required">*</span>
                <AuthSelect
                  value={designation}
                  onChange={(e) => onDesignationChange(e.target.value)}
                  required
                  disabled={!department}
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
                </AuthSelect>
              </label>
              {designation === OTHER_OPTION ? (
                <label className="po-auth-label-block">
                  Enter designation <span className="po-auth-required">*</span>
                  <input
                    value={designationCustom}
                    onChange={(e) => setDesignationCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="po-auth-input"
                    placeholder="e.g. Senior Analyst"
                  />
                </label>
              ) : null}

              <label className="po-auth-label-block">
                Current company <span className="po-auth-required">*</span>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  maxLength={120}
                  className="po-auth-input"
                  placeholder="e.g. ABC Pharma Pvt Ltd"
                />
              </label>

              <label className="po-auth-label-block">
                Preferred location <span className="po-auth-required">*</span>
                <input
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  required
                  maxLength={120}
                  className="po-auth-input"
                  placeholder="e.g. Hyderabad, Remote, Bengaluru"
                />
              </label>

              <label className="po-auth-label-block">
                Notice period <span className="po-auth-required">*</span>
                <input
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  required
                  maxLength={120}
                  className="po-auth-input"
                  placeholder="e.g. Immediate, 15 days, 30 days, 2 months"
                />
              </label>

              <label className="po-auth-label-block">
                Highest qualification <span className="po-auth-required">*</span>
                <AuthSelect value={qualification} onChange={(e) => onQualificationChange(e.target.value)} required>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </AuthSelect>
              </label>
              {qualification === "Other" ? (
                <label className="po-auth-label-block">
                  Specify qualification <span className="po-auth-required">*</span>
                  <input
                    value={qualificationCustom}
                    onChange={(e) => setQualificationCustom(e.target.value)}
                    required
                    maxLength={120}
                    className="po-auth-input"
                    placeholder="Enter your qualification"
                  />
                </label>
              ) : null}

              <div className="po-auth-field">
                <p className="po-auth-label">
                  Preferred modules <span className="po-auth-required">*</span>
                </p>
                <p className="po-auth-field-hint">Select all that apply.</p>
                <div className="po-auth-chip-group">
                  {MODULES.map((m) => {
                    const active = preferred.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleModule(m)}
                        className={`po-auth-chip${active ? " po-auth-chip--active" : ""}`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                {preferred.includes("Others") ? (
                  <label className="po-auth-label-block po-auth-label-block--spaced">
                    Describe preferred modules (Others) <span className="po-auth-required">*</span>
                    <input
                      value={preferredModulesOthersNote}
                      onChange={(e) => setPreferredModulesOthersNote(e.target.value)}
                      required
                      maxLength={200}
                      className="po-auth-input"
                      placeholder="e.g. Formulation R&D, Clinical supplies"
                    />
                  </label>
                ) : null}
              </div>

              <div className="po-auth-field">
                <label className="po-auth-label-block" htmlFor="register-resume">
                  Resume <span className="po-auth-required">*</span>{" "}
                  <span className="po-auth-label-hint">(PDF/DOC, max 5MB)</span>
                  <input
                    id="register-resume"
                    ref={resumeInputRef}
                    type="file"
                    required
                    accept={RESUME_ACCEPT_ATTR}
                    onChange={(e) => onResumeSelected(e.target.files?.[0] ?? null)}
                    className="po-auth-file"
                  />
                </label>
                {resumeHint ? (
                  <p className="po-auth-field-error" role="alert" aria-live="polite">
                    {resumeHint}
                  </p>
                ) : null}
              </div>

              <button type="submit" disabled={busy} className="po-auth-btn po-auth-btn--primary po-auth-btn--block">
                {busy ? "Saving…" : "Create profile"}
              </button>
            </form>
          ) : null}
    </AuthPageShell>
  );
}
