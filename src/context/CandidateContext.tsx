"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearOtpPendingMobile,
  clearVerifiedMobile,
  getVerifiedMobile,
  setVerifiedMobile,
} from "@/src/lib/authSession";
import { createSupabaseClient } from "@/src/lib/supabase";
import type { CandidateRow } from "@/types/database.types";

type CandidateContextValue = {
  candidate: CandidateRow | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (mobile: string) => Promise<void>;
  logout: () => void;
  refreshCandidate: () => Promise<void>;
};

const CandidateContext = createContext<CandidateContextValue | undefined>(undefined);

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const [candidate, setCandidate] = useState<CandidateRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCandidate = useCallback(async () => {
    await Promise.resolve();
    const supabase = createSupabaseClient();
    const mobile = getVerifiedMobile();
    if (!supabase || !mobile) {
      setCandidate(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("mobile", mobile)
      .maybeSingle();

    if (error) {
      console.error(error);
      setCandidate(null);
    } else {
      setCandidate((data as CandidateRow | null) ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshCandidate();
    });
  }, [refreshCandidate]);

  const login = useCallback(
    async (mobile: string) => {
      await Promise.resolve();
      setVerifiedMobile(mobile.trim());
      const supabase = createSupabaseClient();
      const normalized = mobile.trim();
      if (!supabase || !normalized) {
        setCandidate(null);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("mobile", normalized)
        .maybeSingle();

      if (error) {
        console.error(error);
        setCandidate(null);
      } else {
        setCandidate((data as CandidateRow | null) ?? null);
      }
      setLoading(false);
    },
    [],
  );

  const logout = useCallback(() => {
    clearOtpPendingMobile();
    clearVerifiedMobile();
    setCandidate(null);
  }, []);

  const value = useMemo(
    () => ({
      candidate,
      isAuthenticated: Boolean(candidate),
      loading,
      login,
      logout,
      refreshCandidate,
    }),
    [candidate, loading, login, logout, refreshCandidate],
  );

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidate() {
  const ctx = useContext(CandidateContext);
  if (!ctx) {
    throw new Error("useCandidate must be used within CandidateProvider");
  }
  return ctx;
}
