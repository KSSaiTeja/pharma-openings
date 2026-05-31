import type { Metadata } from "next";
import Link from "next/link";

import { JobListByFitScore } from "../components/site/JobListByFitScore";
import { fetchActiveJobFilterOptions, fetchJobsPage } from "@/src/lib/jobs";
import {
  EMPTY_JOBS_FILTER_OPTIONS,
  getActiveFilterCount,
  getPagination,
  parseJobsFilterState,
} from "@/src/lib/jobFilters";
import { JobsEmptyState } from "./JobsEmptyState";
import { JobsFiltersForm } from "./JobsFiltersForm";
import { JobsPageToolbar } from "./JobsPageToolbar";
import { JobsPagination } from "./JobsPagination";

import type { JobRow } from "@/types/database.types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Jobs | PharmaOpenings",
  description:
    "Browse active pharmaceutical jobs by department, location, and role type on PharmaOpenings.",
};

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
  const hasListings = !loadError && paginatedJobs.length > 0;

  return (
    <>
      <section className="po-jobs-page" aria-labelledby="jobs-page-heading">
        <div className="auto-container">
          <header className="po-jobs-page__intro">
            <nav className="po-jobs-page__crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="po-jobs-page__crumbs-sep" aria-hidden>
                /
              </span>
              <span aria-current="page">Jobs</span>
            </nav>
            <h1 id="jobs-page-heading" className="po-jobs-page__title">
              Find your next pharma role
            </h1>
            <p className="po-jobs-page__lead">
              Browse open roles and refine results with the filters on the left.
            </p>
          </header>

          <div className="po-jobs-layout">
            <aside className="po-jobs-sidebar" aria-label="Job filters">
              <div className="po-jobs-filter-panel">
                <div className="po-jobs-filter-panel__head">
                  <h2 className="po-jobs-filter-panel__title">Filters</h2>
                  {activeFilterCount > 0 ? (
                    <span className="po-jobs-filter-panel__badge">{activeFilterCount}</span>
                  ) : null}
                </div>
                <JobsFiltersForm state={filterState} options={options} idPrefix="jobs-filter" />
              </div>
            </aside>

            <div className="po-jobs-main">
              {loadError ? (
                <div className="po-jobs-alert" role="alert">
                  <strong>Couldn&apos;t load listings.</strong> Check your connection or try again
                  in a moment.
                </div>
              ) : null}

              {!loadError ? (
                <JobsPageToolbar
                  showing={paginatedJobs.length}
                  total={totalMatching}
                  activeFilterCount={activeFilterCount}
                />
              ) : null}

              {globallyEmpty ? <JobsEmptyState variant="global" /> : null}
              {filterEmpty ? <JobsEmptyState variant="filtered" /> : null}

              {hasListings ? (
                <JobListByFitScore jobs={paginatedJobs} />
              ) : null}

              {!loadError && totalMatching > 0 && totalPages > 1 ? (
                <JobsPagination
                  filterState={filterState}
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
