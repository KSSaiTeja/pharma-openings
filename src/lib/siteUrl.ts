/** Canonical production origin (www is the live primary host on Vercel). */
const PRODUCTION_SITE_URL = "https://www.pharmaopenings.com";
const FALLBACK_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function isLocalOrInvalid(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local")
    );
  } catch {
    return true;
  }
}

/**
 * Resolves the public site origin for canonical URLs, sitemap, and Open Graph.
 * Prefers `NEXT_PUBLIC_SITE_URL` when set to a real domain; in production
 * falls back to the live domain so SEO never ships with localhost URLs.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured && !isLocalOrInvalid(configured)) {
    return normalizeSiteUrl(configured);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeSiteUrl(`https://${vercelUrl.replace(/^https?:\/\//, "")}`);
  }

  if (configured) {
    return normalizeSiteUrl(configured);
  }

  return FALLBACK_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
