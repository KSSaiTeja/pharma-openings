import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeIndianMobile } from "../_shared/mobile.ts";
import {
  MSG91_OTP_ROW_MARKER,
  formatIndiaMsg91Mobile,
  msg91OtpConfigured,
  msg91SendOtp,
} from "../_shared/msg91.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STABLE = {
  locked:
    "Too many incorrect OTP attempts. Please wait before requesting a new code.",
  storeFailed: "Could not send OTP. Please try again.",
} as const;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
    const body = (await req.json()) as { mobile?: unknown };
    const mobileRaw = body.mobile;
    if (typeof mobileRaw !== "string") {
      return json({ error: "Mobile number is required.", code: "validation_error" }, 400);
    }

    const mobile = normalizeIndianMobile(mobileRaw);
    if (!mobile) {
      return json(
        {
          error: "Enter a valid 10-digit Indian mobile number (starting with 6–9).",
          code: "validation_error",
        },
        400,
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const lockedMins = await activeLockMinutes(supabase, mobile);
    if (lockedMins > 0) {
      return json(
        {
          error: `${STABLE.locked} Try again in about ${lockedMins} minute(s).`,
          code: "otp_locked",
        },
        423,
      );
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    let otp: string;

    if (msg91OtpConfigured()) {
      const e164 = formatIndiaMsg91Mobile(mobile);
      if (!e164) {
        return json(
          {
            error: "Enter a valid 10-digit Indian mobile number (or include country code 91).",
            code: "validation_error",
          },
          400,
        );
      }
      const sent = await msg91SendOtp(e164);
      if (!sent.ok) {
        console.error("send-otp MSG91:", sent.message);
        return json({ error: sent.message, code: "sms_send_failed" }, 502);
      }
      otp = MSG91_OTP_ROW_MARKER;
    } else {
      otp = String(Math.floor(1000 + Math.random() * 9000));
    }

    const insertVariants: Record<string, unknown>[] = [
      { mobile, code: otp, expires_at: expiresAt, verified: false, attempts: 0 },
      { mobile, code: otp, expires_at: expiresAt, verified: false },
      { mobile, otp_code: otp, expires_at: expiresAt, verified: false, attempts: 0 },
      { mobile, otp_code: otp, expires_at: expiresAt, verified: false },
    ];

    let lastErr: { message: string } | null = null;
    for (const row of insertVariants) {
      const { error } = await supabase.from("otp_codes").insert(row);
      if (!error) {
        lastErr = null;
        break;
      }
      lastErr = error;
    }

    if (lastErr) {
      console.error("send-otp insert failed");
      return json({ error: STABLE.storeFailed, code: "otp_store_failed" }, 500);
    }

    return json({ success: true }, 200);
  } catch {
    console.error("send-otp unexpected");
    return json({ error: "Something went wrong. Please try again.", code: "unexpected_error" }, 500);
  }
});
