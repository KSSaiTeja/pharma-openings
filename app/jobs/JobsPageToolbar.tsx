import Link from "next/link";

type JobsPageToolbarProps = {
  showing: number;
  total: number;
  activeFilterCount: number;
};

export function JobsPageToolbar({ showing, total, activeFilterCount }: JobsPageToolbarProps) {
  return (
    <div className="po-jobs-toolbar">
      <div className="po-jobs-toolbar__summary">
        <p className="po-jobs-toolbar__count">
          Showing <strong>{showing}</strong> of <strong>{total}</strong>{" "}
          {total === 1 ? "job" : "jobs"}
        </p>
        {activeFilterCount > 0 ? (
          <p className="po-jobs-toolbar__filters">
            {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active
          </p>
        ) : null}
      </div>
      {activeFilterCount > 0 ? (
        <Link href="/jobs" className="po-jobs-toolbar__clear">
          Clear all filters
        </Link>
      ) : null}
    </div>
  );
}
