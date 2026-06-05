/**
 * 60 realistic pharma job postings for bulk upload / admin demos.
 */

export type DemoJobRow = {
  title: string;
  location: string;
  department: string;
  type: string;
  module: string;
  qualificationNeeded: string;
  description: string;
};

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
  "Ankleshwar",
  "Kolkata",
  "Nagpur",
] as const;

const JOB_TEMPLATES: ReadonlyArray<{
  title: string;
  department: string;
  module: string;
  qualificationNeeded: string;
  description: string;
}> = [
  {
    title: "Assistant Manager – Quality Assurance",
    department: "Quality Assurance",
    module: "OSD",
    qualificationNeeded: "B. Pharma / M Pharma",
    description:
      "Lead IPQA batch release activities for oral solid dosage lines. Coordinate deviation investigations, change controls, and batch documentation review with production and QC.",
  },
  {
    title: "Executive – QMS",
    department: "Quality Assurance",
    module: "OSD",
    qualificationNeeded: "B.Pharm",
    description:
      "Maintain quality management system records, CAPA tracking, and internal audit schedules. Support regulatory inspections and site quality metrics reporting.",
  },
  {
    title: "Deputy Manager – Validations",
    department: "Quality Assurance",
    module: "OSD, API",
    qualificationNeeded: "M.Pharm",
    description:
      "Plan and execute process, cleaning, and computer system validation protocols. Work with engineering and production on qualification lifecycle documentation.",
  },
  {
    title: "Senior Executive – QC (Finished Products)",
    department: "Quality Control",
    module: "OSD",
    qualificationNeeded: "B.Pharm",
    description:
      "Review analytical data for finished product release. Ensure compliance with pharmacopoeial methods and stability sample management.",
  },
  {
    title: "Executive – Stability Studies",
    department: "Quality Control",
    module: "OSD",
    qualificationNeeded: "M.Sc",
    description:
      "Manage stability chambers, sample pull schedules, and trending reports. Coordinate with AR&D on method transfers for stability-indicating tests.",
  },
  {
    title: "Manager – QC Microbiology",
    department: "Quality Control",
    module: "API",
    qualificationNeeded: "M.Pharm",
    description:
      "Oversee environmental monitoring, media fill support, and microbiological testing for API and formulation areas. Guide team on data integrity and GMP practices.",
  },
  {
    title: "Production Operator – Granulation",
    department: "Production OSD",
    module: "OSD",
    qualificationNeeded: "D.Pharm / B.Pharm",
    description:
      "Operate RMG, fluid bed, and related granulation equipment per batch records. Report deviations and support line clearance and equipment logs.",
  },
  {
    title: "Senior Technical Associate – Compression",
    department: "Production OSD",
    module: "OSD",
    qualificationNeeded: "Diploma / ITI",
    description:
      "Run tablet compression machines, in-process checks, and metal detector challenges. Assist supervisors with changeover and preventive maintenance coordination.",
  },
  {
    title: "Supervisor – Coating",
    department: "Production OSD",
    module: "OSD",
    qualificationNeeded: "B.Pharm",
    description:
      "Supervise coating pan / perforated pan operations, spray rate monitoring, and coating uniformity sampling. Train operators on GMP and safety procedures.",
  },
  {
    title: "Officer – Injectable Filling",
    department: "Production Injectables",
    module: "Injectables",
    qualificationNeeded: "B.Pharm",
    description:
      "Support aseptic filling lines, environmental monitoring hooks, and line clearance. Experience with vial / ampoule filling preferred.",
  },
  {
    title: "Management Associate – Lyophilization",
    department: "Production Injectables",
    module: "Injectables",
    qualificationNeeded: "M.Pharm",
    description:
      "Coordinate lyophilization cycles, load patterns, and IPC for sterile injectable products. Interface with QA for batch record review and deviation handling.",
  },
  {
    title: "Technical Associate – Blister Packing",
    department: "Packing",
    module: "OSD",
    qualificationNeeded: "Diploma",
    description:
      "Operate blister packing and cartoning equipment. Perform line clearance, code verification, and packaging material reconciliation.",
  },
  {
    title: "Senior Executive – HVAC & Utilities",
    department: "Engineering",
    module: "OSD, API",
    qualificationNeeded: "B.E / B.Tech",
    description:
      "Maintain HVAC, purified water, and compressed air systems for manufacturing blocks. Support qualification and calibration of utility equipment.",
  },
  {
    title: "Research Scientist – Process R&D",
    department: "Research and Development",
    module: "API",
    qualificationNeeded: "M.Pharm / PhD",
    description:
      "Develop and scale API processes from lab to pilot. Author development reports, impurity profiling strategies, and tech transfer packages.",
  },
  {
    title: "Senior Research Scientist – OSD Formulations",
    department: "Formulation R&D",
    module: "OSD",
    qualificationNeeded: "M.Pharm",
    description:
      "Lead formulation development for immediate and modified release solid oral products. Design DOE studies and stability protocols for registration batches.",
  },
  {
    title: "Manager – Injectable Formulations",
    department: "Formulation R&D",
    module: "Injectables",
    qualificationNeeded: "M.Pharm",
    description:
      "Guide parenteral formulation development including lyophilized and liquid presentations. Collaborate with AR&D on analytical method alignment.",
  },
  {
    title: "Deputy Manager – Analytical Method Development",
    department: "Analytical R&D",
    module: "API, OSD",
    qualificationNeeded: "M.Sc / M.Pharm",
    description:
      "Develop and validate HPLC/GC methods for APIs and finished products. Prepare method validation protocols and regulatory submission sections.",
  },
  {
    title: "Manager – Regulatory Affairs (CMC)",
    department: "Regulatory Affairs",
    module: "OSD, API",
    qualificationNeeded: "M.Pharm",
    description:
      "Prepare Module 2/3 dossiers for US/EU/ROW submissions. Respond to agency queries and coordinate with QA and R&D on deficiency resolutions.",
  },
  {
    title: "Executive – RA Documentation",
    department: "Regulatory Affairs",
    module: "OSD",
    qualificationNeeded: "B.Pharm",
    description:
      "Compile batch manufacturing records, master data, and labelling artwork for variations and renewals. Maintain registration trackers.",
  },
  {
    title: "Warehouse Executive",
    department: "Stores & Logistics",
    module: "Others",
    qualificationNeeded: "Any",
    description:
      "Manage RM/PM warehousing, FIFO/FEFO, and dispatch coordination. SAP or similar ERP experience preferred for pharma inventory.",
  },
  {
    title: "Senior Executive – Raw Material Procurement",
    department: "Purchase & Procurement",
    module: "API",
    qualificationNeeded: "B.Pharm / MBA",
    description:
      "Source APIs and critical excipients, negotiate contracts, and ensure vendor qualification status. Monitor lead times and alternate supplier strategy.",
  },
  {
    title: "Assistant Manager – Demand Planning",
    department: "Supply Chain",
    module: "OSD",
    qualificationNeeded: "B.Pharm / BBA",
    description:
      "Forecast finished goods demand, align production plans, and coordinate with sales and manufacturing on S&OP cycles.",
  },
  {
    title: "Territory Manager – OSD (Domestic)",
    department: "Sales & Marketing",
    module: "OSD",
    qualificationNeeded: "B.Pharm",
    description:
      "Promote branded generic portfolio to physicians and chemists in assigned territory. Achieve prescription and sales targets with compliance to UCPMP.",
  },
  {
    title: "Product Manager – Injectables",
    department: "Sales & Marketing",
    module: "Injectables",
    qualificationNeeded: "M.Pharm / MBA",
    description:
      "Own injectable brand P&L, launch plans, and competitive intelligence. Work with medical affairs on scientific messaging and congress strategy.",
  },
  {
    title: "CSV Specialist – IT QA",
    department: "CSV IT QA",
    module: "Others",
    qualificationNeeded: "B.Tech / B.Pharm",
    description:
      "Execute computer system validation for MES, LIMS, and ERP interfaces. Draft URS, risk assessments, IQ/OQ/PQ protocols per GAMP 5.",
  },
  {
    title: "Safety Officer",
    department: "EHS",
    module: "Others",
    qualificationNeeded: "Diploma / B.Sc",
    description:
      "Implement site safety programs, incident investigations, and permit-to-work systems. Conduct training for production and warehouse staff.",
  },
  {
    title: "Trainee – Production (Fresher)",
    department: "Production OSD",
    module: "OSD",
    qualificationNeeded: "B.Pharm / D.Pharm",
    description:
      "Rotational training across granulation, compression, and packing for fresh pharmacy graduates. Mentorship under GMP-qualified supervisors.",
  },
  {
    title: "Officer – IPQA (API Block)",
    department: "Quality Assurance",
    module: "API",
    qualificationNeeded: "B.Pharm",
    description:
      "Batch disposition for API manufacturing, in-process checks, and cleaning validation support. Experience with hydrogenation or cryogenic steps is a plus.",
  },
  {
    title: "Executive – AQA",
    department: "Quality Assurance",
    module: "Injectables",
    qualificationNeeded: "B.Pharm",
    description:
      "Support audit readiness for sterile manufacturing areas. Review environmental monitoring trends and aseptic process simulation records.",
  },
  {
    title: "Senior Officer – Market Complaints",
    department: "Quality Assurance",
    module: "OSD",
    qualificationNeeded: "M.Pharm",
    description:
      "Investigate product complaints, trend signal detection, and field alert reporting. Coordinate with QC and RA on recall assessment if required.",
  },
  {
    title: "Analyst – In-Process QC",
    department: "Quality Control",
    module: "OSD",
    qualificationNeeded: "B.Sc / B.Pharm",
    description:
      "Perform in-process assays on compression and coating floors. Rapid turnaround for blend uniformity, hardness, and dissolution screening.",
  },
  {
    title: "Scientist – Method Validation",
    department: "Quality Control",
    module: "API, Injectables",
    qualificationNeeded: "M.Sc",
    description:
      "Validate compendial and non-compendial methods. Prepare validation reports for regulatory filings and method transfer to contract labs.",
  },
];

const TYPE_CYCLE = ["Full-time", "Full-time", "Full-time", "Part-time", "Contract"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

export function buildDemoJobs(count = 60): DemoJobRow[] {
  const jobs: DemoJobRow[] = [];
  for (let i = 0; i < count; i++) {
    const t = JOB_TEMPLATES[i % JOB_TEMPLATES.length]!;
    jobs.push({
      title: t.title,
      location: pick(LOCATIONS, i + 3),
      department: t.department,
      type: pick(TYPE_CYCLE, i),
      module: t.module,
      qualificationNeeded: t.qualificationNeeded,
      description: t.description,
    });
  }
  return jobs;
}

export const DEMO_JOBS_CSV_HEADERS =
  "Title,Location,Department,Type,Module,Qualification Needed,Description";

export function demoJobsToCsv(rows: DemoJobRow[]): string {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lines = [DEMO_JOBS_CSV_HEADERS];
  for (const r of rows) {
    lines.push(
      [
        r.title,
        r.location,
        r.department,
        r.type,
        r.module,
        r.qualificationNeeded,
        r.description,
      ]
        .map(escape)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
