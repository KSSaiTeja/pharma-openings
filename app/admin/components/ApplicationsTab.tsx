"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ChevronDown, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  APPLICATION_STATUS_LABELS,
  applicationStatusSelectTriggerClass,
  formatAppliedAt,
  JOB_MODULES,
  statusFromDb,
  statusToDb,
} from "@/app/admin/admin-constants";
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
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Props = {
  supabase: SupabaseClient<Database>;
  onStatsBump: () => void;
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

const TABLE_COLS = 12;

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

export function ApplicationsTab({ supabase, onStatsBump }: Props) {
  const [rows, setRows] = useState<AdminApplicationRow[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs(title, module, location)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data as AdminApplicationRow[]) ?? []);
    }
    const { data: jobRows } = await supabase.from("jobs").select("id, title").order("title", { ascending: true });
    setJobs(jobRows ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => {
          void load();
          onStatsBump();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, load, onStatsBump]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const statusArr = statusFilter.size ? [...statusFilter] : null;
    const moduleArr = moduleFilter.size ? [...moduleFilter] : null;
    const fromTs = dateFrom ? startOfDayIso(dateFrom) : null;
    const toTs = dateTo ? endOfDayIso(dateTo) : null;

    return rows.filter((r) => {
      if (jobFilter !== "all" && r.job_id !== jobFilter) return false;
      if (statusArr && !statusArr.includes(r.status?.toLowerCase() ?? "")) return false;
      if (fromTs && r.created_at < fromTs) return false;
      if (toTs && r.created_at > toTs) return false;
      const mod = (r.jobs?.module ?? "Others").trim() || "Others";
      if (moduleArr && !moduleArr.includes(mod)) return false;
      if (q) {
        const blob = `${r.full_name} ${r.email} ${r.mobile}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, jobFilter, moduleFilter, dateFrom, dateTo]);

  const toggleSelect = (id: string, on: boolean) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const n = new Set(prev);
        filtered.forEach((r) => n.delete(r.id));
        return n;
      });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        filtered.forEach((r) => n.add(r.id));
        return n;
      });
    }
  };

  const updateStatus = useCallback(
    async (id: string, label: string) => {
      const db = statusToDb(label);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: db } : r)));
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

  const exportSelected = () => {
    const pick = filtered.filter((r) => selected.has(r.id));
    if (pick.length === 0) return;
    downloadCsv(
      `applications-export-${new Date().toISOString().slice(0, 10)}.csv`,
      pick.map((r) => ({
        Timestamp: formatAppliedAt(r.created_at),
        "Full Name": r.full_name,
        Email: r.email,
        Mobile: r.mobile,
        "Current Designation": applicationDesignation(r) ?? "",
        "Current Dept": applicationDepartment(r) ?? "",
        "Current Company": applicationCompany(r) ?? "",
        "Highest Qualification": applicationQualification(r) ?? "",
        Module: r.jobs?.module ?? "",
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
      <div className="space-y-4">
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {err}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/30 p-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[140px]">
          <Label className="text-xs">Status</Label>
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
        </div>

        <div className="grid w-full gap-2 sm:w-48">
          <Label className="text-xs">Job</Label>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[140px]">
          <Label className="text-xs">Module</Label>
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
        </div>

        <div className="grid w-full gap-2 sm:w-36">
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="grid w-full gap-2 sm:w-36">
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div className="grid w-full min-w-0 flex-1 gap-2 sm:min-w-[200px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Name, email, mobile…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Button
          type="button"
          variant="default"
          className="shrink-0 gap-2 bg-zinc-900 px-4 font-semibold text-white shadow-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4 shrink-0", loading && "animate-spin")} aria-hidden />
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="button" variant="outline" size="sm" onClick={() => setBulkOpen(true)} disabled={selected.size === 0}>
          Change status ({selected.size})
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={exportSelected} disabled={selected.size === 0}>
          Export CSV ({selected.size})
        </Button>
      </div>

      <div className="min-w-0 space-y-2">
        {!loading && filtered.length > 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <Checkbox checked={allVisibleSelected} onCheckedChange={() => toggleAllVisible()} aria-label="Select all visible" />
            <span className="text-xs font-medium tracking-tight text-zinc-600 dark:text-zinc-400">
              Select all <span className="tabular-nums">({filtered.length})</span>
            </span>
          </div>
        ) : null}

        <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
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
                  className="w-[15%] min-w-0 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400"
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
                  <TableCell colSpan={TABLE_COLS} className="py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Loading applications…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell colSpan={TABLE_COLS} className="py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No applications match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, idx) => {
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
                        {idx + 1}
                      </TableCell>
                      <TableCell className="max-w-0 align-top font-medium text-zinc-900 dark:text-zinc-50">
                        <button
                          type="button"
                          onClick={() => setExpandedCandidate(r)}
                          className="block min-w-0 max-w-full cursor-pointer truncate text-left underline decoration-dotted underline-offset-2 outline-none ring-offset-2 hover:text-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:ring-offset-zinc-950 dark:hover:text-zinc-200 dark:focus-visible:ring-zinc-500"
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
                                className="h-9 w-full gap-1.5 border-0 bg-violet-600 px-2 text-xs font-semibold text-white shadow-md transition-[background,box-shadow] hover:bg-violet-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 dark:bg-violet-600 dark:hover:bg-violet-500 dark:focus-visible:ring-violet-200 dark:focus-visible:ring-offset-zinc-950"
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
        </div>
      </div>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk update status</DialogTitle>
            <DialogDescription>Set status for {selected.size} selected application(s).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label>New status</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void runBulkStatus()} disabled={bulkBusy}>
              {bulkBusy ? "Saving…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(expandedCandidate)} onOpenChange={(open) => (!open ? setExpandedCandidate(null) : null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{expandedCandidate?.full_name ?? "Candidate details"}</DialogTitle>
            <DialogDescription>Expanded application context for quick admin review.</DialogDescription>
          </DialogHeader>
          {expandedCandidate ? (
            <div className="grid gap-3 py-1 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="break-all font-medium">{expandedCandidate.email}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Mobile</p>
                  <p className="font-medium">{expandedCandidate.mobile}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Applied For</p>
                  <p className="font-medium">{expandedCandidate.jobs?.title ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Module</p>
                  <p className="font-medium">{expandedCandidate.jobs?.module ?? "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Current Designation</p>
                  <p className="font-medium">{applicationDesignation(expandedCandidate) ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Current Dept</p>
                  <p className="font-medium">{applicationDepartment(expandedCandidate) ?? "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Current Company</p>
                  <p className="font-medium">{applicationCompany(expandedCandidate) ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Highest Qualification</p>
                  <p className="font-medium">{applicationQualification(expandedCandidate) ?? "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Date Applied</p>
                  <p className="font-medium">{formatAppliedAt(expandedCandidate.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
                  <p className="font-medium">{statusFromDb(expandedCandidate.status)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Resume</p>
                {applicationResumeUrl(expandedCandidate) ? (
                  <a
                    href={applicationResumeUrl(expandedCandidate)!}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-violet-600 underline underline-offset-2 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    Open resume
                  </a>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExpandedCandidate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
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
