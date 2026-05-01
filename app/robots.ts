import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/src/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/profile", "/apply"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
