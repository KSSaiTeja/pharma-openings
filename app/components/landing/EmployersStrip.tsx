import Link from "next/link";

import { EMPLOYERS_STRIP } from "./content";

export function EmployersStrip() {
  return (
    <section
      id="employers"
      className="scroll-mt-32 border-b border-[#e4dff0]/90 bg-[#f7f4fd] px-4 py-10 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] border border-[#e8e2f6] bg-white/80 px-6 py-8 shadow-[0_8px_30px_rgba(30,27,54,0.04)] backdrop-blur-sm sm:flex-row sm:items-center sm:px-10 sm:py-9">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6d6ae8]">
            For employers
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#1e1b36] sm:text-2xl">
            {EMPLOYERS_STRIP.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6b6880] sm:text-[15px]">
            {EMPLOYERS_STRIP.body}
          </p>
        </div>
        <Link
          href={EMPLOYERS_STRIP.href}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#6d6ae8] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(109,106,232,0.35)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(109,106,232,0.4)]"
        >
          {EMPLOYERS_STRIP.cta}
        </Link>
      </div>
    </section>
  );
}
