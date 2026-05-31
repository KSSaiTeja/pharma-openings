import type { Metadata } from "next";

import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Profile"),
  description: "Manage your PharmaOpenings candidate profile and track pharmaceutical job applications.",
  path: "/profile",
  noIndex: true,
});

export default function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
