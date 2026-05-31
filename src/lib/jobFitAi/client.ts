import type { CandidateProfileInput, JobFitJobInput } from "@/src/lib/jobFitAi/types";
import type { CandidateRow, JobRow } from "@/types/database.types";

export function candidateToFitInput(candidate: CandidateRow): CandidateProfileInput {
  return {
    id: candidate.id,
    profileVersion: candidate.updated_at,
    highestQualification: candidate.highest_qualification,
    currentDesignation: candidate.current_designation ?? candidate.designation_custom,
    currentDepartment: candidate.current_department ?? candidate.department_custom,
    currentSubDepartment: candidate.current_sub_department ?? candidate.sub_department_custom,
    currentCompany: candidate.current_company,
    preferredLocation: candidate.preferred_location,
    preferredModules: candidate.preferred_modules,
    noticePeriod: candidate.notice_period,
    hasResume: Boolean(candidate.resume_url),
  };
}

export function jobRowToFitInput(job: JobRow): JobFitJobInput {
  return {
    jobId: job.id,
    title: job.title,
    department: job.department,
    module: job.module,
    qualification: job.qualification_needed,
    location: job.location,
    jobType: job.type,
    description: job.description,
  };
}
