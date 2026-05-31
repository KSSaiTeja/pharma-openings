import type { Metadata } from "next";

import { SiteShell } from "./components/site/SiteShell";
import { SiteScripts } from "./components/site/SiteScripts";
import { SiteStyles } from "./components/site/SiteStyles";
import { AppProviders } from "./providers";
import { SITE_ICONS, SITE_MANIFEST } from "@/src/lib/siteIcons";
import { getSiteUrl } from "@/src/lib/siteUrl";
import "./globals.css";
import "./site-overrides.css";

export const metadata: Metadata = {
  title: "PharmaOpenings — Pharmaceutical careers & job search",
  description:
    "Global opportunities for pharma sector employees—active openings and hiring teams across research, manufacturing, and commercial functions.",
  metadataBase: new URL(getSiteUrl()),
  icons: SITE_ICONS,
  manifest: SITE_MANIFEST,
  appleWebApp: {
    capable: true,
    title: "PharmaOpenings",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "PharmaOpenings — Pharmaceutical careers & job search",
    description:
      "Global opportunities for pharma sector employees—curated pharmaceutical roles worldwide.",
    url: "/",
    siteName: "PharmaOpenings",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PharmaOpenings — Pharmaceutical careers & job search",
    description:
      "Global opportunities for pharma sector employees—curated pharmaceutical roles worldwide.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SiteStyles />
      </head>
      <body>
        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
        <SiteScripts />
      </body>
    </html>
  );
}
