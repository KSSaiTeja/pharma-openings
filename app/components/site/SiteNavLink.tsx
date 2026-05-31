"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { scrollToSection, sectionIdFromHref } from "./navConfig";

type SiteNavLinkProps = {
  href: string;
  label: string;
  isActive?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export function SiteNavLink({ href, label, isActive, className = "", onNavigate }: SiteNavLinkProps) {
  const pathname = usePathname();
  const sectionId = sectionIdFromHref(href);
  const classNames = `po-nav-link${isActive ? " is-active" : ""}${className ? ` ${className}` : ""}`;

  return (
    <Link
      href={href}
      className={classNames}
      aria-current={isActive ? "page" : undefined}
      prefetch={false}
      onClick={(e) => {
        onNavigate?.();

        if (!sectionId) return;

        if (pathname === "/") {
          e.preventDefault();
          const scrolled = scrollToSection(sectionId);
          if (scrolled) {
            window.history.replaceState(null, "", `/#${sectionId}`);
          }
        }
      }}
    >
      {label}
    </Link>
  );
}
