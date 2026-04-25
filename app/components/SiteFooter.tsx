"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCandidate } from "@/src/context/CandidateContext";

import { ADMIN_SITE_NAV_ENABLED, SITE_NAV_LINKS } from "./site-nav";

export function SiteFooter() {
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading, candidate } = useCandidate();
  const year = new Date().getFullYear();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer
      role="contentinfo"
      className="shrink-0 border-t border-[#e4dff0]/90 bg-white px-4 py-10 text-[#1e1b36] sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 sm:flex-row sm:items-center">
        <p className="text-center text-[13px] tracking-wide text-[#6b6880] sm:text-left">
          © {year} PharmaOpenings. All rights reserved.
        </p>
        <nav aria-label="Footer" className="flex flex-col items-center gap-4">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[13px] font-medium text-[#6b6880]">
            {SITE_NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="transition-colors hover:text-[#1e1b36]"
                >
                  {label}
                </Link>
              </li>
            ))}
            {ADMIN_SITE_NAV_ENABLED ? (
              <li>
                <Link
                  href="/admin/login"
                  className="transition-colors hover:text-[#1e1b36]"
                >
                  Admin
                </Link>
              </li>
            ) : null}
          </ul>
          {!authLoading ? (
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[13px] font-medium text-[#6b6880]">
              {!isAuthenticated ? (
                <>
                  <li>
                    <Link
                      href="/register"
                      className="transition-colors hover:text-[#1e1b36]"
                    >
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="transition-colors hover:text-[#1e1b36]"
                    >
                      Login
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/profile"
                    className="transition-colors hover:text-[#1e1b36]"
                    title={candidate?.full_name ?? "Profile"}
                  >
                    Profile
                  </Link>
                </li>
              )}
            </ul>
          ) : null}
        </nav>
      </div>
    </footer>
  );
}
