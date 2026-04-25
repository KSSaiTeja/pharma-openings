import { ABOUT_SECTION } from "./content";
import { SectionHeader } from "./SectionHeader";

export function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-32 border-b border-[#e4dff0]/90 bg-white px-4 py-16 sm:px-6 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            badge={ABOUT_SECTION.badge}
            title={ABOUT_SECTION.title}
            align="center"
          />
          <div className="mt-10 space-y-6 text-left">
            {ABOUT_SECTION.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[17px] leading-[1.75] text-[#6b6880]"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
