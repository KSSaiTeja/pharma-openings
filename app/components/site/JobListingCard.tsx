import Link from "next/link";

import { JobCardPostedLabel } from "./JobCardPostedLabel";
import { JobFitScorePanel } from "./JobFitScorePanel";

type JobListingCardProps = {
  title: string;
  location: string;
  postedLabel?: string;
  jobCode?: string;
  jobId?: string;
  department?: string | null;
  module?: string | null;
  jobType?: string | null;
  qualification?: string | null;
  description?: string | null;
  detailHref: string;
  applyHref?: string;
  ctaLabel?: string;
  /** Polished card layout for the /jobs browse page */
  variant?: "default" | "jobs";
};

export function JobListingCard({
  title,
  location,
  postedLabel,
  jobCode,
  jobId,
  department,
  module,
  jobType,
  qualification,
  description,
  detailHref,
  applyHref,
  ctaLabel = "View Details",
  variant = "default",
}: JobListingCardProps) {
  const roleMeta = jobType ?? qualification ?? null;
  const applyLink = applyHref ?? detailHref;

  if (variant === "jobs") {
    return (
      <article className="po-job-card">
        <div className="po-job-card__meta">
          {postedLabel ? <JobCardPostedLabel postedLabel={postedLabel} /> : null}
          {jobCode ? (
            <span className="po-job-card__code">
              Job ID <span className="po-job-card__code-value">{jobCode}</span>
            </span>
          ) : null}
        </div>
        <div className="po-job-card__body">
          <div className="po-job-card__main">
            <h3 className="po-job-card__title">
              <Link href={detailHref}>{title}</Link>
            </h3>
            <p className="po-job-card__location">{location}</p>
            <ul className="po-job-card__tags" aria-label="Role details">
              {department ? (
                <li>
                  <span className="po-job-card__tag">{department}</span>
                </li>
              ) : null}
              {module ? (
                <li>
                  <span className="po-job-card__tag po-job-card__tag--muted">{module}</span>
                </li>
              ) : null}
              {roleMeta && roleMeta !== module ? (
                <li>
                  <span className="po-job-card__tag po-job-card__tag--muted">{roleMeta}</span>
                </li>
              ) : null}
            </ul>
          </div>
          <div className="po-job-card__actions">
            <Link href={detailHref} className="po-job-card__link">
              View details
            </Link>
            <Link href={applyLink} className="theme-btn btn-one po-job-card__apply">
              {ctaLabel}
            </Link>
          </div>
        </div>
        {jobId ? (
          <JobFitScorePanel
            jobId={jobId}
            title={title}
            department={department}
            module={module}
            qualification={qualification}
            location={location}
            jobType={jobType}
            description={description}
          />
        ) : null}
      </article>
    );
  }

  const experience = qualification ?? department ?? jobType ?? "See listing";

  return (
    <div className="job-block-one">
      <div className="upper-box">
        <ul className="job-info">
          {postedLabel ? (
            <li className="po-job-card__posted-row">
              <JobCardPostedLabel postedLabel={postedLabel} className="po-job-card__posted po-job-card__posted--legacy" />
            </li>
          ) : null}
          {jobCode ? (
            <li>
              Job ID: <span>{jobCode}</span>
            </li>
          ) : null}
        </ul>
      </div>
      <div className="inner-box">
        <div className="title-box title-box--no-icon">
          <h3>
            <Link href={detailHref}>{title}</Link>
          </h3>
          <span>{location}</span>
        </div>
        <div className="salary-box">
          <h5>Department</h5>
          <span>{department ?? "PharmaOpenings"}</span>
        </div>
        <div className="experience-box">
          <h5>Role type</h5>
          <span>{experience}</span>
        </div>
        <div className="btn-box">
          <Link href={applyHref ?? detailHref} className="theme-btn btn-one">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
