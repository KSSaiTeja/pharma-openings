import type { JobFitScoreResult } from "@/src/lib/jobFitScore.mock";

export type CandidateProfileInput = {
  id: string;
  profileVersion?: string | null;
  highestQualification?: string | null;
  currentDesignation?: string | null;
  currentDepartment?: string | null;
  currentSubDepartment?: string | null;
  currentCompany?: string | null;
  preferredLocation?: string | null;
  preferredModules?: string[] | null;
  noticePeriod?: string | null;
  hasResume?: boolean;
};

export type JobFitJobInput = {
  jobId: string;
  title: string;
  department?: string | null;
  module?: string | null;
  qualification?: string | null;
  location?: string | null;
  jobType?: string | null;
  description?: string | null;
};

export type JobFitAiPayload = {
  candidate: CandidateProfileInput;
  job: JobFitJobInput;
};

export type JobFitBatchPayload = {
  candidate: CandidateProfileInput;
  jobs: JobFitJobInput[];
};

export type JobFitScoreMap = Record<string, JobFitScoreResult>;

export type JobFitCacheStatus = "HIT" | "MISS" | "DEDUPED";

export type JobFitScoreResponse = {
  result: JobFitScoreResult;
  cache: JobFitCacheStatus;
};
