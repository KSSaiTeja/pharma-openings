/**
 * PostgREST header consumed by `public.po_request_mobile_header()` in RLS policies.
 * Keep in sync with `supabase/migrations/006_rls_candidates_applications.sql`.
 * During an active OTP request, `getMobileForPoClientHeader()` prefers the pending (pre-verify)
 * mobile so `otp_codes` Realtime/SELECT stays scoped to that number.
 */
export const PO_VERIFIED_MOBILE_HEADER = "x-po-verified-mobile";
