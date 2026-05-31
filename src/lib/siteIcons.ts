import type { Metadata } from "next";

/** Favicon assets live in `public/favicon/` — single source for the whole app. */
export const SITE_ICONS: NonNullable<Metadata["icons"]> = {
  icon: [
    { url: "/favicon/favicon.ico", sizes: "any" },
    { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
  ],
  apple: "/favicon/apple-touch-icon.png",
  other: [
    {
      rel: "mask-icon",
      url: "/favicon/favicon-32x32.png",
    },
  ],
};

export const SITE_MANIFEST = "/favicon/site.webmanifest";
