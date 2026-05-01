"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { JobSaveButton } from "@/app/components/JobSaveButton";
import { useCandidate } from "@/src/context/CandidateContext";
import { setPostAuthRedirect } from "@/src/lib/authSession";

export type JobCardProps = {
  title: string;
  company: string;
  tags: readonly string[];
  /** When omitted, the salary line is hidden (e.g. curated listings). */
  salaryDisplay?: string;
  location: string;
  /** Primary CTA target, usually `/apply/[jobId]`. */
  applyHref: string;
  /** CTA label on the action button (defaults to “Apply now”). */
  ctaLabel?: string;
  /** One-line qualification requirement (PRD). */
  qualificationLabel?: string | null;
  /** Plain-text description preview (already truncated server-side when needed). */
  descriptionPreview?: string | null;
  /** Secondary link, e.g. `/jobs/[id]` for full role detail. */
  detailHref?: string;
  detailLabel?: string;
  /** When set, shows a save/bookmark control (P-30). */
  jobId?: string;
};

function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useCandidate();

  const onApplyClick = useCallback(() => {
    if (!href.startsWith("/apply/")) return;
    setPostAuthRedirect(href);
    router.push("/register");
  }, [href, router]);

  if (href.startsWith("/apply/") && !loading && !isAuthenticated) {
    return (
      <button type="button" className={className} onClick={onApplyClick}>
        {children}
      </button>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function JobCard({
  title,
  company,
  tags,
  salaryDisplay,
  location,
  applyHref,
  ctaLabel = "Apply now",
  qualificationLabel,
  descriptionPreview,
  detailHref,
  detailLabel = "View role",
  jobId,
}: JobCardProps) {
  const initials = company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const qualification = qualificationLabel?.trim();
  const description = descriptionPreview?.trim();

  return (
    <article className="flex flex-col gap-5 rounded-[1.75rem] border border-[#ebe7f4] bg-white px-5 py-5 shadow-[0_8px_30px_rgba(30,27,54,0.04)] transition-shadow hover:shadow-[0_16px_48px_rgba(30,27,54,0.07)] sm:flex-row sm:items-stretch sm:justify-between sm:px-7 sm:py-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:py-0.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0edf8] text-xs font-bold tracking-tight text-[#6d6ae8]"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold tracking-tight text-[#1e1b36] sm:text-lg">
                {title}
              </h3>
              <p className="mt-0.5 text-sm text-[#6b6880]">{company}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <li key={`${tag}-${i}`}>
                    <span className="inline-flex rounded-full bg-[#f4f1fb] px-3 py-1 text-[11px] font-medium text-[#6b6880]">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
              {qualification ? (
                <p className="mt-3 text-xs leading-relaxed text-[#6b6880] sm:text-sm">
                  <span className="font-medium text-[#1e1b36]/85">Qualification: </span>
                  {qualification}
                </p>
              ) : null}
              {description ? (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#6b6880] sm:text-sm">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {jobId ? (
            <div className="shrink-0 pt-0.5">
              <JobSaveButton jobId={jobId} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 text-left sm:w-[min(100%,12.5rem)] sm:items-end sm:justify-between sm:text-right">
        <div>
          {salaryDisplay ? (
            <p className="text-lg font-semibold tracking-tight text-[#1e1b36] sm:text-xl">
              {salaryDisplay}
            </p>
          ) : null}
          <p
            className={
              salaryDisplay
                ? "mt-1 text-xs text-[#6b6880] sm:text-sm"
                : "text-xs text-[#6b6880] sm:text-sm"
            }
          >
            {location}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:items-end">
          <CtaLink
            href={applyHref}
            className="inline-flex w-full min-w-0 items-center justify-center rounded-full border border-[#6d6ae8]/35 bg-white px-5 py-2.5 text-sm font-semibold text-[#6d6ae8] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] transition-[background-color,box-shadow,transform] hover:border-[#6d6ae8]/55 hover:bg-[#6d6ae8]/[0.06] hover:shadow-[0_8px_24px_rgba(109,106,232,0.12)] active:translate-y-px sm:w-auto sm:min-w-[8.5rem]"
          >
            {ctaLabel}
          </CtaLink>
          {detailHref ? (
            <CtaLink
              href={detailHref}
              className="text-center text-xs font-semibold text-[#6d6ae8] underline-offset-4 transition-colors hover:text-[#1e1b36] hover:underline sm:text-right"
            >
              {detailLabel}
            </CtaLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
