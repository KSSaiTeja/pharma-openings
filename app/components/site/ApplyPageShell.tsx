import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

type ApplyPageShellProps = {
  title: string;
  subtitle?: string;
  jobReference?: string;
  crumbs?: Crumb[];
  children: ReactNode;
  centred?: boolean;
};

export function ApplyPageShell({
  title,
  subtitle,
  jobReference,
  crumbs,
  children,
  centred = false,
}: ApplyPageShellProps) {
  const trail: Crumb[] = crumbs ?? [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" },
    { label: title },
  ];

  return (
    <section className="po-auth-page po-apply-page" aria-labelledby="apply-page-title">
      <div className="auto-container po-auth-page__container po-apply-page__container">
        <header className={`po-auth-page__intro${centred ? " po-apply-page__intro--centred" : ""}`}>
          <nav className="po-auth-page__crumbs" aria-label="Breadcrumb">
            {trail.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="po-apply-page__crumb-item">
                {index > 0 ? (
                  <span className="po-auth-page__crumbs-sep" aria-hidden>
                    /
                  </span>
                ) : null}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 id="apply-page-title" className="po-auth-page__title">
            {title}
          </h1>
          {subtitle ? <p className="po-auth-page__lead po-apply-page__subtitle">{subtitle}</p> : null}
          {jobReference ? <p className="po-apply-page__job-ref">{jobReference}</p> : null}
        </header>

        <div className="po-auth-card po-auth-card--wide po-auth-form po-apply-form">{children}</div>
      </div>
    </section>
  );
}
