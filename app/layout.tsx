import type { Metadata } from "next";

import { SiteShell } from "./components/site/SiteShell";
import { SiteScripts } from "./components/site/SiteScripts";
import { SiteStyles } from "./components/site/SiteStyles";
import { WhatsAppWidget } from "./components/site/WhatsAppWidget";
import { AppProviders } from "./providers";
import { SITE_ICONS, SITE_MANIFEST } from "@/src/lib/siteIcons";
import { rootSiteMetadata } from "@/src/lib/seo";
import "./globals.css";
import "./site-overrides.css";

export const metadata: Metadata = {
  ...rootSiteMetadata(),
  icons: SITE_ICONS,
  manifest: SITE_MANIFEST,
  appleWebApp: {
    capable: true,
    title: "PharmaOpenings",
    statusBarStyle: "default",
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
          <WhatsAppWidget />
        </AppProviders>
        <SiteScripts />
      </body>
    </html>
  );
}
