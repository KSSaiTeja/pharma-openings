import { z } from "zod";

const trimString = z.string().trim();
const optionalTrimmed = trimString.transform((value) => value || undefined);

export const STRING_LIMITS = {
  name: 100,
  email: 254,
  mobile: 20,
  designation: 120,
  department: 120,
  subDepartment: 120,
  company: 120,
  location: 120,
  noticePeriod: 120,
  qualificationCustom: 120,
  jobTitle: 140,
  jobDescription: 6000,
} as const;

export const QUALIFICATIONS = [
  "B.Pharm",
  "M.Pharm",
  "B.Sc",
  "M.Sc",
  "PhD",
  "D.Pharm",
  "ITI",
  "Diploma",
  "Other",
] as const;

export const APPLY_QUALIFICATIONS = [...QUALIFICATIONS, "Any"] as const;
export const PREFERRED_MODULES = ["API", "Injectables", "OSD", "Others"] as const;
export const JOB_MODULES = ["API", "Injectables", "OSD", "Others"] as const;
export const JOB_TYPES = ["Full-time", "Part-time", "Contract"] as const;

export const registerSubmitSchema = z
  .object({
    fullName: trimString.min(1, "Full name is required.").max(STRING_LIMITS.name),
    email: trimString.min(1, "Email is required.").max(STRING_LIMITS.email).email("Invalid email address."),
    mobile: trimString.min(8).max(STRING_LIMITS.mobile),
    department: trimString.min(1, "Please select your department.").max(STRING_LIMITS.department),
    subDepartment: trimString.min(1, "Please select your sub-department.").max(STRING_LIMITS.subDepartment),
    designation: trimString.min(1, "Please select your current designation.").max(STRING_LIMITS.designation),
    departmentCustom: optionalTrimmed,
    subDepartmentCustom: optionalTrimmed,
    designationCustom: optionalTrimmed,
    company: trimString.min(1, "Current company is required.").max(STRING_LIMITS.company),
    preferredLocation: trimString
      .min(1, "Preferred location is required.")
      .max(STRING_LIMITS.location),
    qualification: z.enum(QUALIFICATIONS),
    qualificationCustom: z.string().max(STRING_LIMITS.qualificationCustom),
    noticePeriod: trimString
      .min(1, "Notice period is required.")
      .max(STRING_LIMITS.noticePeriod),
    preferred: z.array(z.enum(PREFERRED_MODULES)).min(1, "Please select at least one preferred module."),
    preferredModulesOthersNote: z.string().max(200),
  })
  .superRefine((data, ctx) => {
    if (data.department === "Other" && !data.departmentCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departmentCustom"],
        message: "Please enter your department when selecting Other.",
      });
    }
    if (data.subDepartment === "Other" && !data.subDepartmentCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subDepartmentCustom"],
        message: "Please enter your sub-department when selecting Other.",
      });
    }
    if (data.designation === "Other" && !data.designationCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designationCustom"],
        message: "Please enter your designation when selecting Other.",
      });
    }
    if (data.qualification === "Other" && !data.qualificationCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qualificationCustom"],
        message: "Please specify your qualification when selecting Other.",
      });
    }
    if (data.preferred.includes("Others") && !data.preferredModulesOthersNote?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preferredModulesOthersNote"],
        message: "Please describe your preferred modules when you select Others.",
      });
    }
  });

export const profileUpdateSchema = z.object({
  fullName: trimString.min(1, "Full name is required.").max(STRING_LIMITS.name),
  email: trimString.min(1, "Email is required.").max(STRING_LIMITS.email).email("Invalid email address."),
  designation: optionalTrimmed.refine(
    (value) => !value || value.length <= STRING_LIMITS.designation,
    "Current designation is too long.",
  ),
  department: optionalTrimmed.refine(
    (value) => !value || value.length <= STRING_LIMITS.department,
    "Current department is too long.",
  ),
  company: optionalTrimmed.refine((value) => !value || value.length <= STRING_LIMITS.company, "Company is too long."),
  preferredLocation: optionalTrimmed.refine(
    (value) => !value || value.length <= STRING_LIMITS.location,
    "Preferred location is too long.",
  ),
  qualification: z.enum(QUALIFICATIONS),
  preferred: z.array(z.enum(PREFERRED_MODULES)).min(1, "Please select at least one preferred module."),
});

export const applyPayloadSchema = z.object({
  designation: optionalTrimmed.refine(
    (value) => !value || value.length <= STRING_LIMITS.designation,
    "Current designation is too long.",
  ),
  department: optionalTrimmed.refine(
    (value) => !value || value.length <= STRING_LIMITS.department,
    "Current department is too long.",
  ),
  company: optionalTrimmed.refine((value) => !value || value.length <= STRING_LIMITS.company, "Company is too long."),
  qualification: z.enum(APPLY_QUALIFICATIONS),
});

/** Job apply flow: same taxonomy rules as registration (dropdowns + Other). */
export const applyJobFormSchema = z
  .object({
    department: trimString.min(1, "Please select your department.").max(STRING_LIMITS.department),
    subDepartment: trimString.min(1, "Please select your sub-department.").max(STRING_LIMITS.subDepartment),
    designation: trimString.min(1, "Please select your current designation.").max(STRING_LIMITS.designation),
    departmentCustom: optionalTrimmed,
    subDepartmentCustom: optionalTrimmed,
    designationCustom: optionalTrimmed,
    company: trimString.min(1, "Current company is required.").max(STRING_LIMITS.company),
    qualification: z.enum(APPLY_QUALIFICATIONS),
    qualificationCustom: z.string().max(STRING_LIMITS.qualificationCustom),
  })
  .superRefine((data, ctx) => {
    if (data.department === "Other" && !data.departmentCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departmentCustom"],
        message: "Please enter your department when selecting Other.",
      });
    }
    if (data.subDepartment === "Other" && !data.subDepartmentCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subDepartmentCustom"],
        message: "Please enter your sub-department when selecting Other.",
      });
    }
    if (data.designation === "Other" && !data.designationCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designationCustom"],
        message: "Please enter your designation when selecting Other.",
      });
    }
    if (data.qualification === "Other" && !data.qualificationCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qualificationCustom"],
        message: "Please specify your qualification when selecting Other.",
      });
    }
  });

export const adminJobUpsertSchema = z.object({
  title: trimString.min(1, "Title is required.").max(STRING_LIMITS.jobTitle),
  location: trimString.min(1, "Location is required.").max(STRING_LIMITS.location),
  department: optionalTrimmed.refine(
    (value) => !value || value.length <= STRING_LIMITS.department,
    "Department is too long.",
  ),
  type: z.enum(JOB_TYPES),
  module: z.enum(JOB_MODULES),
  qualification_needed: z.enum(APPLY_QUALIFICATIONS),
  description: trimString.min(1, "Description is required.").max(STRING_LIMITS.jobDescription),
});
