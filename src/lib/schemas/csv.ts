import { z } from "zod";

import { APPLY_QUALIFICATIONS, JOB_MODULES, JOB_TYPES, STRING_LIMITS } from "@/src/lib/schemas/forms";

const trimmed = z.string().trim();

export const jobCsvMappedOutputSchema = z.object({
  title: trimmed.min(1).max(STRING_LIMITS.jobTitle),
  location: trimmed.min(1).max(STRING_LIMITS.location),
  department: trimmed.max(STRING_LIMITS.department).optional().default(""),
  type: z.enum(JOB_TYPES),
  module: z.enum(JOB_MODULES),
  qualificationNeeded: z.enum(APPLY_QUALIFICATIONS),
  description: trimmed.min(1).max(STRING_LIMITS.jobDescription),
});

export type JobCsvMappedOutput = z.infer<typeof jobCsvMappedOutputSchema>;
