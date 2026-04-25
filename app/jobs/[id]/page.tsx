import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JobApplyLink } from "@/app/components/JobApplyLink";
import { fetchJobById } from "@/src/lib/jobs";

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

function JobDetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value?.trim()) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6880]">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-[#1e1b36]">{value}</dd>
    </div>
  );
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: job, error } = await fetchJobById(id);
  if (error || !job) {
    return {
      title: "Job not found | PharmaOpenings",
    };
  }

  return {
    title: job.is_active
      ? `${job.title} | PharmaOpenings`
      : `${job.title} (Inactive) | PharmaOpenings`,
    description: job.description.slice(0, 160),
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const { data: job, error } = await fetchJobById(id);

  if (error) {
    return (
      <main className="relative flex flex-1 flex-col px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center pb-16 text-center">
          <h1 className="text-xl font-semibold text-[#1e1b36]">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6b6880]">
            We couldn&apos;t load this role. Check your connection and Supabase
            settings, then try again.
          </p>
          <Link
            href="/jobs"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-[#ebe7f4] bg-white px-6 py-3 text-sm font-semibold text-[#1e1b36] shadow-sm transition-colors hover:border-[#6d6ae8]/35"
          >
            Back to all jobs
          </Link>
        </div>
      </main>
    );
  }

  if (!job) {
    notFound();
  }

  return (
    <main className="relative flex flex-1 flex-col px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
      <div className="mx-auto w-full max-w-3xl flex-1 pb-16">
        <Link
          href="/jobs"
          className="inline-flex text-sm font-semibold text-[#6d6ae8] underline-offset-4 transition-colors hover:text-[#5855d6] hover:underline"
        >
          ← Back to all jobs
        </Link>

        <article className="mt-8 rounded-[1.75rem] border border-[#ebe7f4] bg-white px-6 py-8 shadow-[0_12px_48px_rgba(30,27,54,0.06)] sm:px-10 sm:py-10">
          <div className="flex flex-wrap gap-2">
            {job.department ? (
              <span className="inline-flex rounded-full bg-[#f4f1fb] px-3 py-1 text-[11px] font-medium text-[#6b6880]">
                {job.department}
              </span>
            ) : null}
            {job.type ? (
              <span className="inline-flex rounded-full bg-[#f4f1fb] px-3 py-1 text-[11px] font-medium text-[#6b6880]">
                {job.type}
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#1e1b36] sm:text-[2rem] sm:leading-tight">
            {job.title}
          </h1>

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6b6880]">
              Job details
            </h2>
            <dl className="mt-4 grid gap-4 rounded-2xl border border-[#ebe7f4] bg-[#faf8ff] p-4 sm:grid-cols-2">
              <JobDetailItem label="Location" value={job.location} />
              <JobDetailItem label="Department" value={job.department} />
              <JobDetailItem label="Type" value={job.type} />
              <JobDetailItem label="Module" value={job.module} />
              <JobDetailItem
                label="Qualification needed"
                value={job.qualification_needed}
              />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6880]">
                  Posted
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-[#1e1b36]">
                  {formatPostedDate(job.created_at)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-10 border-t border-[#ebe7f4] pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6b6880]">
              Role description
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[#1e1b36]">
              {job.description}
            </p>
          </section>

          {job.is_active ? (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <JobApplyLink jobId={job.id} />
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-full border border-[#ebe7f4] bg-white px-6 py-3 text-sm font-semibold text-[#6b6880] transition-colors hover:border-[#6d6ae8]/35 hover:text-[#1e1b36]"
              >
                Back to all jobs
              </Link>
            </div>
          ) : (
            <section className="mt-10 rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3.5">
              <h2 className="text-sm font-semibold text-amber-950">This role is inactive</h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                This position is no longer accepting applications. Browse other active
                openings to continue.
              </p>
              <Link
                href="/jobs"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-950 transition-colors hover:border-amber-400"
              >
                Browse active jobs
              </Link>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
