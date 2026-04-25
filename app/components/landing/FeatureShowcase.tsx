"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { FEATURE_SHOWCASE } from "./content";
import { ImageSlot } from "./ImageSlot";
import { SectionHeader } from "./SectionHeader";

const cardMotion = {
  rest: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function FeatureShowcase() {
  return (
    <section
      id="process"
      className="relative scroll-mt-32 overflow-hidden border-b border-[#e4dff0]/90 px-4 py-16 sm:px-6 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[#f0edf8]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `linear-gradient(to right, #dcd5ee 1px, transparent 1px),
            linear-gradient(to bottom, #dcd5ee 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#c9c2f0]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-[#e8e4f7]/80 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          badge={FEATURE_SHOWCASE.sectionBadge}
          title={FEATURE_SHOWCASE.sectionTitle}
          subtitle={FEATURE_SHOWCASE.sectionSubtitle}
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2 lg:gap-6">
          <motion.article
            initial="rest"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardMotion}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex flex-col rounded-[2rem] border border-white/90 bg-white/95 p-6 shadow-[0_8px_30px_rgba(30,27,54,0.05)] backdrop-blur-sm sm:p-8"
          >
            <h3 className="text-lg font-semibold tracking-tight text-[#1e1b36] sm:text-xl">
              {FEATURE_SHOWCASE.topLeft.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6b6880] sm:text-[15px]">
              {FEATURE_SHOWCASE.topLeft.description}
            </p>
            <ImageSlot
              imageKey={FEATURE_SHOWCASE.topLeft.imageKey}
              alt={FEATURE_SHOWCASE.topLeft.title}
              className="mt-6 min-h-[240px] w-full sm:min-h-[280px]"
            />
          </motion.article>

          <motion.article
            initial="rest"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardMotion}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex flex-col rounded-[2rem] border border-white/90 bg-white/95 p-6 shadow-[0_8px_30px_rgba(30,27,54,0.05)] backdrop-blur-sm sm:p-8"
          >
            <h3 className="text-lg font-semibold tracking-tight text-[#1e1b36] sm:text-xl">
              {FEATURE_SHOWCASE.topRight.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6b6880] sm:text-[15px]">
              {FEATURE_SHOWCASE.topRight.description}
            </p>
            <ImageSlot
              imageKey={FEATURE_SHOWCASE.topRight.imageKey}
              alt={FEATURE_SHOWCASE.topRight.title}
              className="mt-6 min-h-[240px] w-full sm:min-h-[280px]"
            />
          </motion.article>
        </div>

        <motion.article
          initial="rest"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={cardMotion}
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="mt-5 flex flex-col overflow-hidden rounded-[2rem] border border-white/90 bg-white/95 shadow-[0_8px_30px_rgba(30,27,54,0.05)] backdrop-blur-sm lg:mt-6 lg:flex-row"
        >
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-10 lg:max-w-md lg:pr-4">
            <h3 className="text-lg font-semibold tracking-tight text-[#1e1b36] sm:text-xl">
              {FEATURE_SHOWCASE.bottom.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#6b6880] sm:text-[15px]">
              {FEATURE_SHOWCASE.bottom.description}
            </p>
            <Link
              href={FEATURE_SHOWCASE.bottom.ctaHref}
              className="mt-8 inline-flex w-fit items-center rounded-full bg-[#6d6ae8] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_36px_rgba(109,106,232,0.35)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(109,106,232,0.4)]"
            >
              {FEATURE_SHOWCASE.bottom.ctaLabel}
            </Link>
          </div>
          <div className="relative min-h-[260px] flex-1 border-t border-[#ebe7f4] lg:min-h-[320px] lg:border-l lg:border-t-0">
            <ImageSlot
              imageKey={FEATURE_SHOWCASE.bottom.imageKey}
              alt={FEATURE_SHOWCASE.bottom.title}
              className="min-h-[260px] h-full w-full lg:min-h-[320px] lg:rounded-tr-[2rem] lg:rounded-br-[2rem]"
            />
          </div>
        </motion.article>
      </div>
    </section>
  );
}
