import type { JobRow } from "@/types/database.types";

/** Display label for the public job reference shown to candidates and recruiters. */
export const JOB_REFERENCE_LABEL = "Job ID";

type JobReferenceSource = Pick<JobRow, "job_code" | "id"> | { job_code?: string | null; id: string };

/**
 * Returns the human-readable job reference from the database (`job_code`),
 * with a short UUID fallback only when legacy rows lack a code.
 */
export function getJobReference(job: JobReferenceSource): string {
  const code = job.job_code?.trim();
  if (code) return code;
  return job.id.slice(0, 8).toUpperCase();
}

export function formatJobReferenceLabel(job: JobReferenceSource): string {
  return `${JOB_REFERENCE_LABEL}: ${getJobReference(job)}`;
}
