"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

import { normalizeIndianMobile } from "@/src/lib/mobile";
import { createSupabaseClient } from "@/src/lib/supabase";
import type { Database } from "@/types/database.types";

/**
 * Optional dev/staging convenience: stream new `otp_codes` rows via Supabase Realtime.
 * **Off in production** unless `NEXT_PUBLIC_REALTIME_OTP` is explicitly enabled — SMS (or
 * demo bypass) remains the default delivery path. Realtime does not replace SMS; it only
 * reflects DB state visible under the same `x-po-verified-mobile` RLS channel as pending OTP.
 */
export function isRealtimeOtpEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_REALTIME_OTP ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** Matches `MSG91_OTP_ROW_MARKER` in `supabase/functions/_shared/msg91.ts` — never auto-fill. */
const MSG91_OTP_ROW_MARKER = "__MSG91__";

function extractCode(row: Record<string, unknown> | null | undefined): string | null {
  if (!row) return null;
  const c = row.code;
  if (typeof c === "string" && c.length >= 4) {
    if (c === MSG91_OTP_ROW_MARKER) return null;
    return c;
  }
  const legacy = row.otp_code;
  if (typeof legacy === "string" && legacy.length >= 4) {
    if (legacy === MSG91_OTP_ROW_MARKER) return null;
    return legacy;
  }
  return null;
}

/**
 * Subscribe to new OTP rows for `mobile`. Never logs OTP values.
 * @returns cleanup to remove the channel (call on unmount, verify success, or mobile change).
 */
export function subscribeRealtimeOtpInsert(
  supabase: SupabaseClient<Database>,
  mobile: string,
  onCode: (code: string) => void,
): () => void {
  const m = normalizeIndianMobile(mobile) ?? mobile.trim();
  if (!m) return () => {};

  const filter = `mobile=eq.${encodeURIComponent(m)}`;
  const channelId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const channel: RealtimeChannel = supabase
    .channel(`po-otp:${encodeURIComponent(m)}:${channelId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "otp_codes", filter },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (row?.verified === true) return;
        const code = extractCode(row);
        if (code) onCode(code);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

const DEBOUNCE_MS = 220;

/**
 * While `active`, subscribes to Realtime OTP inserts for `mobile` and debounces `onCode`.
 * No-op when the env flag is off (no channel opened).
 */
export function useRealtimeOtp(args: {
  active: boolean;
  mobile: string;
  onCode: (code: string) => void;
}): void {
  const onCodeRef = useRef(args.onCode);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    onCodeRef.current = args.onCode;
  }, [args.onCode]);

  useEffect(() => {
    if (!isRealtimeOtpEnabled() || !args.active) return;

    const supabase = createSupabaseClient();
    if (!supabase) return;

    const m = normalizeIndianMobile(args.mobile) ?? args.mobile.trim();
    if (m.length !== 10) return;

    const flush = (code: string) => {
      if (debounceTimer.current != null) {
        window.clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = window.setTimeout(() => {
        debounceTimer.current = null;
        onCodeRef.current(code);
      }, DEBOUNCE_MS);
    };

    const unsubscribe = subscribeRealtimeOtpInsert(supabase, m, flush);

    return () => {
      unsubscribe();
      if (debounceTimer.current != null) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [args.active, args.mobile]);
}
