import Link from "next/link";

import {
  JOB_APPLY_PLACEHOLDER_HREF,
  JOB_LISTINGS,
  POPULAR_JOBS_SECTION,
} from "./content";
import { JobCard } from "./JobCard";
import { SectionHeader } from "./SectionHeader";

import { jobCardTagsFromRow, truncateJobDescription } from "@/src/lib/jobs";

import type { JobRow } from "@/types/database.types";

const LIVE_COMPANY = "PharmaOpenings";

type PopularJobsProps = {
  initialJobs: JobRow[];
  loadError: boolean;
};

export function PopularJobs({ initialJobs, loadError }: PopularJobsProps) {
  const showLive = !loadError && initialJobs.length > 0;
  const showEmpty = !loadError && initialJobs.length === 0;
  const showFallback = loadError;

  return (
    <section
      id="featured-jobs"
      className="scroll-mt-32 bg-[#faf8ff] px-4 py-16 sm:px-6 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          badge={POPULAR_JOBS_SECTION.badge}
          title={POPULAR_JOBS_SECTION.title}
          subtitle={POPULAR_JOBS_SECTION.subtitle}
        />

        {showEmpty ? (
          <div className="mt-12 rounded-[1.75rem] border border-[#ebe7f4] bg-white px-6 py-14 text-center shadow-[0_8px_30px_rgba(30,27,54,0.04)] sm:px-10 sm:py-16">
            <p className="text-lg font-semibold tracking-tight text-[#1e1b36]">
              Don&apos;t see a matching role?
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6b6880]">
              Register your profile and we&apos;ll reach out when the right opportunity comes. You can also browse all listings in case something was posted recently.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register?source=home-empty"
                className="inline-flex items-center justify-center rounded-full bg-[#1e1b36] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(30,27,54,0.18)] transition-[filter,transform] hover:brightness-110 active:translate-y-px"
              >
                Register your profile
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-full border border-[#ebe7f4] bg-[#faf8ff] px-6 py-2.5 text-sm font-semibold text-[#1e1b36] transition-colors hover:border-[#6d6ae8]/35"
              >
                Browse all jobs
              </Link>
            </div>
          </div>
        ) : null}

        {showLive ? (
          <>
            <ul className="mt-12 flex flex-col gap-4">
              {initialJobs.map((job) => (
                <li key={job.id}>
                  <JobCard
                    title={job.title}
                    company={LIVE_COMPANY}
                    tags={jobCardTagsFromRow(job)}
                    location={job.location}
                    applyHref={`/apply/${job.id}`}
                    ctaLabel="Apply now"
                    qualificationLabel={job.qualification_needed}
                    descriptionPreview={truncateJobDescription(job.description)}
                    detailHref={`/jobs/${job.id}`}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-10 flex justify-center">
              <Link
                href="/jobs"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1e1b36] px-8 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(30,27,54,0.22)] transition-[filter,transform,box-shadow] hover:brightness-110 hover:shadow-[0_14px_40px_rgba(30,27,54,0.18)] active:translate-y-px active:brightness-95"
              >
                Browse all jobs — filters and search
              </Link>
            </div>
          </>
        ) : null}

        {showFallback ? (
          <>
            <p className="mt-8 rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3.5 text-sm leading-relaxed text-amber-950 shadow-sm">
              We couldn&apos;t load live listings. Showing sample roles below — check
              Supabase configuration and try again later.
            </p>
            <ul className="mt-8 flex flex-col gap-4">
              {JOB_LISTINGS.map((job) => (
                <li key={job.id}>
                  <JobCard
                    title={job.title}
                    company={job.company}
                    tags={job.tags}
                    salaryDisplay={job.salaryDisplay}
                    location={job.location}
                    applyHref={JOB_APPLY_PLACEHOLDER_HREF}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-10 flex justify-center">
              <Link
                href="/jobs"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#e4dff5] bg-white px-6 text-sm font-semibold text-[#1e1b36] shadow-sm transition-[color,background-color,border-color] hover:border-[#6d6ae8]/30 hover:bg-[#faf8ff]"
              >
                Go to job browse
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
