"use client";

import { Clock } from "lucide-react";

type JobCardPostedLabelProps = {
  postedLabel: string;
  className?: string;
};

export function JobCardPostedLabel({ postedLabel, className = "po-job-card__posted" }: JobCardPostedLabelProps) {
  return (
    <span className={className}>
      <Clock className="po-job-card__posted-icon" size={15} strokeWidth={2} aria-hidden />
      <span>
        Posted <span className="po-job-card__posted-date">{postedLabel}</span>
      </span>
    </span>
  );
}
