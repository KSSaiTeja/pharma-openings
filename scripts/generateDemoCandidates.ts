/**
 * 60 realistic pharma candidate profiles for Talent Pool / admin demos.
 * Mobiles 9900100001–9900100060 · emails demo.profile.NNN@pharmaopenings.demo
 */

import { CANDIDATE_DEPARTMENT_TAXONOMY } from "../src/lib/candidateTaxonomy";

export type DemoCandidateProfile = {
  full_name: string;
  email: string;
  mobile: string;
  current_department: string;
  current_sub_department: string;
  current_designation: string;
  current_company: string;
  highest_qualification: string;
  preferred_modules: string[];
  preferred_location: string;
  notice_period: string;
};

const FIRST_NAMES = [
  "Priya",
  "Ananya",
  "Kavya",
  "Meera",
  "Divya",
  "Rahul",
  "Arjun",
  "Vikram",
  "Suresh",
  "Kiran",
  "Amit",
  "Neha",
  "Pooja",
  "Sanjay",
  "Deepak",
  "Rohit",
  "Manish",
  "Sneha",
  "Aditi",
  "Harish",
  "Gaurav",
  "Nikhil",
  "Ashok",
  "Lakshmi",
  "Varun",
  "Karthik",
  "Rajesh",
  "Swati",
  "Harsh",
  "Isha",
] as const;

const LAST_NAMES = [
  "Sharma",
  "Patel",
  "Reddy",
  "Nair",
  "Iyer",
  "Mehta",
  "Desai",
  "Kulkarni",
  "Joshi",
  "Rao",
  "Singh",
  "Gupta",
  "Pillai",
  "Menon",
  "Chatterjee",
  "Banerjee",
  "Verma",
  "Agarwal",
  "Malhotra",
  "Saxena",
] as const;

const COMPANIES = [
  "Sun Pharmaceutical",
  "Cipla",
  "Dr. Reddy's Laboratories",
  "Lupin",
  "Aurobindo Pharma",
  "Cadila Healthcare (Zydus)",
  "Biocon",
  "Torrent Pharmaceuticals",
  "Alkem Laboratories",
  "Glenmark Pharmaceuticals",
  "Mankind Pharma",
  "Intas Pharmaceuticals",
  "Emcure Pharmaceuticals",
  "Alembic Pharmaceuticals",
  "Hetero Labs",
  "Granules India",
  "Syngene International",
  "Piramal Pharma",
  "Wockhardt",
  "IPCA Laboratories",
] as const;

const LOCATIONS = [
  "Ahmedabad",
  "Mumbai",
  "Hyderabad",
  "Bangalore",
  "Pune",
  "Vadodara",
  "Goa",
  "Chennai",
  "Delhi NCR",
  "Indore",
  "Baddi",
  "Visakhapatnam",
  "Kolkata",
  "Nagpur",
  "Ankleshwar",
] as const;

const QUALIFICATIONS = [
  "B.Pharm",
  "M.Pharm",
  "B.Sc",
  "M.Sc",
  "PhD",
  "D.Pharm",
  "Diploma",
  "ITI",
] as const;

const NOTICE_PERIODS = ["Immediate", "15 days", "30 days", "45 days", "60 days", "90 days"] as const;

const MODULE_COMBOS: readonly (readonly string[])[] = [
  ["OSD"],
  ["API"],
  ["Injectables"],
  ["OSD", "API"],
  ["Injectables", "OSD"],
  ["API", "Injectables"],
  ["Others"],
  ["OSD", "Others"],
  ["API", "Others"],
  ["Injectables", "Others"],
];

/** Curated department / sub / designation triples aligned with open roles. */
const ROLE_TEMPLATES: ReadonlyArray<{
  department: string;
  subDepartment: string;
  designation: string;
  moduleBias: number;
  qualBias: number;
}> = [
  { department: "Quality Assurance", subDepartment: "IPQA", designation: "Executive", moduleBias: 0, qualBias: 0 },
  { department: "Quality Assurance", subDepartment: "QMS", designation: "Assistant Manager", moduleBias: 0, qualBias: 1 },
  { department: "Quality Assurance", subDepartment: "Validations", designation: "Deputy Manager", moduleBias: 3, qualBias: 1 },
  { department: "Quality Control", subDepartment: "Finished Products", designation: "Senior Executive", moduleBias: 0, qualBias: 0 },
  { department: "Quality Control", subDepartment: "Stability", designation: "Executive", moduleBias: 0, qualBias: 2 },
  { department: "Quality Control", subDepartment: "QC Microbiology", designation: "Manager", moduleBias: 1, qualBias: 3 },
  { department: "Production OSD (Oral Solid Dosage)", subDepartment: "Granulation Operator", designation: "Operator", moduleBias: 0, qualBias: 4 },
  { department: "Production OSD (Oral Solid Dosage)", subDepartment: "Compression Operator", designation: "Senior Technical Associate", moduleBias: 0, qualBias: 4 },
  { department: "Production OSD (Oral Solid Dosage)", subDepartment: "Coating Operator", designation: "Supervisor", moduleBias: 0, qualBias: 5 },
  { department: "Production INJECTABLES", subDepartment: "Filling", designation: "Operator", moduleBias: 2, qualBias: 4 },
  { department: "Production INJECTABLES", subDepartment: "Lyophilization Operation & PFS", designation: "Officer", moduleBias: 2, qualBias: 1 },
  { department: "Production INJECTABLES", subDepartment: "Batch Manufacturing", designation: "Management Associate", moduleBias: 2, qualBias: 0 },
  { department: "Packing", subDepartment: "Blister Packing", designation: "Technical Associate", moduleBias: 0, qualBias: 6 },
  { department: "Packing", subDepartment: "Primary & Secondary Packing", designation: "Supervisor", moduleBias: 3, qualBias: 5 },
  { department: "Engineering", subDepartment: "HVAC & Utility", designation: "Senior Executive", moduleBias: 1, qualBias: 2 },
  { department: "Engineering", subDepartment: "Process Maintenance", designation: "Manager", moduleBias: 0, qualBias: 2 },
  { department: "Research and Development", subDepartment: "Process R&D", designation: "Research Scientist", moduleBias: 1, qualBias: 3 },
  { department: "Formulation Research and Development (FR&D)", subDepartment: "OSD", designation: "Senior Research Scientist", moduleBias: 0, qualBias: 1 },
  { department: "Formulation Research and Development (FR&D)", subDepartment: "Injectables", designation: "Manager", moduleBias: 2, qualBias: 3 },
  { department: "Analytical Research and Development (AR&D)", subDepartment: "Method Development & Method Validation", designation: "Deputy Manager", moduleBias: 1, qualBias: 1 },
  { department: "Regulatory Affairs", subDepartment: "CMC", designation: "Manager", moduleBias: 3, qualBias: 1 },
  { department: "Regulatory Affairs", subDepartment: "Documentation", designation: "Senior Executive", moduleBias: 0, qualBias: 0 },
  { department: "Stores & Warehouse & Logistics", subDepartment: "", designation: "Executive", moduleBias: 7, qualBias: 5 },
  { department: "Purchase & Procurement", subDepartment: "Raw Material", designation: "Senior Executive", moduleBias: 1, qualBias: 0 },
  { department: "Supply Chain Management", subDepartment: "Demand Planning", designation: "Assistant Manager", moduleBias: 3, qualBias: 2 },
  { department: "Sales & Marketing", subDepartment: "OSD", designation: "Manager", moduleBias: 0, qualBias: 0 },
  { department: "Sales & Marketing", subDepartment: "Injectables", designation: "Senior Manager", moduleBias: 2, qualBias: 1 },
  { department: "Bio Pharmaceutical Specialist", subDepartment: "", designation: "Manager", moduleBias: 2, qualBias: 3 },
  { department: "CSV IT QA", subDepartment: "", designation: "Senior Executive", moduleBias: 7, qualBias: 2 },
  { department: "Safety", subDepartment: "", designation: "Officer", moduleBias: 6, qualBias: 0 },
  { department: "Fresher", subDepartment: "General", designation: "Fresher", moduleBias: 0, qualBias: 0 },
  { department: "Fresher", subDepartment: "Not working", designation: "Intern", moduleBias: 1, qualBias: 7 },
];

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length]!;
}

function validateTemplate(t: (typeof ROLE_TEMPLATES)[number]): void {
  const tax = CANDIDATE_DEPARTMENT_TAXONOMY[t.department];
  if (!tax) return;
  if (t.subDepartment !== "General" && !tax.subDepartments.includes(t.subDepartment) && t.department !== "Stores & Warehouse & Logistics") {
    // Stores has empty subDepartments — use first available or General
  }
}

ROLE_TEMPLATES.forEach(validateTemplate);

function demoMobile(index: number): string {
  return String(9900100000 + index + 1);
}

function demoEmail(index: number): string {
  return `demo.profile.${String(index + 1).padStart(3, "0")}@pharmaopenings.demo`;
}

export function buildDemoCandidates(count = 60): DemoCandidateProfile[] {
  const profiles: DemoCandidateProfile[] = [];

  for (let i = 0; i < count; i++) {
    const template = ROLE_TEMPLATES[i % ROLE_TEMPLATES.length]!;
    const tax = CANDIDATE_DEPARTMENT_TAXONOMY[template.department];
    let sub = template.subDepartment;
    if (tax && tax.subDepartments.length > 0 && !tax.subDepartments.includes(sub)) {
      sub = tax.subDepartments[i % tax.subDepartments.length] ?? sub;
    }
    if (template.department === "Stores & Warehouse & Logistics" && tax?.subDepartments.length === 0) {
      sub = "";
    }
    let desig = template.designation;
    if (tax && !tax.designations.includes(desig)) {
      desig = tax.designations[i % tax.designations.length] ?? desig;
    }

    const first = pick(FIRST_NAMES, i * 3 + 7);
    const last = pick(LAST_NAMES, i * 5 + 11);

    profiles.push({
      full_name: `${first} ${last}`,
      email: demoEmail(i),
      mobile: demoMobile(i),
      current_department: template.department,
      current_sub_department: sub,
      current_designation: desig,
      current_company: pick(COMPANIES, i + template.moduleBias),
      highest_qualification: pick(QUALIFICATIONS, template.qualBias + (i % 3)),
      preferred_modules: [...MODULE_COMBOS[template.moduleBias % MODULE_COMBOS.length]!],
      preferred_location: pick(LOCATIONS, i + template.qualBias),
      notice_period: pick(NOTICE_PERIODS, i % NOTICE_PERIODS.length),
    });
  }

  return profiles;
}

export function demoCandidatesToCsv(rows: DemoCandidateProfile[]): string {
  const headers = [
    "Full Name",
    "Email",
    "Mobile",
    "Department",
    "Sub Department",
    "Designation",
    "Company",
    "Qualification",
    "Preferred Modules",
    "Preferred Location",
    "Notice Period",
  ];
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.full_name,
        r.email,
        r.mobile,
        r.current_department,
        r.current_sub_department,
        r.current_designation,
        r.current_company,
        r.highest_qualification,
        r.preferred_modules.join("; "),
        r.preferred_location,
        r.notice_period,
      ]
        .map(escape)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
