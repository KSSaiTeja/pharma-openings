import Link from "next/link";

import { buildJobsQueryString, type JobsFilterState } from "@/src/lib/jobFilters";

type JobsPaginationProps = {
  filterState: JobsFilterState;
  currentPage: number;
  totalPages: number;
};

export function JobsPagination({ filterState, currentPage, totalPages }: JobsPaginationProps) {
  const prevHref = `/jobs${buildJobsQueryString(filterState, { page: currentPage - 1 })}`;
  const nextHref = `/jobs${buildJobsQueryString(filterState, { page: currentPage + 1 })}`;
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <nav className="po-jobs-pagination" aria-label="Jobs pagination">
      {canPrev ? (
        <Link href={prevHref} className="po-jobs-pagination__btn">
          Previous
        </Link>
      ) : (
        <span className="po-jobs-pagination__btn po-jobs-pagination__btn--disabled" aria-disabled>
          Previous
        </span>
      )}
      <span className="po-jobs-pagination__status">
        Page {currentPage} of {totalPages}
      </span>
      {canNext ? (
        <Link href={nextHref} className="po-jobs-pagination__btn">
          Next
        </Link>
      ) : (
        <span className="po-jobs-pagination__btn po-jobs-pagination__btn--disabled" aria-disabled>
          Next
        </span>
      )}
    </nav>
  );
}
