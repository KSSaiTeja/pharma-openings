"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { scrollToSection, sectionIdFromHref } from "./navConfig";

/** Scrolls to hash target after landing on home (e.g. from /jobs → /#about). */
export function HashScrollOnLoad() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    let cancelled = false;
    const timers: number[] = [];

    const run = (behavior: ScrollBehavior) => {
      const hash = window.location.hash;
      if (!hash) return;
      const id = sectionIdFromHref(hash);
      if (!id) return;
      scrollToSection(id, behavior);
    };

    // Retry while layout/preloader settle (cross-page /#section links).
    [0, 150, 450, 900, 1400].forEach((delay, i) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) run(i === 0 ? "auto" : "smooth");
        }, delay),
      );
    });

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname]);

  return null;
}
