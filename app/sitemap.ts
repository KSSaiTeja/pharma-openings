import type { MetadataRoute } from "next";

import { fetchActiveJobSitemapRows } from "@/src/lib/jobs";
import { absoluteUrl } from "@/src/lib/siteUrl";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/jobs"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/login"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/register"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const { data } = await fetchActiveJobSitemapRows();
  const jobRoutes =
    data?.map((job) => ({
      url: absoluteUrl(`/jobs/${job.id}`),
      lastModified: new Date(job.created_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })) ?? [];

  return [...baseRoutes, ...jobRoutes];
}
