"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ChevronDown, FileText, RefreshCw } from "lucide-react";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import {
  APPLICATION_STATUS_LABELS,
  applicationStatusSelectTriggerClass,
  formatAppliedAt,
  JOB_MODULES,
  statusFromDb,
  statusToDb,
} from "@/app/admin/admin-constants";
import {
  AdminActions,
  AdminActionsGroup,
  AdminAlert,
  AdminDetailGrid,
  AdminDetailItem,
  AdminFilterLabel,
  AdminHint,
  AdminPanel,
  AdminPanelField,
  AdminPagination,
  AdminSection,
  AdminSelectBar,
  AdminTableWrap,
  adminDialogClass,
} from "@/app/admin/components/AdminUi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type AdminApplicationRow,
  applicationCompany,
  applicationDepartment,
  applicationDesignation,
  applicationQualification,
  applicationResumeUrl,
} from "@/app/admin/lib/applicationFields";
import {
  ADMIN_APPLICATIONS_PAGE_SIZE,
  adminApplicationsSelect,
  applyAdminApplicationsFilters,
} from "@/app/admin/lib/applicationsAdminQuery";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Props = {
  supabase: SupabaseClient<Database>;
  onStatsBump: () => void;
  /** Appends new rows to the **Applications** sheet (deduped by Application ID) and includes **Job ID** for recruiters. */
  onSyncApplications: (payload: { applicationIds: string[]; page: number }) => void;
  /** When non-null, a sync is in progress (any tab); buttons stay disabled to avoid overlapping requests. */
  syncingTarget: null | "applications" | "talent_pool";
};

function downloadCsv(filename: string, rows: Record<string, string>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string) => {
    if (v.includes('"') || v.includes(",") || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TABLE_COLS = 13;

/** Single-line cell; Radix tooltip shows full value on hover (portal, above table overflow). */
function CellText({ text, className }: { text: string; className?: string }) {
  const raw = text ?? "";
  const t = raw.trim();
  const empty = t.length === 0 || t === "—";
  if (empty) {
    return <span className={cn("block min-w-0 max-w-full truncate text-zinc-400 dark:text-zinc-500", className)}>—</span>;
  }
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "block min-w-0 max-w-full cursor-default truncate outline-none ring-offset-2 hover:underline hover:decoration-dotted hover:decoration-zinc-400 hover:underline-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:ring-offset-zinc-950 dark:hover:decoration-zinc-500 dark:focus-visible:ring-zinc-500",
            className,
          )}
          tabIndex={0}
        >
          {t}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="wrap-break-word font-normal">
        {raw.trim() || raw}
      </TooltipContent>
    </Tooltip>
  );
}

export function ApplicationsTab({ supabase, onStatsBump, onSyncApplications, syncingTarget }: Props) {
  const [rows, setRows] = useState<AdminApplicationRow[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string; job_code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("Reviewed");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<AdminApplicationRow | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadRef = useRef<() => Promise<void>>(async () => {});
  const realtimeDebounceRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const select = adminApplicationsSelect(moduleFilter.size);
    const filterCtx = {
      jobFilter,
      statusFilter,
      moduleFilter,
      dateFrom,
      dateTo,
      search,
      startOfDayIso,
      endOfDayIso,
    };

    let countQ = supabase.from("applications").select(select, { count: "exact", head: true });
    countQ = applyAdminApplicationsFilters(countQ, filterCtx);
    const { count, error: cErr } = await countQ;
    if (cErr) {
      setErr(cErr.message);
      setRows([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const total = count ?? 0;
    setTotalCount(total);
    const pages = Math.max(1, Math.ceil(total / ADMIN_APPLICATIONS_PAGE_SIZE));
    if (page > pages) {
      startTransition(() => {
        setPage(pages);
      });
      setLoading(false);
      return;
    }

    const start = (page - 1) * ADMIN_APPLICATIONS_PAGE_SIZE;
    const end = start + ADMIN_APPLICATIONS_PAGE_SIZE - 1;

    let dataQ = supabase.from("applications").select(select);
    dataQ = applyAdminApplicationsFilters(dataQ, filterCtx);
    const { data, error: dErr } = await dataQ
      .order("created_at", { ascending: false })
      .range(start, end);

    if (dErr) {
      setErr(dErr.message);
      setRows([]);
    } else {
      setRows((data as unknown as AdminApplicationRow[]) ?? []);
    }
    setLoading(false);
  }, [supabase, page, statusFilter, jobFilter, moduleFilter, dateFrom, dateTo, search]);

  loadRef.current = load;

  useEffect(() => {
    void supabase
      .from("jobs")
      .select("id, title, job_code")
      .order("title", { ascending: true })
      .limit(5000)
      .then(({ data }) => setJobs(data ?? []));
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    startTransition(() => {
      setPage(1);
    });
  }, [statusFilter, jobFilter, moduleFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput);
    }, 180);
    return () => {
      window.clearTimeout(t);
    };
  }, [searchInput]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-applications-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => {
        onStatsBump();
        if (realtimeDebounceRef.current != null) {
          window.clearTimeout(realtimeDebounceRef.current);
        }
        realtimeDebounceRef.current = window.setTimeout(() => {
          realtimeDebounceRef.current = null;
          void loadRef.current();
        }, 450);
      })
      .subscribe();
    return () => {
      if (realtimeDebounceRef.current != null) {
        window.clearTimeout(realtimeDebounceRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [supabase, onStatsBump]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_APPLICATIONS_PAGE_SIZE));

  const toggleSelect = (id: string, on: boolean) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  };

  const allVisibleSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const n = new Set(prev);
        rows.forEach((r) => n.delete(r.id));
        return n;
      });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        rows.forEach((r) => n.add(r.id));
        return n;
      });
    }
  };

  const updateStatus = useCallback(
    async (id: string, label: string) => {
      const db = statusToDb(label);
      const statusChangedAt = new Date().toISOString();
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: db, status_changed_at: statusChangedAt } : r)),
      );
      const { error } = await supabase.from("applications").update({ status: db }).eq("id", id);
      if (error) {
        setErr(error.message);
        void load();
        return;
      }
      onStatsBump();
    },
    [supabase, load, onStatsBump],
  );

  const runBulkStatus = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    const db = statusToDb(bulkStatus);
    const { error } = await supabase.from("applications").update({ status: db }).in("id", ids);
    setBulkBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSelected(new Set());
    setBulkOpen(false);
    await load();
    onStatsBump();
  };

  const exportCurrentPage = () => {
    if (rows.length === 0) return;
    downloadCsv(
      `applications-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((r) => ({
        "Application ID": r.id,
        Timestamp: formatAppliedAt(r.created_at),
        "Full Name": r.full_name,
        Email: r.email,
        Mobile: r.mobile,
        "Current Designation": applicationDesignation(r) ?? "",
        "Current Dept": applicationDepartment(r) ?? "",
        "Current Company": applicationCompany(r) ?? "",
        "Highest Qualification": applicationQualification(r) ?? "",
        Module: r.jobs?.module ?? "",
        "Job ID": r.jobs?.job_code ?? "",
        "Applied For (Job Title)": r.jobs?.title ?? "",
        "Job Location": r.jobs?.location ?? "",
        Status: statusFromDb(r.status),
        "Resume Link": applicationResumeUrl(r) ?? "",
      })),
    );
  };

  const statusToggle = (db: string, checked: boolean) => {
    const key = db.toLowerCase();
    setStatusFilter((prev) => {
      const n = new Set(prev);
      if (checked) n.add(key);
      else n.delete(key);
      return n;
    });
  };

  const moduleToggle = (mod: string, checked: boolean) => {
    setModuleFilter((prev) => {
      const n = new Set(prev);
      if (checked) n.add(mod);
      else n.delete(mod);
      return n;
    });
  };

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={80}>
      <AdminSection>
      {err ? <AdminAlert variant="error">{err}</AdminAlert> : null}

      <AdminPanel>
        <AdminPanelField size="sm">
          <AdminFilterLabel>Status</AdminFilterLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between font-normal">
                {statusFilter.size === 0 ? "All statuses" : `${statusFilter.size} selected`}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {APPLICATION_STATUS_LABELS.map((label) => {
                const db = statusToDb(label);
                return (
                  <DropdownMenuCheckboxItem
                    key={label}
                    checked={statusFilter.has(db)}
                    onCheckedChange={(c) => statusToggle(db, Boolean(c))}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </AdminPanelField>

        <AdminPanelField size="md">
          <AdminFilterLabel>Job</AdminFilterLabel>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.job_code ? `${j.job_code} · ${j.title}` : j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminPanelField>

        <AdminPanelField size="sm">
          <AdminFilterLabel>Module</AdminFilterLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between font-normal">
                {moduleFilter.size === 0 ? "All modules" : `${moduleFilter.size} selected`}
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="start">
              <DropdownMenuLabel>Filter by module</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {JOB_MODULES.map((m) => (
                <DropdownMenuCheckboxItem
                  key={m}
                  checked={moduleFilter.has(m)}
                  onCheckedChange={(c) => moduleToggle(m, Boolean(c))}
                >
                  {m}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </AdminPanelField>

        <AdminPanelField size="md">
          <AdminFilterLabel>From</AdminFilterLabel>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </AdminPanelField>
        <AdminPanelField size="md">
          <AdminFilterLabel>To</AdminFilterLabel>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </AdminPanelField>

        <AdminPanelField size="grow">
          <AdminFilterLabel>Search</AdminFilterLabel>
          <Input
            placeholder="Name, email, mobile, Job ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </AdminPanelField>

        <Button
          type="button"
          className="po-admin-btn-primary shrink-0 gap-2"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4 shrink-0", loading && "animate-spin")} aria-hidden />
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </AdminPanel>

      <AdminActions>
        <AdminActionsGroup>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="po-admin-btn-outline"
            onClick={() => setBulkOpen(true)}
            disabled={selected.size === 0}
          >
            Change status ({selected.size})
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="po-admin-btn-outline"
            onClick={exportCurrentPage}
            disabled={rows.length === 0}
          >
            Export this page ({rows.length})
          </Button>
        </AdminActionsGroup>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="po-admin-btn-outline"
          onClick={() => onSyncApplications({ applicationIds: rows.map((r) => r.id), page })}
          disabled={syncingTarget !== null || rows.length === 0 || loading}
        >
          {syncingTarget === "applications"
            ? `Syncing applications (page ${page})…`
            : `Sync applications — page ${page}`}
        </Button>
      </AdminActions>

      {!loading && totalCount > 0 ? (
        <AdminHint>
          <span className="po-admin-hint__emph">Applications sheet · Page {page}</span> —{" "}
          <span className="tabular-nums">{rows.length}</span> of{" "}
          <span className="tabular-nums">{totalCount}</span> matching rows. Appends to the{" "}
          <strong>Applications</strong> tab only; skips rows already present (same Application ID). Each row
          includes <strong>Job ID</strong> (e.g. PO-2026-0001) — the same code candidates see when they apply.
          Re-sync a page to backfill Job ID on rows that were added earlier. Use <strong>Talent pool</strong>{" "}
          for the other tab.
        </AdminHint>
      ) : null}

      <div className="min-w-0 space-y-2">
        {!loading && rows.length > 0 ? (
          <AdminSelectBar>
            <Checkbox checked={allVisibleSelected} onCheckedChange={() => toggleAllVisible()} aria-label="Select all on this page" />
            <span className="text-xs font-medium text-[var(--po-admin-muted)]">
              Select all on page <span className="tabular-nums">({rows.length})</span>
            </span>
          </AdminSelectBar>
        ) : null}

        <AdminTableWrap>
          <Table
            containerClassName="overflow-x-auto overflow-y-visible"
            className="table-fixed border-collapse text-left text-[13px] leading-normal text-zinc-900 dark:text-zinc-100"
          >
            <caption className="sr-only">Job applications, sortable by filters above</caption>
            <TableHeader>
              <TableRow className="border-b border-zinc-200/80 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/60 [&_th]:h-auto [&_th]:min-h-9">
                <TableHead className="w-9 px-1.5 py-2.5" scope="col">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead
                  className="w-8 px-1 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  #
                </TableHead>
                <TableHead
                  className="w-[10%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Candidate Name
                </TableHead>
                <TableHead
                  className="w-[15%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Email
                </TableHead>
                <TableHead
                  className="w-[9%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Mobile
                </TableHead>
                <TableHead
                  className="w-[8%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Job ID
                </TableHead>
                <TableHead
                  className="w-[13%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Applied For
                </TableHead>
                <TableHead
                  className="w-[6%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Module
                </TableHead>
                <TableHead
                  className="w-[10%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Company
                </TableHead>
                <TableHead
                  className="w-[9%] min-w-0 whitespace-nowrap px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Qualification
                </TableHead>
                <TableHead
                  className="w-[11%] min-w-0 whitespace-nowrap px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Status
                </TableHead>
                <TableHead
                  className="w-[9%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Date Applied
                </TableHead>
                <TableHead
                  className="w-[10%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
                  scope="col"
                >
                  Resume
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell colSpan={TABLE_COLS} className="po-admin-table-empty">
                    Loading applications…
                  </TableCell>
                </TableRow>
              ) : totalCount === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell colSpan={TABLE_COLS} className="po-admin-table-empty">
                    No applications match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const resumeUrl = applicationResumeUrl(r);
                  return (
                    <TableRow
                      key={r.id}
                      className="border-b border-zinc-100/90 transition-colors last:border-b-0 hover:bg-zinc-50/60 dark:border-zinc-800/60 dark:hover:bg-zinc-900/35"
                    >
                      <TableCell className="max-w-0 align-top">
                        <div className="flex justify-center pt-0.5">
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={(c) => toggleSelect(r.id, Boolean(c))}
                            aria-label={`Select ${r.full_name}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-0 align-top tabular-nums text-right text-zinc-400 dark:text-zinc-500">
                        {(page - 1) * ADMIN_APPLICATIONS_PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell className="max-w-0 align-top font-medium text-zinc-900 dark:text-zinc-50">
                        <button
                          type="button"
                          onClick={() => setExpandedCandidate(r)}
                          className="po-admin-candidate-link block min-w-0 max-w-full truncate text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-admin-highlight)] focus-visible:ring-offset-2"
                          title={`View details for ${r.full_name}`}
                          aria-label={`Open candidate details for ${r.full_name}`}
                        >
                          {r.full_name}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-0 align-top text-zinc-700 dark:text-zinc-300">
                        <CellText text={r.email} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top tabular-nums text-zinc-700 dark:text-zinc-300">
                        <CellText text={r.mobile} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top font-mono text-xs font-semibold text-[var(--po-admin-brand,#1a3d2e)] dark:text-emerald-200/90">
                        <CellText text={r.jobs?.job_code ?? "—"} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top font-medium text-zinc-800 dark:text-zinc-200">
                        <CellText text={r.jobs?.title ?? "—"} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top text-zinc-700 dark:text-zinc-300">
                        <CellText text={r.jobs?.module ?? "—"} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top text-zinc-700 dark:text-zinc-300">
                        <CellText text={applicationCompany(r) ?? "—"} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top text-zinc-700 dark:text-zinc-300">
                        <CellText text={applicationQualification(r) ?? "—"} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top">
                        <Label className="sr-only">Status for {r.full_name}</Label>
                        <div className="min-w-0">
                          <Select value={statusFromDb(r.status)} onValueChange={(v) => void updateStatus(r.id, v)}>
                            <SelectTrigger className={applicationStatusSelectTriggerClass(r.status)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {APPLICATION_STATUS_LABELS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-0 align-top text-xs text-zinc-600 dark:text-zinc-400">
                        <CellText text={formatAppliedAt(r.created_at)} />
                      </TableCell>
                      <TableCell className="max-w-0 align-top">
                        {resumeUrl ? (
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                className="po-admin-btn-resume h-9 w-full gap-1.5 px-2 text-xs"
                                asChild
                              >
                                <a href={resumeUrl} target="_blank" rel="noreferrer">
                                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
                                  View resume
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" align="center" className="max-w-md wrap-break-word text-[11px] leading-snug">
                              {resumeUrl}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </AdminTableWrap>

        {!loading && totalCount > 0 ? (
          <AdminPagination
            label={
              <span className="tabular-nums">
                {totalCount.toLocaleString()} total · Page {page} of {totalPages}
              </span>
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="po-admin-btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="po-admin-btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </AdminPagination>
        ) : null}
      </div>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className={adminDialogClass}>
          <DialogHeader className="po-admin-dialog__header">
            <DialogTitle className="po-admin-dialog__title">Bulk update status</DialogTitle>
            <DialogDescription className="po-admin-dialog__description">
              Set status for {selected.size} selected application(s).
            </DialogDescription>
          </DialogHeader>
          <div className="po-admin-dialog__body po-admin-dialog__body--form">
            <div className="po-admin-form__field">
              <Label className="po-admin-form__label" htmlFor="bulk-app-status">
                New status
              </Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger id="bulk-app-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUS_LABELS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="po-admin-dialog__footer">
            <Button type="button" variant="outline" className="po-admin-btn-outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="po-admin-btn-primary" onClick={() => void runBulkStatus()} disabled={bulkBusy}>
              {bulkBusy ? "Saving…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(expandedCandidate)} onOpenChange={(open) => (!open ? setExpandedCandidate(null) : null)}>
        <DialogContent className={cn(adminDialogClass, "sm:max-w-xl")}>
          <DialogHeader className="po-admin-dialog__header">
            <DialogTitle className="po-admin-dialog__title">
              {expandedCandidate?.full_name ?? "Candidate details"}
            </DialogTitle>
            <DialogDescription className="po-admin-dialog__description">
              Application summary for quick review.
            </DialogDescription>
          </DialogHeader>
          {expandedCandidate ? (
            <div className="po-admin-dialog__body">
              <AdminDetailGrid>
                <AdminDetailItem label="Email">{expandedCandidate.email}</AdminDetailItem>
                <AdminDetailItem label="Mobile">{expandedCandidate.mobile}</AdminDetailItem>
                <AdminDetailItem label="Job ID">
                  <span className="po-admin-detail-item__value--mono">
                    {expandedCandidate.jobs?.job_code ?? "—"}
                  </span>
                </AdminDetailItem>
                <AdminDetailItem label="Applied for">{expandedCandidate.jobs?.title ?? "—"}</AdminDetailItem>
                <AdminDetailItem label="Module">{expandedCandidate.jobs?.module ?? "—"}</AdminDetailItem>
                <AdminDetailItem label="Current designation">
                  {applicationDesignation(expandedCandidate) ?? "—"}
                </AdminDetailItem>
                <AdminDetailItem label="Department">
                  {applicationDepartment(expandedCandidate) ?? "—"}
                </AdminDetailItem>
                <AdminDetailItem label="Company">{applicationCompany(expandedCandidate) ?? "—"}</AdminDetailItem>
                <AdminDetailItem label="Qualification">
                  {applicationQualification(expandedCandidate) ?? "—"}
                </AdminDetailItem>
                <AdminDetailItem label="Date applied">{formatAppliedAt(expandedCandidate.created_at)}</AdminDetailItem>
                <AdminDetailItem label="Status">{statusFromDb(expandedCandidate.status)}</AdminDetailItem>
                <AdminDetailItem label="Status last changed" className="po-admin-detail-item--full">
                  {expandedCandidate.status_changed_at
                    ? formatAppliedAt(expandedCandidate.status_changed_at)
                    : "—"}
                </AdminDetailItem>
                <AdminDetailItem label="Resume" className="po-admin-detail-item--full">
                  {applicationResumeUrl(expandedCandidate) ? (
                    <a
                      href={applicationResumeUrl(expandedCandidate)!}
                      target="_blank"
                      rel="noreferrer"
                      className="po-admin-link"
                    >
                      Open resume
                    </a>
                  ) : (
                    "—"
                  )}
                </AdminDetailItem>
              </AdminDetailGrid>
            </div>
          ) : null}
          <DialogFooter className="po-admin-dialog__footer">
            <Button type="button" variant="outline" className="po-admin-btn-outline" onClick={() => setExpandedCandidate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </AdminSection>
    </TooltipProvider>
  );
}

function startOfDayIso(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayIso(dateStr: string): string {
  const d = new Date(`${dateStr}T23:59:59.999`);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
