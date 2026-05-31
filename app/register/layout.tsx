import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Register"),
  description:
    "Create your PharmaOpenings profile to apply for pharma jobs, save openings, and get matched with pharmaceutical career opportunities.",
  path: "/register",
});

export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="po-auth-layout-root">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
