"use client";

import { Briefcase, ClipboardList, LogOut, UserPlus } from "lucide-react";
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
import { invokeSupabaseFunction } from "@/src/lib/edgeFunctions";
import { createSupabaseBrowserClient } from "@/src/lib/supabase";
const SYNC_TIMEOUT_MS = 35_000;
const ADMIN_TAB_KEY = "po_admin_active_tab";

type SyncToSheetsResponse = {
  success: boolean;
  scope?: "applications" | "talent_pool";
  applications_synced?: number;
  applications_skipped_duplicates?: number;
  applications_on_page?: number;
  talent_pool_synced?: number;
  talent_pool_skipped_duplicates?: number;
  talent_pool_on_page?: number;
  page?: number | null;
  error?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsTick, setStatsTick] = useState(0);
  const [syncTick, setSyncTick] = useState(0);
  const [syncingTarget, setSyncingTarget] = useState<null | "applications" | "talent_pool">(null);
  const [activeTab, setActiveTab] = useState("applications");
  const [syncMessage, setSyncMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

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

  const resolveSyncErrorMessage = useCallback((error: string | null, status: number | null): string => {
    const raw = error ?? "";
    const normalized = raw.toLowerCase();
    if (
      normalized.includes("application id") ||
      normalized.includes("candidate id") ||
      normalized.includes("must use the new header") ||
      normalized.includes("not compatible") ||
      normalized.includes("application_ids must") ||
      normalized.includes("candidate_ids must")
    ) {
      return raw;
    }
    if (
      normalized.includes("google") ||
      normalized.includes("oauth2.googleapis.com") ||
      normalized.includes("sheets.googleapis.com") ||
      normalized.includes("spreadsheet")
    ) {
      return "Sync failed. Google services unavailable. Retry later.";
    }
    if (status === 429 || normalized.includes("rate limit")) {
      return "Google API rate limited the sync. Please wait a moment and retry.";
    }
    if (normalized.includes("partially completed") || normalized.includes("partial")) {
      return "Sync partially completed. Try again.";
    }
    if (
      normalized.includes("network") ||
      normalized.includes("failed to fetch") ||
      normalized.includes("timeout") ||
      normalized.includes("abort")
    ) {
      return "Sync partially completed. Try again.";
    }
    return "Sync failed. Please try again.";
  }, []);

  const runSheetsSync = useCallback(
    async (
      scope: "applications" | "talent_pool",
      payload: { applicationIds?: string[]; candidateIds?: string[]; page: number },
    ) => {
      if (syncingTarget !== null) return;
      setSyncMessage(null);

      const ids =
        scope === "applications" ? (payload.applicationIds ?? []) : (payload.candidateIds ?? []);
      if (ids.length === 0) {
        setSyncMessage({
          tone: "error",
          text:
            scope === "applications"
              ? "No applications on this page to sync."
              : "No talent pool candidates on this page to sync.",
        });
        return;
      }

      setSyncingTarget(scope);

      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          setSyncMessage({ tone: "error", text: "Supabase is not configured." });
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token ?? "";
        if (!accessToken) {
          setSyncMessage({ tone: "error", text: "Session expired. Please sign in again." });
          return;
        }

        const body =
          scope === "applications"
            ? { scope: "applications" as const, application_ids: payload.applicationIds, page: payload.page }
            : { scope: "talent_pool" as const, candidate_ids: payload.candidateIds, page: payload.page };

        const timeoutController = new AbortController();
        const timeoutId = window.setTimeout(() => timeoutController.abort(), SYNC_TIMEOUT_MS);
        const { data, error, status } = await invokeSupabaseFunction<SyncToSheetsResponse>(
          "sync-to-sheets",
          body,
          { accessToken, signal: timeoutController.signal },
        );
        window.clearTimeout(timeoutId);

        if (error || !data?.success) {
          setSyncMessage({
            tone: "error",
            text: resolveSyncErrorMessage(error ?? data?.error ?? null, status),
          });
          return;
        }

        const pageLabel = data.page ?? payload.page;
        const tabLabel = scope === "applications" ? "Applications" : "Talent Pool";
        const idLabel = scope === "applications" ? "Application ID" : "Candidate ID";

        const appended =
          scope === "applications"
            ? (data.applications_synced ?? 0)
            : (data.talent_pool_synced ?? 0);
        const skipped =
          scope === "applications"
            ? (data.applications_skipped_duplicates ?? 0)
            : (data.talent_pool_skipped_duplicates ?? 0);
        const onPage =
          scope === "applications"
            ? (data.applications_on_page ?? ids.length)
            : (data.talent_pool_on_page ?? ids.length);

        const head = `${tabLabel} · Page ${pageLabel} sync completed. This page has ${onPage} entr${onPage === 1 ? "y" : "ies"}.`;
        let detail: string;
        if (appended > 0 && skipped > 0) {
          detail = ` Added ${appended} new row(s) to the "${tabLabel}" tab; skipped ${skipped} already present (same ${idLabel}).`;
        } else if (appended > 0) {
          detail = ` Added ${appended} new row(s) to the "${tabLabel}" tab.`;
        } else if (skipped > 0) {
          detail = ` No new rows — all ${skipped} were already in the "${tabLabel}" tab.`;
        } else {
          detail = "";
        }

        setSyncMessage({
          tone: "success",
          text: `${head}${detail}`.trim(),
        });
        setSyncTick((n) => n + 1);
        bumpStats();
      } finally {
        setSyncingTarget(null);
      }
    },
    [bumpStats, resolveSyncErrorMessage, syncingTarget],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(ADMIN_TAB_KEY);
    if (saved === "applications" || saved === "jobs" || saved === "talent") {
      setActiveTab(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(ADMIN_TAB_KEY, activeTab);
  }, [activeTab]);

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
        const [appTotal, jobsActive, newToday, shortlisted, appWeek, talentRpc] = await Promise.all([
          supabase.from("applications").select("*", { count: "exact", head: true }),
          supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .gte("created_at", todayStart)
            .lt("created_at", tomorrowStart),
          supabase.from("applications").select("*", { count: "exact", head: true }).ilike("status", "shortlisted"),
          supabase.from("applications").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
          supabase.rpc("count_talent_pool_candidates"),
        ]);

        if (cancelled) return;

        const talentPool =
          talentRpc.error || talentRpc.data == null ? 0 : Number(talentRpc.data as string | number);

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

      {syncMessage ? (
        <p
          role={syncMessage.tone === "success" ? "status" : "alert"}
          aria-live={syncMessage.tone === "success" ? "polite" : "assertive"}
          className={
            syncMessage.tone === "success"
              ? "mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : "mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          }
        >
          {syncMessage.text}
        </p>
      ) : null}

      <div className="mt-6">
        <StatsBar stats={stats} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
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
          <ApplicationsTab
            key={`applications-${syncTick}`}
            supabase={supabase}
            onStatsBump={bumpStats}
            onSyncApplications={(payload) =>
              void runSheetsSync("applications", {
                applicationIds: payload.applicationIds,
                page: payload.page,
              })
            }
            syncingTarget={syncingTarget}
          />
        </TabsContent>
        <TabsContent value="jobs" className="focus-visible:outline-none">
          <JobsTab supabase={supabase} onStatsBump={bumpStats} />
        </TabsContent>
        <TabsContent value="talent" className="focus-visible:outline-none">
          <TalentPoolTab
            key={`talent-${syncTick}`}
            supabase={supabase}
            onSyncTalentPool={(payload) =>
              void runSheetsSync("talent_pool", { candidateIds: payload.candidateIds, page: payload.page })
            }
            syncingTarget={syncingTarget}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
