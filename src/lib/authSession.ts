import { normalizeIndianMobile } from "@/src/lib/mobile";

export const VERIFIED_MOBILE_KEY = "po_verified_mobile";
/** Session mobile for OTP Realtime / RLS channel binding before verify-otp completes. */
export const OTP_PENDING_MOBILE_KEY = "po_otp_pending_mobile";
export const POST_AUTH_REDIRECT_KEY = "po_redirect_after_auth";

export function getVerifiedMobile(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.sessionStorage.getItem(VERIFIED_MOBILE_KEY);
  if (!v?.trim()) return null;
  return normalizeIndianMobile(v) ?? v.trim();
}

export function setVerifiedMobile(mobile: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeIndianMobile(mobile);
  if (!normalized) return;
  window.sessionStorage.setItem(VERIFIED_MOBILE_KEY, normalized);
}

export function clearVerifiedMobile() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(VERIFIED_MOBILE_KEY);
}

export function getOtpPendingMobile(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.sessionStorage.getItem(OTP_PENDING_MOBILE_KEY);
  if (!v?.trim()) return null;
  return normalizeIndianMobile(v) ?? v.trim();
}

export function setOtpPendingMobile(mobile: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeIndianMobile(mobile);
  if (!normalized) return;
  window.sessionStorage.setItem(OTP_PENDING_MOBILE_KEY, normalized);
}

export function clearOtpPendingMobile() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(OTP_PENDING_MOBILE_KEY);
}

export function takePostAuthRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function setPostAuthRedirect(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
}

/** Value for `x-po-verified-mobile` on anon PostgREST/Storage requests (see `po_request_mobile_header()`). */
export function getMobileForPoClientHeader(): string | null {
  if (typeof window === "undefined") return null;
  const m = (getOtpPendingMobile() ?? getVerifiedMobile())?.trim();
  return m || null;
}
