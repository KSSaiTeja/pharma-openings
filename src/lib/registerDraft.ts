export const REGISTER_STEP2_DRAFT_KEY = "po_register_step2_draft";

export type RegisterStep2DraftV1 = {
  v: 1;
  mobile: string;
  fullName: string;
  email: string;
  designation: string;
  department: string;
  subDepartment: string;
  departmentCustom: string;
  subDepartmentCustom: string;
  designationCustom: string;
  company: string;
  preferredLocation: string;
  qualification: string;
  qualificationCustom: string;
  noticePeriod: string;
  preferred: string[];
  preferredModulesOthersNote: string;
};

export function readRegisterStep2Draft(): RegisterStep2DraftV1 | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(REGISTER_STEP2_DRAFT_KEY);
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (o.v !== 1 || typeof o.mobile !== "string") return null;
    const preferred = Array.isArray(o.preferred) ? o.preferred.filter((x): x is string => typeof x === "string") : [];
    return {
      v: 1,
      mobile: o.mobile.trim(),
      fullName: typeof o.fullName === "string" ? o.fullName : "",
      email: typeof o.email === "string" ? o.email : "",
      designation: typeof o.designation === "string" ? o.designation : "",
      department: typeof o.department === "string" ? o.department : "",
      subDepartment: typeof o.subDepartment === "string" ? o.subDepartment : "",
      departmentCustom: typeof o.departmentCustom === "string" ? o.departmentCustom : "",
      subDepartmentCustom: typeof o.subDepartmentCustom === "string" ? o.subDepartmentCustom : "",
      designationCustom: typeof o.designationCustom === "string" ? o.designationCustom : "",
      company: typeof o.company === "string" ? o.company : "",
      preferredLocation: typeof o.preferredLocation === "string" ? o.preferredLocation : "",
      qualification: typeof o.qualification === "string" ? o.qualification : "",
      qualificationCustom: typeof o.qualificationCustom === "string" ? o.qualificationCustom : "",
      noticePeriod: typeof o.noticePeriod === "string" ? o.noticePeriod : "",
      preferredModulesOthersNote:
        typeof o.preferredModulesOthersNote === "string" ? o.preferredModulesOthersNote : "",
      preferred: preferred.length ? preferred : ["Others"],
    };
  } catch {
    return null;
  }
}

export function writeRegisterStep2Draft(draft: RegisterStep2DraftV1) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REGISTER_STEP2_DRAFT_KEY, JSON.stringify(draft));
}

export function clearRegisterStep2Draft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REGISTER_STEP2_DRAFT_KEY);
}
