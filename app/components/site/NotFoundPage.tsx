import Link from "next/link";

type NotFoundPageProps = {
  /** Job detail pages use role-specific copy; everything else uses the global recruiter joke. */
  variant?: "global" | "job";
};

const COPY = {
  global: {
    title: "This page didn't pass screening",
    lead: (
      <>
        We ran this URL through HR, compliance, and two rounds of interviews. Verdict:{" "}
        <strong>not a fit</strong>. It may have been filled, relocated, or never applied in the first
        place. Head home and browse roles that are actually hiring.
      </>
    ),
    primary: { href: "/", label: "Back to homepage" },
    secondary: { href: "/jobs", label: "Browse open roles" },
  },
  job: {
    title: "This role isn't on the board anymore",
    lead: (
      <>
        The posting may have been <strong>filled</strong>, paused, or taken off the market. Good news:
        other openings are still accepting applications—no cover letter required for those clicks.
      </>
    ),
    primary: { href: "/jobs", label: "Browse open roles" },
    secondary: { href: "/", label: "Back to homepage" },
  },
} as const;

export function NotFoundPage({ variant = "global" }: NotFoundPageProps) {
  const copy = COPY[variant];

  return (
    <main className="po-not-found" aria-labelledby="not-found-title">
      <div className="po-not-found__glow" aria-hidden />
      <div className="po-not-found__inner">
        <p className="po-not-found__code" aria-hidden>
          404
        </p>
        <h1 id="not-found-title" className="po-not-found__title">
          {copy.title}
        </h1>
        <p className="po-not-found__lead">{copy.lead}</p>
        <div className="po-not-found__actions">
          <Link href={copy.primary.href} className="theme-btn btn-one po-not-found__btn">
            {copy.primary.label}
          </Link>
          <Link href={copy.secondary.href} className="po-not-found__btn po-not-found__btn--secondary">
            {copy.secondary.label}
          </Link>
        </div>
      </div>
    </main>
  );
}
