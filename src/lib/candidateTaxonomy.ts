export const OTHER_OPTION = "Other" as const;

export type DepartmentTaxonomy = {
  subDepartments: readonly string[];
  designations: readonly string[];
};

export const CANDIDATE_DEPARTMENT_TAXONOMY: Record<string, DepartmentTaxonomy> = {
  "Production OSD (Oral Solid Dosage)": {
    subDepartments: [
      "Compression Operator",
      "Granulation Operator",
      "Coating Operator",
      "Capsule Filling Operator",
      "Wruster Coating Operator",
      "PPIC",
      "Production QMS",
      "Market Complaints",
      "Documentation",
    ],
    designations: [
      "Junior Operator",
      "Operator",
      "Technical Associate",
      "Senior Technical Associate",
      "Officer",
      "Senior Officer",
      "Management Associate",
      "Supervisor",
    ],
  },
  "Production INJECTABLES": {
    subDepartments: [
      "Autoclave",
      "Washing",
      "Filling",
      "Sealing",
      "Batch Manufacturing",
      "Lyophilization Operation & PFS",
      "Ophthalmic 3 Piece",
      "BFS Infusion Bag Filling Operation",
      "Documentation",
    ],
    designations: [
      "Junior Operator",
      "Operator",
      "Technical Associate",
      "Senior Technical Associate",
      "Officer",
      "Senior Officer",
      "Management Associate",
      "Supervisor",
    ],
  },
  Packing: {
    subDepartments: [
      "Bottle Packing",
      "Blister Packing",
      "Auto-Cartonator",
      "Primary & Secondary Packing",
      "Packing QMS",
      "Bulk Packing",
      "PPIC Packing",
    ],
    designations: [
      "Operator",
      "Technical Associate",
      "Management Associate",
      "Senior Technical Associate",
      "Supervisor",
    ],
  },
  "Quality Assurance": {
    subDepartments: [
      "IPQA",
      "AQA",
      "QMS",
      "CQA",
      "MQA",
      "Market Complaints",
      "Validations",
      "Documentation",
      "Equipment Qualification",
      "Process Validation",
      "Cleaning Validation",
      "QA CSV",
      "DQA",
    ],
    designations: [
      "Junior Executive",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Associate Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
    ],
  },
  "Quality Control": {
    subDepartments: [
      "Finished Products",
      "In-Process",
      "Stability",
      "IPQC",
      "Instruments",
      "Documentation",
      "QC Microbiology",
      "QC ELISA",
      "QC Data Reviewer",
    ],
    designations: [
      "Junior Executive",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Associate Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
    ],
  },
  Engineering: {
    subDepartments: [
      "Process Maintenance",
      "Process Instrumentation",
      "Electrical",
      "Mechanical",
      "Engineering QMS",
      "Process Maintenance - Packing Maintenance",
      "Civil",
      "Water Systems",
      "HVAC & Utility",
    ],
    designations: [
      "Junior Executive",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Associate Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
    ],
  },
  "Research and Development": {
    subDepartments: ["Process R&D", "Synthesis R&D"],
    designations: [
      "Research Associate",
      "Senior Research Associate",
      "Research Scientist",
      "Scientist 1,2,3,4",
      "Principal Scientist",
      "Senior Principal Scientist",
      "Associate Director",
    ],
  },
  "Analytical Research and Development (AR&D)": {
    subDepartments: ["Method Development & Method Validation"],
    designations: [
      "Officer",
      "Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
    ],
  },
  "Formulation Research and Development (FR&D)": {
    subDepartments: ["OSD", "Injectables", "Ophthalmics", "Complex Injectables"],
    designations: [
      "Research Associate",
      "Research Scientist",
      "Senior Research Scientist",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Stores & Warehouse & Logistics": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  Safety: {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Regulatory Affairs": {
    subDepartments: ["CMC", "Labelling", "Post Approval", "Documentation"],
    designations: [
      "Research Associate",
      "Research Scientist",
      "Senior Research Scientist",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Sales & Marketing": {
    subDepartments: ["API", "OSD", "Injectables", "Domestic", "US", "EU"],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "International Business Development": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Purchase & Procurement": {
    subDepartments: [
      "Raw Material",
      "Packing Material",
      "Capex",
      "Opex",
      "Direct Material",
      "Indirect Material",
      "Engineering",
    ],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Supply Chain Management": {
    subDepartments: [
      "Supply Planning",
      "Demand Planning",
      "New Product Launches",
      "Third Party Manufacturing",
    ],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Operational Excellence": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "CROM (BD & SCM)": {
    subDepartments: ["Front End", "Backend", "US", "EU", "Canada", "Others"],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Finance & Accounts": {
    subDepartments: [
      "Accounts Payable",
      "Accounts Receivables",
      "General Ledger",
      "BRS",
      "Costing",
      "Pricing",
      "Finance Analyst",
    ],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  HR: {
    subDepartments: ["Recruitment", "Payroll", "HR Operations", "International HR"],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Information Technology (IT)": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Packaging Development": {
    subDepartments: ["OSD", "Injectables", "Ophthalmics"],
    designations: [
      "Research Associate",
      "Senior Research Associate",
      "Research Scientist",
      "Group Leader",
      "Principal Scientist",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Learning & Development": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Project Management (PMT)": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  Legal: {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "IPR & IPM": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Investor Relations": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Bio Pharmaceutical Specialist": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  Toxicologist: {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "Treasury Management": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
  "CSV IT QA": {
    subDepartments: [],
    designations: [
      "Officer",
      "Executive",
      "Senior Executive",
      "Assistant Manager",
      "Deputy Manager",
      "Manager",
      "Senior Manager",
      "AGM/DGM",
      "General Manager",
      "VP/Sr VP",
      "Director",
    ],
  },
};

export const DEPARTMENT_OPTIONS = Object.keys(CANDIDATE_DEPARTMENT_TAXONOMY);

function appendOther(options: readonly string[]): string[] {
  return options.includes(OTHER_OPTION) ? [...options] : [...options, OTHER_OPTION];
}

export function getSubDepartmentOptions(department: string): string[] {
  const match = CANDIDATE_DEPARTMENT_TAXONOMY[department];
  return appendOther(match?.subDepartments ?? []);
}

export function getDesignationOptions(department: string): string[] {
  const match = CANDIDATE_DEPARTMENT_TAXONOMY[department];
  return appendOther(match?.designations ?? []);
}

export function normalizeTaxonomyValue(value: string): string | null {
  const v = value.trim();
  return v.length ? v : null;
}

export type CandidateTaxonomySelection = {
  department: string | null;
  subDepartment: string | null;
  designation: string | null;
  departmentCustom: string | null;
  subDepartmentCustom: string | null;
  designationCustom: string | null;
};

export function resolveCandidateTaxonomySelection(input: {
  department: string;
  subDepartment: string;
  designation: string;
  departmentCustom: string;
  subDepartmentCustom: string;
  designationCustom: string;
}): CandidateTaxonomySelection {
  const department = normalizeTaxonomyValue(input.department);
  const subDepartment = normalizeTaxonomyValue(input.subDepartment);
  const designation = normalizeTaxonomyValue(input.designation);
  const departmentCustom = normalizeTaxonomyValue(input.departmentCustom);
  const subDepartmentCustom = normalizeTaxonomyValue(input.subDepartmentCustom);
  const designationCustom = normalizeTaxonomyValue(input.designationCustom);

  return {
    department,
    subDepartment,
    designation,
    departmentCustom: department === OTHER_OPTION ? departmentCustom : null,
    subDepartmentCustom: subDepartment === OTHER_OPTION ? subDepartmentCustom : null,
    designationCustom: designation === OTHER_OPTION ? designationCustom : null,
  };
}
