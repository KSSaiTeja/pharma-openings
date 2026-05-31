import type { Metadata } from "next";

import { buildPageMetadata, pageTitle } from "@/src/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Sign in"),
  description:
    "Sign in to PharmaOpenings with mobile OTP to apply for pharmaceutical jobs and manage your candidate profile.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="po-auth-layout-root">{children}</div>;
}
