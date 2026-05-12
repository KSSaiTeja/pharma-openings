/**
 * MSG91 OTP API v5 (SendOTP + server-side verify).
 * @see https://docs.msg91.com/otp
 */

/** Stored in `otp_codes.code` when MSG91 generated the OTP (not in our DB). */
export const MSG91_OTP_ROW_MARKER = "__MSG91__";

export function msg91OtpConfigured(): boolean {
  const auth = (Deno.env.get("MSG91_AUTHKEY") ?? "").trim();
  const tid = (Deno.env.get("MSG91_OTP_TEMPLATE_ID") ?? "").trim();
  return auth.length > 0 && tid.length > 0;
}

/**
 * Normalize to MSG91 "mobile" (India): 91 + 10 digits starting with 6–9.
 * Accepts trimmed user input (e.g. "9876543210", "+91 98765 43210").
 */
export function formatIndiaMsg91Mobile(mobileTrimmed: string): string | null {
  const digits = mobileTrimmed.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}

function parseMsg91Json(text: string): { type?: string; message?: string } {
  try {
    return JSON.parse(text) as { type?: string; message?: string };
  } catch {
    return {};
  }
}

export async function msg91SendOtp(mobileE164: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const authkey = (Deno.env.get("MSG91_AUTHKEY") ?? "").trim();
  const template_id = (Deno.env.get("MSG91_OTP_TEMPLATE_ID") ?? "").trim();

  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      authkey,
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template_id, mobile: mobileE164 }),
  });

  const text = await res.text();
  const body = parseMsg91Json(text);
  if (body.type === "success") {
    return { ok: true };
  }
  const msg =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "Could not send SMS. Please try again.";
  return { ok: false, message: msg };
}

export async function msg91VerifyOtp(
  mobileE164: string,
  otp: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const authkey = (Deno.env.get("MSG91_AUTHKEY") ?? "").trim();
  const cleanOtp = otp.replace(/\D/g, "");
  const url = new URL("https://control.msg91.com/api/v5/otp/verify");
  url.searchParams.set("mobile", mobileE164);
  url.searchParams.set("otp", cleanOtp);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { authkey, accept: "application/json" },
  });

  const text = await res.text();
  const body = parseMsg91Json(text);
  if (body.type === "success") {
    return { ok: true };
  }
  const msg =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "That code is not correct. Double-check and try again.";
  return { ok: false, message: msg };
}
