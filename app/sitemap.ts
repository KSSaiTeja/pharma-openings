import type { MetadataRoute } from "next";

import { fetchPublishedBlogPosts } from "@/src/lib/blog";
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
      priority: 0.95,
    },
    {
      url: absoluteUrl("/register"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/partner"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const posts = await fetchPublishedBlogPosts();
  const blogRoutes =
    posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })) ?? [];

  const { data } = await fetchActiveJobSitemapRows();
  const jobRoutes =
    data?.map((job) => ({
      url: absoluteUrl(`/jobs/${job.id}`),
      lastModified: new Date(job.created_at),
      changeFrequency: "daily" as const,
      priority: 0.85,
    })) ?? [];

  return [...baseRoutes, ...blogRoutes, ...jobRoutes];
}
