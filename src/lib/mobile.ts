/** User-facing validation message for auth flows. */
export const INVALID_INDIAN_MOBILE_MESSAGE =
  "Enter a valid 10-digit Indian mobile number (starting with 6–9).";

/**
 * Canonical storage key: 10 digits, no country code (e.g. `9390418860`).
 * Accepts pasted `+91`, spaces, or `91` prefix.
 */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return digits.slice(2);
  }
  return null;
}

/** Display for OTP hints (E.164-style, still 10-digit national number). */
export function formatIndianMobileHint(tenDigits: string): string {
  const m = normalizeIndianMobile(tenDigits);
  if (!m) return tenDigits.trim();
  return `+91 ${m.slice(0, 5)} ${m.slice(5)}`;
}
