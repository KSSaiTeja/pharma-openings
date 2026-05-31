"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminAlert, AdminLoading } from "@/app/admin/components/AdminUi";
import { AdminShell } from "@/app/admin/components/AdminShell";
import { clearAdminReturn, setAdminReturn } from "@/app/admin/lib/authGate";
import { clearInvalidAdminSession, createSupabaseBrowserClient } from "@/src/lib/supabase";

type AdminAuthGateProps = {
  children: React.ReactNode;
};

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const redirectToAdminLogin = useCallback(() => {
    if (typeof window !== "undefined") {
      const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      setAdminReturn(returnPath);
    }
    router.replace("/admin/login");
  }, [router]);

  const logout = useCallback(async () => {
    clearAdminReturn();
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/admin/login");
  }, [router]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      queueMicrotask(() => setReady(true));
      return;
    }
    let cancelled = false;
    void (async () => {
      await clearInvalidAdminSession(supabase);
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      queueMicrotask(() => {
        if (cancelled) return;
        if (!data.session) {
          redirectToAdminLogin();
        } else {
          clearAdminReturn();
          setSessionEmail(data.session.user.email ?? null);
        }
        setReady(true);
      });
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!sess) {
        redirectToAdminLogin();
        return;
      }
      clearAdminReturn();
      setSessionEmail(sess.user.email ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [redirectToAdminLogin]);

  if (!ready) {
    return (
      <AdminShell sessionEmail="" onLogout={() => void logout()}>
        <AdminLoading message="Checking session…" />
      </AdminShell>
    );
  }

  if (!sessionEmail) {
    return (
      <AdminShell sessionEmail="" onLogout={() => void logout()}>
        <AdminLoading message="Redirecting to sign in…" />
      </AdminShell>
    );
  }

  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return (
      <AdminShell sessionEmail={sessionEmail} onLogout={() => void logout()}>
        <AdminAlert variant="error">Supabase is not configured.</AdminAlert>
      </AdminShell>
    );
  }

  return (
    <AdminShell sessionEmail={sessionEmail} onLogout={() => void logout()}>
      {children}
    </AdminShell>
  );
}

export function useAdminSupabase() {
  return createSupabaseBrowserClient();
}
