"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Pencil, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AdminActions,
  AdminActionsGroup,
  AdminAlert,
  AdminCard,
  AdminCardList,
  AdminSection,
  AdminTableWrap,
  adminDialogClass,
} from "@/app/admin/components/AdminUi";
import { JOB_CSV_TEMPLATE_HEADERS, parseJobCsv } from "@/app/admin/lib/jobCsv";
import {
  JOB_MODULES,
  JOB_TYPES,
  QUALIFICATIONS,
  type JobModule,
  type JobType,
  type Qualification,
} from "@/app/admin/admin-constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { adminJobUpsertSchema } from "@/src/lib/schemas/forms";
import type { Database, Tables, TablesInsert } from "@/types/database.types";

type Props = {
  supabase: SupabaseClient<Database>;
  onStatsBump: () => void;
};

const emptyForm: {
  title: string;
  location: string;
  department: string;
  type: JobType;
  module: JobModule;
  qualification_needed: Qualification;
  description: string;
} = {
  title: "",
  location: "",
  department: "",
  type: "Full-time",
  module: "Others",
  qualification_needed: "Any",
  description: "",
};

export function JobsTab({ supabase, onStatsBump }: Props) {
  const [jobs, setJobs] = useState<Tables<"jobs">[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusPopup, setStatusPopup] = useState<{
    open: boolean;
    tone: "success" | "error";
    title: string;
    details: string[];
  }>({
    open: false,
    tone: "success",
    title: "",
    details: [],
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saveBusy, setSaveBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tables<"jobs"> | null>(null);
  const [deleteCanHardDelete, setDeleteCanHardDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openStatusPopup = useCallback((tone: "success" | "error", title: string, details: string[] = []) => {
    setStatusPopup({ open: true, tone, title, details });
  }, []);

  const buildSkippedDetails = (rows: Array<{ rowNumber: number; message: string }>, limit = 5): string[] => {
    if (rows.length === 0) return [];
    const top = rows.slice(0, limit).map((r) => `Row ${r.rowNumber}: ${r.message}`);
    const remaining = rows.length - top.length;
    if (remaining > 0) {
      top.push(`...and ${remaining} more skipped row${remaining > 1 ? "s" : ""}.`);
    }
    return top;
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) {
      openStatusPopup("error", "Could not load jobs", [error.message]);
      setJobs([]);
    } else {
      setJobs((data as Tables<"jobs">[]) ?? []);
    }
    setLoading(false);
  }, [openStatusPopup, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (j: Tables<"jobs">) => {
    setEditingId(j.id);
    setForm({
      title: j.title,
      location: j.location,
      department: j.department ?? "",
      type: (JOB_TYPES.includes(j.type as JobType) ? j.type : "Full-time") as JobType,
      module: (JOB_MODULES.includes(j.module as JobModule) ? j.module : "Others") as JobModule,
      qualification_needed: (QUALIFICATIONS.includes(j.qualification_needed as Qualification)
        ? j.qualification_needed
        : "Any") as Qualification,
      description: j.description,
    });
    setFormOpen(true);
  };

  const saveJob = async () => {
    const parsed = adminJobUpsertSchema.safeParse(form);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Please review the form fields.";
      openStatusPopup("error", "Could not save job", [firstError]);
      return;
    }
    const normalized = parsed.data;
    setSaveBusy(true);
    const payload: TablesInsert<"jobs"> = {
      title: normalized.title,
      location: normalized.location,
      department: normalized.department ?? null,
      type: normalized.type,
      module: normalized.module,
      qualification_needed: normalized.qualification_needed,
      description: normalized.description,
      is_active: true,
    };
    if (editingId) {
      const { error } = await supabase
        .from("jobs")
        .update({
          title: payload.title,
          location: payload.location,
          department: payload.department,
          type: payload.type,
          module: payload.module,
          qualification_needed: payload.qualification_needed,
          description: payload.description,
        })
        .eq("id", editingId);
      setSaveBusy(false);
      if (error) {
        openStatusPopup("error", "Could not save job", [error.message]);
        return;
      }
    } else {
      const { error } = await supabase.from("jobs").insert(payload);
      setSaveBusy(false);
      if (error) {
        openStatusPopup("error", "Could not create job", [error.message]);
        return;
      }
    }
    setFormOpen(false);
    await load();
    onStatsBump();
  };

  const openDeleteDialog = async (j: Tables<"jobs">) => {
    setDeleteTarget(j);
    setDeleteCanHardDelete(false);
    setDeleteOpen(true);

    const { count, error } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", j.id);
    if (error) {
      openStatusPopup("error", "Could not check linked applications", [error.message]);
      return;
    }
    setDeleteCanHardDelete((count ?? 0) === 0);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    const query = deleteCanHardDelete
      ? supabase.from("jobs").delete().eq("id", deleteTarget.id)
      : supabase.from("jobs").update({ is_active: false }).eq("id", deleteTarget.id);
    const { error } = await query;
    setDeleteBusy(false);
    if (error) {
      openStatusPopup("error", "Could not update job", [error.message]);
      return;
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
    await load();
    onStatsBump();
  };

  const toggleActive = async (j: Tables<"jobs">, next: boolean) => {
    setJobs((prev) => prev.map((x) => (x.id === j.id ? { ...x, is_active: next } : x)));
    const { error } = await supabase.from("jobs").update({ is_active: next }).eq("id", j.id);
    if (error) {
      openStatusPopup("error", "Could not update status", [error.message]);
      void load();
      return;
    }
    onStatsBump();
  };

  const downloadTemplate = () => {
    const blob = new Blob([`${JOB_CSV_TEMPLATE_HEADERS}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jobs-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onCsv = async (f: File | null) => {
    if (!f) return;
    setUploadProgress(null);
    const bytes = new Uint8Array(await f.arrayBuffer());
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const hasEncodingReplacement = text.includes("\uFFFD");
    const encodingHint = hasEncodingReplacement
      ? "Encoding note: this file may be saved as Latin-1/non-UTF-8. Save as UTF-8 (or UTF-8 BOM) and retry."
      : null;
    const { inserted, skipped, totalRows, headerError, skipReasons, rowErrors } = parseJobCsv(text);
    if (headerError) {
      openStatusPopup("error", "CSV upload failed", encodingHint ? [headerError, encodingHint] : [headerError]);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const skippedDetails = buildSkippedDetails(rowErrors);
    if (inserted.length === 0) {
      openStatusPopup("success", `Uploaded 0 of ${totalRows} rows`, [
        `${skipped} rows skipped (${skipReasons.missing_required} missing required fields, ${skipReasons.invalid_data} invalid rows, ${skipReasons.empty_row} empty rows).`,
        ...(encodingHint ? [encodingHint] : []),
        ...skippedDetails,
      ]);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const chunk = 50;
    let ok = 0;
    for (let i = 0; i < inserted.length; i += chunk) {
      const slice = inserted.slice(i, i + chunk);
      setUploadProgress(`Uploading ${Math.min(i + slice.length, inserted.length)} of ${inserted.length} valid rows...`);
      const { error } = await supabase.from("jobs").insert(slice);
      if (error) {
        setUploadProgress(null);
        openStatusPopup("error", `Upload stopped after ${ok} rows`, [
          `Uploaded ${ok} of ${totalRows} rows before an error.`,
          error.message,
        ]);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      ok += slice.length;
    }
    setUploadProgress(null);
    openStatusPopup("success", `Uploaded ${ok} of ${totalRows} rows`, [
      `${skipped} rows skipped (${skipReasons.missing_required} missing required fields, ${skipReasons.invalid_data} invalid rows, ${skipReasons.empty_row} empty rows).`,
      ...(encodingHint ? [encodingHint] : []),
      ...skippedDetails,
    ]);
    if (fileRef.current) fileRef.current.value = "";
    await load();
    onStatsBump();
  };

  return (
    <AdminSection>
      {uploadProgress ? <AdminAlert variant="info">{uploadProgress}</AdminAlert> : null}
      <Dialog open={statusPopup.open} onOpenChange={(open) => setStatusPopup((prev) => ({ ...prev, open }))}>
        <DialogContent className={cn(adminDialogClass, "sm:max-w-lg")}>
          <DialogHeader className="po-admin-dialog__header">
            <DialogTitle
              className={cn(
                "po-admin-dialog__title",
                statusPopup.tone === "success" ? "text-[#14532d]" : "text-[#9a3412]",
              )}
            >
              {statusPopup.title}
            </DialogTitle>
          </DialogHeader>
          {statusPopup.details.length > 0 ? (
            <div className="po-admin-dialog__body space-y-2 text-sm text-[var(--po-admin-muted)]">
              {statusPopup.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </div>
          ) : null}
          <DialogFooter className="po-admin-dialog__footer">
            <Button type="button" className="po-admin-btn-primary" onClick={() => setStatusPopup((prev) => ({ ...prev, open: false }))}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminActions>
        <AdminActionsGroup>
          <Button type="button" className="po-admin-btn-primary" onClick={openCreate}>
            Add job
          </Button>
          <Button type="button" variant="outline" className="po-admin-btn-outline" onClick={downloadTemplate}>
            Download CSV template
          </Button>
          <Button type="button" variant="secondary" className="po-admin-btn-outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Bulk upload CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void onCsv(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" className="po-admin-btn-outline" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </AdminActionsGroup>
      </AdminActions>

      <AdminCardList className="md:hidden">
        {loading ? (
          <p className="text-sm text-[var(--po-admin-muted)]">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-[var(--po-admin-muted)]">No jobs yet.</p>
        ) : (
          jobs.map((j) => (
            <AdminCard key={j.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{j.title}</p>
                  <p className="font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {j.job_code}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {j.location} · {j.module ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {j.type ?? "—"} · {j.qualification_needed ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{j.is_active ? "Active" : "Inactive"}</span>
                    <Switch checked={j.is_active} onCheckedChange={(c) => void toggleActive(j, Boolean(c))} />
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" className="po-admin-btn-ghost" aria-label="Edit" onClick={() => openEdit(j)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Deactivate"
                      onClick={() => {
                        void openDeleteDialog(j);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))
        )}
      </AdminCardList>

      <AdminTableWrap className="hidden md:block">
        <Table>
          <caption className="sr-only">Job postings and bulk actions</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="po-admin-table-empty">
                  Loading…
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="po-admin-table-empty">
                  No jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {j.job_code}
                  </TableCell>
                  <TableCell className="max-w-[200px] font-medium">{j.title}</TableCell>
                  <TableCell>{j.location}</TableCell>
                  <TableCell>{j.module ?? "—"}</TableCell>
                  <TableCell>{j.type ?? "—"}</TableCell>
                  <TableCell>{j.qualification_needed ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{j.is_active ? "Active" : "Inactive"}</span>
                      <Switch checked={j.is_active} onCheckedChange={(c) => void toggleActive(j, Boolean(c))} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="sm" variant="ghost" className="po-admin-btn-ghost" onClick={() => openEdit(j)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="po-admin-btn-ghost po-admin-btn-destructive"
                      onClick={() => {
                        void openDeleteDialog(j);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrap>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={cn(adminDialogClass, "sm:max-w-lg")}>
          <DialogHeader className="po-admin-dialog__header">
            <DialogTitle className="po-admin-dialog__title">{editingId ? "Edit job" : "Add job"}</DialogTitle>
            <DialogDescription className="po-admin-dialog__description">
              Required fields are marked. Department is optional.
            </DialogDescription>
          </DialogHeader>
          <div className="po-admin-dialog__body po-admin-dialog__body--form grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="job-title">Title *</Label>
              <Input id="job-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-loc">Location *</Label>
              <Input id="job-loc" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-dept">Department</Label>
              <Input
                id="job-dept"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as JobType }))}>
                <SelectTrigger id="job-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-module">Module *</Label>
              <Select value={form.module} onValueChange={(v) => setForm((f) => ({ ...f, module: v as JobModule }))}>
                <SelectTrigger id="job-module">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_MODULES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-qualification">Qualification needed *</Label>
              <Select
                value={form.qualification_needed}
                onValueChange={(v) => setForm((f) => ({ ...f, qualification_needed: v as Qualification }))}
              >
                <SelectTrigger id="job-qualification">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALIFICATIONS.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-desc">Description *</Label>
              <Textarea
                id="job-desc"
                rows={5}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="po-admin-dialog__footer">
            <Button type="button" variant="outline" className="po-admin-btn-outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="po-admin-btn-primary" onClick={() => void saveJob()} disabled={saveBusy}>
              {saveBusy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className={adminDialogClass}>
          <DialogHeader className="po-admin-dialog__header">
            <DialogTitle className="po-admin-dialog__title">
              {deleteCanHardDelete ? "Delete job?" : "Deactivate job?"}
            </DialogTitle>
            <DialogDescription className="po-admin-dialog__description">
              {deleteTarget ? (
                <>
                  {deleteCanHardDelete ? (
                    <>
                      No applications exist for <strong>{deleteTarget.title}</strong>. This job can be deleted permanently.
                    </>
                  ) : (
                    <>
                      This job has applications. <strong>{deleteTarget.title}</strong> will be set to inactive so existing
                      applications stay intact.
                    </>
                  )}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="po-admin-dialog__footer">
            <Button type="button" variant="outline" className="po-admin-btn-outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="po-admin-btn-primary"
              onClick={() => void confirmDelete()}
              disabled={deleteBusy}
            >
              {deleteBusy ? "Working…" : deleteCanHardDelete ? "Delete permanently" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSection>
  );
}
