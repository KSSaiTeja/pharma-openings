import Link from "next/link";

export default function JobNotFound() {
  return (
    <main className="relative flex flex-1 flex-col px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center pb-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d6ae8]">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#1e1b36]">
          This job isn&apos;t available
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#6b6880]">
          The role may have been filled or removed. Try browsing current openings
          instead.
        </p>
        <Link
          href="/jobs"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#1e1b36] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(30,27,54,0.22)] transition-[filter,transform] hover:brightness-110 active:translate-y-px active:brightness-95"
        >
          Browse all jobs
        </Link>
      </div>
    </main>
  );
}
