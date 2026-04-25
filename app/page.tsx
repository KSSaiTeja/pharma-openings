import { HeroSection } from "./components/HeroSection";
import { SiteSections } from "./components/SiteSections";
import { fetchRecentActiveJobs, HOME_PAGE_JOBS_LIMIT } from "@/src/lib/jobs";

export const dynamic = "force-dynamic";

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
