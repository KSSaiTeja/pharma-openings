"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCandidateNoteRow, CandidateRow, Database } from "@/types/database.types";

import { formatAppliedAt, JOB_MODULES, QUALIFICATIONS } from "../admin-constants";

type Props = {
  supabase: SupabaseClient<Database>;
};

export function TalentPoolTab({ supabase }: Props) {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [appliedCandidateIds, setAppliedCandidateIds] = useState<Set<string>>(new Set());
  const [notesByCandidate, setNotesByCandidate] = useState<Record<string, AdminCandidateNoteRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [qualFilter, setQualFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeCandidate, setActiveCandidate] = useState<CandidateRow | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteErr, setNoteErr] = useState<string | null>(null);

  const groupNotes = useCallback((notes: AdminCandidateNoteRow[]) => {
    const grouped: Record<string, AdminCandidateNoteRow[]> = {};
    for (const note of notes) {
      const key = note.candidate_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(note);
    }
    return grouped;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const [{ data: apps, error: e1 }, { data: cands, error: e2 }, { data: notes, error: e3 }] = await Promise.all([
      supabase.from("applications").select("candidate_id").not("candidate_id", "is", null),
      supabase.from("candidates").select("*").order("created_at", { ascending: false }).limit(3000),
      supabase
        .from("admin_candidate_notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);
    if (e1 || e2 || e3) {
      setErr(e1?.message ?? e2?.message ?? e3?.message ?? "Failed to load");
      setCandidates([]);
      setAppliedCandidateIds(new Set());
      setNotesByCandidate({});
    } else {
      setCandidates((cands as CandidateRow[]) ?? []);
      setAppliedCandidateIds(
        new Set((apps ?? []).map((r) => r.candidate_id).filter((id): id is string => Boolean(id))),
      );
      setNotesByCandidate(groupNotes((notes as AdminCandidateNoteRow[]) ?? []));
    }
    setLoading(false);
  }, [groupNotes, supabase]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const pool = useMemo(
    () => candidates.filter((c) => !appliedCandidateIds.has(c.id)),
    [candidates, appliedCandidateIds],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pool.filter((c) => {
      if (moduleFilter !== "all") {
        const mods = c.preferred_modules ?? [];
        if (!mods.includes(moduleFilter)) return false;
      }
      if (qualFilter !== "all") {
        const hq = (c.highest_qualification ?? "").trim();
        if (hq !== qualFilter) return false;
      }
      if (locationFilter !== "all") {
        const location = (c.preferred_location ?? "").trim();
        if (!location || location !== locationFilter) return false;
      }
      if (q) {
        const blob = `${c.full_name} ${c.email} ${c.mobile} ${c.preferred_location ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [pool, moduleFilter, qualFilter, locationFilter, search]);

  const locationOptions = useMemo(() => {
    return Array.from(new Set(pool.map((candidate) => (candidate.preferred_location ?? "").trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [pool]);

  const submitNote = useCallback(async () => {
    if (!activeCandidate) return;
    const body = noteBody.trim();
    if (!body) {
      setNoteErr("Note cannot be empty.");
      return;
    }
    setNoteBusy(true);
    setNoteErr(null);
    const { error } = await supabase.from("admin_candidate_notes").insert({
      candidate_id: activeCandidate.id,
      body,
      admin_email: sessionEmail,
    });
    if (error) {
      setNoteErr(error.message);
      setNoteBusy(false);
      return;
    }
    setNoteBody("");
    await load();
    setNoteBusy(false);
  }, [activeCandidate, load, noteBody, sessionEmail, supabase]);

  const noteSummaryFor = useCallback(
    (candidateId: string) => {
      const first = notesByCandidate[candidateId]?.[0];
      if (!first) return "No notes";
      const preview = first.body.replace(/\s+/g, " ").trim();
      return preview.length > 48 ? `${preview.slice(0, 48)}...` : preview;
    },
    [notesByCandidate],
  );

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {err}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid w-full gap-2 sm:w-44">
          <Label className="text-xs">Module</Label>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {JOB_MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-full gap-2 sm:w-44">
          <Label className="text-xs">Qualification</Label>
          <Select value={qualFilter} onValueChange={setQualFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {QUALIFICATIONS.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-full min-w-0 flex-1 gap-2 sm:min-w-[200px]">
          <Label className="text-xs">Location</Label>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locationOptions.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-full min-w-0 flex-1 gap-2 sm:min-w-[200px]">
          <Label className="text-xs">Search</Label>
          <Input
            placeholder="Name, email, mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Showing {filtered.length} candidate{filtered.length === 1 ? "" : "s"} with no applications yet.
      </p>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Mobile</TableHead>
              <TableHead className="hidden xl:table-cell">Designation</TableHead>
              <TableHead className="hidden xl:table-cell">Department</TableHead>
              <TableHead className="hidden sm:table-cell">Company</TableHead>
              <TableHead className="hidden sm:table-cell">Qual.</TableHead>
              <TableHead className="hidden lg:table-cell">Modules</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead className="hidden md:table-cell">Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-sm text-zinc-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-sm text-zinc-500">
                  No talent pool entries match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="hidden max-w-[200px] truncate md:table-cell">{c.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{c.mobile}</TableCell>
                  <TableCell className="hidden max-w-[140px] truncate xl:table-cell">{c.current_designation ?? "—"}</TableCell>
                  <TableCell className="hidden max-w-[120px] truncate xl:table-cell">{c.current_department ?? "—"}</TableCell>
                  <TableCell className="hidden max-w-[140px] truncate sm:table-cell">{c.current_company ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.highest_qualification ?? "—"}</TableCell>
                  <TableCell className="hidden max-w-[160px] truncate text-xs lg:table-cell">
                    {(c.preferred_modules ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-[140px] truncate md:table-cell">
                    {c.preferred_location ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <button
                      type="button"
                      className="max-w-[180px] truncate text-left text-xs font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-200"
                      onClick={() => {
                        setActiveCandidate(c);
                        setNoteErr(null);
                      }}
                    >
                      {noteSummaryFor(c.id)}
                    </button>
                  </TableCell>
                  <TableCell>
                    {c.resume_url ? (
                      <a
                        href={c.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-zinc-600 md:table-cell dark:text-zinc-300">
                    {formatAppliedAt(c.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(activeCandidate)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCandidate(null);
            setNoteBody("");
            setNoteErr(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate notes</DialogTitle>
            <DialogDescription>
              {activeCandidate ? `${activeCandidate.full_name} (${activeCandidate.mobile})` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {(activeCandidate ? notesByCandidate[activeCandidate.id] ?? [] : []).length === 0 ? (
              <p className="text-sm text-zinc-500">No notes yet. Add one below.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                {(activeCandidate ? notesByCandidate[activeCandidate.id] ?? [] : []).map((note) => (
                  <article key={note.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                    <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{note.body}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {note.admin_email ?? "admin"} - {formatAppliedAt(note.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="candidate-note">Add note</Label>
              <Textarea
                id="candidate-note"
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="Write an internal note..."
                rows={4}
              />
              {noteErr ? <p className="text-xs text-red-600">{noteErr}</p> : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setActiveCandidate(null)} disabled={noteBusy}>
              Close
            </Button>
            <Button type="button" onClick={() => void submitNote()} disabled={noteBusy}>
              {noteBusy ? "Saving..." : "Save note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
