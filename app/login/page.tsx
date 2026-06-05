"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthMobileInput,
} from "@/app/components/auth/AuthUi";
import { AuthPageShell } from "@/app/components/site/AuthPageShell";
import { OtpBoxes, OTP_DIGIT_COUNT } from "@/components/OtpBoxes";
import { useCandidate } from "@/src/context/CandidateContext";
import {
  clearOtpPendingMobile,
  getOtpPendingMobile,
  setOtpPendingMobile,
  takePostAuthRedirect,
} from "@/src/lib/authSession";
import { invokeSupabaseFunction } from "@/src/lib/edgeFunctions";
import {
  formatIndianMobileHint,
  INVALID_INDIAN_MOBILE_MESSAGE,
  normalizeIndianMobile,
} from "@/src/lib/mobile";
import { useRealtimeOtp } from "@/src/lib/realtimeOtp";
import type { CandidateRow } from "@/types/database.types";

type VerifyOtpResponse = {
  verified?: boolean;
  candidate?: CandidateRow | null;
};

function initialMobile(): string {
  const pending = getOtpPendingMobile();
  return pending ?? "";
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCandidate();

  const [mobile, setMobile] = useState(initialMobile);
  const canonicalMobile = useMemo(() => normalizeIndianMobile(mobile), [mobile]);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [otpSentOnce, setOtpSentOnce] = useState(() => Boolean(getOtpPendingMobile()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

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
    active: otpSentOnce && !notRegistered,
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

  const canSendOtp = useMemo(() => canonicalMobile !== null, [canonicalMobile]);

  const sendOtp = useCallback(async () => {
    setError(null);
    setNotRegistered(false);
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

  const verifyAndLogin = useCallback(async () => {
    setError(null);
    setNotRegistered(false);
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

    if (!data.candidate) {
      clearOtpPendingMobile();
      setNotRegistered(true);
      return;
    }

    clearOtpPendingMobile();
    await login(canonicalMobile);
    const next = takePostAuthRedirect();
    router.replace(next ?? "/");
  }, [canonicalMobile, login, otp, router]);

  const tryDifferentNumber = useCallback(() => {
    setNotRegistered(false);
    setOtpSentOnce(false);
    setOtp("");
    setError(null);
    setResendIn(0);
  }, []);

  return (
    <AuthPageShell
      authMode="login"
      title="Sign in"
      subtitle="Use the mobile number from your registration. We’ll text you a one-time code."
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {notRegistered ? (
        <div className="po-auth-panel">
          <p className="po-auth-panel__title">No account found</p>
          <p className="po-auth-panel__text">We don’t have a profile for this number yet.</p>
          <div className="po-auth-actions">
            <Link href="/register" className="po-auth-btn po-auth-btn--primary po-auth-btn--link">
              Create an account
            </Link>
            <AuthButton variant="secondary" onClick={tryDifferentNumber}>
              Try a different number
            </AuthButton>
          </div>
        </div>
      ) : null}

      {!notRegistered ? (
        <div className="po-auth-stack">
          <AuthField
            label="Mobile number"
            htmlFor="login-mobile"
            required
            hint="India (+91) · 10 digits, no country code"
          >
            <AuthMobileInput id="login-mobile" value={mobile} onChange={setMobile} required />
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
              <p id="login-otp-heading" className="po-auth-otp-label">
                Enter the {OTP_DIGIT_COUNT}-digit code
              </p>
              <p className="po-auth-otp-hint">
                Sent to {canonicalMobile ? formatIndianMobileHint(canonicalMobile) : mobile}
              </p>
              <OtpBoxes value={otp} onChange={setOtp} disabled={busy} labelledBy="login-otp-heading" />
              <AuthButton variant="accent" disabled={!canVerify} onClick={verifyAndLogin} className="po-auth-btn--block">
                {busy ? "Signing in…" : "Verify & sign in"}
              </AuthButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </AuthPageShell>
  );
}
