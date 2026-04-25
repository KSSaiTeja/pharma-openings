import { CONTACT_SECTION } from "./content";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-32 bg-linear-to-b from-[#faf8ff] to-white px-4 py-16 sm:px-6 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative mx-auto max-w-lg overflow-hidden rounded-[2rem] border border-[#ebe7f4] bg-white p-px shadow-[0_28px_90px_rgba(30,27,54,0.08)]">
          <div className="rounded-[calc(2rem-1px)] bg-linear-to-b from-white to-[#faf8ff] px-8 py-12 text-center sm:px-12 sm:py-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6d6ae8]">
              {CONTACT_SECTION.badge}
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#1e1b36] sm:text-[1.75rem]">
              {CONTACT_SECTION.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#6b6880]">
              {CONTACT_SECTION.body}
            </p>
            <a
              href={`mailto:${CONTACT_SECTION.email}`}
              className="mt-8 inline-flex text-base font-semibold text-[#6d6ae8] underline decoration-[#6d6ae8]/25 underline-offset-[6px] transition-colors hover:decoration-[#6d6ae8]"
            >
              {CONTACT_SECTION.email}
            </a>
            <p className="mt-8 border-t border-[#ebe7f4] pt-8 text-[13px] leading-relaxed text-[#6b6880]">
              {CONTACT_SECTION.footnote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
