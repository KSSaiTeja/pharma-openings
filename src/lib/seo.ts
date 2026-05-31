import type { Metadata } from "next";

import { FOOTER_OFFICES, SOCIAL_LINKS } from "@/app/content/site";
import { absoluteUrl, getSiteUrl } from "@/src/lib/siteUrl";

export const SITE_NAME = "PharmaOpenings";
export const SITE_BRAND = "Pharma Openings";

/** Primary homepage title — targets the core “pharma openings” search intent. */
export const HOME_TITLE =
  "Pharma Openings — Pharmaceutical Jobs, Vacancies & Career Opportunities";

export const DEFAULT_DESCRIPTION =
  "PharmaOpenings is India's dedicated pharmaceutical job board. Browse pharma openings in R&D, QA, QC, production, regulatory affairs, clinical operations, and more.";

export const DEFAULT_KEYWORDS = [
  "pharma openings",
  "pharmaceutical jobs",
  "pharma jobs India",
  "pharmaceutical vacancies",
  "pharma career opportunities",
  "pharmaceutical job search",
  "life sciences jobs",
  "pharma hiring",
  "quality assurance jobs pharma",
  "production jobs pharmaceutical",
] as const;

export const OG_IMAGE_PATH = "/pharma-openings/assets/images/logo.png";

export const CONTACT_EMAIL = "hello@pharmaopenings.com";

type PageSeoInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogType?: "website" | "article";
};

export function pageTitle(segment: string): string {
  return `${segment} | ${SITE_NAME}`;
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  keywords,
  noIndex = false,
  ogType = "website",
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const siteUrl = getSiteUrl();
  const ogImage = absoluteUrl(OG_IMAGE_PATH);

  return {
    title,
    description,
    keywords: keywords ?? [...DEFAULT_KEYWORDS],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: "en_IN",
      images: [
        {
          url: ogImage,
          alt: `${SITE_NAME} — pharmaceutical job board`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function rootSiteMetadata(): Metadata {
  return {
    ...buildPageMetadata({
      title: HOME_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: "/",
    }),
    title: {
      default: HOME_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: getSiteUrl() }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "employment",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export function organizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_BRAND,
    url: siteUrl,
    logo: absoluteUrl(OG_IMAGE_PATH),
    email: CONTACT_EMAIL,
    description: DEFAULT_DESCRIPTION,
    sameAs: SOCIAL_LINKS.map((link) => link.href),
    address: FOOTER_OFFICES.map((office) => ({
      "@type": "PostalAddress",
      name: office.region,
      streetAddress: office.lines.slice(0, -1).join(", ") || office.lines[0],
      addressLocality: office.lines[office.lines.length - 1],
      addressCountry: office.region === "India" ? "IN" : "DE",
    })),
  };
}

export function websiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_BRAND,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/jobs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function jobPostingJsonLd(job: {
  id: string;
  title: string;
  description: string;
  created_at: string;
  type: string | null;
  location: string;
  department: string | null;
  qualification_needed: string | null;
  is_active: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: new Date(job.created_at).toISOString(),
    validThrough: job.is_active ? undefined : new Date(job.created_at).toISOString(),
    employmentType: job.type ?? "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: getSiteUrl(),
      logo: absoluteUrl(OG_IMAGE_PATH),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "IN",
      },
    },
    url: absoluteUrl(`/jobs/${job.id}`),
    directApply: true,
    industry: job.department ?? "Pharmaceutical",
    qualifications: job.qualification_needed ?? undefined,
    occupationalCategory: job.department ?? undefined,
  };
}
