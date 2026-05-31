import type { Metadata } from "next";

import { NotFoundPage } from "@/app/components/site/NotFoundPage";

export const metadata: Metadata = {
  title: "Page not found | PharmaOpenings",
  description: "This page isn't available. Browse pharmaceutical job openings on PharmaOpenings.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundPage variant="global" />;
}
