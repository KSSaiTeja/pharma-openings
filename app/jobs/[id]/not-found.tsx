import type { Metadata } from "next";

import { NotFoundPage } from "@/app/components/site/NotFoundPage";

export const metadata: Metadata = {
  title: "Job not found | PharmaOpenings",
  description: "This job posting is no longer available. Browse current pharmaceutical openings.",
  robots: { index: false, follow: false },
};

export default function JobNotFound() {
  return <NotFoundPage variant="job" />;
}
