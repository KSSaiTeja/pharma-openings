"use client";

import { Briefcase, ClipboardList, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { startOfLocalDay } from "@/app/admin/admin-constants";
import {
  AdminAlert,
  AdminHeader,
  adminTabsClass,
} from "@/app/admin/components/AdminUi";
import { useAdminSupabase } from "@/app/admin/components/AdminAuthGate";
import { ApplicationsTab } from "@/app/admin/components/ApplicationsTab";
import { JobsTab } from "@/app/admin/components/JobsTab";
import type { AdminStats } from "@/app/admin/components/StatsBar";
import { StatsBar } from "@/app/admin/components/StatsBar";
import { TalentPoolTab } from "@/app/admin/components/TalentPoolTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invokeSupabaseFunction } from "@/src/lib/edgeFunctions";

const SYNC_TIMEOUT_MS = 35_000;
const ADMIN_TAB_KEY = "po_admin_active_tab";

type SyncToSheetsResponse = {
  success: boolean;
  scope?: "applications" | "talent_pool";
  applications_synced?: number;
  applications_skipped_duplicates?: number;
  applications_on_page?: number;
  applications_job_ids_updated?: number;
  talent_pool_synced?: number;
  talent_pool_skipped_duplicates?: number;
  talent_pool_on_page?: number;
  page?: number | null;
  error?: string;
};

export default function AdminDashboardPage() {
  const supabase = useAdminSupabase();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsTick, setStatsTick] = useState(0);
  const [syncTick, setSyncTick] = useState(0);
  const [syncingTarget, setSyncingTarget] = useState<null | "applications" | "talent_pool">(null);
  const [activeTab, setActiveTab] = useState("applications");
  const [syncMessage, setSyncMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

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
      if (syncingTarget !== null || !supabase) return;
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

        const jobIdsUpdated =
          scope === "applications" ? (data.applications_job_ids_updated ?? 0) : 0;
        const jobIdNote =
          scope === "applications" && jobIdsUpdated > 0
            ? ` Updated Job ID on ${jobIdsUpdated} existing row(s) in the sheet.`
            : scope === "applications"
              ? " Each row includes Job ID (e.g. PO-2026-0001) so recruiters can match what candidates quote."
              : "";

        setSyncMessage({
          tone: "success",
          text: `${head}${detail}${jobIdNote}`.trim(),
        });
        setSyncTick((n) => n + 1);
        bumpStats();
      } finally {
        setSyncingTarget(null);
      }
    },
    [bumpStats, resolveSyncErrorMessage, supabase, syncingTarget],
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
    if (!supabase) return;
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
  }, [supabase, statsTick]);

  if (!supabase) {
    return <AdminAlert variant="error">Supabase is not configured.</AdminAlert>;
  }

  return (
    <>
      <AdminHeader title="Admin dashboard" subtitle="Applications, jobs, and talent pool" showLogo={false} />

      {syncMessage ? <AdminAlert variant={syncMessage.tone}>{syncMessage.text}</AdminAlert> : null}

      <StatsBar stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className={adminTabsClass.root}>
        <TabsList className={adminTabsClass.list}>
          <TabsTrigger value="applications" className={adminTabsClass.trigger}>
            <span className="flex min-w-0 items-center gap-3">
              <span className={adminTabsClass.triggerIcon}>
                <ClipboardList className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={adminTabsClass.triggerTitle}>Applications</span>
                <span className={adminTabsClass.triggerDesc}>Review pipeline</span>
              </span>
            </span>
            <span className={adminTabsClass.badge}>{stats?.totalApplications ?? 0}</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className={adminTabsClass.trigger}>
            <span className="flex min-w-0 items-center gap-3">
              <span className={adminTabsClass.triggerIcon}>
                <Briefcase className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={adminTabsClass.triggerTitle}>Manage jobs</span>
                <span className={adminTabsClass.triggerDesc}>Postings and CSV</span>
              </span>
            </span>
            <span className={adminTabsClass.badge}>{stats?.activeJobs ?? 0}</span>
          </TabsTrigger>
          <TabsTrigger value="talent" className={adminTabsClass.trigger}>
            <span className="flex min-w-0 items-center gap-3">
              <span className={adminTabsClass.triggerIcon}>
                <UserPlus className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={adminTabsClass.triggerTitle}>Talent pool</span>
                <span className={adminTabsClass.triggerDesc}>No application yet</span>
              </span>
            </span>
            <span className={adminTabsClass.badge}>{stats?.talentPool ?? 0}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className={adminTabsClass.content}>
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
        <TabsContent value="jobs" className={adminTabsClass.content}>
          <JobsTab supabase={supabase} onStatsBump={bumpStats} />
        </TabsContent>
        <TabsContent value="talent" className={adminTabsClass.content}>
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
    </>
  );
}
