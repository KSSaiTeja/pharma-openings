"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NAV_SECTIONS, SITE_NAV_SCROLL_OFFSET } from "./navConfig";

/** Viewport line (px from top) used to decide which section is active. */
const ACTIVATION_LINE = SITE_NAV_SCROLL_OFFSET + 48;
/** Extra space above the first section — hero/banner shows no active nav item. */
const HERO_CLEARANCE = 120;

export function useActiveNavSection() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveId(null);
      return;
    }

    const sectionEls = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );

    if (sectionEls.length === 0) return;

    const updateActive = () => {
      const first = sectionEls[0];
      if (first && first.getBoundingClientRect().top > ACTIVATION_LINE + HERO_CLEARANCE) {
        setActiveId(null);
        return;
      }

      let current: string | null = null;
      for (const section of NAV_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= ACTIVATION_LINE) {
          current = section.id;
        }
      }

      setActiveId(current);
    };

    updateActive();

    const observer = new IntersectionObserver(() => updateActive(), {
      root: null,
      rootMargin: `-${ACTIVATION_LINE}px 0px -55% 0px`,
      threshold: [0, 0.05, 0.15],
    });

    sectionEls.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [pathname]);

  return activeId;
}
