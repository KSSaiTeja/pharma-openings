"use client";

import { useMemo } from "react";

import { JobListingCard } from "./JobListingCard";
import { formatJobPostedLabel } from "@/src/lib/formatJobPosted";
import { getJobReference } from "@/src/lib/jobReference";
import { JobFitScoresProvider, useJobFitScores } from "@/src/context/JobFitScoresContext";
import type { JobRow } from "@/types/database.types";

type JobListByFitScoreProps = {
  jobs: JobRow[];
};

function JobListSortedInner({ jobs }: JobListByFitScoreProps) {
  const fitScores = useJobFitScores();

  const displayJobs = useMemo(() => {
    if (!fitScores.enabled || Object.keys(fitScores.scores).length === 0) {
      return jobs;
    }
    return [...jobs].sort((a, b) => {
      const scoreA = fitScores.scores[a.id]?.score ?? -1;
      const scoreB = fitScores.scores[b.id]?.score ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [fitScores.enabled, fitScores.scores, jobs]);

  return (
    <>
      {fitScores.enabled ? (
        <p className="po-jobs-sort-note" role="status">
          {fitScores.loading
            ? "Ranking roles by your profile match…"
            : "Sorted by best match for your profile"}
        </p>
      ) : null}
      <div className="po-jobs-list">
        {displayJobs.map((job) => (
          <JobListingCard
            key={job.id}
            variant="jobs"
            jobId={job.id}
            title={job.title}
            location={job.location}
            postedLabel={formatJobPostedLabel(job.created_at)}
            jobCode={getJobReference(job)}
            department={job.department}
            module={job.module}
            jobType={job.type}
            qualification={job.qualification_needed}
            description={job.description}
            detailHref={`/jobs/${job.id}`}
            applyHref={`/apply/${job.id}`}
            ctaLabel="Apply now"
          />
        ))}
      </div>
    </>
  );
}

export function JobListByFitScore({ jobs }: JobListByFitScoreProps) {
  return (
    <JobFitScoresProvider jobs={jobs}>
      <JobListSortedInner jobs={jobs} />
    </JobFitScoresProvider>
  );
}
