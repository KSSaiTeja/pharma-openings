import Link from "next/link";

type AuthPageShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  step?: number;
  totalSteps?: number;
  authMode: "login" | "register";
  /** Wider card for multi-field forms (register step 2). */
  cardSize?: "default" | "wide";
};

export function AuthPageShell({
  title,
  subtitle,
  children,
  step,
  totalSteps,
  authMode,
  cardSize = "default",
}: AuthPageShellProps) {
  const cardClass =
    cardSize === "wide" ? "po-auth-card po-auth-card--wide po-auth-form" : "po-auth-card po-auth-form";

  return (
    <section className="po-auth-page" aria-labelledby="auth-page-title">
      <div className="auto-container po-auth-page__container">
        <header className="po-auth-page__intro">
          <nav className="po-auth-page__crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="po-auth-page__crumbs-sep" aria-hidden>
              /
            </span>
            <span aria-current="page">{title}</span>
          </nav>
          {step && totalSteps ? (
            <p className="po-auth-page__step">
              Step <strong>{step}</strong> of {totalSteps}
            </p>
          ) : null}
          <h1 id="auth-page-title" className="po-auth-page__title">
            {title}
          </h1>
          {subtitle ? <p className="po-auth-page__lead">{subtitle}</p> : null}
        </header>

        <div className={cardClass}>{children}</div>

        <p className="po-auth-page__switch">
          {authMode === "login" ? (
            <>
              New here?{" "}
              <Link href="/register" className="po-auth-page__switch-link">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link href="/login" className="po-auth-page__switch-link">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
