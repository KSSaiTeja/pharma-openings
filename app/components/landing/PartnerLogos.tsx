import { PARTNERS_SECTION } from "./content";
import { SectionHeader } from "./SectionHeader";

export function PartnerLogos() {
  return (
    <section className="border-b border-[#e4dff0]/90 bg-white px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          badge={PARTNERS_SECTION.badge}
          title={PARTNERS_SECTION.title}
        />
        <ul className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-10">
          {PARTNERS_SECTION.partners.map((p) => (
            <li key={p.id}>
              <div
                className="flex h-14 min-w-[7.5rem] items-center justify-center rounded-2xl border border-[#ebe7f4] bg-[#faf8ff] px-5 text-xs font-semibold tracking-wide text-[#6b6880] shadow-[0_8px_30px_rgba(30,27,54,0.04)]"
                title={p.name}
              >
                <span className="text-[#1e1b36]/70">{p.initials}</span>
                <span className="sr-only">{p.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
