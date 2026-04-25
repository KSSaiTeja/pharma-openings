"use client";

import { motion } from "motion/react";

import { STATS_BANNER } from "./content";

export function StatsBanner() {
  return (
    <section className="relative px-4 pb-6 pt-4 sm:px-6 lg:pb-10 lg:pt-6">
      <motion.div
        className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#1e1b36] px-6 py-10 shadow-[0_24px_80px_rgba(30,27,54,0.25)] sm:px-10 sm:py-12 lg:px-12 lg:py-14"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-12">
          <div className="flex shrink-0 flex-col justify-between rounded-[1.75rem] bg-[#6d6ae8] p-7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:p-8 lg:max-w-[280px] lg:rounded-2xl">
            <div>
              <p className="text-5xl font-semibold leading-none tracking-tight sm:text-6xl">
                {STATS_BANNER.highlight.rank}
              </p>
              <p className="mt-4 text-lg font-semibold tracking-tight">
                {STATS_BANNER.highlight.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/85">
                {STATS_BANNER.highlight.description}
              </p>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS_BANNER.stats.map((stat) => (
              <div
                key={stat.headline}
                className="flex flex-col justify-center py-8 text-center sm:px-6 sm:py-0 lg:px-8"
              >
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem] lg:text-[2.25rem]">
                  {stat.headline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
