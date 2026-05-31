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
import {
  emptySiteAnalyticsStats,
  parseSiteAnalyticsStats,
  type SiteAnalyticsStats,
} from "@/src/lib/siteAnalytics";

function formatRatio(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  return (numerator / denominator).toFixed(1);
}

function AnalyticsMetricCard({
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

export function VisitorAnalyticsPanel() {
  const supabase = useAdminSupabase();
  const [stats, setStats] = useState<SiteAnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadStats = useCallback(
    async (isRefresh = false) => {
      if (!supabase) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc("get_site_analytics_stats");

      if (rpcError) {
        setError(rpcError.message);
        setStats(emptySiteAnalyticsStats());
      } else {
        setStats(parseSiteAnalyticsStats(data));
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

  if (!supabase) {
    return <AdminAlert variant="error">Supabase is not configured.</AdminAlert>;
  }

  const s = stats ?? emptySiteAnalyticsStats();
  const viewsPerVisitorToday = formatRatio(s.pageViewsToday, s.uniqueVisitorsToday);
  const viewsPerVisitorWeek = formatRatio(s.pageViewsThisWeek, s.uniqueVisitorsThisWeek);
  const viewsPerVisitorTotal = formatRatio(s.pageViewsTotal, s.uniqueVisitorsTotal);

  return (
    <>
      <AdminHeader
        title="Website traffic"
        subtitle="First-party visitor counts from your public site (IST day boundaries)."
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

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {loading ? (
        <AdminLoading message="Loading traffic stats…" />
      ) : (
        <AdminSection>
          <div className="po-admin-analytics-hero">
            <article className="po-admin-analytics-hero__featured">
              <div className="po-admin-analytics-hero__featured-icon" aria-hidden>
                <Users className="h-6 w-6" />
              </div>
              <div className="po-admin-analytics-hero__featured-body">
                <p className="po-admin-analytics-hero__eyebrow">Today</p>
                <p className="po-admin-analytics-hero__value">{s.uniqueVisitorsToday.toLocaleString()}</p>
                <p className="po-admin-analytics-hero__label">Unique visitors</p>
              </div>
            </article>

            <div className="po-admin-analytics-hero__side">
              <article className="po-admin-analytics-hero__mini">
                <div className="po-admin-analytics-hero__mini-icon" aria-hidden>
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <p className="po-admin-analytics-hero__mini-label">Page views today</p>
                  <p className="po-admin-analytics-hero__mini-value">{s.pageViewsToday.toLocaleString()}</p>
                </div>
              </article>
              <article className="po-admin-analytics-hero__mini">
                <div className="po-admin-analytics-hero__mini-icon" aria-hidden>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="po-admin-analytics-hero__mini-label">Views per visitor</p>
                  <p className="po-admin-analytics-hero__mini-value">{viewsPerVisitorToday}</p>
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
            <AnalyticsMetricCard
              label="Visitors this week"
              value={s.uniqueVisitorsThisWeek}
              hint={`${viewsPerVisitorWeek} views / visitor`}
              icon={Users}
              accent="violet"
            />
            <AnalyticsMetricCard
              label="Page views this week"
              value={s.pageViewsThisWeek}
              icon={MousePointerClick}
              accent="green"
            />
            <AnalyticsMetricCard
              label="Total visitors"
              value={s.uniqueVisitorsTotal}
              hint={`${viewsPerVisitorTotal} views / visitor`}
              icon={Globe}
              accent="blue"
            />
            <AnalyticsMetricCard
              label="Total page views"
              value={s.pageViewsTotal}
              icon={BarChart3}
              accent="amber"
            />
          </div>

          <AdminPanel className="po-admin-analytics-note">
            <h3>How this is counted</h3>
            <ul>
              <li>Each browser gets a first-party cookie — returning within 24 hours counts as the same visitor.</li>
              <li>Admin pages and API routes are excluded from tracking.</li>
              <li>Day and week totals use India Standard Time (IST) boundaries.</li>
            </ul>
          </AdminPanel>
        </AdminSection>
      )}
    </>
  );
}
