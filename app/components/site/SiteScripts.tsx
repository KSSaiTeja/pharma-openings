"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

import { siteAsset } from "./paths";

/** Jobaway / marketing template scripts — not used on admin (no matching DOM). */
const SITE_SCRIPTS = [
  "js/jquery.js",
  "js/bootstrap.min.js",
  "js/owl.js",
  "js/wow.js",
  "js/validation.js",
  "js/jquery.fancybox.js",
  "js/appear.js",
  "js/isotope.js",
  "js/parallax-scroll.js",
  "js/jquery.nice-select.min.js",
  "js/scrolltop.min.js",
  "js/gsap.js",
  "js/ScrollTrigger.js",
  "js/SplitText.js",
  "js/jquery-ui.js",
  "js/lenis.min.js",
  "js/odometer.js",
  "js/script.js",
] as const;

export function SiteScripts() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return null;
  }

  return (
    <>
      {SITE_SCRIPTS.map((src) => (
        <Script key={src} src={siteAsset(src)} strategy="afterInteractive" />
      ))}
    </>
  );
}
