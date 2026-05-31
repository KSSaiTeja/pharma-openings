import type { Metadata } from "next";

import { NotFoundPage } from "./components/site/NotFoundPage";
import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Page not found"),
  description:
    "This page is not available. Browse pharmaceutical job openings and pharma vacancies on PharmaOpenings.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return <NotFoundPage />;
}
