import Link from "next/link";

type JobsEmptyStateProps = {
  variant: "global" | "filtered";
};

export function JobsEmptyState({ variant }: JobsEmptyStateProps) {
  if (variant === "global") {
    return (
      <div className="po-jobs-empty">
        <h3>No openings right now</h3>
        <p>
          We&apos;re not listing roles at the moment. Register your profile and we&apos;ll reach
          out when a match appears.
        </p>
        <Link href="/register?source=jobs-empty" className="theme-btn btn-one po-jobs-empty__cta">
          Register your profile
        </Link>
      </div>
    );
  }

  return (
    <div className="po-jobs-empty">
      <h3>No jobs match your filters</h3>
      <p>Try broadening your search or reset the filters to see all open roles.</p>
      <div className="po-jobs-empty__actions">
        <Link href="/jobs" className="theme-btn btn-one">
          Clear filters
        </Link>
        <Link href="/register?source=jobs-filter-empty" className="po-jobs-empty__secondary">
          Register profile
        </Link>
      </div>
    </div>
  );
}
