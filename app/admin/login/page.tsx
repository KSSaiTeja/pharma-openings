"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { clearAdminReturn, resolveAdminReturn } from "@/app/admin/lib/authGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/src/lib/supabase";

export default function AdminLoginPage() {
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
    <main className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-4 py-10 sm:min-h-[70vh]">
      <div className="rounded-2xl border border-[var(--color-po-lavender-deep)] bg-white p-6 shadow-md shadow-[var(--color-po-navy)]/5">
        <h1 className="text-xl font-semibold text-[var(--color-po-navy)]">Admin sign in</h1>
        <p className="mt-1 text-sm text-[var(--color-po-muted)]">Use your Supabase Auth admin account.</p>

        <form className="mt-6 space-y-4" onSubmit={(ev) => void submit(ev)}>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-po-muted)]">
          <Link
            href="/"
            className="font-medium text-[var(--color-po-violet)] underline-offset-4 hover:underline"
          >
            Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
