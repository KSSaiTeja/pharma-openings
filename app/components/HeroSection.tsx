"use client";

import { motion } from "motion/react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4";

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-neutral-200/90 bg-white/80 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 backdrop-blur-sm">
      {children}
    </span>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <video
          className="w-full h-full object-cover [transform:scaleY(-1)]"
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[26.416%] from-[rgba(255,255,255,0)] to-[66.943%] to-white" />
      </div>

      <motion.div
        className="relative z-10 flex w-full max-w-[1200px] flex-col items-center px-5 pb-24 pt-[290px] text-center sm:px-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
        style={{ gap: "32px" }}
      >
        <motion.h1
          variants={fadeSlideUp}
          className="max-w-[1100px] font-medium tracking-[-0.04em] text-neutral-900"
        >
          <span className="inline-flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
            <span className="text-[clamp(2rem,5vw,80px)] leading-[1.05] lg:text-[80px]">
              Where
            </span>
            <span
              className="text-[clamp(2.5rem,6vw,100px)] italic leading-none [font-family:var(--font-instrument-serif)] lg:text-[100px]"
            >
              talent
            </span>
            <span className="text-[clamp(2rem,5vw,80px)] leading-[1.05] lg:text-[80px]">
              meets opportunity
            </span>
          </span>
        </motion.h1>

        <motion.p
          variants={fadeSlideUp}
          className="max-w-[554px] text-lg leading-relaxed text-[#373a46]/80"
        >
         Explore curated listings from leading
          pharmaceutical employers—whether you are advancing your career or
          taking your first step into the field.
        </motion.p>

        <motion.div
          id="browse"
          variants={fadeSlideUp}
          className="flex w-full max-w-[min(92vw,720px)] scroll-mt-40 flex-col items-center gap-6"
        >
          <div className="w-full">
            <form
              method="get"
              action="/jobs"
              className="rounded-[2rem] border border-neutral-200/90 bg-[#fafafa] p-1.5 shadow-[0px_10px_40px_5px_rgba(194,194,194,0.22)] sm:p-2"
            >
              <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[1.625rem] bg-[#fcfcfc] ring-1 ring-black/[0.04] lg:grid-cols-[minmax(0,1fr)_minmax(0,200px)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(0,240px)_auto]">
                <div className="relative min-h-0 min-w-0 border-b border-neutral-200/80 lg:border-b-0 lg:border-r">
                  <label htmlFor="hero-job-q" className="sr-only">
                    Role, keyword, or company
                  </label>
                  <input
                    id="hero-job-q"
                    name="q"
                    type="search"
                    placeholder="Role, keyword, or company"
                    autoComplete="off"
                    className="box-border h-14 w-full min-w-0 bg-transparent px-5 py-3 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 sm:px-6 lg:h-[3.75rem]"
                  />
                </div>
                <div className="relative min-h-0 min-w-0 border-b border-neutral-200/80 lg:border-b-0 lg:border-r">
                  <label htmlFor="hero-job-loc" className="sr-only">
                    Location
                  </label>
                  <input
                    id="hero-job-loc"
                    name="location"
                    type="text"
                    placeholder="City, state, or remote"
                    autoComplete="address-level2"
                    className="box-border h-14 w-full min-w-0 bg-transparent px-5 py-3 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 sm:px-6 lg:h-[3.75rem]"
                  />
                </div>
                <div className="flex min-w-0 items-stretch p-1.5 sm:p-2">
                  <button
                    type="submit"
                    className="flex h-12 w-full min-w-0 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#3a3a3a] via-[#252525] to-[#141414] px-6 text-[15px] font-medium tracking-tight text-white shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-[filter] hover:brightness-110 active:brightness-95 lg:h-auto lg:min-h-0 lg:flex-1 lg:rounded-xl lg:px-8"
                  >
                    Search jobs
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex w-full max-w-xl flex-col items-center gap-4">
            <p className="text-center text-[13px] font-medium tracking-wide text-neutral-500">
              Curated roles from innovators worldwide
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
              <TrustPill>Research &amp; development</TrustPill>
              <TrustPill>Clinical &amp; regulatory</TrustPill>
              <TrustPill>Commercial</TrustPill>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
