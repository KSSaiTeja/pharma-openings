"use client";

import { useEffect, useState } from "react";

import { siteAsset } from "./paths";

const MIN_VISIBLE_MS = 850;
const EXIT_MS = 450;
const MAX_WAIT_MS = 4000;

type Phase = "active" | "exit" | "done";

export function SitePreloader() {
  const [phase, setPhase] = useState<Phase>("active");

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    let exitTimer: number | undefined;
    let doneTimer: number | undefined;
    let maxTimer: number | undefined;

    const beginExit = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("exit");
        doneTimer = window.setTimeout(() => {
          if (!cancelled) setPhase("done");
        }, EXIT_MS);
      }, wait);
    };

    if (document.readyState === "complete") {
      beginExit();
    } else {
      window.addEventListener("load", beginExit, { once: true });
    }
    maxTimer = window.setTimeout(beginExit, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("load", beginExit);
      if (maxTimer) window.clearTimeout(maxTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
      if (doneTimer) window.clearTimeout(doneTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === "active" || phase === "exit") {
      document.body.classList.add("po-preloader-active");
      return () => document.body.classList.remove("po-preloader-active");
    }
    document.body.classList.remove("po-preloader-active");
    return undefined;
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`po-preloader${phase === "exit" ? " po-preloader--exit" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <img
        src={siteAsset("images/logo.png")}
        alt="PharmaOpenings"
        className="po-preloader__logo"
        width={200}
        height={60}
        fetchPriority="high"
      />
    </div>
  );
}
