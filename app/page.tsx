import type { Metadata } from "next";

import { HeroSection } from "./components/HeroSection";
import { SiteSections } from "./components/SiteSections";
import { fetchRecentActiveJobs, HOME_PAGE_JOBS_LIMIT } from "@/src/lib/jobs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "PharmaOpenings — Pharmaceutical careers & job search",
  description:
    "Explore active pharmaceutical openings and discover hiring teams across research, manufacturing, and commercial functions.",
};

export default async function Home() {
  const { data, error } = await fetchRecentActiveJobs(HOME_PAGE_JOBS_LIMIT);
  const homeJobs = [...(data ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const homeJobsLoadError = Boolean(error);

  return (
    <main>
      <HeroSection />
      <SiteSections homeJobs={homeJobs} homeJobsLoadError={homeJobsLoadError} />
    </main>
  );
}
