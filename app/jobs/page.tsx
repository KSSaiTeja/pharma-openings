import Link from "next/link";
import type { Metadata } from "next";

import { JobCard } from "../components/landing/JobCard";
import {
  fetchActiveJobFilterOptions,
  fetchJobsPage,
  jobCardTagsFromRow,
  truncateJobDescription,
} from "@/src/lib/jobs";
import {
  EMPTY_JOBS_FILTER_OPTIONS,
  buildJobsQueryString,
  getActiveFilterCount,
  getPagination,
  parseJobsFilterState,
} from "@/src/lib/jobFilters";
import { JobsFiltersForm } from "./JobsFiltersForm";

import type { JobRow } from "@/types/database.types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Jobs | PharmaOpenings",
  description:
    "Browse active pharmaceutical jobs by department, location, and role type on PharmaOpenings.",
};

function EmptyResultsIllustration() {
  return (
    <div
      className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ebe7f4] bg-white shadow-[0_8px_24px_rgba(30,27,54,0.06)]"
      aria-hidden
    >
      <svg
        className="h-8 w-8 text-[#6d6ae8]/90"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    </div>
  );
}

type JobsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const sp = (await searchParams) ?? {};
  const filterState = parseJobsFilterState(sp);

  const [optionsResult, listingResult] = await Promise.all([
    fetchActiveJobFilterOptions(),
    fetchJobsPage(filterState),
  ]);

  const options = optionsResult.data ?? EMPTY_JOBS_FILTER_OPTIONS;
  const loadError = Boolean(listingResult.error ?? optionsResult.error);
  const totalMatching = listingResult.count ?? 0;
  const paginatedJobs = listingResult.data ?? [];
  const activeFilterCount = getActiveFilterCount(filterState);
  const { totalPages, currentPage } = getPagination(
    Math.max(0, totalMatching),
    filterState.page,
  );
  const noFilters = activeFilterCount === 0;
  const globallyEmpty = !loadError && noFilters && totalMatching === 0;
  const filterEmpty = !loadError && !noFilters && totalMatching === 0;

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d6ae8]">
            Open roles
          </p>
          <h1 className="mt-3 font-semibold tracking-tight text-[#1e1b36] text-[clamp(1.75rem,4vw,2.5rem)]">
            Browse pharmaceutical openings
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[#6b6880]">
            Search by title, narrow by department, and explore locations that fit
            how you want to work.
          </p>
        </header>

        <details className="mt-10 rounded-[1.25rem] border border-[#ebe7f4] bg-white p-4 shadow-[0_10px_34px_rgba(30,27,54,0.06)] lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet">
            <span className="text-sm font-semibold tracking-wide text-[#1e1b36]">Advanced filters</span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#6d6ae8]/10 px-2 text-xs font-semibold text-[#5d58df]">
              {activeFilterCount}
            </span>
          </summary>
          <div className="mt-4 border-t border-[#f0ecfb] pt-4">
            <JobsFiltersForm state={filterState} options={options} idPrefix="mobile-filter" />
          </div>
        </details>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="hidden w-full max-w-sm shrink-0 rounded-[1.5rem] border border-[#ebe7f4] bg-white/95 p-5 shadow-[0_12px_40px_rgba(30,27,54,0.06)] lg:block">
            <details open>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-1 py-1 pb-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet">
                <span className="text-sm font-semibold tracking-wide text-[#1e1b36]">Advanced filters</span>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#6d6ae8]/10 px-2 text-xs font-semibold text-[#5d58df]">
                  {activeFilterCount}
                </span>
              </summary>
              <JobsFiltersForm state={filterState} options={options} idPrefix="desktop-filter" />
            </details>
          </aside>

          <section className="min-w-0 flex-1">
            {loadError ? (
              <p className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3.5 text-sm leading-relaxed text-amber-950 shadow-sm">
                We couldn&apos;t load listings from the server. Check your Supabase configuration and try again.
              </p>
            ) : null}

            {!loadError ? (
              <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ebe7f4] bg-white px-4 py-3">
                <p className="text-sm text-[#4f4b67]">
                  {/*
                    x = jobs on current page slice, y = all jobs that match current filters before pagination.
                  */}
                  Showing <span className="font-semibold text-[#1e1b36]">{paginatedJobs.length}</span> of{" "}
                  <span className="font-semibold text-[#1e1b36]">{totalMatching}</span> jobs
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#6d6ae8]/10 px-2 text-xs font-semibold text-[#5d58df]">
                    {activeFilterCount}
                  </span>
                  <Link
                    href="/jobs"
                    className="inline-flex h-11 min-h-11 items-center justify-center rounded-full border border-[#e4dff5] bg-white px-3 text-xs font-semibold text-[#6b6880] transition-[color,background-color,border-color] hover:border-[#6d6ae8]/30 hover:bg-[#faf8ff] hover:text-[#1e1b36] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
                  >
                    Clear all
                  </Link>
                </div>
              </div>
            ) : null}

            <ul className="flex flex-col gap-4 pb-4">
              {!loadError && globallyEmpty ? (
                <li className="overflow-hidden rounded-[1.75rem] border border-[#ebe7f4] bg-white px-8 py-16 text-center shadow-[0_8px_30px_rgba(30,27,54,0.04)] sm:py-20">
                  <EmptyResultsIllustration />
                  <p className="text-lg font-semibold tracking-tight text-[#1e1b36]">
                    No openings currently
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6b6880]">
                    Don&apos;t see a matching role? Register your profile and we&apos;ll reach out when the right opportunity comes.
                  </p>
                  <Link
                    href="/register?source=jobs-empty"
                    className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1e1b36] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(30,27,54,0.18)] transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
                  >
                    Register your profile
                  </Link>
                </li>
              ) : null}

              {!loadError && filterEmpty ? (
                <li className="overflow-hidden rounded-[1.75rem] border border-[#ebe7f4] bg-white px-8 py-16 text-center shadow-[0_8px_30px_rgba(30,27,54,0.04)] sm:py-20">
                  <EmptyResultsIllustration />
                  <p className="text-lg font-semibold tracking-tight text-[#1e1b36]">
                    No jobs match your filters
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6b6880]">
                    Don&apos;t see a matching role? Try adjusting your criteria, or register your profile and we&apos;ll reach out when the right opportunity comes.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/jobs"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#ebe7f4] bg-[#faf8ff] px-6 py-2.5 text-sm font-semibold text-[#1e1b36] transition-colors hover:border-[#6d6ae8]/35 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
                    >
                      Clear all filters
                    </Link>
                    <Link
                      href="/register?source=jobs-filter-empty"
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1e1b36] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(30,27,54,0.18)] transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet"
                    >
                      Register your profile
                    </Link>
                  </div>
                </li>
              ) : null}

              {!loadError &&
                paginatedJobs.map((job: JobRow) => (
                  <li key={job.id}>
                    <JobCard
                      title={job.title}
                      company="PharmaOpenings"
                      tags={jobCardTagsFromRow(job)}
                      location={job.location}
                      applyHref={`/apply/${job.id}`}
                      ctaLabel="Apply now"
                      qualificationLabel={job.qualification_needed}
                      descriptionPreview={truncateJobDescription(job.description)}
                      detailHref={`/jobs/${job.id}`}
                      jobId={job.id}
                    />
                  </li>
                ))}
            </ul>

            {!loadError && totalMatching > 0 && totalPages > 1 ? (
              <nav className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-[#ebe7f4] pt-6" aria-label="Jobs pagination">
                <Link
                  href={`/jobs${buildJobsQueryString(filterState, { page: currentPage - 1 })}`}
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={`inline-flex h-11 min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet ${
                    currentPage <= 1
                      ? "pointer-events-none border-[#f0ecfb] text-[#b5b0c7]"
                      : "border-[#e4dff5] bg-white text-[#4f4b67] hover:border-[#6d6ae8]/30 hover:bg-[#faf8ff]"
                  }`}
                >
                  Previous
                </Link>
                <span className="px-2 text-sm text-[#4f4b67]">
                  Page {currentPage} of {totalPages}
                </span>
                <Link
                  href={`/jobs${buildJobsQueryString(filterState, { page: currentPage + 1 })}`}
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={`inline-flex h-11 min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-po-violet ${
                    currentPage >= totalPages
                      ? "pointer-events-none border-[#f0ecfb] text-[#b5b0c7]"
                      : "border-[#e4dff5] bg-white text-[#4f4b67] hover:border-[#6d6ae8]/30 hover:bg-[#faf8ff]"
                  }`}
                >
                  Next
                </Link>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
