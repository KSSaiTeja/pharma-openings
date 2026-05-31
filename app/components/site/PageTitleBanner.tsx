import type { ReactNode } from "react";
import Link from "next/link";

type Crumb = { label: string; href?: string };

type PageTitleBannerProps = {
  title: string;
  crumbs?: Crumb[];
};

export function PageTitleBanner({ title, crumbs }: PageTitleBannerProps) {
  const trail: Crumb[] = crumbs ?? [
    { label: "Home", href: "/" },
    { label: title },
  ];

  return (
    <section className="page-title centred pt_110">
      <div className="auto-container">
        <div className="content-box">
          <h1>{title}</h1>
          <ul className="bread-crumb clearfix">
            {trail.flatMap((crumb, index) => {
              const items: ReactNode[] = [];
              if (index > 0) {
                items.push(<li key={`sep-${index}`}>-</li>);
              }
              items.push(
                <li key={crumb.label}>
                  {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
                </li>,
              );
              return items;
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
