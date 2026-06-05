import type { Metadata } from "next";

import { PartnerLandingPage } from "@/app/components/site/partner/PartnerLandingPage";
import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Partner With Us — Free Pharma Job Postings"),
  description:
    "Partner with PharmaOpenings to post pharmaceutical jobs for free. Reach GxP-ready candidates across QA, production, regulatory, clinical, and more.",
  path: "/partner",
  keywords: [
    "pharma job postings free",
    "pharmaceutical employer partnership",
    "post pharma jobs India",
    "pharma hiring platform",
    "GxP candidates",
  ],
});

export default function PartnerPage() {
  return <PartnerLandingPage />;
}
