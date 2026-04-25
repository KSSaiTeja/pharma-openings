"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Pencil, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
import type { Database, JobRow, TablesInsert } from "@/types/database.types";

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
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saveBusy, setSaveBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JobRow | null>(null);
  const [deleteCanHardDelete, setDeleteCanHardDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) {
      setErr(error.message);
      setJobs([]);
    } else {
      setJobs((data as JobRow[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

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

  const openEdit = (j: JobRow) => {
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
    if (!form.title.trim() || !form.location.trim() || !form.description.trim()) {
      setErr("Title, location, and description are required.");
      return;
    }
    setSaveBusy(true);
    setErr(null);
    const payload: TablesInsert<"jobs"> = {
      title: form.title.trim(),
      location: form.location.trim(),
      department: form.department.trim() || null,
      type: form.type,
      module: form.module,
      qualification_needed: form.qualification_needed,
      description: form.description.trim(),
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
        setErr(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("jobs").insert(payload);
      setSaveBusy(false);
      if (error) {
        setErr(error.message);
        return;
      }
    }
    setFormOpen(false);
    await load();
    onStatsBump();
  };

  const openDeleteDialog = async (j: JobRow) => {
    setErr(null);
    setDeleteTarget(j);
    setDeleteCanHardDelete(false);
    setDeleteOpen(true);

    const { count, error } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", j.id);
    if (error) {
      setErr(error.message);
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
      setErr(error.message);
      return;
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
    await load();
    onStatsBump();
  };

  const toggleActive = async (j: JobRow, next: boolean) => {
    setJobs((prev) => prev.map((x) => (x.id === j.id ? { ...x, is_active: next } : x)));
    const { error } = await supabase.from("jobs").update({ is_active: next }).eq("id", j.id);
    if (error) {
      setErr(error.message);
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
    setUploadMsg(null);
    setErr(null);
    const text = await f.text();
    const { inserted, skipped } = parseJobCsv(text);
    const totalRows = inserted.length + skipped;
    if (inserted.length === 0) {
      setUploadMsg(`Uploaded 0 of ${totalRows} rows. ${skipped} rows skipped (missing required fields).`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const chunk = 40;
    let ok = 0;
    for (let i = 0; i < inserted.length; i += chunk) {
      const slice = inserted.slice(i, i + chunk);
      const { error } = await supabase.from("jobs").insert(slice);
      if (error) {
        setErr(error.message);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      ok += slice.length;
    }
    setUploadMsg(`Uploaded ${ok} of ${totalRows} rows. ${skipped} rows skipped (missing required fields).`);
    if (fileRef.current) fileRef.current.value = "";
    await load();
    onStatsBump();
  };

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {err}
        </p>
      ) : null}
      {uploadMsg ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          {uploadMsg}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="button" onClick={openCreate}>
          Add job
        </Button>
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          Download CSV template
        </Button>
        <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
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
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-zinc-500">No jobs yet.</p>
        ) : (
          jobs.map((j) => (
            <div key={j.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{j.title}</p>
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
                    <Button type="button" size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(j)}>
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
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={7} className="text-center text-sm text-zinc-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-zinc-500">
                  No jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((j) => (
                <TableRow key={j.id}>
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
                    <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(j)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
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
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit job" : "Add job"}</DialogTitle>
            <DialogDescription>Required fields are marked. Department is optional.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
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
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as JobType }))}>
                <SelectTrigger>
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
              <Label>Module *</Label>
              <Select value={form.module} onValueChange={(v) => setForm((f) => ({ ...f, module: v as JobModule }))}>
                <SelectTrigger>
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
              <Label>Qualification needed *</Label>
              <Select
                value={form.qualification_needed}
                onValueChange={(v) => setForm((f) => ({ ...f, qualification_needed: v as Qualification }))}
              >
                <SelectTrigger>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveJob()} disabled={saveBusy}>
              {saveBusy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteCanHardDelete ? "Delete job?" : "Deactivate job?"}</DialogTitle>
            <DialogDescription>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleteBusy}>
              {deleteBusy ? "Working…" : deleteCanHardDelete ? "Delete permanently" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
