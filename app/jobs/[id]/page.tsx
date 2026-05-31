import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JobApplyLink } from "@/app/components/JobApplyLink";
import { JobSaveButton } from "@/app/components/JobSaveButton";
import { JsonLd } from "@/app/components/site/JsonLd";
import { PageTitleBanner } from "@/app/components/site/PageTitleBanner";
import { getJobReference } from "@/src/lib/jobReference";
import { fetchJobById } from "@/src/lib/jobs";
import { buildPageMetadata, jobPostingJsonLd, pageTitle } from "@/src/lib/seo";

export const dynamic = "force-dynamic";

function formatPostedDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: job, error } = await fetchJobById(id);
  if (error || !job) {
    return buildPageMetadata({
      title: pageTitle("Job not found"),
      description: "This pharmaceutical job posting is no longer available on PharmaOpenings.",
      path: `/jobs/${id}`,
      noIndex: true,
    });
  }

  const description = `${job.title} in ${job.location}. ${job.description.slice(0, 140).trim()}…`;
  const title = job.is_active
    ? pageTitle(`${job.title} — ${job.location}`)
    : pageTitle(`${job.title} (Inactive)`);

  return buildPageMetadata({
    title,
    description,
    path: `/jobs/${id}`,
    noIndex: !job.is_active,
    ogType: "article",
    keywords: [
      job.title,
      `${job.location} pharma jobs`,
      job.department ?? "pharmaceutical jobs",
      "pharma openings",
    ].filter(Boolean),
  });
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const { data: job, error } = await fetchJobById(id);

  if (error) {
    return (
      <>
        <PageTitleBanner title="Job details" />
        <section className="job-details pt_110 pb_120">
          <div className="auto-container centred">
            <h2>Something went wrong</h2>
            <p className="mt_20">
              We couldn&apos;t load this role. Check your connection and Supabase settings.
            </p>
            <Link href="/jobs" className="theme-btn btn-one mt_30">
              Back to all jobs
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (!job) {
    notFound();
  }

  return (
    <>
      <JsonLd data={jobPostingJsonLd(job)} />
      <PageTitleBanner title={job.title} crumbs={[{ label: "Home", href: "/" }, { label: "Jobs", href: "/jobs" }, { label: job.title }]} />
      <section className="job-details pt_110 pb_120">
        <div className="auto-container">
          <div className="row clearfix">
            <div className="col-lg-4 col-md-12 col-sm-12 sidebar-side">
              <div className="job-sidebar mr_40">
                <div className="info-widget sidebar-widget mb_30">
                  <ul className="clearfix">
                    <li>
                      <h5>Job ID</h5>
                      <p className="po-job-reference">{getJobReference(job)}</p>
                    </li>
                    <li>
                      <h5>Location</h5>
                      <p>{job.location}</p>
                    </li>
                    {job.department ? (
                      <li>
                        <h5>Department</h5>
                        <p>{job.department}</p>
                      </li>
                    ) : null}
                    {job.type ? (
                      <li>
                        <h5>Type</h5>
                        <p>{job.type}</p>
                      </li>
                    ) : null}
                    {job.module ? (
                      <li>
                        <h5>Module</h5>
                        <p>{job.module}</p>
                      </li>
                    ) : null}
                    {job.qualification_needed ? (
                      <li>
                        <h5>Qualification</h5>
                        <p>{job.qualification_needed}</p>
                      </li>
                    ) : null}
                    <li>
                      <h5>Posted</h5>
                      <p>{formatPostedDate(job.created_at)}</p>
                    </li>
                  </ul>
                </div>
                <div className="requirements-widget sidebar-widget">
                  <h3>Save this role</h3>
                  <JobSaveButton jobId={job.id} variant="pill" />
                </div>
              </div>
            </div>
            <div className="col-lg-8 col-md-12 col-sm-12 content-side">
              <div className="job-details-content">
                <div className="text-box mb_60">
                  <h3>Job description</h3>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
                {job.is_active ? (
                  <div className="btn-box">
                    <JobApplyLink jobId={job.id} />
                    <Link href="/jobs" className="theme-btn banner-btn ml_15">
                      Back to jobs
                    </Link>
                  </div>
                ) : (
                  <div className="text-box">
                    <h3>This role is inactive</h3>
                    <p>This position is no longer accepting applications.</p>
                    <Link href="/jobs" className="theme-btn btn-one mt_20">
                      Browse active jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
