/**
 * Prefer `snapshot_*` (apply-time); fall back to `current_*` / `resume_url` / `highest_qualification` for older rows.
 */
export type AdminApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  job_id: string;
  status: string;
  status_changed_at?: string | null;
  created_at: string;
  candidate_id?: string | null;
  resume_url?: string | null;
  snapshot_resume_url?: string | null;
  current_designation?: string | null;
  current_department?: string | null;
  current_company?: string | null;
  snapshot_designation?: string | null;
  snapshot_department?: string | null;
  snapshot_company?: string | null;
  highest_qualification?: string | null;
  snapshot_qualification?: string | null;
  jobs?: { title: string; module: string | null; location?: string | null } | null;
};

export function applicationDesignation(r: AdminApplicationRow): string | null {
  return r.snapshot_designation ?? r.current_designation ?? null;
}

export function applicationDepartment(r: AdminApplicationRow): string | null {
  return r.snapshot_department ?? r.current_department ?? null;
}

export function applicationCompany(r: AdminApplicationRow): string | null {
  return r.snapshot_company ?? r.current_company ?? null;
}

export function applicationQualification(r: AdminApplicationRow): string | null {
  return r.snapshot_qualification ?? r.highest_qualification ?? null;
}

export function applicationResumeUrl(r: AdminApplicationRow): string | null {
  return r.snapshot_resume_url ?? r.resume_url ?? null;
}
