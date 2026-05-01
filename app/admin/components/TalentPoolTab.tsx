"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { startTransition, useCallback, useEffect, useState } from "react";

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
import type { AdminCandidateNoteRow, CandidateRow, Database, Json } from "@/types/database.types";

import { formatAppliedAt, JOB_MODULES, QUALIFICATIONS } from "../admin-constants";

const TALENT_POOL_PAGE_SIZE = 40;

type Props = {
  supabase: SupabaseClient<Database>;
  onSyncTalentPool: (payload: { candidateIds: string[]; page: number }) => void;
  syncingTarget: null | "applications" | "talent_pool";
};

function parseTalentPoolRpcPayload(raw: Json): { total: number; rows: CandidateRow[] } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { total: 0, rows: [] };
  }
  const o = raw as Record<string, unknown>;
  const total = typeof o.total === "number" ? o.total : Number(o.total ?? 0);
  const rowsRaw = o.rows;
  if (!Array.isArray(rowsRaw)) {
    return { total, rows: [] };
  }
  return { total, rows: rowsRaw as CandidateRow[] };
}

export function TalentPoolTab({ supabase, onSyncTalentPool, syncingTarget }: Props) {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [qualFilter, setQualFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeCandidate, setActiveCandidate] = useState<CandidateRow | null>(null);
  const [dialogNotes, setDialogNotes] = useState<AdminCandidateNoteRow[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteErr, setNoteErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.rpc("talent_pool_candidates_page", {
      p_limit: TALENT_POOL_PAGE_SIZE,
      p_offset: (page - 1) * TALENT_POOL_PAGE_SIZE,
      p_module: moduleFilter === "all" ? null : moduleFilter,
      p_qual: qualFilter === "all" ? null : qualFilter,
      p_location: locationFilter === "all" ? null : locationFilter,
      p_search: search.trim() ? search.trim() : null,
    });

    if (error) {
      setErr(error.message);
      setCandidates([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const parsed = parseTalentPoolRpcPayload(data as Json);
    setTotalCount(parsed.total);
    const pages = Math.max(1, Math.ceil(parsed.total / TALENT_POOL_PAGE_SIZE));
    if (page > pages) {
      startTransition(() => {
        setPage(pages);
      });
      setLoading(false);
      return;
    }
    setCandidates(parsed.rows);
    setLoading(false);
  }, [supabase, page, moduleFilter, qualFilter, locationFilter, search]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("candidates").select("preferred_location").limit(8000);
      const u = new Set<string>();
      for (const row of data ?? []) {
        const loc = (row as { preferred_location?: string | null }).preferred_location?.trim();
        if (loc) u.add(loc);
      }
      setLocationOptions([...u].sort((a, b) => a.localeCompare(b)));
    })();
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
  }, [moduleFilter, qualFilter, locationFilter, search]);

  const openCandidateNotes = useCallback(
    async (c: CandidateRow) => {
      setActiveCandidate(c);
      setNoteErr(null);
      const { data, error } = await supabase
        .from("admin_candidate_notes")
        .select("*")
        .eq("candidate_id", c.id)
        .order("created_at", { ascending: false });
      if (error) {
        setDialogNotes([]);
        setNoteErr(error.message);
        return;
      }
      setDialogNotes((data as AdminCandidateNoteRow[]) ?? []);
    },
    [supabase],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / TALENT_POOL_PAGE_SIZE));

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
    if (activeCandidate) {
      const { data } = await supabase
        .from("admin_candidate_notes")
        .select("*")
        .eq("candidate_id", activeCandidate.id)
        .order("created_at", { ascending: false });
      setDialogNotes((data as AdminCandidateNoteRow[]) ?? []);
    }
    setNoteBusy(false);
  }, [activeCandidate, load, noteBody, sessionEmail, supabase]);

  return (
    <div className="space-y-4">
      {err ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
          aria-live="assertive"
        >
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
        <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSyncTalentPool({ candidateIds: candidates.map((c) => c.id), page })}
            disabled={syncingTarget !== null || candidates.length === 0 || loading}
          >
            {syncingTarget === "talent_pool"
              ? `Syncing talent pool (page ${page})…`
              : `Sync talent pool — page ${page}`}
          </Button>
        </div>
      </div>

      {!loading && totalCount > 0 ? (
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Talent Pool sheet · Page {page}</span> — appends
          to the <span className="font-medium">Talent Pool</span> tab only; skips candidates already in the sheet (same
          Candidate ID). Use the <span className="font-medium">Applications</span> tab for job applications.
        </p>
      ) : null}

      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Showing {candidates.length.toLocaleString()} on this page · {totalCount.toLocaleString()} matching · candidates
        with no applications yet
      </p>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <Table>
          <caption className="sr-only">Talent pool candidates with no applications yet</caption>
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
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-sm text-zinc-500">
                  No talent pool entries match these filters.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((c) => (
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
                      className="max-w-[180px] truncate rounded-sm text-left text-xs font-medium text-zinc-800 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-200 dark:focus-visible:ring-zinc-500"
                      onClick={() => void openCandidateNotes(c)}
                    >
                      View / add notes
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

      {!loading && totalCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={Boolean(activeCandidate)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCandidate(null);
            setDialogNotes([]);
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
            {dialogNotes.length === 0 ? (
              <p className="text-sm text-zinc-500">No notes yet. Add one below.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                {dialogNotes.map((note) => (
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
              {noteErr ? (
                <p className="text-xs text-red-600" role="alert" aria-live="assertive">
                  {noteErr}
                </p>
              ) : null}
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
