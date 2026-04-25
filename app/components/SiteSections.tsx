import {
  AboutSection,
  ContactSection,
  EmployersStrip,
  FeatureShowcase,
  PartnerLogos,
  PopularJobs,
  StatsBanner,
} from "./landing";

import type { JobRow } from "@/types/database.types";

type SiteSectionsProps = {
  homeJobs: JobRow[];
  homeJobsLoadError: boolean;
};

/**
 * Landing page body below the hero. Each block is a focused component;
 * copy and media paths live in `landing/content.ts`.
 */
export function SiteSections({ homeJobs, homeJobsLoadError }: SiteSectionsProps) {
  return (
    <div className="bg-[#f7f4fd] text-[#1e1b36]">
      <StatsBanner />
      <PartnerLogos />
      <EmployersStrip />
      <FeatureShowcase />
      <PopularJobs initialJobs={homeJobs} loadError={homeJobsLoadError} />
      <AboutSection />
      <ContactSection />
    </div>
  );
}
