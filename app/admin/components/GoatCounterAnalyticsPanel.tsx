"use client";

import { BarChart3, Eye, Globe, MousePointerClick, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAdminSupabase } from "@/app/admin/components/AdminAuthGate";
import {
  AdminAlert,
  AdminHeader,
  AdminLoading,
  AdminPanel,
  AdminSection,
} from "@/app/admin/components/AdminUi";
import { Button } from "@/components/ui/button";
import type { GoatCounterDashboardStats } from "@/src/lib/goatcounter";

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "blue" | "green" | "violet" | "amber";
}) {
  return (
    <article className={`po-admin-analytics-card po-admin-analytics-card--${accent ?? "blue"}`}>
      <div className="po-admin-analytics-card__icon" aria-hidden>
        <Icon className="h-5 w-5" />
      </div>
      <div className="po-admin-analytics-card__body">
        <p className="po-admin-analytics-card__label">{label}</p>
        <p className="po-admin-analytics-card__value">{value.toLocaleString()}</p>
        {hint ? <p className="po-admin-analytics-card__hint">{hint}</p> : null}
      </div>
    </article>
  );
}

export function GoatCounterAnalyticsPanel() {
  const supabase = useAdminSupabase();
  const [stats, setStats] = useState<GoatCounterDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadStats = useCallback(
    async (isRefresh = false) => {
      if (!supabase) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSetupNeeded(false);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Admin session expired. Sign in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch("/api/admin/traffic-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = (await response.json()) as GoatCounterDashboardStats & { error?: string };

      if (!response.ok) {
        setSetupNeeded(response.status === 503);
        setError(payload.error ?? "Could not load website traffic.");
        setStats(null);
      } else {
        setStats(payload);
        setUpdatedAt(new Date());
      }

      setLoading(false);
      setRefreshing(false);
    },
    [supabase],
  );

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadStats(true);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadStats]);

  if (!supabase) {
    return <AdminAlert variant="error">Supabase is not configured.</AdminAlert>;
  }

  const s = stats;

  return (
    <>
      <AdminHeader
        title="Website traffic"
        subtitle="Live counts via GoatCounter — shown here for your client, no separate login needed."
        showLogo={false}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="po-admin-btn-outline"
            disabled={refreshing || loading}
            onClick={() => void loadStats(true)}
          >
            <RefreshCw className={`h-4 w-4${refreshing ? " po-admin-spin" : ""}`} aria-hidden />
            Refresh
          </Button>
        }
      />

      {setupNeeded ? (
        <AdminPanel className="po-admin-analytics-setup">
          <h3>Set up GoatCounter tracking</h3>
          <ol>
            <li>
              Add to <code>.env.local</code> and Vercel:{" "}
              <code>NEXT_PUBLIC_GOATCOUNTER_SITE=pharma-openings</code>
            </li>
            <li>
              Create an API token at{" "}
              <a href="https://www.goatcounter.com/user/apitoken" target="_blank" rel="noopener noreferrer">
                goatcounter.com/user/apitoken
              </a>{" "}
              with <strong>Read statistics</strong>, then set <code>GOATCOUNTER_API_TOKEN</code> in env.
            </li>
            <li>Redeploy — the tracking script will start counting visits on your live site.</li>
          </ol>
        </AdminPanel>
      ) : null}

      {error && !setupNeeded ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {loading ? (
        <AdminLoading message="Loading traffic stats…" />
      ) : s ? (
        <AdminSection>
          <div className="po-admin-analytics-hero">
            <article className="po-admin-analytics-hero__featured">
              <div className="po-admin-analytics-hero__featured-icon" aria-hidden>
                <Users className="h-6 w-6" />
              </div>
              <div className="po-admin-analytics-hero__featured-body">
                <p className="po-admin-analytics-hero__eyebrow">Today (IST)</p>
                <p className="po-admin-analytics-hero__value">{s.pageViewsToday.toLocaleString()}</p>
                <p className="po-admin-analytics-hero__label">Page views</p>
              </div>
            </article>

            <div className="po-admin-analytics-hero__side">
              <article className="po-admin-analytics-hero__mini">
                <div className="po-admin-analytics-hero__mini-icon" aria-hidden>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="po-admin-analytics-hero__mini-label">Active now</p>
                  <p className="po-admin-analytics-hero__mini-value">{s.activeRecent.toLocaleString()}</p>
                </div>
              </article>
              <article className="po-admin-analytics-hero__mini">
                <div className="po-admin-analytics-hero__mini-icon" aria-hidden>
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <p className="po-admin-analytics-hero__mini-label">Last 10 minutes</p>
                  <p className="po-admin-analytics-hero__mini-value">Auto-refreshes every minute</p>
                </div>
              </article>
              {updatedAt ? (
                <p className="po-admin-analytics-hero__updated">
                  Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="po-admin-analytics-grid">
            <MetricCard label="This week" value={s.pageViewsWeek} icon={BarChart3} accent="violet" />
            <MetricCard label="All time" value={s.pageViewsTotal} icon={Globe} accent="blue" />
            <MetricCard label="Today" value={s.pageViewsToday} icon={MousePointerClick} accent="green" />
            <MetricCard
              label="Active (10 min)"
              value={s.activeRecent}
              hint="Recent page views"
              icon={TrendingUp}
              accent="amber"
            />
          </div>

          {s.topPages.length > 0 ? (
            <AdminPanel className="po-admin-analytics-top-pages">
              <h3>Top pages today</h3>
              <ul>
                {s.topPages.map((page) => (
                  <li key={page.path}>
                    <span className="po-admin-analytics-top-pages__path">{page.path}</span>
                    <span className="po-admin-analytics-top-pages__count">{page.pageViews.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          ) : null}
        </AdminSection>
      ) : null}
    </>
  );
}
