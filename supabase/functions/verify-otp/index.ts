import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  MSG91_OTP_ROW_MARKER,
  formatIndiaMsg91Mobile,
  msg91OtpConfigured,
  msg91VerifyOtp,
} from "../_shared/msg91.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEMO_CODE = "1234";
const LOCKOUT_MS = 5 * 60 * 1000;
const MAX_WRONG_ATTEMPTS = 3;

const STABLE = {
  expired: "OTP expired. Tap Resend to get a new code.",
  invalid: "That code is not correct. Double-check and try again.",
  noOtp: "No OTP on file. Tap Resend to get a new code.",
  sendFirst: "Send an OTP to this number before verifying.",
  lockBase:
    "Too many incorrect OTP attempts. Please wait before trying again.",
} as const;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Default true when unset (dev-friendly: OTP `1234` works against latest pending row).
 * Disabled when MSG91 credentials are set (real SMS OTP). Otherwise false only for
 * explicit falsey `OTP_DEMO_BYPASS`.
 */
function isDemoBypassEnabled(): boolean {
  if (msg91OtpConfigured()) return false;
  const raw = Deno.env.get("OTP_DEMO_BYPASS");
  if (raw === undefined || raw === null || String(raw).trim() === "") return true;
  const v = String(raw).trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  return true;
}

function storedCode(row: { code?: unknown; otp_code?: unknown }): string | null {
  if (typeof row.code === "string" && row.code.length > 0) return row.code;
  if (typeof row.otp_code === "string" && row.otp_code.length > 0) return row.otp_code;
  return null;
}

type OtpRow = {
  id: string;
  expires_at: string;
  verified: boolean;
  attempts?: number | null;
  code?: unknown;
  otp_code?: unknown;
};

async function activeLockMinutes(supabase: SupabaseClient<any>, mobile: string): Promise<number> {
  const { data, error } = await supabase
    .from("otp_mobile_lockouts")
    .select("locked_until")
    .eq("mobile", mobile)
    .maybeSingle();
  if (error || !data?.locked_until) return 0;
  const until = new Date(String(data.locked_until)).getTime();
  const leftMs = until - Date.now();
  if (leftMs <= 0) return 0;
  return Math.max(1, Math.ceil(leftMs / 60_000));
}

async function applyLockout(supabase: SupabaseClient<any>, mobile: string): Promise<boolean> {
  const lockedUntil = new Date(Date.now() + LOCKOUT_MS).toISOString();
  const { error } = await supabase.from("otp_mobile_lockouts").upsert(
    { mobile, locked_until: lockedUntil },
    { onConflict: "mobile" },
  );
  if (error) {
    console.error("verify-otp lockout write failed");
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed", code: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Service misconfigured", code: "server_misconfigured" }, 500);
  }

  try {
    const body = (await req.json()) as { mobile?: unknown; otp?: unknown };
    const mobileRaw = body.mobile;
    const otpRaw = body.otp;
    if (typeof mobileRaw !== "string" || typeof otpRaw !== "string") {
      return json(
        { error: "Mobile and OTP are required.", code: "validation_error" },
        400,
      );
    }

    const mobile = mobileRaw.trim();
    const otp = otpRaw.trim();
    if (!mobile || !otp) {
      return json({ error: "Invalid mobile or OTP.", code: "validation_error" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const lockedMins = await activeLockMinutes(supabase, mobile);
    if (lockedMins > 0) {
      return json(
        {
          error: `${STABLE.lockBase} Try again in about ${lockedMins} minute(s).`,
          code: "otp_locked",
        },
        423,
      );
    }

    const { data: latest, error: fetchErr } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("mobile", mobile)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error("verify-otp fetch failed");
      return json({ error: "Verification failed. Please try again.", code: "lookup_failed" }, 500);
    }
    const demoBypass = isDemoBypassEnabled();
    const isDemoCode = otp === DEMO_CODE;

    let matchedId: string | null = null;

    const e164 = formatIndiaMsg91Mobile(mobile);
    const secret = latest ? storedCode(latest) : null;
    const useMsg91 =
      msg91OtpConfigured() &&
      Boolean(latest?.id) &&
      Boolean(e164) &&
      secret === MSG91_OTP_ROW_MARKER;

    if (latest?.id && msg91OtpConfigured() && secret === MSG91_OTP_ROW_MARKER && !e164) {
      return json(
        {
          error: "Enter a valid 10-digit Indian mobile number (or include country code 91).",
          code: "validation_error",
        },
        400,
      );
    }

    const bumpWrongAttempt = async (): Promise<Response> => {
      if (!latest?.id) {
        return json({ error: STABLE.invalid, code: "otp_invalid" }, 400);
      }
      const prev = latest.attempts ?? 0;
      const nextAttempts = prev + 1;
      const { error: upErr } = await supabase
        .from("otp_codes")
        .update({ attempts: nextAttempts })
        .eq("id", latest.id);
      if (upErr) {
        console.error("verify-otp attempt update failed");
        return json({ error: "Verification failed. Please try again.", code: "update_failed" }, 500);
      }

      if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
        const lockOk = await applyLockout(supabase, mobile);
        if (!lockOk) {
          return json(
            { error: "Verification failed. Please try again.", code: "lockout_failed" },
            500,
          );
        }
        const mins = Math.max(1, Math.ceil(LOCKOUT_MS / 60_000));
        return json(
          {
            error: `${STABLE.lockBase} Try again in about ${mins} minute(s).`,
            code: "otp_locked",
          },
          423,
        );
      }

      return json({ error: STABLE.invalid, code: "otp_invalid" }, 400);
    };

    if (useMsg91 && latest && e164) {
      const expiresAtMs = new Date(latest.expires_at).getTime();
      if (expiresAtMs <= Date.now()) {
        return json({ error: STABLE.expired, code: "otp_expired" }, 400);
      }
      const vr = await msg91VerifyOtp(e164, otp);
      if (!vr.ok) {
        return await bumpWrongAttempt();
      }
      matchedId = latest.id;
    } else if (demoBypass && isDemoCode) {
      if (!latest?.id) {
        return json({ error: STABLE.sendFirst, code: "otp_invalid" }, 400);
      }
      matchedId = latest.id;
    } else {
      if (!latest?.id) {
        return json({ error: STABLE.noOtp, code: "otp_invalid" }, 400);
      }

      const expiresAt = new Date(latest.expires_at).getTime();
      if (expiresAt <= Date.now()) {
        return json({ error: STABLE.expired, code: "otp_expired" }, 400);
      }

      const secretLocal = storedCode(latest);
      if (!secretLocal) {
        console.error("verify-otp row missing code column");
        return json({ error: "Verification failed. Please try again.", code: "lookup_failed" }, 500);
      }

      if (otp !== secretLocal) {
        return await bumpWrongAttempt();
      }

      matchedId = latest.id;
    }

    if (!matchedId) {
      return json({ error: STABLE.invalid, code: "otp_invalid" }, 400);
    }

    const { error: verifyErr } = await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", matchedId);
    if (verifyErr) {
      console.error("verify-otp mark verified failed");
      return json({ error: "Could not complete verification.", code: "verify_failed" }, 500);
    }

    await supabase.from("otp_mobile_lockouts").delete().eq("mobile", mobile);

    const { data: existingCand, error: existErr } = await supabase
      .from("candidates")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();

    if (existErr) {
      console.error("verify-otp candidate lookup failed");
      return json({ error: "Verification succeeded but profile lookup failed.", code: "candidate_read_failed" }, 500);
    }

    if (existingCand?.id) {
      const { error: candUpdErr } = await supabase
        .from("candidates")
        .update({ otp_verified: true })
        .eq("mobile", mobile);
      if (candUpdErr) {
        console.error("verify-otp candidate otp_verified update failed");
        return json(
          { error: "Could not update verification status. Please try again.", code: "candidate_update_failed" },
          500,
        );
      }
    }

    const { data: candidate, error: candErr } = await supabase
      .from("candidates")
      .select("*")
      .eq("mobile", mobile)
      .maybeSingle();

    if (candErr) {
      console.error("verify-otp candidate read failed");
      return json({ error: "Verification succeeded but profile lookup failed.", code: "candidate_read_failed" }, 500);
    }

    return json({ verified: true, candidate: candidate ?? null }, 200);
  } catch {
    console.error("verify-otp unexpected");
    return json({ error: "Something went wrong. Please try again.", code: "unexpected_error" }, 500);
  }
});
