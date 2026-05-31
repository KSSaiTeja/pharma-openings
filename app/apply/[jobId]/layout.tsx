import type { Metadata } from "next";

import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Apply"),
  description: "Apply for a pharmaceutical role on PharmaOpenings.",
  path: "/apply",
  noIndex: true,
});

export default function ApplyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="po-auth-layout-root">{children}</div>;
}
