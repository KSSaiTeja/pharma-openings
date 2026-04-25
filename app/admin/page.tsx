"use client";

import { Briefcase, ClipboardList, LogOut, UserPlus } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { startOfLocalDay } from "@/app/admin/admin-constants";
import { clearAdminReturn, setAdminReturn } from "@/app/admin/lib/authGate";
import { ApplicationsTab } from "@/app/admin/components/ApplicationsTab";
import { JobsTab } from "@/app/admin/components/JobsTab";
import type { AdminStats } from "@/app/admin/components/StatsBar";
import { StatsBar } from "@/app/admin/components/StatsBar";
import { TalentPoolTab } from "@/app/admin/components/TalentPoolTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseBrowserClient } from "@/src/lib/supabase";
import type { Database } from "@/types/database.types";

const PAGE_SIZE = 1000;

async function fetchAllCandidateIds(supabase: SupabaseClient<Database>): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from("candidates").select("id").order("id", { ascending: true }).range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    const rows = data ?? [];
    for (const row of rows) {
      if (row.id) ids.add(row.id);
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return ids;
}

async function fetchAllAppliedCandidateIds(supabase: SupabaseClient<Database>): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("applications")
      .select("candidate_id")
      .not("candidate_id", "is", null)
      .order("candidate_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    const rows = data ?? [];
    for (const row of rows) {
      if (row.candidate_id) ids.add(row.candidate_id);
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return ids;
}

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsTick, setStatsTick] = useState(0);

  const redirectToAdminLogin = useCallback(() => {
    if (typeof window !== "undefined") {
      const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      setAdminReturn(returnPath);
    }
    router.replace("/admin/login");
  }, [router]);

  const bumpStats = useCallback(() => {
    setStatsTick((n) => n + 1);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      queueMicrotask(() => setReady(true));
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
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
    });
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

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !sessionEmail) return;
    let cancelled = false;
    const run = async () => {
      const todayStart = startOfLocalDay().toISOString();
      const tomorrowStart = startOfLocalDay(new Date(Date.now() + 24 * 60 * 60 * 1000)).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      try {
        const [appTotal, jobsActive, newToday, shortlisted, appWeek, allCandidateIds, appliedCandidateIds] =
          await Promise.all([
            supabase.from("applications").select("*", { count: "exact", head: true }),
            supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
            supabase
              .from("applications")
              .select("*", { count: "exact", head: true })
              .gte("created_at", todayStart)
              .lt("created_at", tomorrowStart),
            supabase.from("applications").select("*", { count: "exact", head: true }).ilike("status", "shortlisted"),
            supabase.from("applications").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
            fetchAllCandidateIds(supabase),
            fetchAllAppliedCandidateIds(supabase),
          ]);

        if (cancelled) return;

        let talentPool = 0;
        for (const candidateId of allCandidateIds) {
          if (!appliedCandidateIds.has(candidateId)) {
            talentPool += 1;
          }
        }

        queueMicrotask(() => {
          if (cancelled) return;
          setStats({
            totalApplications: appTotal.count ?? 0,
            activeJobs: jobsActive.count ?? 0,
            newToday: newToday.count ?? 0,
            shortlisted: shortlisted.count ?? 0,
            talentPool,
            thisWeek: appWeek.count ?? 0,
          });
        });
      } catch {
        if (cancelled) return;
        queueMicrotask(() => {
          if (cancelled) return;
          setStats({
            totalApplications: 0,
            activeJobs: 0,
            newToday: 0,
            shortlisted: 0,
            talentPool: 0,
            thisWeek: 0,
          });
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionEmail, statsTick]);

  const logout = async () => {
    clearAdminReturn();
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (!ready) {
    return (
      <main className="mx-auto max-w-[min(100%,90rem)] min-w-0 px-4 py-16">
        <p className="text-center text-sm text-zinc-500">Checking session…</p>
      </main>
    );
  }

  if (!sessionEmail) {
    return (
      <main className="mx-auto max-w-[min(100%,90rem)] min-w-0 px-4 py-16">
        <p className="text-center text-sm text-zinc-500">Redirecting to sign in…</p>
      </main>
    );
  }

  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-[min(100%,90rem)] min-w-0 px-4 py-16">
        <p className="text-center text-sm text-red-600">Supabase is not configured.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[min(100%,90rem)] min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Admin dashboard</h1>
          <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">{sessionEmail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <StatsBar stats={stats} />
      </div>

      <Tabs defaultValue="applications" className="mt-8">
        <TabsList className="flex h-auto w-full flex-col gap-2 rounded-2xl border border-zinc-200/90 bg-white/95 p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 sm:flex-row sm:gap-2">
          <TabsTrigger
            value="applications"
            className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-transparent px-4 py-3 text-left shadow-none transition-colors data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50 data-[state=active]:text-zinc-900 data-[state=inactive]:hover:bg-zinc-50 dark:data-[state=active]:border-violet-500/40 dark:data-[state=active]:bg-violet-950/50 dark:data-[state=active]:text-zinc-50 dark:data-[state=inactive]:hover:bg-zinc-800/80"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 group-data-[state=active]:bg-violet-100 group-data-[state=active]:text-violet-800 dark:bg-zinc-800 dark:text-zinc-200 dark:group-data-[state=active]:bg-violet-900/60 dark:group-data-[state=active]:text-violet-100">
                <ClipboardList className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight">Applications</span>
                <span className="mt-0.5 block text-xs font-normal text-zinc-500 group-data-[state=active]:text-violet-700/90 dark:text-zinc-400 dark:group-data-[state=active]:text-violet-200/90">
                  Review pipeline
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-zinc-200/90 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-800 group-data-[state=active]:bg-white/90 group-data-[state=active]:text-violet-900 dark:bg-zinc-700 dark:text-zinc-100 dark:group-data-[state=active]:bg-violet-900/80 dark:group-data-[state=active]:text-violet-50">
              {stats?.totalApplications ?? 0}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="jobs"
            className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-transparent px-4 py-3 text-left shadow-none transition-colors data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50 data-[state=active]:text-zinc-900 data-[state=inactive]:hover:bg-zinc-50 dark:data-[state=active]:border-violet-500/40 dark:data-[state=active]:bg-violet-950/50 dark:data-[state=active]:text-zinc-50 dark:data-[state=inactive]:hover:bg-zinc-800/80"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 group-data-[state=active]:bg-violet-100 group-data-[state=active]:text-violet-800 dark:bg-zinc-800 dark:text-zinc-200 dark:group-data-[state=active]:bg-violet-900/60 dark:group-data-[state=active]:text-violet-100">
                <Briefcase className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight">Manage jobs</span>
                <span className="mt-0.5 block text-xs font-normal text-zinc-500 group-data-[state=active]:text-violet-700/90 dark:text-zinc-400 dark:group-data-[state=active]:text-violet-200/90">
                  Postings and CSV
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-zinc-200/90 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-800 group-data-[state=active]:bg-white/90 group-data-[state=active]:text-violet-900 dark:bg-zinc-700 dark:text-zinc-100 dark:group-data-[state=active]:bg-violet-900/80 dark:group-data-[state=active]:text-violet-50">
              {stats?.activeJobs ?? 0}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="talent"
            className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-transparent px-4 py-3 text-left shadow-none transition-colors data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50 data-[state=active]:text-zinc-900 data-[state=inactive]:hover:bg-zinc-50 dark:data-[state=active]:border-violet-500/40 dark:data-[state=active]:bg-violet-950/50 dark:data-[state=active]:text-zinc-50 dark:data-[state=inactive]:hover:bg-zinc-800/80"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 group-data-[state=active]:bg-violet-100 group-data-[state=active]:text-violet-800 dark:bg-zinc-800 dark:text-zinc-200 dark:group-data-[state=active]:bg-violet-900/60 dark:group-data-[state=active]:text-violet-100">
                <UserPlus className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight">Talent pool</span>
                <span className="mt-0.5 block text-xs font-normal text-zinc-500 group-data-[state=active]:text-violet-700/90 dark:text-zinc-400 dark:group-data-[state=active]:text-violet-200/90">
                  No application yet
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-zinc-200/90 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-800 group-data-[state=active]:bg-white/90 group-data-[state=active]:text-violet-900 dark:bg-zinc-700 dark:text-zinc-100 dark:group-data-[state=active]:bg-violet-900/80 dark:group-data-[state=active]:text-violet-50">
              {stats?.talentPool ?? 0}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="focus-visible:outline-none">
          <ApplicationsTab supabase={supabase} onStatsBump={bumpStats} />
        </TabsContent>
        <TabsContent value="jobs" className="focus-visible:outline-none">
          <JobsTab supabase={supabase} onStatsBump={bumpStats} />
        </TabsContent>
        <TabsContent value="talent" className="focus-visible:outline-none">
          <TalentPoolTab supabase={supabase} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
