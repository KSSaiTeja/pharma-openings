import type { CandidateRow } from "@/types/database.types";

/** Inputs needed to compute a placeholder fit score (replaced by AI later). */
export type JobFitScoreJobInput = {
  jobId: string;
  title: string;
  department?: string | null;
  module?: string | null;
  qualification?: string | null;
  location?: string | null;
  jobType?: string | null;
  description?: string | null;
};

export type JobFitScoreTier = "strong" | "good" | "fair" | "low";

export type JobFitImprovement = {
  id: string;
  title: string;
  detail: string;
  /** Rough estimate shown in UI — replaced by AI later. */
  pointsGain: number;
};

export type JobFitScoreResult = {
  score: number;
  tier: JobFitScoreTier;
  improvements: [JobFitImprovement, JobFitImprovement, JobFitImprovement];
};

function hashSeed(a: string, b: string): number {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function includesLoose(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack.includes(needle) || needle.includes(haystack);
}

function scoreTier(score: number): JobFitScoreTier {
  if (score >= 80) return "strong";
  if (score >= 65) return "good";
  if (score >= 50) return "fair";
  return "low";
}

function clampScore(score: number): number {
  return Math.min(96, Math.max(42, Math.round(score)));
}

type ImprovementCandidate = JobFitImprovement & { priority: number };

/**
 * Deterministic mock fit score for UI preview.
 * Uses candidate profile + job metadata; swap for AI API later.
 */
export function computeMockJobFitScore(
  job: JobFitScoreJobInput,
  candidate: CandidateRow,
): JobFitScoreResult {
  const seed = hashSeed(job.jobId, candidate.id);
  let score = 52 + (seed % 34);

  const jobModule = normalize(job.module);
  const jobQual = normalize(job.qualification);
  const jobLoc = normalize(job.location);
  const jobDept = normalize(job.department);
  const preferredModules = (candidate.preferred_modules ?? []).map(normalize);
  const candQual = normalize(candidate.highest_qualification);
  const candLoc = normalize(candidate.preferred_location);
  const candDept = normalize(candidate.current_department ?? candidate.department_custom);
  const candSubDept = normalize(
    candidate.current_sub_department ?? candidate.sub_department_custom,
  );
  const candDesignation = normalize(
    candidate.current_designation ?? candidate.designation_custom,
  );
  const jobDesc = normalize(job.description);
  const jobTitle = normalize(job.title);

  if (jobModule && preferredModules.some((m) => m === jobModule || includesLoose(m, jobModule))) {
    score += 9;
  }

  if (jobQual && candQual && (includesLoose(candQual, jobQual) || includesLoose(jobQual, candQual))) {
    score += 8;
  }

  if (jobLoc && candLoc && includesLoose(candLoc, jobLoc)) {
    score += 6;
  }

  if (jobDept && candDept && includesLoose(candDept, jobDept)) {
    score += 5;
  }

  if (candDesignation && includesLoose(jobTitle, candDesignation)) {
    score += 4;
  }

  if (jobDept && candSubDept && includesLoose(jobDesc, candSubDept)) {
    score += 6;
  }

  if (
    jobDept &&
    candDept &&
    includesLoose(candDept, jobDept) &&
    jobModule &&
    preferredModules.some((m) => includesLoose(m, jobModule))
  ) {
    score += 5;
  }

  if (jobDept && candDept && !includesLoose(candDept, jobDept)) {
    score -= 12;
  }

  if (jobModule && preferredModules.length > 0 && !preferredModules.some((m) => includesLoose(m, jobModule))) {
    score -= 8;
  }

  if (candidate.resume_url) {
    score += 4;
  } else {
    score -= 6;
  }

  if (!candidate.highest_qualification) {
    score -= 4;
  }

  if (!candidate.current_designation && !candidate.designation_custom) {
    score -= 3;
  }

  const finalScore = clampScore(score);
  const improvements: ImprovementCandidate[] = [];

  if (!candidate.resume_url) {
    improvements.push({
      id: "resume",
      priority: 10,
      title: "Upload your résumé",
      detail: "A complete CV helps us match your GxP and production experience to this role.",
      pointsGain: 6,
    });
  }

  if (job.module && !preferredModules.some((m) => includesLoose(m, jobModule))) {
    improvements.push({
      id: "module",
      priority: 9,
      title: `Add ${job.module} to preferred modules`,
      detail: "Tell us you are open to this production area so similar roles rank higher.",
      pointsGain: 9,
    });
  }

  if (job.qualification && (!candQual || !includesLoose(candQual, jobQual))) {
    improvements.push({
      id: "qualification",
      priority: 8,
      title: "Align your qualification",
      detail: `Update highest qualification to reflect ${job.qualification} if accurate for you.`,
      pointsGain: 8,
    });
  }

  if (job.location && (!candLoc || !includesLoose(candLoc, jobLoc))) {
    improvements.push({
      id: "location",
      priority: 7,
      title: "Update preferred location",
      detail: `Include ${job.location} if you can work there or relocate for pharma roles.`,
      pointsGain: 6,
    });
  }

  if (!candidate.current_designation && !candidate.designation_custom) {
    improvements.push({
      id: "designation",
      priority: 6,
      title: "Add current designation",
      detail: "Seniority and job title help compare you fairly against this opening.",
      pointsGain: 5,
    });
  }

  if (!candidate.current_department && !candidate.department_custom && job.department) {
    improvements.push({
      id: "department",
      priority: 5,
      title: "Specify your department",
      detail: `This role is in ${job.department} — matching department lifts relevance.`,
      pointsGain: 5,
    });
  }

  if (!candidate.notice_period) {
    improvements.push({
      id: "notice",
      priority: 4,
      title: "Set your notice period",
      detail: "Many employers shortlist candidates who show clear joining availability.",
      pointsGain: 4,
    });
  }

  if (finalScore >= 80) {
    improvements.push({
      id: "apply-note",
      priority: 2,
      title: "Strengthen your application note",
      detail: "Mention one audit, batch, or validation win relevant to this team when you apply.",
      pointsGain: 3,
    });
  } else {
    improvements.push({
      id: "experience",
      priority: 3,
      title: "Highlight module experience",
      detail: "Reference batch records, cleaning validation, or QA release in your profile summary.",
      pointsGain: 4,
    });
  }

  improvements.push({
    id: "profile-fresh",
    priority: 1,
    title: "Keep profile details current",
    detail: "Scores refresh when you save changes — outdated fields lower your match.",
    pointsGain: 2,
  });

  improvements.sort((a, b) => b.priority - a.priority);

  const picked: JobFitImprovement[] = [];
  for (const item of improvements) {
    if (picked.length >= 3) break;
    const { priority: _p, ...rest } = item;
    if (!picked.some((p) => p.id === rest.id)) picked.push(rest);
  }

  while (picked.length < 3) {
    picked.push({
      id: `fallback-${picked.length}`,
      title: "Complete your profile",
      detail: "Fill in missing sections so we can score you accurately on pharma roles.",
      pointsGain: 5,
    });
  }

  return {
    score: finalScore,
    tier: scoreTier(finalScore),
    improvements: [picked[0]!, picked[1]!, picked[2]!],
  };
}

export function jobFitScoreLabel(tier: JobFitScoreTier): string {
  switch (tier) {
    case "strong":
      return "Strong match";
    case "good":
      return "Good match";
    case "fair":
      return "Fair match";
    default:
      return "Room to grow";
  }
}

export function jobFitPotentialScore(score: number, improvements: JobFitImprovement[]): number {
  const boost = improvements.reduce((sum, item) => sum + item.pointsGain, 0);
  return Math.min(98, score + Math.round(boost * 0.55));
}
