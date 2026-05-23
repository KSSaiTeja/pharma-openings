/**
 * Centralized landing copy and structured data for PharmaOpenings.
 * Update metrics and media paths here—components stay presentational.
 */

export type FeatureImageKey = "compliance" | "documents" | "coordination";

/** Set to a path under `/public` (e.g. `/landing/compliance.png`) when assets are uploaded. */
export const LANDING_MEDIA_PATHS: Partial<Record<FeatureImageKey, string>> = {
  // compliance: "/landing/compliance.png",
  // documents: "/landing/documents.png",
  // coordination: "/landing/coordination.png",
};

export const PARTNERS_SECTION = {
  badge: "Trusted partners",
  title: "Connecting pharmaceutical leaders with exceptional talent",
  /** Placeholder monograms—swap for SVG logos when available. */
  partners: [
    { id: "1", name: "India", initials: "India" },
    { id: "2", name: "USA", initials: "USA" },
    { id: "3", name: "Germany", initials: "Germany" },
    { id: "4", name: "China", initials: "China" },
    { id: "5", name: "Switzerland", initials: "Switzerland" },
  ] as const,
};

export const FEATURE_SHOWCASE = {
  sectionBadge: "How it works",
  sectionTitle: "From profile to placement—designed for clarity",
  sectionSubtitle:
    "Candidates and teams move through a calm, structured flow: compliance-ready profiles, transparent documents, and coordinated next steps.",
  topLeft: {
    imageKey: "compliance",
    title: "Compliance-ready profile",
    description:
      "Licenses, work history, and education—organized the way hiring teams in pharma expect.",
  },
  topRight: {
    imageKey: "documents",
    title: "Credentials & dossiers",
    description:
      "Upload CVs, certifications, and portfolios in one secure flow built for regulated hiring.",
  },
  bottom: {
    imageKey: "coordination",
    title: "Coordination & interviews",
    description:
      "Schedule conversations and track next steps without losing context between stakeholders.",
    ctaLabel: "Learn more",
    ctaHref: "#contact",
  },
} as const;

export const POPULAR_JOBS_SECTION = {
  badge: "Featured roles",
  title: "High-demand openings on PharmaOpenings",
  subtitle:
    "Representative listings across clinical, regulatory, and technical tracks—updated regularly.",
} as const;

/**
 * Temporary target for “Apply now” on featured job cards.
 * Replace with `/sign-up`, `/login`, or per-job apply URLs when those flows exist.
 */
export const JOB_APPLY_PLACEHOLDER_HREF = "#contact" as const;

export const JOB_LISTINGS = [
  {
    id: "1",
    title: "Senior Clinical Research Associate",
    company: "Nordic BioPharma",
    tags: ["8+ yrs", "Hybrid", "Oncology"],
    salaryDisplay: "$128k–$152k",
    location: "Boston, MA",
  },
  {
    id: "2",
    title: "Regulatory Affairs Manager (CMC)",
    company: "Sterling Therapeutics",
    tags: ["5–7 yrs", "Full-time", "Small molecule"],
    salaryDisplay: "$135k–$165k",
    location: "Raleigh-Durham, NC",
  },
  {
    id: "3",
    title: "Quality Systems Lead — GMP",
    company: "Lattice Manufacturing",
    tags: ["10+ yrs", "On-site", "Validation"],
    salaryDisplay: "$142k–$168k",
    location: "Puerto Rico",
  },
  {
    id: "4",
    title: "Medical Science Liaison — Immunology",
    company: "Helix Immunology",
    tags: ["Advanced degree", "Field", "Launch"],
    salaryDisplay: "$155k–$185k",
    location: "Remote — US",
  },
] as const;

export const EMPLOYERS_STRIP = {
  title: "Hiring on PharmaOpenings?",
  body: "Reach potential candidates with Good Skillset and Experience",
  cta: "Partner with us",
  href: "#contact",
} as const;

export const ABOUT_SECTION = {
  badge: "About",
  title: "More than a job board",
  paragraphs: [
    "PharmaOpenings exists to connect exceptional people with organizations advancing therapies and standards of care. We curate opportunities so you spend less time searching and more time deciding what fits.",
    "Whether you are growing a team or growing your career, the platform is built as a calm, premium layer between ambition and the next conversation.",
  ],
} as const;

export const CONTACT_SECTION = {
  badge: "Contact",
  title: "Let’s start a conversation",
  body: "Listings, partnerships, or account support—we respond with care.",
  email: "hello@pharmaopenings.com",
  footnote:
    "Need a candidate or employer account? Email us and we will help you get started.",
} as const;
