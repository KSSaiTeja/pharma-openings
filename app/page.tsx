import { HomePage } from "./components/site";
import { JsonLd } from "./components/site/JsonLd";
import { fetchRecentActiveJobs, HOME_PAGE_JOBS_LIMIT } from "@/src/lib/jobs";
import { organizationJsonLd, websiteJsonLd } from "@/src/lib/seo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await fetchRecentActiveJobs(HOME_PAGE_JOBS_LIMIT);
  const homeJobs = [...(data ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const homeJobsLoadError = Boolean(error);

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <HomePage homeJobs={homeJobs} homeJobsLoadError={homeJobsLoadError} />
    </>
  );
}
