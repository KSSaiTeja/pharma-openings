"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCandidate } from "@/src/context/CandidateContext";
import {
  clearOtpPendingMobile,
  getOtpPendingMobile,
  setOtpPendingMobile,
  takePostAuthRedirect,
} from "@/src/lib/authSession";
import { OtpBoxes, OTP_DIGIT_COUNT } from "@/components/OtpBoxes";
import { invokeSupabaseFunction } from "@/src/lib/edgeFunctions";
import { useRealtimeOtp } from "@/src/lib/realtimeOtp";
import type { CandidateRow } from "@/types/database.types";

type VerifyOtpResponse = {
  verified?: boolean;
  candidate?: CandidateRow | null;
};

function normalizeMobile(input: string) {
  return input.trim();
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCandidate();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [otpSentOnce, setOtpSentOnce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

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
    active: otpSentOnce && !notRegistered,
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

  const canSendOtp = useMemo(() => normalizeMobile(mobile).length >= 8, [mobile]);

  const sendOtp = useCallback(async () => {
    setError(null);
    setNotRegistered(false);
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

  const verifyAndLogin = useCallback(async () => {
    setError(null);
    setNotRegistered(false);
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

    if (!data.candidate) {
      clearOtpPendingMobile();
      setNotRegistered(true);
      return;
    }

    clearOtpPendingMobile();
    await login(normalizeMobile(mobile));
    const next = takePostAuthRedirect();
    router.replace(next ?? "/");
  }, [login, mobile, otp, router]);

  const tryDifferentNumber = useCallback(() => {
    setNotRegistered(false);
    setOtpSentOnce(false);
    setOtp("");
    setError(null);
    setResendIn(0);
  }, []);

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
      <div className="mx-auto w-full max-w-xl flex-1">
        <div className="rounded-[1.75rem] border border-[var(--color-po-lavender-deep)] bg-white/90 p-6 shadow-[0_12px_48px_rgba(30,27,54,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-po-muted)]">
            Candidate login
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-po-navy)]">
            Sign in with mobile OTP
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-po-muted)]">
            Enter the mobile number you used to register. Demo tip: you can use 1234 as the OTP.
          </p>

          {error ? (
            <p className="mt-4 rounded-2xl border border-[var(--color-po-coral)]/35 bg-[var(--color-po-lavender)] px-4 py-3 text-sm text-[var(--color-po-navy)]">
              {error}
            </p>
          ) : null}

          {notRegistered ? (
            <div className="mt-6 rounded-2xl border border-[var(--color-po-gold)]/40 bg-[var(--color-po-lavender)] px-4 py-4 text-sm text-[var(--color-po-navy)]">
              <p className="font-semibold">Not registered.</p>
              <p className="mt-1 text-[var(--color-po-muted)]">No profile exists for this number yet.</p>
              <Link
                href="/register"
                className="mt-3 inline-flex text-sm font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
              <button
                type="button"
                onClick={tryDifferentNumber}
                className="mt-3 block w-full rounded-full border border-[var(--color-po-lavender-deep)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-po-navy)] transition-colors hover:border-[var(--color-po-violet)]/35"
              >
                Try a different number
              </button>
            </div>
          ) : null}

          {!notRegistered ? (
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
                  onClick={verifyAndLogin}
                  className="w-full rounded-full bg-[var(--color-po-teal)] px-6 py-3 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Signing in…" : "Verify & sign in"}
                </button>
              ) : null}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-[var(--color-po-muted)]">
            New here?{" "}
            <Link
              className="font-semibold text-[var(--color-po-violet)] underline-offset-4 hover:underline"
              href="/register"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
