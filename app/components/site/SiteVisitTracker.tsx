"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { shouldTrackPath } from "@/src/lib/siteAnalytics";

const TRACK_COOLDOWN_MS = 30 * 60 * 1000;

function storageKey(path: string): string {
  return `po_track_${path}`;
}

export function SiteVisitTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) return;
    if (lastTrackedPath.current === pathname) return;

    if (typeof window !== "undefined") {
      const key = storageKey(pathname);
      const lastTrackedAt = window.sessionStorage.getItem(key);
      if (lastTrackedAt && Date.now() - Number(lastTrackedAt) < TRACK_COOLDOWN_MS) {
        lastTrackedPath.current = pathname;
        return;
      }
    }

    lastTrackedPath.current = pathname;

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) return;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey(pathname), String(Date.now()));
        }
      })
      .catch(() => {
        lastTrackedPath.current = null;
      });
  }, [pathname]);

  return null;
}
