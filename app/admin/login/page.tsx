"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import {
  AdminAlert,
  AdminFormField,
  AdminLoading,
  AdminLoginCard,
  AdminLoginHeader,
  AdminLoginShell,
} from "@/app/admin/components/AdminUi";
import { clearAdminReturn, resolveAdminReturn } from "@/app/admin/lib/authGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearInvalidAdminSession, createSupabaseBrowserClient } from "@/src/lib/supabase";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      await clearInvalidAdminSession(supabase);
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) {
        const nextPath = resolveAdminReturn(searchParams.get("next"));
        clearAdminReturn();
        router.replace(nextPath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }
      setBusy(true);
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (signErr) {
        setError(signErr.message);
        return;
      }
      const nextPath = resolveAdminReturn(searchParams.get("next"));
      clearAdminReturn();
      router.replace(nextPath);
    },
    [email, password, router, searchParams],
  );

  return (
    <AdminLoginShell>
      <AdminLoginCard>
        <AdminLoginHeader title="Admin sign in" lead="Sign in with your admin account to manage jobs and applications." />

        <form className="po-admin-form" onSubmit={(ev) => void submit(ev)}>
          <AdminFormField label="Email" htmlFor="admin-email">
            <Input
              id="admin-email"
              className="po-admin-control"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </AdminFormField>
          <AdminFormField label="Password" htmlFor="admin-password">
            <Input
              id="admin-password"
              className="po-admin-control"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </AdminFormField>
          {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
          <Button type="submit" className="po-admin-btn-primary po-admin-form__submit w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="po-admin-login__footer">
          <Link href="/" className="po-admin-link">
            Back to site
          </Link>
        </p>
      </AdminLoginCard>
    </AdminLoginShell>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <AdminLoginShell>
          <AdminLoading message="Loading…" />
        </AdminLoginShell>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
