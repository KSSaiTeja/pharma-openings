type SectionHeaderProps = {
  badge: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
};

export function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
}: SectionHeaderProps) {
  const alignClass =
    align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left";

  return (
    <div className={alignClass}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6d6ae8]">
        {badge}
      </p>
      <h2 className="mt-4 text-[clamp(1.5rem,3.2vw,2.25rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-[#1e1b36]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-[15px] leading-relaxed text-[#6b6880] sm:text-[17px]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
