import type { Metadata } from "next";

import { NotFoundPage } from "@/app/components/site/NotFoundPage";
import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Job not found"),
  description:
    "This pharmaceutical job posting is no longer available. Browse current pharma openings on PharmaOpenings.",
  path: "/jobs/not-found",
  noIndex: true,
});

export default function JobNotFound() {
  return <NotFoundPage variant="job" />;
}
