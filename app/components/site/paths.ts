/** Public URL prefix for PharmaOpenings site static assets. */
export const SITE_ASSETS = "/pharma-openings/assets";

export function siteAsset(path: string): string {
  return `${SITE_ASSETS}/${path.replace(/^\//, "")}`;
}
