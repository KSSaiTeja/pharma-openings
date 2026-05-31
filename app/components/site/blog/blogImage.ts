import { siteAsset } from "@/app/components/site/paths";

const FALLBACK_BLOG_IMAGE = "images/resource/industries-1.jpg";

/** Resolve stored blog image value (Storage URL or legacy asset path) for display. */
export function resolveBlogImageUrl(image: string): string {
  const trimmed = image.trim();
  if (!trimmed) return siteAsset(FALLBACK_BLOG_IMAGE);
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return siteAsset(trimmed);
}

/** Absolute URL for SEO / Open Graph (Storage URL or site asset). */
export function absoluteBlogImageUrl(image: string, toAbsolute: (path: string) => string): string {
  const trimmed = image.trim();
  if (!trimmed) return toAbsolute(siteAsset(FALLBACK_BLOG_IMAGE));
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return toAbsolute(siteAsset(trimmed));
}
